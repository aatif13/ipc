import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, Badge, Tabs } from '../components/ui';
import { Map, Layers, ArrowRight, ChevronRight } from 'lucide-react';

export default function ArchitecturePage() {
  const [tab, setTab] = useState('architecture');

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Architecture</h1>
        <p className="text-muted-foreground mt-1">System architecture and implementation design</p>
      </div>

      <Tabs
        tabs={[
          { label: 'System Architecture', value: 'architecture' },
          { label: 'Linux Target', value: 'linux' },
          { label: 'Embedded Linux', value: 'embedded' },
        ]}
        activeTab={tab}
        onChange={setTab}
      />

      {tab === 'architecture' && <ArchitectureTab />}
      {tab === 'linux' && <LinuxTargetTab />}
      {tab === 'embedded' && <EmbeddedLinuxTab />}
    </div>
  );
}

function ArchitectureTab() {
  return (
    <div className="space-y-6 mt-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Map className="h-4 w-4" />
            System Architecture
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-muted/30 rounded-lg p-6 font-mono text-sm space-y-2 overflow-x-auto">
            <pre className="text-center text-muted-foreground">
{`                    USER APPLICATION
                           │
                 ┌─────────┴─────────┐
                 │                   │
            Producer             Consumer
                 │                   ▲
                 │                   │
                 ▼                   │
           ┌─────────────────────────────┐
           │       SHARED MEMORY         │
           │                             │
           │       RING BUFFER           │
           │                             │
           │  Read Index / Write Index   │
           └─────────────────────────────┘
                           │
                           ▼
                    Synchronization
                           │
                           ▼
                    Linux IPC Layer`}
            </pre>
          </div>
          <div className="mt-4 space-y-2">
            <Badge variant="secondary">Prototype implementation: user-space shared memory</Badge>
            <Badge variant="secondary">Target architecture: Embedded Linux / Linux kernel</Badge>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-3 gap-4">
        {[
          {
            title: 'Producer Process',
            desc: 'Writes messages into shared memory ring buffer. Manages write index and tracks buffer occupancy.',
            color: 'border-blue-500/50',
          },
          {
            title: 'Shared Memory Ring Buffer',
            desc: 'Fixed-size circular buffer in shared memory. Each slot stores message ID, checksum, and payload.',
            color: 'border-green-500/50',
          },
          {
            title: 'Consumer Process',
            desc: 'Reads messages from shared memory ring buffer. Verifies data integrity via checksum.',
            color: 'border-purple-500/50',
          },
        ].map(item => (
          <Card key={item.title} className={item.color}>
            <CardContent className="p-4">
              <h4 className="font-semibold text-sm mb-2">{item.title}</h4>
              <p className="text-xs text-muted-foreground">{item.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Ring Buffer Visual */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Ring Buffer Structure</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-muted/30 rounded-lg p-4 font-mono text-xs text-center">
            <pre>{`┌──────────────────────────────────────────────────┐
│              SHARED MEMORY                       │
│                                                  │
│  [M1][M2][M3][M4][M5][ ][ ][ ][ ][ ][ ][ ][ ]  │
│        ↑                                ↑        │
│      READ                            WRITE       │
│      INDEX                           INDEX       │
│                                                  │
└──────────────────────────────────────────────────┘`}</pre>
          </div>
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div className="p-2 rounded bg-muted">
              <div className="font-semibold">Read Index</div>
              <div className="text-muted-foreground">Pointer to next slot to read</div>
            </div>
            <div className="p-2 rounded bg-muted">
              <div className="font-semibold">Write Index</div>
              <div className="text-muted-foreground">Pointer to next slot to write</div>
            </div>
            <div className="p-2 rounded bg-muted">
              <div className="font-semibold">Count</div>
              <div className="text-muted-foreground">Number of filled slots</div>
            </div>
            <div className="p-2 rounded bg-muted">
              <div className="font-semibold">Capacity</div>
              <div className="text-muted-foreground">Maximum number of slots</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function LinuxTargetTab() {
  return (
    <div className="space-y-6 mt-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Linux Target Architecture</CardTitle>
          <p className="text-sm text-muted-foreground">How the prototype maps to a Linux kernel implementation</p>
        </CardHeader>
        <CardContent>
          <div className="bg-muted/30 rounded-lg p-6 font-mono text-sm overflow-x-auto">
            <pre className="text-center text-muted-foreground">
{`User Application
       │
     ioctl()
       │
       ▼
Linux Kernel Module
       │
     mmap()
       │
       ▼
Shared Memory
       │
       ▼
Ring Buffer`}
            </pre>
          </div>

          <div className="mt-6 space-y-4">
            {[
              {
                title: 'mmap()',
                desc: 'Maps kernel shared memory into user-space address space. Enables direct memory access without copy operations.',
                icon: '📦',
              },
              {
                title: 'ioctl()',
                desc: 'Control interface between user-space and kernel module. Used to configure, start, and stop IPC operations.',
                icon: '⚙️',
              },
              {
                title: 'Synchronization',
                desc: 'Kernel-level synchronization primitives (spinlocks, mutexes) ensure safe concurrent access from multiple processes.',
                icon: '🔒',
              },
              {
                title: 'Kernel/User-space Boundary',
                desc: 'Shared memory exists in kernel space. User processes access it through mapped pages, avoiding system call overhead for data transfer.',
                icon: '🌉',
              },
            ].map(item => (
              <div key={item.title} className="flex gap-3 p-3 rounded-lg border">
                <div className="text-2xl">{item.icon}</div>
                <div>
                  <div className="font-semibold text-sm">{item.title}</div>
                  <div className="text-xs text-muted-foreground">{item.desc}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 p-4 rounded-lg bg-amber-500/10 border border-amber-500/30">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-amber-500 font-semibold text-sm">Future Linux Kernel Implementation</span>
            </div>
            <p className="text-xs text-muted-foreground">
              The current prototype runs in user space using Python multiprocessing.shared_memory.
              A production deployment would implement the ring buffer as a Linux kernel module with
              proper mmap-based shared memory and ioctl control interface.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function EmbeddedLinuxTab() {
  return (
    <div className="space-y-6 mt-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Embedded Linux Deployment Path</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-muted/30 rounded-lg p-6 font-mono text-sm overflow-x-auto">
            <pre className="text-center text-muted-foreground">
{`Laptop Prototype
       ↓
Linux PC
       ↓
Raspberry Pi
       ↓
Embedded Linux Device`}
            </pre>
          </div>

          <div className="mt-6 grid md:grid-cols-2 gap-4">
            {[
              {
                title: 'Raspberry Pi',
                desc: 'ARM-based single-board computers running Linux. Ideal for prototyping embedded IPC solutions.',
                icon: '🍓',
              },
              {
                title: 'ARM Linux Systems',
                desc: 'Industrial ARM boards running embedded Linux distributions with real-time patches.',
                icon: '🔧',
              },
              {
                title: 'Industrial Gateways',
                desc: 'Edge computing devices requiring low-latency inter-process communication.',
                icon: '🏭',
              },
              {
                title: 'Robotics Systems',
                desc: 'Real-time communication between control processes and sensor interfaces.',
                icon: '🤖',
              },
              {
                title: 'IoT Gateways',
                desc: 'High-throughput data transfer between device management and cloud communication.',
                icon: '📡',
              },
              {
                title: 'Real-Time Systems',
                desc: 'Deterministic communication for safety-critical embedded applications.',
                icon: '⏱️',
              },
            ].map(item => (
              <div key={item.title} className="flex gap-3 p-3 rounded-lg border">
                <div className="text-2xl">{item.icon}</div>
                <div>
                  <div className="font-semibold text-sm">{item.title}</div>
                  <div className="text-xs text-muted-foreground">{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
