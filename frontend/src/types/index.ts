export interface BenchmarkMetrics {
  total_time: number;
  avg_latency: number;
  min_latency: number;
  max_latency: number;
  median_latency: number;
  p95_latency: number;
  p99_latency: number;
  throughput_bytes_per_sec: number;
  throughput_messages_per_sec: number;
  throughput_mbps: number;
  cpu_usage_percent: number;
  memory_usage_bytes: number;
  memory_usage_mb: number;
  messages_sent: number;
  messages_received: number;
  messages_failed: number;
  messages_dropped: number;
  integrity_errors: number;
}

export interface Experiment {
  id: string;
  timestamp: string;
  method: string;
  message_size: number;
  num_messages: number;
  iterations: number;
  metrics: BenchmarkMetrics;
  execution_time: number;
  system: SystemInfo;
  num_producers?: number;
  num_consumers?: number;
}

export interface ComparisonResult {
  id: string;
  timestamp: string;
  message_size: number;
  num_messages: number;
  iterations: number;
  results: Record<string, BenchmarkMetrics | { error: string }>;
  improvements: Record<string, any>;
  execution_time: number;
  system: SystemInfo;
}

export interface SystemInfo {
  os: string;
  os_version: string;
  os_release: string;
  architecture: string;
  platform: string;
  cpu_brand: string;
  cpu_count_physical: number;
  cpu_count_logical: number;
  cpu_freq_max: number;
  cpu_freq_current: number;
  ram_total_gb: number;
  ram_available_gb: number;
  ram_used_percent: number;
  python_version: string;
  pid: number;
}

export interface BenchmarkRequest {
  method: string;
  message_size: number;
  num_messages: number;
  iterations?: number;
}

export interface StressTestRequest {
  num_producers: number;
  num_consumers: number;
  message_size: number;
  num_messages: number;
}

export type IpcMethod = 'pipe' | 'shared_memory' | 'ring_buffer';

export const MESSAGE_SIZE_PRESETS = [
  { label: '1 KB', value: 1024 },
  { label: '4 KB', value: 4096 },
  { label: '16 KB', value: 16384 },
  { label: '64 KB', value: 65536 },
  { label: '256 KB', value: 262144 },
  { label: '1 MB', value: 1048576 },
  { label: '4 MB', value: 4194304 },
  { label: '16 MB', value: 16777216 },
];

export const MESSAGE_COUNT_PRESETS = [
  { label: '100', value: 100 },
  { label: '1,000', value: 1000 },
  { label: '10,000', value: 10000 },
  { label: '50,000', value: 50000 },
  { label: '100,000', value: 100000 },
];

export const EXPERIMENT_PRESETS = [
  { name: 'Small Messages', message_size: 1024, num_messages: 100000, icon: '⚡' },
  { name: 'Medium Messages', message_size: 65536, num_messages: 10000, icon: '📦' },
  { name: 'Large Data Transfer', message_size: 1048576, num_messages: 1000, icon: '🚀' },
  { name: 'Latency Test', message_size: 1024, num_messages: 50000, icon: '⏱️' },
  { name: 'Throughput Test', message_size: 1048576, num_messages: 5000, icon: '📊' },
  { name: 'Stress Test', message_size: 4096, num_messages: 10000, icon: '🔥' },
];
