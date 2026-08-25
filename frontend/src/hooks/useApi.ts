import { useState, useCallback } from 'react';

interface UseAsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export function useAsync<T>() {
  const [state, setState] = useState<UseAsyncState<T>>({ data: null, loading: false, error: null });

  const execute = useCallback(async (fn: () => Promise<T>) => {
    setState({ data: null, loading: true, error: null });
    try {
      const result = await fn();
      setState({ data: result, loading: false, error: null });
      return result;
    } catch (err: any) {
      const msg = err?.message || 'An error occurred';
      setState({ data: null, loading: false, error: msg });
      throw err;
    }
  }, []);

  return { ...state, execute };
}
