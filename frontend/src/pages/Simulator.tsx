import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, Button, Input, Select, Label, Progress, Badge } from '../components/ui';
import { api } from '../services/api';
import { Play, Square, RotateCcw, Zap, Clock, Cpu, Shield, TrendingUp, Loader2, Terminal, ChevronDown, ChevronUp } from 'lucide-react';
import { MESSAGE_SIZE_PRESETS, MESSAGE_COUNT_PRESETS, EXPERIMENT_PRESETS } from '../types';

type IpcMethod = 'pipe' | 'shared_memory' | 'ring_buffer';

/** Validate that a benchmark response has the expected structure. */
function isValidBenchmarkResponse(res: unknown): res is {
  execution_time: number;
  metrics: {
    avg_latency: number;
    p95_latency: number;
    p99_latency: number;
    min_latency: number;
    max_latency: number;
    median_latency: number;
    throughput_mbps: number;
    throughput_messages_per_sec: number;
    cpu_usage_percent: number;
    memory_usage_mb: number;
    messages_sent: number;
    messages_received: number;
    integrity_errors: number;
    messages_dropped: number;
  };
} {
  if (!res || typeof res !== 'object') return false;
  const r = res as Record<string, unknown>;
  if (typeof r.execution_time !== 'number') return false;
  if (!r.metrics || typeof r.metrics !== 'object') return false;
  const m = r.metrics as Record<string, unknown>;
  return typeof m.avg_latency === 'number' && typeof m.throughput_mbps === 'number';
}

