import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useStats } from '../hooks/useStats';
import { useConnectRepo } from '../hooks/useRepos';
import Layout from '../components/layout/Layout';
import CommitChart from '../components/charts/CommitChart';
import StatCard from '../components/ui/StatCard';
import CommitList from '../components/ui/CommitList';
import ContributorCard from '../components/ui/ContributorCard';
import RepoSelector from '../components/RepoSelector';
import DateRangePicker from '../components/DateRangePicker';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import ErrorState from '../components/ui/ErrorState';
import { GitCommitHorizontal, Calendar, TrendingUp, Link2, AlertTriangle, Users, Github } from 'lucide-react';
import { formatDistanceToNow, formatDate } from '../components/utils/time';
import { useQueryClient } from '@tanstack/react-query';

function defaultRange() {
  const to = new Date();
  to.setHours(23, 59, 59, 999);
  const from = new Date();
  from.setDate(from.getDate() - 30);
  from.setHours(0, 0, 0, 0);
  return { from, to, label: 'Last 30 days' };
}

export default function Dashboard() {
  const { user, refreshUser } = useAuth();
  const queryClient = useQueryClient();
  const [dateRange, setDateRange] = useState(defaultRange);

  const {
    data: stats,
    isLoading,
    isError,
    error,
    refetch,
  } = useStats(dateRange, { enabled: !!user?.connectedRepo });

  async function handleRepoConnected() {
    await refreshUser();
    queryClient.invalidateQueries({ queryKey: ['stats'] });
  }

  /* ── Onboarding state ── */
  if (!user?.connectedRepo) {
    return (
      <Layout>
        <div className="max-w-lg mx-auto pt-4">
          {/* Welcome */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-3">
              <img
                src={user?.avatarUrl}
                alt={user?.username}
                className="w-10 h-10 rounded-full ring-2 ring-gray-200 dark:ring-surface-border"
              />
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  Welcome back, {user?.username}
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">One more step to get started</p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 bg-accent/10 dark:bg-accent/20 rounded-xl flex items-center justify-center">
                <Link2 className="w-4 h-4 text-accent" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-200">Connect a repository</h2>
                <p className="text-xs text-gray-400 dark:text-gray-500">Pick the repo you want to track</p>
              </div>
            </div>
            <RepoSelector onConnected={handleRepoConnected} />
          </div>
        </div>
      </Layout>
    );
  }

  /* ── Error states ── */
  const errorCode = error?.response?.data?.code;
  if (isError && errorCode === 'REPO_ARCHIVED') {
    return (
      <Layout>
        <ErrorBanner
          message="This repo is no longer accessible on GitHub."
          action="Go to Settings to disconnect it."
        />
      </Layout>
    );
  }
  if (isError && (errorCode === 'GITHUB_UNAUTHORIZED' || error?.response?.status === 401)) {
    return (
      <Layout>
        <ErrorBanner
          message="Your GitHub session expired."
          action={<a href="/api/v1/auth/github" className="text-accent underline font-medium">Sign in again →</a>}
        />
      </Layout>
    );
  }

  const repoName = stats?.repo?.fullName || user.connectedRepo?.fullName;
  const [repoOwner, repoRepo] = (repoName || '').split('/');
  const { buckets = [], summary = {}, recentCommits = [], contributors = [] } = stats || {};
  const hasActivity = buckets.some((b) => b.count > 0);

  return (
    <Layout>
      {/* ── Page header ── */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-7">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Github className="w-4 h-4 text-gray-400 dark:text-gray-500" />
            <span className="text-xs text-gray-400 dark:text-gray-500">{repoOwner}</span>
            <span className="text-xs text-gray-300 dark:text-gray-600">/</span>
            <span className="text-sm font-semibold text-gray-800 dark:text-white">{repoRepo}</span>
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-500 ml-6">
            Commit activity ·{' '}
            <span className="text-accent font-medium">{dateRange.label}</span>
          </p>
        </div>
        <div className="flex items-center gap-2.5 sm:ml-auto">
          <DateRangePicker value={dateRange} onChange={setDateRange} />
          <a
            href="/settings"
            className="text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors whitespace-nowrap underline decoration-dotted"
          >
            Change repo
          </a>
        </div>
      </div>

      {isLoading ? (
        <LoadingSpinner label="Fetching commit activity…" />
      ) : (
        <div className="space-y-5">
          {/* ── Stat cards ── */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard
              label={`Commits (${dateRange.label.toLowerCase()})`}
              value={summary.totalCommits ?? 0}
              icon={GitCommitHorizontal}
              accent
            />
            <StatCard
              label="Last commit"
              value={
                summary.lastCommitDate
                  ? formatDistanceToNow(new Date(summary.lastCommitDate))
                  : '—'
              }
              icon={Calendar}
            />
            <StatCard
              label="Busiest day"
              value={summary.busiestDay?.count ? `${summary.busiestDay.count} commits` : '—'}
              subtext={summary.busiestDay ? formatDate(summary.busiestDay.date) : undefined}
              icon={TrendingUp}
            />
          </div>

          {/* ── Commit chart ── */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-100">Commits over time</h2>
                {buckets.length > 90 && (
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Grouped by week</p>
                )}
              </div>
              {hasActivity && (
                <span className="badge badge-green">
                  {summary.totalCommits} total
                </span>
              )}
            </div>
            {!hasActivity ? (
              <div className="py-12 text-center">
                <p className="text-sm text-gray-400 dark:text-gray-500">No commits in this period.</p>
                <p className="text-xs text-gray-300 dark:text-gray-600 mt-1">Try a wider date range.</p>
              </div>
            ) : (
              <CommitChart buckets={buckets} />
            )}
          </div>

          {/* ── Two column layout for contributors + commits ── */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

            {/* Contributors */}
            {contributors.length > 0 && (
              <div className="lg:col-span-2">
                <div className="flex items-center gap-2 mb-3">
                  <Users className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
                  <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Contributors</h2>
                  <span className="badge badge-gray ml-auto">{contributors.length}</span>
                </div>
                <div className="space-y-2">
                  {contributors.map((c, i) => (
                    <ContributorCard
                      key={c.authorLogin}
                      contributor={c}
                      totalCommits={summary.totalCommits}
                      rank={i + 1}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Recent commits */}
            <div className={contributors.length > 0 ? 'lg:col-span-3' : 'lg:col-span-5'}>
              <div className="flex items-center gap-2 mb-3">
                <GitCommitHorizontal className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
                <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Recent commits</h2>
                {recentCommits.length > 0 && (
                  <span className="badge badge-gray ml-auto">{recentCommits.length}</span>
                )}
              </div>
              <div className="card p-4">
                <CommitList commits={recentCommits} />
              </div>
            </div>
          </div>
        </div>
      )}

      {isError && !errorCode && (
        <ErrorState message="Couldn't load commit stats." onRetry={refetch} />
      )}
    </Layout>
  );
}

function ErrorBanner({ message, action }) {
  return (
    <div className="max-w-lg mx-auto">
      <div className="flex items-start gap-4 card p-5 border-yellow-200 dark:border-yellow-700/60 bg-yellow-50 dark:bg-yellow-900/10">
        <div className="w-8 h-8 rounded-lg bg-yellow-100 dark:bg-yellow-800/30 flex items-center justify-center flex-shrink-0">
          <AlertTriangle className="w-4 h-4 text-yellow-500" />
        </div>
        <div>
          <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-300">{message}</p>
          <p className="text-sm text-yellow-700 dark:text-yellow-400/80 mt-0.5">{action}</p>
        </div>
      </div>
    </div>
  );
}
