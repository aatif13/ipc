"""System information gathering."""
import platform
import os
import sys
import psutil


def get_system_info() -> dict:
    """Collect comprehensive system information."""
    mem = psutil.virtual_memory()
    cpu_freq = psutil.cpu_freq()
    
    return {
        "os": platform.system(),
        "os_version": platform.version(),
        "os_release": platform.release(),
        "architecture": platform.machine(),
        "platform": platform.platform(),
        "cpu_brand": platform.processor() or "Unknown",
        "cpu_count_physical": psutil.cpu_count(logical=False) or 0,
        "cpu_count_logical": psutil.cpu_count(logical=True) or 0,
        "cpu_freq_max": round(cpu_freq.max, 2) if cpu_freq else 0,
        "cpu_freq_current": round(cpu_freq.current, 2) if cpu_freq else 0,
        "ram_total_gb": round(mem.total / (1024 ** 3), 2),
        "ram_available_gb": round(mem.available / (1024 ** 3), 2),
        "ram_used_percent": mem.percent,
        "python_version": sys.version,
        "pid": os.getpid(),
    }
