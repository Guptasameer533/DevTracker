import { useState } from 'react';
import { Lock, Globe, Search, GitFork, ArrowRight } from 'lucide-react';
import { useAvailableRepos, useConnectRepo } from '../hooks/useRepos';
import LoadingSpinner from './ui/LoadingSpinner';
import ErrorState from './ui/ErrorState';
import { formatDistanceToNow } from './utils/time';

export default function RepoSelector({ onConnected }) {
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState('');
  const { data: repos, isLoading, isError, refetch } = useAvailableRepos();
  const connectMutation = useConnectRepo();

  const filtered = (repos || []).filter((r) =>
    r.fullName.toLowerCase().includes(search.toLowerCase())
  );

  async function handleConnect() {
    if (!selected) return;
    try {
      await connectMutation.mutateAsync(selected);
      onConnected?.();
    } catch {
      // Error shown via mutation state
    }
  }

  if (isLoading) return <LoadingSpinner label="Fetching your repositories…" />;
  if (isError) return <ErrorState message="Couldn't load repos from GitHub." onRetry={refetch} />;

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search repositories…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-base pl-9"
        />
      </div>

      {/* Repo list */}
      <div className="max-h-64 overflow-y-auto rounded-xl border border-gray-200 dark:border-surface-border divide-y divide-gray-100 dark:divide-surface-border bg-white dark:bg-surface-elevated">
        {filtered.length === 0 && (
          <div className="py-8 text-center">
            <GitFork className="w-6 h-6 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
            <p className="text-sm text-gray-400 dark:text-gray-500">No repositories found.</p>
          </div>
        )}
        {filtered.map((repo) => {
          const isSelected = selected === repo.githubRepoId;
          return (
            <label
              key={repo.githubRepoId}
              className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${
                isSelected
                  ? 'bg-accent/5 dark:bg-accent/10'
                  : 'hover:bg-gray-50 dark:hover:bg-surface-muted/40'
              }`}
            >
              <input
                type="radio"
                name="repo"
                value={repo.githubRepoId}
                checked={isSelected}
                onChange={() => setSelected(repo.githubRepoId)}
                className="accent-accent flex-shrink-0"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-medium truncate ${isSelected ? 'text-accent' : 'text-gray-800 dark:text-gray-200'}`}>
                    {repo.fullName}
                  </span>
                  {repo.private
                    ? <Lock className="w-3 h-3 flex-shrink-0 text-gray-400" />
                    : <Globe className="w-3 h-3 flex-shrink-0 text-gray-300 dark:text-gray-600" />
                  }
                </div>
                <div className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">
                  Updated {formatDistanceToNow(new Date(repo.updatedAt))}
                </div>
              </div>
            </label>
          );
        })}
      </div>

      {connectMutation.isError && (
        <p className="text-sm text-red-500 dark:text-red-400">
          {connectMutation.error?.response?.data?.message || 'Failed to connect repo. Please try again.'}
        </p>
      )}

      <button
        onClick={handleConnect}
        disabled={!selected || connectMutation.isPending}
        className="btn-primary w-full py-2.5 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {connectMutation.isPending ? (
          'Connecting…'
        ) : (
          <>
            Connect repository
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </button>
    </div>
  );
}
