"""Zero-Copy IPC Lab — FastAPI Backend."""
import os
import json
import time
import uuid
import asyncio
from datetime import datetime
from typing import Optional
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from benchmark.traditional_ipc import benchmark_pipe
from benchmark.shared_memory import benchmark_shared_memory
from benchmark.ring_buffer import benchmark_ring_buffer
from benchmark.stress_test import benchmark_stress
from benchmark.metrics import compute_improvement
from utils.system_info import get_system_info

app = FastAPI(title="Zero-Copy IPC Lab", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory experiment store
experiments_db: dict = {}
background_tasks_status: dict = {}


class BenchmarkRequest(BaseModel):
    method: str = Field(..., description="IPC method: pipe, shared_memory, ring_buffer")
    message_size: int = Field(1024, ge=1, le=67108864)
    num_messages: int = Field(1000, ge=1, le=200000)
    iterations: int = Field(3, ge=1, le=10)


class StressTestRequest(BaseModel):
    num_producers: int = Field(1, ge=1, le=8)
    num_consumers: int = Field(1, ge=1, le=8)
    message_size: int = Field(1024, ge=1, le=67108864)
    num_messages: int = Field(1000, ge=1, le=200000)


class FullComparisonRequest(BaseModel):
    message_size: int = Field(1024, ge=1, le=67108864)
    num_messages: int = Field(1000, ge=1, le=200000)
    iterations: int = Field(3, ge=1, le=10)


@app.get("/")
async def root():
    return {"status": "ok", "service": "Zero-Copy IPC Lab Backend", "version": "1.0.0"}


@app.get("/api/health")
async def health():
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}


@app.get("/api/system-info")
async def system_info():
    return get_system_info()


@app.post("/api/benchmark")
def run_benchmark(req: BenchmarkRequest):
    """Run a single IPC benchmark."""
    start = time.time()
    try:
        if req.method == "pipe":
            metrics = benchmark_pipe(req.num_messages, req.message_size, req.iterations)
        elif req.method == "shared_memory":
            metrics = benchmark_shared_memory(req.num_messages, req.message_size, req.iterations)
        elif req.method == "ring_buffer":
            metrics = benchmark_ring_buffer(req.num_messages, req.message_size, req.iterations)
        else:
            raise HTTPException(400, f"Unknown method: {req.method}")
    except Exception as e:
        raise HTTPException(500, f"Benchmark failed: {str(e)}")
    
    elapsed = time.time() - start
    
    experiment = {
        "id": str(uuid.uuid4()),
        "timestamp": datetime.utcnow().isoformat(),
        "method": req.method,
        "message_size": req.message_size,
        "num_messages": req.num_messages,
        "iterations": req.iterations,
        "metrics": metrics,
        "execution_time": round(elapsed, 4),
        "system": get_system_info(),
    }
    experiments_db[experiment["id"]] = experiment
    
    return experiment


@app.post("/api/benchmark/stress")
def run_stress_test(req: StressTestRequest):
    """Run stress test benchmark."""
    start = time.time()
    try:
        metrics = benchmark_stress(
            req.num_producers, req.num_consumers,
            req.num_messages, req.message_size
        )
    except Exception as e:
        raise HTTPException(500, f"Stress test failed: {str(e)}")
    
    elapsed = time.time() - start
    experiment = {
        "id": str(uuid.uuid4()),
        "timestamp": datetime.utcnow().isoformat(),
        "method": "stress_test",
        "num_producers": req.num_producers,
        "num_consumers": req.num_consumers,
        "message_size": req.message_size,
        "num_messages": req.num_messages,
        "iterations": 1,
        "metrics": metrics,
        "execution_time": round(elapsed, 4),
        "system": get_system_info(),
    }
    experiments_db[experiment["id"]] = experiment
    return experiment


