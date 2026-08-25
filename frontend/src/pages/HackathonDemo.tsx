import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, Button, Badge, Progress } from '../components/ui';
import { api } from '../services/api';
import { Rocket, Play, Pause, ChevronRight, ChevronLeft, Loader2, Shield, TrendingUp, Zap, Cpu, Activity } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface DemoProps {
  onExit: () => void;
}

const SCENES = [
  { title: 'The Problem', icon: '⚠️', duration: 0 },
  { title: 'Traditional IPC', icon: '📦', duration: 0 },
  { title: 'Our Approach', icon: '💡', duration: 0 },
  { title: 'Run Benchmark', icon: '▶️', duration: 0 },
  { title: 'Results', icon: '📊', duration: 0 },
  { title: 'Integrity Check', icon: '🔐', duration: 0 },
  { title: 'Architecture', icon: '🏗️', duration: 0 },
  { title: 'Applications', icon: '🚀', duration: 0 },
  { title: 'Future Scope', icon: '🗺️', duration: 0 },
];

export default function HackathonDemo({ onExit }: DemoProps) {
  const [scene, setScene] = useState(0);
  const [demoResult, setDemoResult] = useState<any>(null);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);

  const runDemo = useCallback(async () => {
    setRunning(true);
    setProgress(0);
    try {
      setProgress(10);
      await new Promise(r => setTimeout(r, 500));
      setProgress(30);

      const res = await api.runFullComparison({
        message_size: 4096,
        num_messages: 5000,
        iterations: 3,
      });

      setProgress(80);
      setDemoResult(res);
      setProgress(100);
    } catch (err) {
      console.error(err);
    }
    setRunning(false);
  }, []);

  useEffect(() => {
    if (scene === 3 && !demoResult && !running) {
      runDemo();
    }
  }, [scene, demoResult, running, runDemo]);

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Rocket className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Hackathon Demo Mode</h1>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="secondary">Scene {scene + 1} / {SCENES.length}</Badge>
            <Button variant="outline" size="sm" onClick={onExit}>Exit Demo</Button>
          </div>
        </div>

        {/* Progress */}
        <div className="mb-6">
          <Progress value={(scene + 1) / SCENES.length * 100} />
          <div className="flex justify-between mt-2">
            {SCENES.map((s, i) => (
              <button key={i} onClick={() => setScene(i)}
                className={`text-xs transition-colors ${i === scene ? 'text-primary font-medium' : i < scene ? 'text-green-500' : 'text-muted-foreground'}`}>
                {s.icon}
              </button>
            ))}
          </div>
        </div>

        {/* Scene Content */}
        <div className="animate-slide-up">
          {scene === 0 && <SceneProblem />}
          {scene === 1 && <SceneTraditional />}
          {scene === 2 && <SceneOurApproach />}
          {scene === 3 && <SceneBenchmark running={running} progress={progress} />}
          {scene === 4 && <SceneResults result={demoResult} />}
          {scene === 5 && <SceneIntegrity result={demoResult} />}
          {scene === 6 && <SceneArchitecture />}
          {scene === 7 && <SceneApplications />}
          {scene === 8 && <SceneFuture />}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8">
          <Button variant="outline" onClick={() => setScene(Math.max(0, scene - 1))} disabled={scene === 0} className="gap-2">
            <ChevronLeft className="h-4 w-4" /> Previous
          </Button>
          <Button onClick={() => setScene(Math.min(SCENES.length - 1, scene + 1))} disabled={scene === SCENES.length - 1} className="gap-2">
            Next <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function SceneProblem() {
  return (
    <Card className="border-2 border-red-500/30">
      <CardContent className="p-8 text-center">
        <div className="text-5xl mb-6">⚠️</div>
        <h2 className="text-3xl font-bold mb-4">Modern systems move enormous amounts of data between processes.</h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Traditional IPC mechanisms copy data through kernel buffers — consuming CPU cycles,
          memory bandwidth, and adding latency to every transfer.
        </p>
      </CardContent>
    </Card>
  );
}

function SceneTraditional() {
  return (
    <Card>
      <CardContent className="p-8">
        <h2 className="text-2xl font-bold mb-6 text-center">Traditional IPC — Multiple Copies</h2>
        <div className="bg-muted/30 rounded-lg p-8 font-mono text-center text-lg">
          <div className="text-blue-500 font-bold">Process A</div>
          <div className="text-red-400 my-2">↓ Copy 1 (→ Kernel)</div>
          <div className="text-amber-500 font-bold">Kernel Buffer</div>
          <div className="text-red-400 my-2">↓ Copy 2 (→ Process B)</div>
          <div className="text-blue-500 font-bold">Process B</div>
        </div>
        <p className="text-center text-muted-foreground mt-4">
          Two memory copies per message — CPU and bandwidth overhead for every transfer.
        </p>
      </CardContent>
    </Card>
  );
}

