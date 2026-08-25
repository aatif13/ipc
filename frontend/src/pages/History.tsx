import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, Button, Badge } from '../components/ui';
import { api } from '../services/api';
import { History as HistoryIcon, Trash2, RefreshCw, Eye, ArrowLeftRight, Download } from 'lucide-react';

export default function HistoryPage() {
  const [experiments, setExperiments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedA, setSelectedA] = useState<string | null>(null);
  const [selectedB, setSelectedB] = useState<string | null>(null);
  const [compareResult, setCompareResult] = useState<any>(null);
  const [viewingReport, setViewingReport] = useState<any>(null);

  const loadExperiments = async () => {
    setLoading(true);
    try {
      const data = await api.listExperiments();
      setExperiments(data);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => { loadExperiments(); }, []);

  const handleDelete = async (id: string) => {
    await api.deleteExperiment(id);
    loadExperiments();
  };

  const handleClear = async () => {
    await api.clearExperiments();
    loadExperiments();
  };

  const handleCompare = async () => {
    if (!selectedA || !selectedB) return;
    const expA = experiments.find(e => e.id === selectedA);
    const expB = experiments.find(e => e.id === selectedB);
    if (!expA || !expB) return;

    setCompareResult({ a: expA, b: expB });
  };

  const handleViewReport = async (id: string) => {
    try {
      const report = await api.getReport(id);
      setViewingReport(report);
    } catch (e) {
      console.error(e);
    }
  };

  const handleExportJSON = (experiment: any) => {
    const blob = new Blob([JSON.stringify(experiment, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ipc-benchmark-${experiment.id?.slice(0, 8)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportCSV = () => {
    if (experiments.length === 0) return;
    const headers = ['ID', 'Timestamp', 'Method', 'Message Size', 'Messages', 'Avg Latency (μs)', 'Throughput (MB/s)', 'CPU (%)', 'Memory (MB)', 'Integrity Errors'];
    const rows = experiments.map(e => [
      e.id?.slice(0, 8),
      e.timestamp,
      e.method,
      e.message_size,
      e.num_messages,
      e.metrics?.avg_latency?.toFixed(2),
      e.metrics?.throughput_mbps?.toFixed(2),
      e.metrics?.cpu_usage_percent?.toFixed(1),
      e.metrics?.memory_usage_mb?.toFixed(1),
      e.metrics?.integrity_errors,
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ipc-benchmarks.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Experiment History</h1>
          <p className="text-muted-foreground mt-1">{experiments.length} experiment{experiments.length !== 1 ? 's' : ''} recorded</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={loadExperiments} className="gap-2">
            <RefreshCw className="h-3 w-3" /> Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportCSV} className="gap-2">
            <Download className="h-3 w-3" /> Export CSV
          </Button>
          {experiments.length > 0 && (
            <Button variant="destructive" size="sm" onClick={handleClear}>
              Clear All
            </Button>
          )}
        </div>
      </div>

      {/* Compare */}
      {experiments.length >= 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <ArrowLeftRight className="h-4 w-4" />
              Side-by-Side Comparison
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <select value={selectedA || ''} onChange={e => setSelectedA(e.target.value)}
                className="flex-1 h-10 rounded-md border bg-background px-3 text-sm">
                <option value="">Select Experiment A</option>
                {experiments.map(e => (
                  <option key={e.id} value={e.id}>
                    {e.method} — {formatSize(e.message_size)} × {e.num_messages} — {new Date(e.timestamp).toLocaleDateString()}
                  </option>
                ))}
              </select>
              <span className="text-muted-foreground font-bold">vs</span>
              <select value={selectedB || ''} onChange={e => setSelectedB(e.target.value)}
                className="flex-1 h-10 rounded-md border bg-background px-3 text-sm">
                <option value="">Select Experiment B</option>
                {experiments.map(e => (
                  <option key={e.id} value={e.id}>
                    {e.method} — {formatSize(e.message_size)} × {e.num_messages} — {new Date(e.timestamp).toLocaleDateString()}
                  </option>
                ))}
              </select>
              <Button onClick={handleCompare} disabled={!selectedA || !selectedB} size="sm">
                Compare
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Compare Result */}
      {compareResult && (
        <Card className="animate-slide-up">
          <CardHeader>
            <CardTitle className="text-base">Comparison Results</CardTitle>
          </CardHeader>
          <CardContent>
            <ComparisonRow label="Average Latency" a={compareResult.a.metrics?.avg_latency} b={compareResult.b.metrics?.avg_latency} unit="μs" lower />
            <ComparisonRow label="P95 Latency" a={compareResult.a.metrics?.p95_latency} b={compareResult.b.metrics?.p95_latency} unit="μs" lower />
            <ComparisonRow label="Throughput" a={compareResult.a.metrics?.throughput_mbps} b={compareResult.b.metrics?.throughput_mbps} unit="MB/s" />
            <ComparisonRow label="CPU Usage" a={compareResult.a.metrics?.cpu_usage_percent} b={compareResult.b.metrics?.cpu_usage_percent} unit="%" lower />
            <ComparisonRow label="Memory" a={compareResult.a.metrics?.memory_usage_mb} b={compareResult.b.metrics?.memory_usage_mb} unit="MB" lower />
            <ComparisonRow label="Integrity Errors" a={compareResult.a.metrics?.integrity_errors} b={compareResult.b.metrics?.integrity_errors} unit="" lower />
          </CardContent>
        </Card>
      )}

      {/* Report */}
      {viewingReport && (
        <Card className="animate-slide-up">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Experiment Report</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => setViewingReport(null)}>Close</Button>
          </CardHeader>
          <CardContent>
            <pre className="text-xs bg-muted/30 rounded-lg p-4 overflow-auto max-h-96">
              {JSON.stringify(viewingReport, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}

      {/* Table */}
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Date</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Method</th>
                <th className="text-right py-3 px-4 font-medium text-muted-foreground">Size</th>
                <th className="text-right py-3 px-4 font-medium text-muted-foreground">Messages</th>
                <th className="text-right py-3 px-4 font-medium text-muted-foreground">Latency</th>
                <th className="text-right py-3 px-4 font-medium text-muted-foreground">Throughput</th>
                <th className="text-right py-3 px-4 font-medium text-muted-foreground">CPU</th>
                <th className="text-right py-3 px-4 font-medium text-muted-foreground">Errors</th>
                <th className="text-right py-3 px-4 font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {experiments.map(exp => (
                <tr key={exp.id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="py-3 px-4 text-xs">{new Date(exp.timestamp).toLocaleString()}</td>
                  <td className="py-3 px-4">
                    <Badge variant={exp.method === 'pipe' ? 'secondary' : exp.method === 'shared_memory' ? 'default' : 'outline'}>
                      {exp.method}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-xs">{formatSize(exp.message_size)}</td>
                  <td className="py-3 px-4 text-right font-mono text-xs">{exp.num_messages?.toLocaleString()}</td>
                  <td className="py-3 px-4 text-right font-mono text-xs">{exp.metrics?.avg_latency?.toFixed(1)} μs</td>
                  <td className="py-3 px-4 text-right font-mono text-xs">{exp.metrics?.throughput_mbps?.toFixed(1)} MB/s</td>
                  <td className="py-3 px-4 text-right font-mono text-xs">{exp.metrics?.cpu_usage_percent?.toFixed(1)}%</td>
                  <td className="py-3 px-4 text-right font-mono text-xs">
                    {exp.metrics?.integrity_errors === 0 ? <span className="text-green-500">0</span> : <span className="text-red-500">{exp.metrics?.integrity_errors}</span>}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleViewReport(exp.id)}>
                        <Eye className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleExportJSON(exp)}>
                        <Download className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500" onClick={() => handleDelete(exp.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {experiments.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-muted-foreground">
                    No experiments recorded yet. Run a benchmark to see results here.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

function ComparisonRow({ label, a, b, unit, lower }: { label: string; a: number; b: number; unit: string; lower?: boolean }) {
  const diff = a > 0 ? ((b - a) / a * 100) : 0;
  const improved = lower ? diff < 0 : diff > 0;
  return (
    <div className="flex items-center justify-between py-2 border-b last:border-0 text-sm">
      <span className="font-medium">{label}</span>
      <div className="flex items-center gap-4 text-xs">
        <span className="font-mono w-24 text-right">{a?.toFixed(2)} {unit}</span>
        <span className="text-muted-foreground">vs</span>
        <span className="font-mono w-24 text-right">{b?.toFixed(2)} {unit}</span>
        <span className={`w-20 text-right font-mono ${improved ? 'text-green-500' : 'text-red-500'}`}>
          {diff > 0 ? '+' : ''}{diff.toFixed(1)}%
        </span>
      </div>
    </div>
  );
}

function formatSize(bytes: number): string {
  if (bytes >= 1048576) return `${(bytes / 1048576).toFixed(0)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${bytes} B`;
}