@app.post("/api/benchmark/full-comparison")
def run_full_comparison(req: FullComparisonRequest):
    """Run all three IPC methods and compare."""
    results = {}
    
    start = time.time()
    try:
        results["pipe"] = benchmark_pipe(req.num_messages, req.message_size, req.iterations)
    except Exception as e:
        results["pipe"] = {"error": str(e)}
    
    try:
        results["shared_memory"] = benchmark_shared_memory(req.num_messages, req.message_size, req.iterations)
    except Exception as e:
        results["shared_memory"] = {"error": str(e)}
    
    try:
        results["ring_buffer"] = benchmark_ring_buffer(req.num_messages, req.message_size, req.iterations)
    except Exception as e:
        results["ring_buffer"] = {"error": str(e)}
    
    elapsed = time.time() - start
    
    # Compute improvements
    improvements = {}
    if "error" not in results.get("pipe", {}) and "error" not in results.get("shared_memory", {}):
        improvements["pipe_vs_shm"] = compute_improvement(results["pipe"], results["shared_memory"])
    if "error" not in results.get("pipe", {}) and "error" not in results.get("ring_buffer", {}):
        improvements["pipe_vs_ring"] = compute_improvement(results["pipe"], results["ring_buffer"])
    
    comparison = {
        "id": str(uuid.uuid4()),
        "timestamp": datetime.utcnow().isoformat(),
        "message_size": req.message_size,
        "num_messages": req.num_messages,
        "iterations": req.iterations,
        "results": results,
        "improvements": improvements,
        "execution_time": round(elapsed, 4),
        "system": get_system_info(),
    }
    
    experiments_db[comparison["id"]] = comparison
    return comparison


@app.get("/api/experiments")
async def list_experiments():
    """List all stored experiments."""
    items = list(experiments_db.values())
    items.sort(key=lambda x: x.get("timestamp", ""), reverse=True)
    return items


@app.get("/api/experiments/{experiment_id}")
async def get_experiment(experiment_id: str):
    """Get a specific experiment."""
    if experiment_id not in experiments_db:
        raise HTTPException(404, "Experiment not found")
    return experiments_db[experiment_id]


@app.delete("/api/experiments/{experiment_id}")
async def delete_experiment(experiment_id: str):
    """Delete a specific experiment."""
    if experiment_id not in experiments_db:
        raise HTTPException(404, "Experiment not found")
    del experiments_db[experiment_id]
    return {"status": "deleted"}


@app.delete("/api/experiments")
async def clear_experiments():
    """Clear all experiments."""
    experiments_db.clear()
    return {"status": "cleared"}


@app.get("/api/report/{experiment_id}")
async def generate_report(experiment_id: str):
    """Generate a JSON report for an experiment."""
    if experiment_id not in experiments_db:
        raise HTTPException(404, "Experiment not found")
    
    exp = experiments_db[experiment_id]
    report = {
        "title": "Zero-Copy IPC Experiment Report",
        "generated_at": datetime.utcnow().isoformat(),
        "experiment_id": experiment_id,
        "system_info": exp.get("system", {}),
        "configuration": {
            "method": exp.get("method", "unknown"),
            "message_size_bytes": exp.get("message_size", 0),
            "num_messages": exp.get("num_messages", 0),
            "iterations": exp.get("iterations", 0),
        },
        "results": exp.get("metrics", {}),
        "conclusion": _generate_conclusion(exp),
        "disclaimer": "Prototype Scope: This experiment was run using user-space IPC mechanisms. "
                      "A production deployment would require platform-specific Linux/embedded implementation."
    }
    return report


def _generate_conclusion(exp: dict) -> str:
    """Auto-generate a conclusion based on results."""
    m = exp.get("metrics", {})
    method = exp.get("method", "unknown")
    avg_lat = m.get("avg_latency", 0)
    tp = m.get("throughput_mbps", 0)
    integrity = m.get("integrity_errors", 0)
    
    lines = []
    if method in ("shared_memory", "ring_buffer"):
        lines.append(f"The {method.replace('_', '-')} approach achieved an average latency of {avg_lat:.2f} μs with throughput of {tp:.2f} MB/s.")
        lines.append("The improvement is workload-dependent and may vary with message size, process scheduling, and system load.")
    else:
        lines.append(f"The {method.replace('_', '-')} baseline achieved an average latency of {avg_lat:.2f} μs with throughput of {tp:.2f} MB/s.")
    
    if integrity == 0:
        lines.append("All messages passed data integrity verification.")
    else:
        lines.append(f"Data integrity errors detected: {integrity}.")
    
    return " ".join(lines)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
