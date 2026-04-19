import { useQuery, useQueryClient } from '@tanstack/react-query';
import { statsApi } from '../services/api';

export function useStats(dateRange, options = {}) {
  const { from, to } = dateRange || {};

  return useQuery({
    queryKey: ['stats', 'commits', from?.toISOString?.(), to?.toISOString?.()],
    queryFn: () => statsApi.commits(from, to),
    staleTime: 5 * 60 * 1000,
    retry: (failCount, error) => {
      const status = error?.response?.status;
      if (status === 401 || status === 410) return false;
      return failCount < 2;
    },
    ...options,
  });
}

export function useDemoStats(dateRange) {
  const { from, to } = dateRange || {};
  return useQuery({
    queryKey: ['stats', 'demo', from?.toISOString?.(), to?.toISOString?.()],
    queryFn: () => statsApi.demo(from, to),
    staleTime: 10 * 60 * 1000,
  });
}

export function useInvalidateStats() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ['stats'] });
}
