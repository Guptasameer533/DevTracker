import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reposApi } from '../services/api';

export function useAvailableRepos(options = {}) {
  return useQuery({
    queryKey: ['repos', 'available'],
    queryFn: reposApi.available,
    staleTime: 5 * 60 * 1000,
    ...options,
  });
}

export function useConnectRepo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (githubRepoId) => reposApi.connect(githubRepoId),
    onSuccess: () => {
      // Refresh user (connectedRepo changes) + stats
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
  });
}

export function useDisconnectRepo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: reposApi.disconnect,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
  });
}
