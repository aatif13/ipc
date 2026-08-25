# Zero-Copy Shared-Memory IPC Framework

> **Move data once. Share memory. Reduce latency.**

A hackathon prototype demonstrating high-performance Inter-Process Communication using shared memory and comparing it against conventional data-copy-based IPC.

---

## Problem Statement

Traditional IPC mechanisms (pipes, sockets, message queues) transfer data by copying between user-space buffers and kernel-space buffers. For each transfer, the data is copied at least twice, consuming CPU cycles and memory bandwidth.

## Solution

A shared-memory IPC architecture where processes access a common memory region through a ring buffer, eliminating unnecessary data copying.

## Architecture

```
Traditional IPC:          Shared-Memory IPC:
Process A                 Process A
  ↓                         ↓
Copy                      ┌──────────────┐
  ↓                       │Shared Memory │
Kernel                    │ Ring Buffer  │
  ↓                       └──────────────┘
Copy                        ↑
  ↓                         ↓
Process B                 Process B
```

## Features

- **Real benchmarks**: Actual local experiments, no hard-coded values
- **Three IPC methods**: Pipe, Shared Memory, Ring Buffer
- **Data integrity**: MD5 checksum verification
- **Live visualization**: Real-time process and buffer animation
- **Professional dashboard**: KPI cards, charts, experiment history
- **Hackathon Demo Mode**: Automated 5-minute presentation
- **Beginner/Technical modes**: Accessible to all skill levels

## Technologies

### Frontend
- React 18 + TypeScript
- Vite
- Tailwind CSS
- Recharts (charting)
- Lucide Icons

### Backend
- Python 3.10+
- FastAPI + Uvicorn
- multiprocessing + shared_memory
- psutil

## Installation

### Windows

```bash
# Clone repository
cd zero-copy-ipc

# Backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt

# Frontend
cd frontend
npm install
```

### macOS / Linux

```bash
cd zero-copy-ipc

# Backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Frontend
cd frontend
npm install
```

## Running

### Start Backend (Terminal 1)

```bash
cd zero-copy-ipc
.\venv\Scripts\Activate.ps1   # Windows
# source venv/bin/activate    # macOS/Linux

cd backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Start Frontend (Terminal 2)

```bash
cd zero-copy-ipc/frontend
npm run dev
```

### Open Browser

```
http://localhost:5173
```

## Understanding Results

- **Latency**: Time per message transfer (lower is better)
- **Throughput**: Data transferred per second (higher is better)
- **CPU Usage**: Processor utilization (lower is better)
- **Data Integrity**: All messages must be verified (0 errors expected)

Results vary by message size, system load, and hardware. The improvement from shared memory is most noticeable for small-to-medium messages where copy overhead is significant.

## Technical Limitations

- User-space implementation (not kernel-level)
- Spin-wait synchronization (not optimal for all workloads)
- Single-machine only (no network IPC)
- Results depend on system hardware and load

## Future Scope

1. **Linux Kernel Module**: mmap-based shared memory with ioctl control
2. **Embedded Linux**: ARM platform deployment (Raspberry Pi)
3. **Real-Time Systems**: Deterministic latency guarantees
4. **Multi-Machine**: Network shared memory

## Hackathon Demo Instructions

1. Open the application at http://localhost:5173
2. Click **"Run Hackathon Demo"** on the dashboard
3. The demo will automatically guide through 9 scenes:
   - Problem → Traditional IPC → Our Approach → Benchmark → Results → Integrity → Architecture → Applications → Future
4. Each scene has a "Next" button for manual progression

## Prototype Scope

> This hackathon prototype demonstrates shared-memory IPC concepts in user space. A production deployment would require platform-specific Linux/embedded implementation and additional validation. This is NOT a kernel-level implementation.

---

**Engineering > Marketing** — All benchmark results come from actual local experiments.
