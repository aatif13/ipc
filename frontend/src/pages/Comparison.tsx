import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, Button, Select, Label, Progress, Badge } from '../components/ui';
import { api } from '../services/api';
import { BarChart3, Loader2, TrendingUp, Clock, Cpu, Activity } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { MESSAGE_SIZE_PRESETS } from '../types';

export default function ComparisonPage() {
  const [messageSize, setMessageSize] = useState(4096);
  const [numMessages, setNumMessages] = useState(1000);
  const [iterations, setIterations] = useState(3);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const runComparison = async () => {
    setRunning(true);
    setProgress(0);
    setResult(null);
    setError(null);

    try {
      const methods = ['pipe', 'shared_memory', 'ring_buffer'] as const;
      const results: Record<string, any> = {};

      for (let i = 0; i < methods.length; i++) {
        const method = methods[i];
        const progressStart = 10 + (i * 80) / methods.length;
        const progressEnd = 10 + ((i + 1) * 80) / methods.length;
        setProgress(Math.round(progressStart));

        try {
          const res = await api.runBenchmark({
            method,
            message_size: messageSize,
            num_messages: numMessages,
            iterations,
          });
          results[method] = res.metrics ?? res;
        } catch (err: any) {
          results[method] = { error: err.message || `Benchmark failed for ${method}` };
        }

        setProgress(Math.round(progressEnd));
      }

      // Compute improvements
      const improvements: Record<string, any> = {};
      const pipeMetrics = results['pipe'];
      const shmMetrics = results['shared_memory'];
      const ringMetrics = results['ring_buffer'];

      if (pipeMetrics && !pipeMetrics.error && shmMetrics && !shmMetrics.error) {
        improvements.pipe_vs_shm = computeImprovement(pipeMetrics, shmMetrics);
      }
      if (pipeMetrics && !pipeMetrics.error && ringMetrics && !ringMetrics.error) {
        improvements.pipe_vs_ring = computeImprovement(pipeMetrics, ringMetrics);
      }

      setProgress(100);
      setResult({ results, improvements });
    } catch (err: any) {
      setError(err.message || 'Comparison failed');
    } finally {
      setRunning(false);
    }
  };

  function computeImprovement(trad: any, shm: any) {
    const tradLat = trad.avg_latency || 1;
    const shmLat = shm.avg_latency || 1;
    return {
      latency_improvement: shmLat > 0 ? Math.round((tradLat / shmLat) * 100) / 100 : 0,
      throughput_improvement: trad.throughput_mbps > 0 ? Math.round((shm.throughput_mbps / trad.throughput_mbps) * 100) / 100 : 0,
      cpu_reduction_percent: trad.cpu_usage_percent > 0 ? Math.round(Math.max(0, (1 - shm.cpu_usage_percent / trad.cpu_usage_percent) * 100) * 10) / 10 : 0,
      integrity_errors: (trad.integrity_errors || 0) + (shm.integrity_errors || 0),
      messages_lost: (trad.messages_dropped || 0) + (shm.messages_dropped || 0),
    };
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Benchmark Comparison</h1>
        <p className="text-muted-foreground mt-1">Compare traditional IPC vs shared-memory performance</p>
      </div>

      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Comparison Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-4 gap-4 items-end">
            <div className="space-y-2">
              <Label>Message Size</Label>
              <Select value={messageSize} onChange={e => setMessageSize(Number(e.target.value))}>
                {MESSAGE_SIZE_PRESETS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Messages</Label>
              <Select value={numMessages} onChange={e => setNumMessages(Number(e.target.value))}>
                {[100, 500, 1000, 5000, 10000].map(n => <option key={n} value={n}>{n.toLocaleString()}</option>)}
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Iterations</Label>
              <Select value={iterations} onChange={e => setIterations(Number(e.target.value))}>
                {[1, 2, 3, 5].map(n => <option key={n} value={n}>{n}</option>)}
              </Select>
            </div>
            <Button onClick={runComparison} disabled={running} className="gap-2">
              {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <BarChart3 className="h-4 w-4" />}
              {running ? 'Running...' : 'Run Full Comparison'}
            </Button>
          </div>
          {running && (
            <div className="mt-4">
              <Progress value={progress} />
              <p className="text-xs text-muted-foreground mt-1">Running benchmarks across all IPC methods...</p>
            </div>
          )}
        </CardContent>
      </Card>

      {error && (
        <Card className="border-red-500/50">
          <CardContent className="p-4">
            <div className="text-red-500 text-sm">⚠ {error}</div>
          </CardContent>
        </Card>
      )}

      {result && (
        <div className="space-y-6 animate-slide-up">
          {/* Comparison Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Performance Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <ComparisonTable results={result.results} />
            </CardContent>
          </Card>

          {/* Charts */}
          <div className="grid md:grid-cols-2 gap-6">
            <LatencyChart results={result.results} />
            <ThroughputChart results={result.results} />
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <CpuChart results={result.results} />
            <ImprovementsChart improvements={result.improvements} />
          </div>

          {/* Improvements */}
          {result.improvements && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  Performance Improvements
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  {result.improvements.pipe_vs_shm && (
                    <ImprovementCard title="Pipe → Shared Memory" data={result.improvements.pipe_vs_shm} />
                  )}
                  {result.improvements.pipe_vs_ring && (
                    <ImprovementCard title="Pipe → Ring Buffer" data={result.improvements.pipe_vs_ring} />
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Explanation */}
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground leading-relaxed">
                The shared-memory approach achieved performance differences compared to the copy-based baseline
                for this workload. Results are workload-dependent and may vary with message size, process
                scheduling, and system load. The improvement reflects reduced data copying overhead rather than
                a fundamental architectural advantage for all use cases.
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

function ComparisonTable({ results }: { results: Record<string, any> }) {
  const methods = ['pipe', 'shared_memory', 'ring_buffer'];
  const methodLabels: Record<string, string> = {
    pipe: 'Traditional (Pipe)',
    shared_memory: 'Shared Memory',
    ring_buffer: 'Ring Buffer',
  };

  const metrics = [
    { label: 'Avg Latency (μs)', key: 'avg_latency', fmt: (v: number) => v.toFixed(2) },
    { label: 'P95 Latency (μs)', key: 'p95_latency', fmt: (v: number) => v.toFixed(2) },
    { label: 'Throughput (MB/s)', key: 'throughput_mbps', fmt: (v: number) => v.toFixed(2) },
    { label: 'Msg/sec', key: 'throughput_messages_per_sec', fmt: (v: number) => v.toFixed(0) },
    { label: 'CPU Usage (%)', key: 'cpu_usage_percent', fmt: (v: number) => v.toFixed(1) },
    { label: 'Memory (MB)', key: 'memory_usage_mb', fmt: (v: number) => v.toFixed(1) },
    { label: 'Integrity Errors', key: 'integrity_errors', fmt: (v: number) => String(v) },
  ];

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b">
            <th className="text-left py-2 px-3 font-medium text-muted-foreground">Metric</th>
            {methods.map(m => (
              <th key={m} className="text-right py-2 px-3 font-medium text-muted-foreground">
                {methodLabels[m]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {metrics.map(metric => (
            <tr key={metric.key} className="border-b last:border-0">
              <td className="py-2 px-3">{metric.label}</td>
              {methods.map(m => {
                const val = results[m]?.[metric.key];
                const isError = val === undefined;
                return (
                  <td key={m} className="py-2 px-3 text-right font-mono">
                    {isError ? <span className="text-red-400">Error</span> : metric.fmt(val)}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function LatencyChart({ results }: { results: Record<string, any> }) {
  const data = Object.entries(results).filter(([k, v]: [string, any]) => v && !v.error).map(([method, data]: [string, any]) => ({
    name: method === 'pipe' ? 'Pipe' : method === 'shared_memory' ? 'Shared Mem' : 'Ring Buf',
    avg: data.avg_latency,
    p95: data.p95_latency,
    p99: data.p99_latency,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Latency Comparison</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
            <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
            <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
            <Legend />
            <Bar dataKey="avg" name="Avg Latency (μs)" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            <Bar dataKey="p95" name="P95 (μs)" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

function ThroughputChart({ results }: { results: Record<string, any> }) {
  const data = Object.entries(results).filter(([k, v]: [string, any]) => v && !v.error).map(([method, data]: [string, any]) => ({
    name: method === 'pipe' ? 'Pipe' : method === 'shared_memory' ? 'Shared Mem' : 'Ring Buf',
    throughput: data.throughput_mbps,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Throughput Comparison</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
            <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
            <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
            <Bar dataKey="throughput" name="Throughput (MB/s)" fill="#10b981" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

function CpuChart({ results }: { results: Record<string, any> }) {
  const data = Object.entries(results).filter(([k, v]: [string, any]) => v && !v.error).map(([method, data]: [string, any]) => ({
    name: method === 'pipe' ? 'Pipe' : method === 'shared_memory' ? 'Shared Mem' : 'Ring Buf',
    cpu: data.cpu_usage_percent,
    memory: data.memory_usage_mb,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">CPU Usage Comparison</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
            <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
            <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
            <Bar dataKey="cpu" name="CPU (%)" fill="#f59e0b" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

function ImprovementsChart({ improvements }: { improvements: any }) {
  const data = [
    { name: 'Latency', value: improvements?.pipe_vs_shm?.latency_improvement || 0 },
    { name: 'Throughput', value: improvements?.pipe_vs_shm?.throughput_improvement || 0 },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Improvement Factors (Pipe → Shared Memory)</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
            <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
            <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
            <Bar dataKey="value" name="Improvement Factor (×)" radius={[4, 4, 0, 0]}>
              {data.map((_, i) => <Cell key={i} fill={i === 0 ? '#3b82f6' : '#10b981'} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

function ImprovementCard({ title, data }: { title: string; data: any }) {
  return (
    <div className="rounded-lg border p-4 space-y-2">
      <h4 className="font-semibold text-sm">{title}</h4>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <span className="text-muted-foreground">Latency: </span>
          <span className="font-mono font-bold">{data.latency_improvement}×</span>
        </div>
        <div>
          <span className="text-muted-foreground">Throughput: </span>
          <span className="font-mono font-bold">{data.throughput_improvement}×</span>
        </div>
        <div>
          <span className="text-muted-foreground">CPU Reduction: </span>
          <span className="font-mono font-bold">{data.cpu_reduction_percent}%</span>
        </div>
        <div>
          <span className="text-muted-foreground">Errors: </span>
          <span className="font-mono font-bold">{data.integrity_errors}</span>
        </div>
      </div>
    </div>
  );
}
