import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, Badge } from '../components/ui';
import { api } from '../services/api';
import { Shield, Cpu, MapPin, Github, BookOpen, Globe } from 'lucide-react';

export default function AboutPage() {
  const [systemInfo, setSystemInfo] = useState<any>(null);

  useEffect(() => {
    api.systemInfo().then(setSystemInfo).catch(console.error);
  }, []);

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">About</h1>
        <p className="text-muted-foreground mt-1">Zero-Copy IPC Lab — Hackathon Prototype</p>
      </div>

      {/* Problem & Solution */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">The Problem</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Unnecessary data movement between processes increases latency and CPU/memory overhead.
              Traditional IPC mechanisms copy data through kernel buffers, consuming CPU cycles and
              memory bandwidth for each transfer.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Our Solution</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground leading-relaxed">
              A shared-memory IPC architecture that minimizes unnecessary copying. Processes access
              a common memory region through a ring buffer, reducing data movement and communication overhead.
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">The Prototype</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground leading-relaxed">
              A user-space implementation demonstrating the concept and benchmarking it against traditional
              IPC. All benchmark results come from actual local experiments — no hard-coded values.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Future Scope</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Linux kernel module → Embedded Linux → Hardware deployment on ARM platforms including
              Raspberry Pi, industrial gateways, and real-time embedded systems.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* System Info */}
      {systemInfo && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Cpu className="h-4 w-4" />
              System Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-3 text-sm">
              {[
                { label: 'OS', value: `${systemInfo.os} ${systemInfo.os_release}` },
                { label: 'Architecture', value: systemInfo.architecture },
                { label: 'CPU Cores', value: `${systemInfo.cpu_count_physical} physical, ${systemInfo.cpu_count_logical} logical` },
                { label: 'CPU Freq', value: `${systemInfo.cpu_freq_current} MHz` },
                { label: 'RAM', value: `${systemInfo.ram_total_gb} GB total, ${systemInfo.ram_available_gb} GB available` },
                { label: 'Python', value: systemInfo.python_version?.split(' ')?.[0] || systemInfo.python_version },
                { label: 'Backend', value: 'FastAPI + Uvicorn' },
                { label: 'Benchmark Engine', value: 'multiprocessing + shared_memory' },
              ].map(item => (
                <div key={item.label} className="flex justify-between p-2 rounded bg-muted/50">
                  <span className="text-muted-foreground">{item.label}</span>
                  <span className="font-mono text-xs">{item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tech Stack */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Technology Stack</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <div className="font-semibold mb-2 text-muted-foreground">Frontend</div>
              <div className="flex flex-wrap gap-2">
                {['React 18', 'TypeScript', 'Vite', 'Tailwind CSS', 'Recharts', 'Lucide Icons'].map(t => (
                  <Badge key={t} variant="secondary">{t}</Badge>
                ))}
              </div>
            </div>
            <div>
              <div className="font-semibold mb-2 text-muted-foreground">Backend</div>
              <div className="flex flex-wrap gap-2">
                {['Python', 'FastAPI', 'Uvicorn', 'multiprocessing', 'shared_memory', 'psutil'].map(t => (
                  <Badge key={t} variant="secondary">{t}</Badge>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Disclaimer */}
      <Card className="border-amber-500/30">
        <CardContent className="p-6">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-amber-500 mt-0.5" />
            <div>
              <h3 className="font-semibold text-sm mb-1">Prototype Scope</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                This hackathon prototype demonstrates shared-memory IPC concepts in user space.
                A production deployment would require platform-specific Linux/embedded implementation
                and additional validation. This is NOT a claim of kernel-level implementation.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
