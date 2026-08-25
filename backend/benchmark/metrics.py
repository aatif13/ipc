"""Metrics collection and calculation utilities."""
import time
import statistics
from dataclasses import dataclass, field
from typing import List, Optional


@dataclass
class BenchmarkMetrics:
    """Comprehensive benchmark metrics."""
    total_time: float = 0.0
    avg_latency: float = 0.0
    min_latency: float = float('inf')
    max_latency: float = 0.0
    median_latency: float = 0.0
    p95_latency: float = 0.0
    p99_latency: float = 0.0
    throughput_bytes_per_sec: float = 0.0
    throughput_messages_per_sec: float = 0.0
    throughput_mbps: float = 0.0
    cpu_usage_percent: float = 0.0
    memory_usage_bytes: int = 0
    memory_usage_mb: float = 0.0
    messages_sent: int = 0
    messages_received: int = 0
    messages_failed: int = 0
    messages_dropped: int = 0
    integrity_errors: int = 0
    latencies: List[float] = field(default_factory=list)

    def to_dict(self) -> dict:
        return {
            "total_time": round(self.total_time, 6),
            "avg_latency": round(self.avg_latency, 6),
            "min_latency": round(self.min_latency, 6),
            "max_latency": round(self.max_latency, 6),
            "median_latency": round(self.median_latency, 6),
            "p95_latency": round(self.p95_latency, 6),
            "p99_latency": round(self.p99_latency, 6),
            "throughput_bytes_per_sec": round(self.throughput_bytes_per_sec, 2),
            "throughput_messages_per_sec": round(self.throughput_messages_per_sec, 2),
            "throughput_mbps": round(self.throughput_mbps, 4),
            "cpu_usage_percent": round(self.cpu_usage_percent, 4),
            "memory_usage_bytes": self.memory_usage_bytes,
            "memory_usage_mb": round(self.memory_usage_mb, 4),
            "messages_sent": self.messages_sent,
            "messages_received": self.messages_received,
            "messages_failed": self.messages_failed,
            "messages_dropped": self.messages_dropped,
            "integrity_errors": self.integrity_errors,
        }


def calculate_latency_stats(latencies: List[float], metrics: BenchmarkMetrics) -> BenchmarkMetrics:
    """Calculate percentile and statistical metrics from raw latencies."""
    if not latencies:
        return metrics
    
    sorted_lat = sorted(latencies)
    n = len(sorted_lat)
    
    metrics.avg_latency = statistics.mean(sorted_lat)
    metrics.median_latency = statistics.median(sorted_lat)
    metrics.min_latency = sorted_lat[0]
    metrics.max_latency = sorted_lat[-1]
    
    # p95 and p99
    p95_idx = int(n * 0.95)
    p99_idx = int(n * 0.99)
    metrics.p95_latency = sorted_lat[min(p95_idx, n - 1)]
    metrics.p99_latency = sorted_lat[min(p99_idx, n - 1)]
    
    return metrics


def make_throughput(metrics: BenchmarkMetrics, total_data_bytes: int, num_messages: int) -> BenchmarkMetrics:
    """Calculate throughput metrics from total time."""
    if metrics.total_time > 0:
        metrics.throughput_bytes_per_sec = total_data_bytes / metrics.total_time
        metrics.throughput_messages_per_sec = num_messages / metrics.total_time
        metrics.throughput_mbps = metrics.throughput_bytes_per_sec / (1024 * 1024)
    return metrics


def compute_improvement(traditional_metrics: dict, shared_metrics: dict) -> dict:
    """Compute improvement ratios between traditional and shared-memory IPC."""
    result = {}
    
    trad_lat = traditional_metrics.get("avg_latency", 1)
    shm_lat = shared_metrics.get("avg_latency", 1)
    if shm_lat > 0:
        result["latency_improvement"] = round(trad_lat / shm_lat, 2) if shm_lat > 0 else 0
    else:
        result["latency_improvement"] = 0
    
    trad_tp = traditional_metrics.get("throughput_mbps", 0.001)
    shm_tp = shared_metrics.get("throughput_mbps", 0)
    if trad_tp > 0:
        result["throughput_improvement"] = round(shm_tp / trad_tp, 2)
    else:
        result["throughput_improvement"] = 0
    
    trad_cpu = traditional_metrics.get("cpu_usage_percent", 1)
    shm_cpu = shared_metrics.get("cpu_usage_percent", 0)
    if trad_cpu > 0:
        result["cpu_reduction_percent"] = round(max(0, (1 - shm_cpu / trad_cpu) * 100), 1)
    else:
        result["cpu_reduction_percent"] = 0
    
    result["integrity_errors"] = (
        traditional_metrics.get("integrity_errors", 0) + 
        shared_metrics.get("integrity_errors", 0)
    )
    result["messages_lost"] = (
        traditional_metrics.get("messages_dropped", 0) + 
        shared_metrics.get("messages_dropped", 0)
    )
    
    return result
