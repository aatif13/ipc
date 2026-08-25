"""Traditional IPC benchmark using multiprocessing Pipe."""
import multiprocessing
import time
import struct
import hashlib
import os
import psutil
from typing import Optional
from .metrics import BenchmarkMetrics, calculate_latency_stats, make_throughput


def _pack_message(msg_id: int, payload: bytes) -> bytes:
    """Pack message with ID, length, payload, and checksum."""
    checksum = hashlib.md5(payload).digest()
    header = struct.pack("!IQ", msg_id, len(payload))
    return header + checksum + payload


def _unpack_message(data: bytes):
    """Unpack message returning (msg_id, payload, valid)."""
    header = data[:12]
    msg_id, payload_len = struct.unpack("!IQ", header)
    checksum = data[12:28]
    payload = data[28:28 + payload_len]
    valid = hashlib.md5(payload).digest() == checksum
    return msg_id, payload, valid


def _pipe_producer(conn, num_messages: int, message_size: int, ready_event: multiprocessing.Event):
    """Producer process: sends messages via Pipe."""
    payload = os.urandom(message_size)
    ready_event.wait()
    for i in range(num_messages):
        msg = _pack_message(i, payload)
        try:
            conn.send_bytes(msg)
        except (BrokenPipeError, OSError):
            break
    conn.close()


def _pipe_consumer(conn, num_messages: int, result_queue: multiprocessing.Queue):
    """Consumer process: receives messages via Pipe."""
    latencies = []
    messages_received = 0
    messages_failed = 0
    integrity_errors = 0
    process = psutil.Process()
    
    for _ in range(num_messages):
        start = time.perf_counter()
        try:
            data = conn.recv_bytes()
        except (EOFError, OSError):
            break
        elapsed = time.perf_counter() - start
        latencies.append(elapsed * 1_000_000)  # microseconds
        messages_received += 1
        
        try:
            msg_id, payload, valid = _unpack_message(data)
            if not valid:
                integrity_errors += 1
        except Exception:
            messages_failed += 1
            integrity_errors += 1
    
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


def benchmark_pipe(num_messages: int, message_size: int, iterations: int = 3) -> dict:
    """Run Pipe-based IPC benchmark across multiple iterations."""
    all_latencies = []
    all_cpu = []
    all_memory = []
    total_messages_received = 0
    total_messages_failed = 0
    total_integrity_errors = 0
    total_time = 0.0
    
    for _ in range(iterations):
        parent_conn, child_conn = multiprocessing.Pipe(duplex=True)
        result_queue = multiprocessing.Queue()
        ready = multiprocessing.Event()
        
        consumer_proc = multiprocessing.Process(
            target=_pipe_consumer,
            args=(child_conn, num_messages, result_queue),
            daemon=True
        )
        producer_proc = multiprocessing.Process(
            target=_pipe_producer,
            args=(parent_conn, num_messages, message_size, ready),
            daemon=True
        )
        
        consumer_proc.start()
        producer_proc.start()
        ready.set()
        
        start_time = time.perf_counter()
        producer_proc.join(timeout=120)
        consumer_proc.join(timeout=120)
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
            parent_conn.close()
            child_conn.close()
        except Exception:
            pass
        consumer_proc.terminate()
        producer_proc.terminate()
    
    metrics = BenchmarkMetrics()
    metrics.total_time = total_time / iterations
    metrics.messages_sent = num_messages
    metrics.messages_received = total_messages_received // iterations
    metrics.messages_failed = total_messages_failed // iterations
    metrics.integrity_errors = total_integrity_errors // iterations
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