export default function Simulator() {
  const [method, setMethod] = useState<IpcMethod>('ring_buffer');
  const [messageSize, setMessageSize] = useState(4096);
  const [numMessages, setNumMessages] = useState(1000);
  const [iterations, setIterations] = useState(3);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [result, setResult] = useState<any>(null);
  const [showLogs, setShowLogs] = useState(false);

  const addLog = (msg: string) => setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);

  const runExperiment = async () => {
    setRunning(true);
    setProgress(0);
    setResult(null);
    setLogs([]);
    addLog('Initializing benchmark...');

    try {
      addLog(`Method: ${method}, Size: ${formatSize(messageSize)}, Messages: ${numMessages}, Iterations: ${iterations}`);
      setProgress(10);

      addLog('Sending benchmark request to backend...');
      setProgress(20);

      const res = await api.runBenchmark({
        method,
        message_size: messageSize,
        num_messages: numMessages,
        iterations,
      });

      // Validate response structure before using it
      if (!isValidBenchmarkResponse(res)) {
        throw new Error('Backend returned an unexpected response format. Check that the backend is running correctly.');
      }

      setProgress(80);
      addLog(`Benchmark complete. Total time: ${res.execution_time}s`);
      addLog(`Avg latency: ${res.metrics.avg_latency.toFixed(2)} μs`);
      addLog(`Throughput: ${res.metrics.throughput_mbps.toFixed(2)} MB/s`);

      if (res.metrics.integrity_errors === 0) {
        addLog('✓ Data integrity verified');
      } else {
        addLog(`⚠ Integrity errors: ${res.metrics.integrity_errors}`);
      }

      setProgress(100);
      addLog('✓ Experiment finished');
      setResult(res);
    } catch (err: any) {
      addLog(`✗ Error: ${err.message}`);
      addLog('  Tip: ensure the backend is running on http://127.0.0.1:8000');
      setProgress(0);
    } finally {
      setRunning(false);
    }
  };

  const applyPreset = (preset: typeof EXPERIMENT_PRESETS[0]) => {
    setMessageSize(preset.message_size);
    setNumMessages(preset.num_messages);
    addLog(`Applied preset: ${preset.name}`);
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Live IPC Simulator</h1>
        <p className="text-muted-foreground mt-1">Run real-time IPC experiments with custom configurations</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Controls */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* IPC Method */}
              <div className="space-y-2">
                <Label>IPC Method</Label>
                <Select value={method} onChange={e => setMethod(e.target.value as IpcMethod)}>
                  <option value="pipe">Traditional IPC (Pipe)</option>
                  <option value="shared_memory">Shared Memory</option>
                  <option value="ring_buffer">Ring Buffer Prototype</option>
                </Select>
              </div>

              {/* Message Size */}
              <div className="space-y-2">
                <Label>Message Size</Label>
                <div className="grid grid-cols-4 gap-1">
                  {MESSAGE_SIZE_PRESETS.map(p => (
                    <button key={p.value}
                      onClick={() => setMessageSize(p.value)}
                      className={`px-2 py-1 text-xs rounded border transition-colors ${messageSize === p.value ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80'}`}>
                      {p.label}
                    </button>
                  ))}
                </div>
                <Input type="number" value={messageSize} onChange={e => setMessageSize(Number(e.target.value))}
                  className="mt-2" min={1} max={67108864} />
              </div>

              {/* Number of Messages */}
              <div className="space-y-2">
                <Label>Number of Messages</Label>
                <div className="flex gap-1 flex-wrap">
                  {MESSAGE_COUNT_PRESETS.map(p => (
                    <button key={p.value}
                      onClick={() => setNumMessages(p.value)}
                      className={`px-2 py-1 text-xs rounded border transition-colors ${numMessages === p.value ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80'}`}>
                      {p.label}
                    </button>
                  ))}
                </div>
                <Input type="number" value={numMessages} onChange={e => setNumMessages(Number(e.target.value))}
                  className="mt-2" min={1} max={200000} />
              </div>

              {/* Iterations */}
              <div className="space-y-2">
                <Label>Iterations</Label>
                <Select value={iterations} onChange={e => setIterations(Number(e.target.value))}>
                  {[1, 2, 3, 5, 10].map(n => <option key={n} value={n}>{n}</option>)}
                </Select>
              </div>

              <Button onClick={runExperiment} disabled={running} className="w-full gap-2">
                {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                {running ? 'Running...' : '▶ Start Experiment'}
              </Button>
            </CardContent>
          </Card>

          {/* Presets */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Experiment Presets</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                {EXPERIMENT_PRESETS.map(p => (
                  <button key={p.name} onClick={() => applyPreset(p)}
                    className="p-2 text-left text-xs rounded border hover:bg-muted transition-colors">
                    <span className="text-base">{p.icon}</span>
                    <div className="font-medium mt-1">{p.name}</div>
                    <div className="text-muted-foreground">{formatSize(p.message_size)} × {p.num_messages.toLocaleString()}</div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Visualization and Results */}
        <div className="lg:col-span-2 space-y-4">
          {/* Process Visualization */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Process Visualization
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ProcessVisualization running={running} progress={progress} method={method} result={result} />
            </CardContent>
          </Card>

          {/* Progress */}
          {running && (
            <Card className="animate-slide-up">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Experiment Progress</span>
                  <span className="text-sm text-muted-foreground">{progress}%</span>
                </div>
                <Progress value={progress} />
              </CardContent>
            </Card>
          )}

          {/* Results */}
          {result && (
            <div className="animate-slide-up space-y-4">
              <ResultsGrid metrics={result.metrics} />

              {/* Data Integrity */}
              <DataIntegrityCard metrics={result.metrics} />
            </div>
          )}

          {/* Logs */}
          <Card>
            <button className="w-full flex items-center justify-between p-4" onClick={() => setShowLogs(!showLogs)}>
              <div className="flex items-center gap-2">
                <Terminal className="h-4 w-4" />
                <span className="text-sm font-medium">Developer Console</span>
                <Badge variant="secondary">{logs.length} entries</Badge>
              </div>
              {showLogs ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
            {showLogs && (
              <CardContent className="pt-0">
                <div className="bg-black/90 rounded-lg p-4 font-mono text-xs max-h-64 overflow-y-auto">
                  {logs.length === 0 && <span className="text-gray-500">Waiting for benchmark...</span>}
                  {logs.map((log, i) => (
                    <div key={i} className={
                      log.includes('✓') ? 'text-green-400' :
                      log.includes('✗') || log.includes('Error') ? 'text-red-400' :
                      log.includes('⚠') ? 'text-yellow-400' : 'text-gray-300'
                    }>
                      {log}
                    </div>
                  ))}
                </div>
              </CardContent>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

function ProcessVisualization({ running, progress, method, result }: { running: boolean; progress: number; method: string; result: any }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 justify-center">
        {/* Process A */}
        <div className={`text-center p-4 rounded-lg border-2 transition-all duration-500 ${
          running ? 'border-blue-500 bg-blue-500/10' : 'border-border'
        }`}>
          <div className="text-xs text-muted-foreground mb-1">PROCESS A</div>
          <div className="font-mono text-sm font-bold">Producer</div>
          {running && (
            <div className="mt-2 text-xs text-blue-400 animate-pulse">
              Sending...
            </div>
          )}
        </div>

        {/* Arrow / Buffer */}
        <div className="flex flex-col items-center gap-1">
          <div className={`text-xs font-mono ${running ? 'text-green-400' : 'text-muted-foreground'}`}>
            {running ? '>>>' : '---'}
          </div>
          <div className={`rounded-lg border-2 px-6 py-3 text-center transition-all duration-500 ${
            running ? 'border-green-500 bg-green-500/10' : 'border-border'
          }`}>
            <div className="text-xs text-muted-foreground mb-1">
              {method === 'pipe' ? 'PIPE' : method === 'shared_memory' ? 'SHARED MEMORY' : 'RING BUFFER'}
            </div>
            <div className="font-mono text-sm font-bold">
              {method === 'ring_buffer' ? '○ Buffer' : '□ Buffer'}
            </div>
            {running && (
              <div className="mt-2">
                <Progress value={progress} className="h-1" />
              </div>
            )}
          </div>
          <div className={`text-xs font-mono ${running ? 'text-green-400' : 'text-muted-foreground'}`}>
            {running ? '>>>' : '---'}
          </div>
        </div>

        {/* Process B */}
        <div className={`text-center p-4 rounded-lg border-2 transition-all duration-500 ${
          running ? 'border-purple-500 bg-purple-500/10' : 'border-border'
        }`}>
          <div className="text-xs text-muted-foreground mb-1">PROCESS B</div>
          <div className="font-mono text-sm font-bold">Consumer</div>
          {running && (
            <div className="mt-2 text-xs text-purple-400 animate-pulse">
              Receiving...
            </div>
          )}
        </div>
      </div>

      {/* Running stats */}
      {running && (
        <div className="grid grid-cols-4 gap-2 text-center">
          {[
            { label: 'Messages', value: result?.metrics?.messages_received || '...' },
            { label: 'Latency', value: result?.metrics?.avg_latency ? `${result.metrics.avg_latency.toFixed(1)}μs` : '...' },
            { label: 'Throughput', value: result?.metrics?.throughput_mbps ? `${result.metrics.throughput_mbps.toFixed(1)}MB/s` : '...' },
            { label: 'Errors', value: result?.metrics?.integrity_errors || '0' },
          ].map(s => (
            <div key={s.label} className="p-2 rounded bg-muted text-xs">
              <div className="text-muted-foreground">{s.label}</div>
              <div className="font-mono font-bold">{s.value}</div>
            </div>
          ))}
        </div>
      )}

      {!running && !result && (
        <div className="text-center text-muted-foreground text-sm py-4">
          Configure parameters and click "Start Experiment" to begin
        </div>
      )}

      {result && !running && (
        <div className="text-center text-green-500 font-medium text-sm animate-slide-up">
          ✓ Experiment Complete
        </div>
      )}
    </div>
  );
}

function ResultsGrid({ metrics }: { metrics: any }) {
  const items = [
    { label: 'Avg Latency', value: `${metrics.avg_latency.toFixed(2)} μs`, icon: Clock, color: 'text-blue-500' },
    { label: 'P95 Latency', value: `${metrics.p95_latency.toFixed(2)} μs`, icon: Clock, color: 'text-blue-400' },
    { label: 'P99 Latency', value: `${metrics.p99_latency.toFixed(2)} μs`, icon: Clock, color: 'text-blue-300' },
    { label: 'Min Latency', value: `${metrics.min_latency.toFixed(2)} μs`, icon: Clock, color: 'text-cyan-500' },
    { label: 'Max Latency', value: `${metrics.max_latency.toFixed(2)} μs`, icon: Clock, color: 'text-cyan-400' },
    { label: 'Median Latency', value: `${metrics.median_latency.toFixed(2)} μs`, icon: Clock, color: 'text-cyan-300' },
    { label: 'Throughput', value: `${metrics.throughput_mbps.toFixed(2)} MB/s`, icon: TrendingUp, color: 'text-green-500' },
    { label: 'Msg/sec', value: metrics.throughput_messages_per_sec.toFixed(0), icon: Zap, color: 'text-green-400' },
    { label: 'CPU Usage', value: `${metrics.cpu_usage_percent.toFixed(1)}%`, icon: Cpu, color: 'text-amber-500' },
    { label: 'Memory', value: `${metrics.memory_usage_mb.toFixed(1)} MB`, icon: Shield, color: 'text-purple-500' },
    { label: 'Sent', value: metrics.messages_sent.toLocaleString(), icon: Zap, color: 'text-blue-500' },
    { label: 'Received', value: metrics.messages_received.toLocaleString(), icon: Zap, color: 'text-green-500' },
  ];

  return (
    <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
      {items.map(item => {
        const Icon = item.icon;
        return (
          <Card key={item.label}>
            <CardContent className="p-3">
              <div className="flex items-center gap-1 mb-1">
                <Icon className={`h-3 w-3 ${item.color}`} />
                <span className="text-xs text-muted-foreground">{item.label}</span>
              </div>
              <div className="text-lg font-bold font-mono">{item.value}</div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function DataIntegrityCard({ metrics }: { metrics: any }) {
  const verified = metrics.integrity_errors === 0 && metrics.messages_dropped === 0;
  return (
    <Card className={verified ? 'border-green-500/50' : 'border-red-500/50'}>
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <div className={`text-3xl ${verified ? 'text-green-500' : 'text-red-500'}`}>
            {verified ? '✓' : '✗'}
          </div>
          <div className="grid grid-cols-4 gap-4 flex-1">
            <div>
              <div className="text-xs text-muted-foreground">Messages Sent</div>
              <div className="font-mono font-bold">{metrics.messages_sent.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Received</div>
              <div className="font-mono font-bold">{metrics.messages_received.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Integrity Errors</div>
              <div className="font-mono font-bold">{metrics.integrity_errors}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Dropped</div>
              <div className="font-mono font-bold">{metrics.messages_dropped}</div>
            </div>
          </div>
          <Badge variant={verified ? 'default' : 'destructive'} className="text-sm">
            {verified ? '✓ DATA INTEGRITY VERIFIED' : '✗ INTEGRITY FAILURE'}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}

function formatSize(bytes: number): string {
  if (bytes >= 1048576) return `${(bytes / 1048576).toFixed(0)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${bytes} B`;
}
