"""Ring Buffer IPC benchmark using multiprocessing.shared_memory."""
import multiprocessing
import multiprocessing.shared_memory as shm
import time
import struct
import hashlib
import os
import psutil
from .metrics import BenchmarkMetrics, calculate_latency_stats, make_throughput


# Ring Buffer layout:
# capacity(4) | write_idx(4) | read_idx(4) | count(4) | running(1)
# Then: capacity * (4 + 16 + message_size) bytes for slots
HEADER_SIZE = 17
SLOT_META = 20  # msg_id(4) + checksum(16)


def _rbuf_producer(shm_name: str, num_messages: int, message_size: int,
                    capacity: int, ready_event: multiprocessing.Event):
    """Producer: writes messages into the ring buffer."""
    mem = shm.SharedMemory(name=shm_name)
    ready_event.wait()

    slot_size = SLOT_META + message_size
    payload = os.urandom(message_size)

    for msg_id in range(num_messages):
        # Spin wait for space
        while True:
            count = struct.unpack_from("!I", mem.buf, 12)[0]
            if count < capacity:
                break
            time.sleep(0.0001)

        write_idx = struct.unpack_from("!I", mem.buf, 4)[0]
        slot_offset = HEADER_SIZE + (write_idx % capacity) * slot_size

        # Write slot data
        struct.pack_into("!I", mem.buf, slot_offset, msg_id)
        checksum = hashlib.md5(payload).digest()
        mem.buf[slot_offset + 4:slot_offset + 20] = checksum
        mem.buf[slot_offset + 20:slot_offset + 20 + message_size] = payload

        # Update write index and count
        new_write = (write_idx + 1) % capacity
        struct.pack_into("!I", mem.buf, 4, new_write)
        new_count = count + 1
        struct.pack_into("!I", mem.buf, 12, new_count)

    mem.close()


def _rbuf_consumer(shm_name: str, num_messages: int, message_size: int,
                    capacity: int, result_queue: multiprocessing.Queue):
    """Consumer: reads messages from the ring buffer."""
    mem = shm.SharedMemory(name=shm_name)
    process = psutil.Process()

    latencies = []
    messages_received = 0
    messages_failed = 0
    integrity_errors = 0
    slot_size = SLOT_META + message_size

    for _ in range(num_messages):
        start = time.perf_counter()

        # Spin wait for data
        while True:
            count = struct.unpack_from("!I", mem.buf, 12)[0]
            if count > 0:
                break
            time.sleep(0.0001)

        # Read from ring buffer
        read_idx = struct.unpack_from("!I", mem.buf, 8)[0]
        slot_offset = HEADER_SIZE + (read_idx % capacity) * slot_size

        msg_id = struct.unpack_from("!I", mem.buf, slot_offset)[0]
        stored_checksum = bytes(mem.buf[slot_offset + 4:slot_offset + 20])
        stored_payload = bytes(mem.buf[slot_offset + 20:slot_offset + 20 + message_size])

        elapsed = time.perf_counter() - start
        latencies.append(elapsed * 1_000_000)
        messages_received += 1

        # Verify integrity
        computed_checksum = hashlib.md5(stored_payload).digest()
        if stored_checksum != computed_checksum:
            integrity_errors += 1

        # Update read index and count
        new_read = (read_idx + 1) % capacity
        struct.pack_into("!I", mem.buf, 8, new_read)
        count = struct.unpack_from("!I", mem.buf, 12)[0]
        struct.pack_into("!I", mem.buf, 12, max(0, count - 1))

    cpu_pct = process.cpu_percent(interval=None)
    mem_info = process.memory_info()

    result_queue.put({
        "latencies": latencies,
        "messages_received": messages_received,
        "messages_failed": messages_failed,
        "integrity_errors": integrity_errors,
        "cpu_usage": cpu_pct,
        "memory_usage": mem_info.rss,
    })
    mem.close()


def benchmark_ring_buffer(num_messages: int, message_size: int, iterations: int = 3) -> dict:
    """Run Ring Buffer IPC benchmark across multiple iterations."""
    all_latencies = []
    all_cpu = []
    all_memory = []
    total_messages_received = 0
    total_messages_failed = 0
    total_integrity_errors = 0
    total_time = 0.0

    for _ in range(iterations):
        capacity = max(16, min(512, num_messages // 4))
        slot_size = SLOT_META + message_size
        shm_size = HEADER_SIZE + capacity * slot_size

        try:
            mem = shm.SharedMemory(create=True, size=shm_size)
        except OSError:
            capacity = max(4, min(64, num_messages // 10))
            shm_size = HEADER_SIZE + capacity * slot_size
            mem = shm.SharedMemory(create=True, size=shm_size)

        # Initialize header
        struct.pack_into("!I", mem.buf, 0, capacity)
        struct.pack_into("!I", mem.buf, 4, 0)   # write_idx
        struct.pack_into("!I", mem.buf, 8, 0)   # read_idx
        struct.pack_into("!I", mem.buf, 12, 0)   # count
        mem.buf[16] = 1  # running

        result_queue = multiprocessing.Queue()
        ready = multiprocessing.Event()

        consumer_proc = multiprocessing.Process(
            target=_rbuf_consumer,
            args=(mem.name, num_messages, message_size, capacity, result_queue),
            daemon=True
        )
        producer_proc = multiprocessing.Process(
            target=_rbuf_producer,
            args=(mem.name, num_messages, message_size, capacity, ready),
            daemon=True
        )

        consumer_proc.start()
        producer_proc.start()
        ready.set()

        start_time = time.perf_counter()
        producer_proc.join(timeout=60)
        consumer_proc.join(timeout=60)
        elapsed = time.perf_counter() - start_time
        total_time += elapsed

        if not result_queue.empty():
            result = result_queue.get()
            all_latencies.extend(result["latencies"])
            total_messages_received += result["messages_received"]
            total_messages_failed += result["messages_failed"]
            total_integrity_errors += result["integrity_errors"]
            all_cpu.append(result["cpu_usage"])
            all_memory.append(result["memory_usage"])

        try:
            mem.close()
            mem.unlink()
        except Exception:
            pass
        try:
            consumer_proc.terminate()
            producer_proc.terminate()
        except Exception:
            pass

    metrics = BenchmarkMetrics()
    metrics.total_time = total_time / iterations if iterations > 0 else 0
    metrics.messages_sent = num_messages
    metrics.messages_received = total_messages_received // iterations if iterations > 0 else 0
    metrics.messages_failed = total_messages_failed // iterations if iterations > 0 else 0
    metrics.integrity_errors = total_integrity_errors // iterations if iterations > 0 else 0
    metrics.messages_dropped = max(0, metrics.messages_sent - metrics.messages_received)

    if all_cpu:
        metrics.cpu_usage_percent = sum(all_cpu) / len(all_cpu)
    if all_memory:
        metrics.memory_usage_bytes = max(all_memory)
        metrics.memory_usage_mb = metrics.memory_usage_bytes / (1024 * 1024)

    metrics = calculate_latency_stats(all_latencies, metrics)
    total_data = num_messages * message_size
    metrics = make_throughput(metrics, total_data, num_messages)

    return metrics.to_dict()
