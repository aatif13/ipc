const BASE = "https://ipc-clv1.onrender.com";

async function fetchJSON<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${url}`, {
    headers: {
      "Content-Type": "application/json",
    },
    ...init,
  });

  if (!res.ok) {
    const err = await res
      .json()
      .catch(() => ({ detail: res.statusText }));

    throw new Error(err.detail || `HTTP ${res.status}`);
  }

  return res.json();
}

export const api = {
  health: () =>
    fetchJSON<{ status: string }>("/api/health"),

  systemInfo: () =>
    fetchJSON<any>("/api/system-info"),

  runBenchmark: (params: {
    method: string;
    message_size: number;
    num_messages: number;
    iterations?: number;
  }) =>
    fetchJSON<any>("/api/benchmark", {
      method: "POST",
      body: JSON.stringify(params),
    }),

  runStressTest: (params: {
    num_producers: number;
    num_consumers: number;
    message_size: number;
    num_messages: number;
  }) =>
    fetchJSON<any>("/api/benchmark/stress", {
      method: "POST",
      body: JSON.stringify(params),
    }),

  runFullComparison: (params: {
    message_size: number;
    num_messages: number;
    iterations?: number;
  }) =>
    fetchJSON<any>("/api/benchmark/full-comparison", {
      method: "POST",
      body: JSON.stringify(params),
    }),

  listExperiments: () =>
    fetchJSON<any[]>("/api/experiments"),

  getExperiment: (id: string) =>
    fetchJSON<any>(`/api/experiments/${id}`),

  deleteExperiment: (id: string) =>
    fetchJSON<any>(`/api/experiments/${id}`, {
      method: "DELETE",
    }),

  clearExperiments: () =>
    fetchJSON<any>("/api/experiments", {
      method: "DELETE",
    }),

  getReport: (id: string) =>
    fetchJSON<any>(`/api/report/${id}`),
};