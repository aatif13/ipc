import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, Button, Badge } from '../components/ui';
import { Eye, EyeOff, BookOpen } from 'lucide-react';

export default function HowItWorksPage() {
  const [showCopies, setShowCopies] = useState(false);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">How Zero-Copy Works</h1>
        <p className="text-muted-foreground mt-1">Interactive visual explanation of shared-memory IPC</p>
      </div>

      {/* Traditional IPC */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Traditional IPC — Copy-Based</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-muted/30 rounded-lg p-6 font-mono text-sm relative">
            <pre className="text-center text-muted-foreground">
{`Application Buffer (Process A)
       │
       ▼
${showCopies ? '  ╔════════╗\n  ║  COPY  ║    ← Kernel copies data\n  ╚════════╝' : '      ↓'}
       │
       ▼
Kernel Buffer
       │
       ▼
${showCopies ? '  ╔════════╗\n  ║  COPY  ║    ← Kernel copies again\n  ╚════════╝' : '      ↓'}
       │
       ▼
Application Buffer (Process B)`}
            </pre>
          </div>
          <div className="mt-4 flex items-center gap-4">
            <Button variant={showCopies ? 'default' : 'outline'} onClick={() => setShowCopies(!showCopies)}
              className="gap-2">
              {showCopies ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {showCopies ? 'Hide Copy Operations' : 'Show Me Where Copies Happen'}
            </Button>
            {showCopies && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground animate-slide-up">
                <span className="text-red-500">⚠</span>
                Two copy operations per message transfer — each consumes CPU and memory bandwidth
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Shared Memory */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Shared Memory — Zero-Copy Oriented</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-muted/30 rounded-lg p-6 font-mono text-sm">
            <pre className="text-center text-muted-foreground">
{`Process A
    │
    ▼
┌───────────────┐
│ Shared Memory │  ← Direct access, no copying
│   Ring Buffer │
└───────────────┘
    ▲
    │
Process B`}
            </pre>
          </div>
          <div className="mt-4 p-4 rounded-lg bg-green-500/10 border border-green-500/30">
            <div className="text-green-500 font-semibold text-sm mb-1">Key Advantage</div>
            <p className="text-xs text-muted-foreground">
              Both processes access the same memory region directly. No data copying through kernel buffers.
              The ring buffer provides orderly producer/consumer communication.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Why It Matters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Why Copying Overhead Matters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              { title: 'CPU Overhead', desc: 'Every copy consumes CPU cycles that could be used for computation.', icon: '💻', color: 'bg-red-500/10' },
              { title: 'Memory Bandwidth', desc: 'Copying consumes memory bus bandwidth, reducing throughput for other operations.', icon: '📊', color: 'bg-orange-500/10' },
              { title: 'Latency', desc: 'Additional copies add latency proportional to message size.', icon: '⏱️', color: 'bg-amber-500/10' },
              { title: 'Scalability', desc: 'Copy costs scale with data size, limiting throughput for large messages.', icon: '📈', color: 'bg-blue-500/10' },
            ].map(item => (
              <div key={item.title} className={`p-4 rounded-lg ${item.color}`}>
                <div className="text-2xl mb-2">{item.icon}</div>
                <div className="font-semibold text-sm mb-1">{item.title}</div>
                <div className="text-xs text-muted-foreground">{item.desc}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Benefits */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Why Our Approach?</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-4 gap-4">
            {[
              { title: '⚡ Low Latency', desc: 'Reduce unnecessary data movement between processes.' },
              { title: '🚀 High Throughput', desc: 'Efficient transfer of large data volumes.' },
              { title: '💾 Lower Overhead', desc: 'Reduce CPU and memory pressure.' },
              { title: '🔐 Reliable Communication', desc: 'Verify data integrity with checksums.' },
            ].map(item => (
              <div key={item.title} className="p-4 rounded-lg border text-center">
                <div className="text-2xl mb-2">{item.title.split(' ')[0]}</div>
                <div className="font-semibold text-sm mb-1">{item.title.split(' ').slice(1).join(' ')}</div>
                <div className="text-xs text-muted-foreground">{item.desc}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
