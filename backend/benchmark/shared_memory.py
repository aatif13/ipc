"""Shared Memory IPC benchmark using multiprocessing.shared_memory."""
import multiprocessing
import multiprocessing.shared_memory as shm
import time
import struct
import hashlib
import os
import psutil
from .metrics import BenchmarkMetrics, calculate_latency_stats, make_throughput


def _shm_producer(shm_name: str, message_size: int, num_messages: int,
                   ready_event: multiprocessing.Event, done_event: multiprocessing.Event):
    """Producer: write messages into shared memory using simple slot buffer."""
    mem = shm.SharedMemory(name=shm_name)
    ready_event.wait()

    payload = os.urandom(message_size)
    slot_size = message_size

    for i in range(num_messages):
        # Wait for consumer to have read previous message
        while True:
            state = mem.buf[0]  # 0=ready for write, 1=data available, 2=done
            if state == 0:
                break
            if state == 2:
                mem.close()
                return
            time.sleep(0.0001)

        # Write payload at offset 1 (after state byte)
        checksum = hashlib.md5(payload).digest()
        struct.pack_into("!I", mem.buf, 1, i)  # message ID
        struct.pack_into("!I", mem.buf, 5, message_size)  # payload size
        mem.buf[9:25] = checksum  # MD5 checksum
        mem.buf[25:25 + slot_size] = payload

        # Signal data is available
        mem.buf[0] = 1

    # Wait for consumer to read the last message, then signal done
    while True:
        state = mem.buf[0]
        if state == 0:
            break
        time.sleep(0.0001)
    mem.buf[0] = 2
    done_event.set()
    mem.close()


def _shm_consumer(shm_name: str, message_size: int, num_messages: int,
                   result_queue: multiprocessing.Queue):
    """Consumer: read messages from shared memory."""
    mem = shm.SharedMemory(name=shm_name)
    process = psutil.Process()

    latencies = []
    messages_received = 0
    messages_failed = 0
    integrity_errors = 0

    for _ in range(num_messages):
        start = time.perf_counter()

        # Wait for data to be available
        while True:
            state = mem.buf[0]
            if state == 1:
                break
            if state == 2:
                elapsed = time.perf_counter() - start
                latencies.append(elapsed * 1_000_000)
                break
            time.sleep(0.0001)

        # Read from slot
        msg_id = struct.unpack_from("!I", mem.buf, 1)[0]
        stored_size = struct.unpack_from("!I", mem.buf, 5)[0]
        stored_checksum = bytes(mem.buf[9:25])
        stored_payload = bytes(mem.buf[25:25 + stored_size])

        elapsed = time.perf_counter() - start
        latencies.append(elapsed * 1_000_000)
        messages_received += 1

        # Verify integrity
        computed_checksum = hashlib.md5(stored_payload).digest()
        if stored_checksum != computed_checksum:
            integrity_errors += 1

        if stored_size != message_size:
            messages_failed += 1

        # Signal ready for next write
        mem.buf[0] = 0

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


def benchmark_shared_memory(num_messages: int, message_size: int, iterations: int = 3) -> dict:
    """Run Shared Memory IPC benchmark across multiple iterations."""
    all_latencies = []
    all_cpu = []
    all_memory = []
    total_messages_received = 0
    total_messages_failed = 0
    total_integrity_errors = 0
    total_time = 0.0

    for _ in range(iterations):
        # Header: state(1) + msg_id(4) + size(4) + checksum(16) + payload
        shm_size = 25 + message_size
        try:
            mem = shm.SharedMemory(create=True, size=shm_size)
        except OSError:
            mem = shm.SharedMemory(create=True, size=shm_size)

        # Initialize state to "ready for write"
        mem.buf[0] = 0

        result_queue = multiprocessing.Queue()
        ready = multiprocessing.Event()
        done = multiprocessing.Event()

        consumer_proc = multiprocessing.Process(
            target=_shm_consumer,
            args=(mem.name, message_size, num_messages, result_queue),
            daemon=True
        )
        producer_proc = multiprocessing.Process(
            target=_shm_producer,
            args=(mem.name, message_size, num_messages, ready, done),
            daemon=True
        )

        consumer_proc.start()
        producer_proc.start()
        ready.set()

        start_time = time.perf_counter()
        producer_proc.join(timeout=30)
        consumer_proc.join(timeout=30)
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

        # Cleanup
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
