import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui';

const APPLICATIONS = [
  {
    title: 'Robotics',
    icon: '🤖',
    desc: 'High-speed sensor-to-process communication. Motor controllers, IMUs, and vision systems need sub-millisecond data transfer.',
    details: ['ROS message passing', 'Real-time control loops', 'Sensor fusion pipelines'],
  },
  {
    title: 'Autonomous Systems',
    icon: '🚗',
    desc: 'Camera, LiDAR, and sensor data transfer between perception and decision-making processes.',
    details: ['Multi-sensor fusion', 'Path planning data', 'Vehicle-to-vehicle communication'],
  },
  {
    title: 'Industrial IoT',
    icon: '🏭',
    desc: 'Low-latency device communication in manufacturing environments with deterministic timing requirements.',
    details: ['PLC communication', 'SCADA systems', 'Predictive maintenance'],
  },
  {
    title: 'Edge AI',
    icon: '🧠',
    desc: 'Transfer large tensors and images between inference and pre-processing processes at the edge.',
    details: ['Model inference pipelines', 'Image preprocessing', 'Feature extraction'],
  },
  {
    title: 'Multimedia',
    icon: '🎬',
    desc: 'Video and audio frame sharing between encoding, decoding, and rendering processes.',
    details: ['Video transcoding', 'Audio processing', 'Real-time streaming'],
  },
  {
    title: 'Automotive',
    icon: '🏎️',
    desc: 'Sensor and control-process communication in ADAS and autonomous driving systems.',
    details: ['ADAS processing', 'ECU communication', 'Diagnostic data transfer'],
  },
  {
    title: 'Telecommunications',
    icon: '📡',
    desc: 'High-throughput packet processing in network function virtualization and 5G infrastructure.',
    details: ['NFV data planes', '5G core processing', 'Packet inspection'],
  },
];

export default function ApplicationsPage() {
  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Applications</h1>
        <p className="text-muted-foreground mt-1">Real-world use cases for high-performance IPC</p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {APPLICATIONS.map(app => (
          <Card key={app.title} className="hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="text-3xl mb-3">{app.icon}</div>
              <h3 className="font-bold text-lg mb-2">{app.title}</h3>
              <p className="text-sm text-muted-foreground mb-3">{app.desc}</p>
              <div className="space-y-1">
                {app.details.map(d => (
                  <div key={d} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                    {d}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Future Extension Roadmap */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Future Extension Roadmap</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-muted/30 rounded-lg p-6 font-mono text-sm">
            <pre className="text-center text-muted-foreground">
{`CURRENT: User-Space Prototype
              ↓
PHASE 2: Linux Implementation
              ↓
PHASE 3: Kernel Module
              ↓
PHASE 4: Embedded Linux
              ↓
PHASE 5: ARM / Raspberry Pi
              ↓
PHASE 6: Real-Time Systems`}
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
