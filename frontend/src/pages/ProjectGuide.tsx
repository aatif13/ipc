import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, Badge, Button } from '../components/ui';
import { BookOpen, ChevronDown, ChevronUp } from 'lucide-react';

const GUIDE_SECTIONS = [
  {
    id: 'ipc',
    step: 1,
    title: 'What is IPC?',
    beginner: 'IPC stands for Inter-Process Communication. It\'s how separate programs (processes) on a computer talk to each other. Each process has its own memory space, so they can\'t directly read each other\'s data.',
    technical: 'Inter-Process Communication (IPC) refers to mechanisms that enable processes to exchange data and synchronize operations. In operating systems, processes are isolated in separate virtual address spaces, so IPC mechanisms provide controlled channels for data transfer.',
    example: 'Think of it like two people in separate rooms who can\'t see each other\'s whiteboards. They need a shared space (like a window) to exchange messages.',
  },
  {
    id: 'why-ipc',
    step: 2,
    title: 'Why do processes need IPC?',
    beginner: 'Modern applications often split work across multiple processes. A web server might have one process handling requests and another processing data. These processes need to share information to work together.',
    technical: 'Process isolation provides memory safety and fault containment. However, cooperative systems require data exchange between isolated processes. IPC enables modular architectures where processes handle specific responsibilities.',
    example: 'In a self-driving car, one process handles camera input, another processes LiDAR data, and a third controls steering. They all need to share data in real-time.',
  },
  {
    id: 'traditional',
    step: 3,
    title: 'Traditional IPC',
    beginner: 'The most common way to send data between processes is through pipes or queues. The operating system copies the data from one process\'s memory, through the kernel, and into another process\'s memory. This involves two copies per transfer.',
    technical: 'Traditional IPC mechanisms (pipes, sockets, message queues) transfer data by copying between user-space buffers and kernel-space buffers. For each transfer, the data is copied at least twice: from the sender\'s buffer to kernel space, and from kernel space to the receiver\'s buffer.',
    example: 'It\'s like writing a message on paper, putting it in a mailbox (kernel), and someone picking it up and copying it to their notebook.',
  },
  {
    id: 'shared-memory',
    step: 4,
    title: 'What is Shared Memory?',
    beginner: 'Shared memory is a special region of memory that multiple processes can access at the same time. Instead of copying data back and forth, both processes read and write directly to the same memory area.',
    technical: 'Shared memory is a IPC mechanism that maps a common memory region into the address spaces of multiple processes. Processes can directly read/write this region without kernel-mediated data copying, achieving zero-copy semantics for data exchange.',
    example: 'Instead of writing letters back and forth, both people share the same whiteboard. When one person writes something, the other can immediately see it.',
  },
  {
    id: 'zero-copy',
    step: 5,
    title: 'What is Zero-Copy?',
    beginner: 'Zero-copy means the data stays in one place in memory and isn\'t duplicated. The data is written once to shared memory and read directly from there. This avoids the overhead of copying.',
    technical: 'Zero-copy techniques minimize or eliminate data copying during transfer. With shared memory, data is written to a shared buffer once and read from the same location, avoiding kernel-mediated copy operations. This reduces CPU usage and memory bandwidth consumption.',
    example: 'Instead of photocopying a document and mailing it, you share a digital file. Both people access the same file without making copies.',
  },
  {
    id: 'ring-buffer',
    step: 6,
    title: 'Ring Buffer',
    beginner: 'A ring buffer (or circular buffer) is like a round table with seats. You write messages going clockwise, and read them going clockwise too. When you reach the end, you wrap around to the beginning. It\'s efficient because you reuse the same memory.',
    technical: 'A ring buffer is a fixed-size data structure that uses a circular array with read and write pointers. It enables efficient FIFO communication between producers and consumers without memory allocation. The buffer wraps around when it reaches capacity, with full/empty detection using count or pointer comparison.',
    example: 'Imagine a revolving sushi restaurant. The chef places plates on the belt (write), and diners pick them up (read). The belt goes around in a circle.',
  },
  {
    id: 'sync',
    step: 7,
    title: 'Synchronization',
    beginner: 'When two processes access shared memory at the same time, problems can occur. Synchronization (like locks) ensures that only one process writes at a time, preventing data corruption.',
    technical: 'Concurrent access to shared memory requires synchronization primitives (mutexes, semaphores, spinlocks) to prevent race conditions. In our prototype, spin-wait synchronization ensures thread-safe producer/consumer coordination without kernel involvement.',
    example: 'It\'s like a single-lane bridge — only one car goes at a time, signaled by a traffic light.',
  },
  {
    id: 'benchmark',
    step: 8,
    title: 'Benchmarking',
    beginner: 'We measure how fast and efficient each approach is. We test latency (how long a message takes), throughput (how much data per second), and CPU usage (how much work the processor does).',
    technical: 'Benchmarks measure latency (per-message transfer time at various percentiles), throughput (total data transferred per second), CPU utilization, and memory consumption. Multiple iterations with statistical analysis ensure reproducible results.',
    example: 'It\'s like timing how long it takes to deliver packages through different routes.',
  },
  {
    id: 'correctness',
    step: 9,
    title: 'Data Integrity',
    beginner: 'Speed is only useful if the data arrives correctly. We add checksums (fingerprints) to every message. The receiver checks that the fingerprint matches, proving the data wasn\'t corrupted.',
    technical: 'Data integrity is verified using MD5 checksums attached to each message. The receiver recomputes the hash and compares it against the transmitted hash. Any mismatch indicates data corruption or loss, which is tracked as an integrity error.',
    example: 'It\'s like sealing a letter with a wax seal — if the seal is broken, you know the message was tampered with.',
  },
  {
    id: 'linux',
    step: 10,
    title: 'Linux Architecture',
    beginner: 'This prototype could eventually run on Linux computers using kernel-level features. Linux has special system calls (like mmap) that let programs share memory efficiently at the operating system level.',
    technical: 'A production Linux implementation would use a kernel module with mmap()-based shared memory, ioctl() for control operations, and kernel synchronization primitives. This eliminates user-space overhead and enables kernel-bypass IPC.',
    example: 'Think of it as upgrading from a prototype in a lab to a factory production line.',
  },
  {
    id: 'embedded',
    step: 11,
    title: 'Embedded Linux',
    beginner: 'The same ideas could run on small computers like Raspberry Pi. Embedded Linux systems in robots, cars, and IoT devices need fast communication between processes — exactly what this technology provides.',
    technical: 'Embedded Linux deployments on ARM platforms (Raspberry Pi, industrial gateways) require kernel-level shared memory with real-time guarantees. The architecture scales from user-space prototypes to kernel modules with deterministic latency.',
    example: 'It\'s like taking the same design from a full-size car and adapting it for a compact electric vehicle.',
  },
  {
    id: 'results',
    step: 12,
    title: 'Understanding Results',
    beginner: 'When you run benchmarks, look at the latency and throughput numbers. If shared memory is faster, it means less data copying. If not, the difference might be due to system load or message size.',
    technical: 'Interpret results in context: smaller messages favor shared memory (less copy overhead), while very large messages may show less improvement (memory bandwidth becomes the bottleneck). System load, CPU cache behavior, and process scheduling all affect results.',
    example: 'The results depend on many factors — just like how delivery speed depends on traffic, package size, and route.',
  },
];

