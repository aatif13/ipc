"""Stress test benchmark with multiple producers/consumers."""
import multiprocessing
import multiprocessing.shared_memory as shm
import time
import struct
import hashlib
import os
import psutil
from .metrics import BenchmarkMetrics, calculate_latency_stats, make_throughput


RBUF_HEADER_SIZE = 21


def _stress_producer(shm_name: int, producer_id: int, num_messages: int,
                     message_size: int, capacity: int, ready_event: multiprocessing.Event):
    """Individual producer for stress test."""
    import hashlib as hl
    mem = shm.SharedMemory(name=shm_name)
    ready_event.wait()
    slot_size = 4 + 16 + message_size
    payload = os.urandom(message_size)

    for msg_id in range(num_messages):
        while True:
            count = struct.unpack_from("!I", mem.buf, 16)[0]
            if count < capacity:
                break
            time.sleep(0)

        write_idx = struct.unpack_from("!I", mem.buf, 8)[0]
        slot_offset = RBUF_HEADER_SIZE + (write_idx % capacity) * slot_size

        struct.pack_into("!I", mem.buf, slot_offset, msg_id)
        checksum = hl.md5(payload).digest()
        mem.buf[slot_offset + 4:slot_offset + 20] = checksum
        mem.buf[slot_offset + 20:slot_offset + 20 + message_size] = payload

        new_write = (write_idx + 1) % capacity
        struct.pack_into("!I", mem.buf, 8, new_write)
        count = struct.unpack_from("!I", mem.buf, 16)[0]
        struct.pack_into("!I", mem.buf, 16, count + 1)

    mem.close()


def _stress_consumer(shm_name: int, num_messages: int, message_size: int,
                     capacity: int, result_queue: multiprocessing.Queue):
    """Individual consumer for stress test."""
    import hashlib as hl
    mem = shm.SharedMemory(name=shm_name)
    slot_size = 4 + 16 + message_size
    latencies = []
    received = 0
    failed = 0
    integrity_errors = 0

    while received < num_messages:
        count = struct.unpack_from("!I", mem.buf, 16)[0]
        if count == 0:
            continue

        start = time.perf_counter()
        read_idx = struct.unpack_from("!I", mem.buf, 12)[0]
        slot_offset = RBUF_HEADER_SIZE + (read_idx % capacity) * slot_size
        stored_payload = bytes(mem.buf[slot_offset + 20:slot_offset + 20 + message_size])
        stored_checksum = bytes(mem.buf[slot_offset + 4:slot_offset + 20])

        elapsed = time.perf_counter() - start
        latencies.append(elapsed * 1_000_000)
        received += 1

        computed = hl.md5(stored_payload).digest()
        if stored_checksum != computed:
            integrity_errors += 1

        new_read = (read_idx + 1) % capacity
        struct.pack_into("!I", mem.buf, 12, new_read)
        count = struct.unpack_from("!I", mem.buf, 16)[0]
        struct.pack_into("!I", mem.buf, 16, max(0, count - 1))

    result_queue.put({
        "latencies": latencies,
        "received": received,
        "failed": failed,
        "integrity_errors": integrity_errors,
    })
    mem.close()


def benchmark_stress(num_producers: int, num_consumers: int,
                     num_messages: int, message_size: int, iterations: int = 1) -> dict:
    """Run stress test benchmark."""
    all_latencies = []
    total_received = 0
    total_integrity_errors = 0
    total_time = 0.0
    process = psutil.Process()

    for _ in range(iterations):
        capacity = max(64, min(2048, num_messages))
        slot_size = 4 + 16 + message_size
        shm_size = RBUF_HEADER_SIZE + capacity * slot_size

        mem = shm.SharedMemory(create=True, size=shm_size)
        struct.pack_into("!I", mem.buf, 0, message_size)
        struct.pack_into("!I", mem.buf, 4, capacity)
        struct.pack_into("!I", mem.buf, 8, 0)
        struct.pack_into("!I", mem.buf, 12, 0)
        struct.pack_into("!I", mem.buf, 16, 0)
        mem.buf[20] = 1

        msgs_per_producer = num_messages // num_producers
        msgs_per_consumer = (num_messages * num_producers) // num_consumers

        result_queue = multiprocessing.Queue()
        ready = multiprocessing.Event()
        procs = []

        for cid in range(num_consumers):
            p = multiprocessing.Process(
                target=_stress_consumer,
                args=(mem.name, msgs_per_consumer, message_size, capacity, result_queue),
                daemon=True
            )
            p.start()
            procs.append(p)

        for pid in range(num_producers):
            p = multiprocessing.Process(
                target=_stress_producer,
                args=(mem.name, pid, msgs_per_producer, message_size, capacity, ready),
                daemon=True
            )
            p.start()
            procs.append(p)

        ready.set()
        start = time.perf_counter()

        for p in procs:
            p.join(timeout=120)

        elapsed = time.perf_counter() - start
        total_time += elapsed

        while not result_queue.empty():
            r = result_queue.get()
            all_latencies.extend(r["latencies"])
            total_received += r["received"]
            total_integrity_errors += r["integrity_errors"]

        try:
            mem.close()
            mem.unlink()
        except Exception:
            pass

    metrics = BenchmarkMetrics()
    metrics.total_time = total_time / iterations if iterations > 0 else 0
    metrics.messages_sent = num_messages * num_producers
    metrics.messages_received = total_received // iterations if iterations > 0 else 0
    metrics.integrity_errors = total_integrity_errors // iterations if iterations > 0 else 0
    metrics.messages_dropped = max(0, metrics.messages_sent - metrics.messages_received)
    metrics.cpu_usage_percent = process.cpu_percent(interval=None)
    mem_info = process.memory_info()
    metrics.memory_usage_bytes = mem_info.rss
    metrics.memory_usage_mb = metrics.memory_usage_bytes / (1024 * 1024)

    metrics = calculate_latency_stats(all_latencies, metrics)
    total_data = num_messages * message_size * num_producers
    metrics = make_throughput(metrics, total_data, metrics.messages_received)

    return metrics.to_dict()