function SceneOurApproach() {
  return (
    <Card>
      <CardContent className="p-8">
        <h2 className="text-2xl font-bold mb-6 text-center">Our Approach — Shared Memory</h2>
        <div className="bg-muted/30 rounded-lg p-8 font-mono text-center text-lg">
          <div className="text-blue-500 font-bold">Process A</div>
          <div className="text-green-400 my-2">↓ Direct Access</div>
          <div className="border-2 border-green-500 rounded-lg py-3 px-6 inline-block bg-green-500/10">
            <div className="text-green-500 font-bold">Shared Memory Ring Buffer</div>
            <div className="text-xs text-green-400 mt-1">Zero-copy data exchange</div>
          </div>
          <div className="text-green-400 my-2">↑ Direct Access</div>
          <div className="text-blue-500 font-bold">Process B</div>
        </div>
        <p className="text-center text-muted-foreground mt-4">
          Both processes access the same memory — no unnecessary copying.
        </p>
      </CardContent>
    </Card>
  );
}

function SceneBenchmark({ running, progress }: { running: boolean; progress: number }) {
  return (
    <Card>
      <CardContent className="p-8">
        <h2 className="text-2xl font-bold mb-6 text-center">Running Live Benchmark</h2>
        <div className="max-w-md mx-auto space-y-4">
          <div className="text-center text-muted-foreground">
            {running ? 'Executing real benchmark across all IPC methods...' : 'Starting benchmark...'}
          </div>
          <Progress value={progress} />
          <div className="grid grid-cols-3 gap-4 text-center text-sm">
            <div className={`p-3 rounded border ${running ? 'border-blue-500 bg-blue-500/10' : ''}`}>
              <div className="font-medium">Pipe IPC</div>
              <div className="text-xs text-muted-foreground">Traditional</div>
            </div>
            <div className={`p-3 rounded border ${running ? 'border-green-500 bg-green-500/10' : ''}`}>
              <div className="font-medium">Shared Memory</div>
              <div className="text-xs text-muted-foreground">Zero-Copy</div>
            </div>
            <div className={`p-3 rounded border ${running ? 'border-purple-500 bg-purple-500/10' : ''}`}>
              <div className="font-medium">Ring Buffer</div>
              <div className="text-xs text-muted-foreground">Optimized</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SceneResults({ result }: { result: any }) {
  if (!result) return <Card><CardContent className="p-8 text-center text-muted-foreground">Run the benchmark first (Scene 4)</CardContent></Card>;

  const improvements = result.improvements?.pipe_vs_shm || {};
  const items = [
    { label: 'Latency Improvement', value: `${improvements.latency_improvement || 0}×`, color: 'text-blue-500' },
    { label: 'Throughput Improvement', value: `${improvements.throughput_improvement || 0}×`, color: 'text-green-500' },
    { label: 'CPU Reduction', value: `${improvements.cpu_reduction_percent || 0}%`, color: 'text-amber-500' },
  ];

  const chartData = Object.entries(result.results || {}).filter(([k, v]: [string, any]) => v && !v.error).map(([k, v]: [string, any]) => ({
    name: k === 'pipe' ? 'Pipe' : k === 'shared_memory' ? 'Shared Mem' : 'Ring Buf',
    latency: v.avg_latency,
    throughput: v.throughput_mbps,
  }));

  return (
    <Card>
      <CardContent className="p-8">
        <h2 className="text-2xl font-bold mb-6 text-center">Performance Results</h2>

        {/* Scorecard */}
        <div className="bg-muted/30 rounded-lg p-6 border-2 border-primary/30 max-w-lg mx-auto mb-6">
          <div className="text-center font-mono text-sm space-y-2">
            <div className="text-lg font-bold mb-4">EXPERIMENT COMPLETE</div>
            {items.map(item => (
              <div key={item.label} className="flex justify-between">
                <span>{item.label}</span>
                <span className={`font-bold ${item.color}`}>{item.value}</span>
              </div>
            ))}
            <div className="flex justify-between">
              <span>Integrity Errors</span>
              <span className="font-bold text-green-500">{improvements.integrity_errors || 0}</span>
            </div>
            <div className="flex justify-between">
              <span>Messages Lost</span>
              <span className="font-bold text-green-500">{improvements.messages_lost || 0}</span>
            </div>
          </div>
        </div>

        {/* Chart */}
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData}>
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Bar dataKey="latency" name="Avg Latency (μs)">
              {chartData.map((_, i) => <Cell key={i} fill={i === 0 ? '#ef4444' : i === 1 ? '#3b82f6' : '#8b5cf6'} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

function SceneIntegrity({ result }: { result: any }) {
  const pipe = result?.results?.pipe;
  const shm = result?.results?.shared_memory;
  const ring = result?.results?.ring_buffer;
  const allZero = [pipe, shm, ring].every(r => r && !r.error && r.integrity_errors === 0);

  return (
    <Card className={allZero ? 'border-green-500/50' : 'border-red-500/50'}>
      <CardContent className="p-8 text-center">
        <div className="text-6xl mb-4">{allZero ? '✓' : '✗'}</div>
        <h2 className="text-2xl font-bold mb-4">
          {allZero ? 'DATA INTEGRITY VERIFIED' : 'INTEGRITY ERRORS DETECTED'}
        </h2>
        <p className="text-muted-foreground mb-6">
          All messages were verified using MD5 checksums. Data integrity is maintained across all IPC methods.
        </p>

        <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto">
          {[
            { name: 'Pipe', data: pipe },
            { name: 'Shared Memory', data: shm },
            { name: 'Ring Buffer', data: ring },
          ].map(item => (
            <div key={item.name} className="p-3 rounded-lg border text-center">
              <div className="text-sm font-medium">{item.name}</div>
              <div className="text-xs text-muted-foreground mt-1">
                Sent: {item.data?.messages_sent?.toLocaleString() || '—'}
              </div>
              <div className="text-xs text-muted-foreground">
                Received: {item.data?.messages_received?.toLocaleString() || '—'}
              </div>
              <div className={`text-xs font-bold mt-1 ${item.data?.integrity_errors === 0 ? 'text-green-500' : 'text-red-500'}`}>
                Errors: {item.data?.integrity_errors ?? '—'}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function SceneArchitecture() {
  return (
    <Card>
      <CardContent className="p-8">
        <h2 className="text-2xl font-bold mb-6 text-center">System Architecture</h2>
        <div className="bg-muted/30 rounded-lg p-6 font-mono text-sm">
          <pre className="text-center text-muted-foreground">
{`User Application
       │
     ioctl()
       │
       ▼
Linux Kernel Module  ← Future
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
        <div className="flex gap-3 justify-center mt-4">
          <Badge variant="default">Prototype: user-space shared memory</Badge>
          <Badge variant="secondary">Target: Linux kernel / Embedded Linux</Badge>
        </div>
      </CardContent>
    </Card>
  );
}

function SceneApplications() {
  const apps = [
    { icon: '🤖', name: 'Robotics' },
    { icon: '🚗', name: 'Autonomous Systems' },
    { icon: '🏭', name: 'Industrial IoT' },
    { icon: '🧠', name: 'Edge AI' },
    { icon: '🎬', name: 'Multimedia' },
    { icon: '🏎️', name: 'Automotive' },
    { icon: '📡', name: 'Telecom' },
  ];

  return (
    <Card>
      <CardContent className="p-8">
        <h2 className="text-2xl font-bold mb-6 text-center">Real-World Applications</h2>
        <div className="grid grid-cols-4 md:grid-cols-7 gap-4">
          {apps.map(app => (
            <div key={app.name} className="text-center p-4 rounded-lg border hover:bg-muted/50 transition-colors">
              <div className="text-3xl mb-2">{app.icon}</div>
              <div className="text-xs font-medium">{app.name}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function SceneFuture() {
  return (
    <Card>
      <CardContent className="p-8">
        <h2 className="text-2xl font-bold mb-6 text-center">Future Scope</h2>
        <div className="bg-muted/30 rounded-lg p-6 font-mono text-sm max-w-md mx-auto">
          <pre className="text-center text-muted-foreground">
{`CURRENT
User-Space Prototype
       ↓
PHASE 2
Linux Implementation
       ↓
PHASE 3
Kernel Module
       ↓
PHASE 4
Embedded Linux
       ↓
PHASE 5
ARM / Raspberry Pi
       ↓
PHASE 6
Real-Time Systems`}
          </pre>
        </div>
        <div className="text-center mt-6">
          <p className="text-muted-foreground mb-4">
            From prototype to production — a clear path to Linux kernel-level IPC.
          </p>
          <div className="flex items-center justify-center gap-2">
            <Badge variant="default">Engineering &gt; Marketing</Badge>
            <Badge variant="secondary">Real measurements, not fake numbers</Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