export default function ProjectGuidePage() {
  const [mode, setMode] = useState<'beginner' | 'technical'>('beginner');
  const [expandedSection, setExpandedSection] = useState<string | null>('ipc');

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Project Guide</h1>
          <p className="text-muted-foreground mt-1">Learn how the Zero-Copy IPC system works, step by step</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Mode:</span>
          <Button variant={mode === 'beginner' ? 'default' : 'outline'} size="sm" onClick={() => setMode('beginner')}>
            Beginner
          </Button>
          <Button variant={mode === 'technical' ? 'default' : 'outline'} size="sm" onClick={() => setMode('technical')}>
            Technical
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        {GUIDE_SECTIONS.map(section => (
          <Card key={section.id} className="overflow-hidden">
            <button
              className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/50 transition-colors"
              onClick={() => setExpandedSection(expandedSection === section.id ? null : section.id)}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                  {section.step}
                </div>
                <span className="font-semibold">{section.title}</span>
              </div>
              {expandedSection === section.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
            {expandedSection === section.id && (
              <CardContent className="pt-0 pb-4 animate-slide-up">
                <div className="ml-11 space-y-3">
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {mode === 'beginner' ? section.beginner : section.technical}
                  </p>
                  <div className="p-3 rounded-lg bg-muted/50 border">
                    <div className="text-xs font-medium text-muted-foreground mb-1">💡 Example</div>
                    <p className="text-sm">{section.example}</p>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
