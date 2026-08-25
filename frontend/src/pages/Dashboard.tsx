import React, { useEffect, useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, Button, Badge } from '../components/ui';
import { api } from '../services/api';
import {
  Cpu, Zap, Activity, Clock, ArrowUpRight, Shield, TrendingUp,
  MemoryStick, Timer, RefreshCw, Rocket, ChevronRight
} from 'lucide-react';

interface DashboardProps {
  onNavigate: (page: string) => void;
  onRunDemo: () => void;
}

export default function Dashboard({ onNavigate, onRunDemo }: DashboardProps) {
  const [backendConnected, setBackendConnected] = useState(false);
  const [lastResult, setLastResult] = useState<any>(null);

  useEffect(() => {
    api.health().then(() => setBackendConnected(true)).catch(() => setBackendConnected(false));
  }, []);

  const kpis = lastResult ? [
    { label: 'Avg Latency', value: `${(lastResult.results?.pipe?.avg_latency || 0).toFixed(1)} μs`, sub: 'vs traditional', icon: Clock, color: 'text-blue-500' },
    { label: 'Throughput', value: `${(lastResult.results?.shared_memory?.throughput_mbps || 0).toFixed(0)} MB/s`, sub: 'shared memory', icon: Zap, color: 'text-green-500' },
    { label: 'CPU Usage', value: `${(lastResult.results?.shared_memory?.cpu_usage_percent || 0).toFixed(1)}%`, sub: 'utilization', icon: Cpu, color: 'text-amber-500' },
    { label: 'Improvement', value: `${(lastResult.improvements?.pipe_vs_shm?.latency_improvement || 0)}×`, sub: 'faster', icon: TrendingUp, color: 'text-emerald-500' },
    { label: 'Integrity', value: `${(lastResult.results?.shared_memory?.integrity_errors || 0) === 0 ? '✓ Verified' : 'Errors'}`, sub: 'data integrity', icon: Shield, color: 'text-green-500' },
    { label: 'Messages Lost', value: `${(lastResult.improvements?.pipe_vs_shm?.messages_lost || 0)}`, sub: 'total lost', icon: Activity, color: 'text-red-500' },
  ] : [
    { label: 'Avg Latency', value: '—', sub: 'run benchmark', icon: Clock, color: 'text-muted-foreground' },
    { label: 'Throughput', value: '—', sub: 'run benchmark', icon: Zap, color: 'text-muted-foreground' },
    { label: 'CPU Usage', value: '—', sub: 'run benchmark', icon: Cpu, color: 'text-muted-foreground' },
    { label: 'Improvement', value: '—', sub: 'run benchmark', icon: TrendingUp, color: 'text-muted-foreground' },
    { label: 'Integrity', value: '—', sub: 'run benchmark', icon: Shield, color: 'text-muted-foreground' },
    { label: 'Messages Lost', value: '—', sub: 'run benchmark', icon: Activity, color: 'text-muted-foreground' },
  ];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">Zero-Copy IPC Lab</h1>
            <Badge variant={backendConnected ? 'default' : 'destructive'}>
              {backendConnected ? '🟢 Backend Connected' : '🔴 Backend Offline'}
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1">High-Performance Inter-Process Communication Prototype</p>
        </div>
        <Badge variant="secondary">Prototype Mode</Badge>
      </div>

      {/* Hero Section */}
      <Card className="overflow-hidden">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-green-500/5" />
          <CardContent className="p-8 relative">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <h2 className="text-2xl font-bold mb-3">Why Copy Data When You Can Share It?</h2>
                <p className="text-muted-foreground mb-6 leading-relaxed">
                  Traditional IPC moves data between processes by copying it through the kernel.
                  Shared-memory IPC allows processes to access a common memory region directly,
                  reducing unnecessary data movement.
                </p>
                <div className="flex gap-3">
                  <Button onClick={onRunDemo} className="gap-2">
                    <Rocket className="h-4 w-4" />
                    Run Hackathon Demo
                  </Button>
                  <Button variant="outline" onClick={() => onNavigate('simulator')}>
                    Open Simulator
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <AnimatedDiagram type="traditional" />
                <AnimatedDiagram type="shared" />
              </div>
            </div>
          </CardContent>
        </div>
      </Card>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {kpis.map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <Card key={i} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{kpi.label}</span>
                  <Icon className={`h-4 w-4 ${kpi.color}`} />
                </div>
                <div className="text-2xl font-bold">{kpi.value}</div>
                <div className="text-xs text-muted-foreground mt-1">{kpi.sub}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => onNavigate('simulator')}>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-500" />
              Live IPC Simulator
            </CardTitle>
            <CardDescription>Run real-time IPC experiments with custom configurations</CardDescription>
          </CardHeader>
        </Card>
        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => onNavigate('comparison')}>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-500" />
              Benchmark Comparison
            </CardTitle>
            <CardDescription>Compare traditional vs shared memory performance</CardDescription>
          </CardHeader>
        </Card>
        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => onNavigate('architecture')}>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <MemoryStick className="h-5 w-5 text-purple-500" />
              System Architecture
            </CardTitle>
            <CardDescription>Understand the shared-memory IPC architecture</CardDescription>
          </CardHeader>
        </Card>
      </div>

      {/* Prototype Scope */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-amber-500/10">
              <Shield className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <h3 className="font-semibold mb-1">Prototype Scope</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                This hackathon prototype demonstrates the principles, architecture and measurable performance
                characteristics of shared-memory IPC. The current implementation runs in user space so it
                can be demonstrated without specialized Linux hardware. The architecture is designed to be
                extended to Linux kernel-level IPC and embedded Linux environments.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function AnimatedDiagram({ type }: { type: 'traditional' | 'shared' }) {
  return (
    <div className="rounded-lg border bg-muted/30 p-4 font-mono text-xs space-y-1">
      <div className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">
        {type === 'traditional' ? 'Traditional IPC' : 'Shared Memory'}
      </div>
      {type === 'traditional' ? (
        <>
          <div className="text-center text-blue-400">Process A</div>
          <div className="text-center text-red-400 animate-pulse">↓ Copy</div>
          <div className="text-center text-amber-400">Kernel</div>
          <div className="text-center text-red-400 animate-pulse">↓ Copy</div>
          <div className="text-center text-blue-400">Process B</div>
        </>
      ) : (
        <>
          <div className="text-center text-blue-400">Process A</div>
          <div className="text-center text-green-400">↓</div>
          <div className="text-center border border-green-500/50 rounded bg-green-500/10 px-2 py-1 text-green-400">
            Shared Memory
          </div>
          <div className="text-center text-green-400">↑ ↓</div>
          <div className="text-center text-blue-400">Process B</div>
        </>
      )}
    </div>
  );
}
