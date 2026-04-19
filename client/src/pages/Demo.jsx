import { Link } from 'react-router-dom';
import { BarChart2, Github, Info, GitCommitHorizontal, Calendar, TrendingUp, Users, Moon, Sun, ArrowRight } from 'lucide-react';
import { useDemoStats } from '../hooks/useStats';
import CommitChart from '../components/charts/CommitChart';
import StatCard from '../components/ui/StatCard';
import CommitList from '../components/ui/CommitList';
import ContributorCard from '../components/ui/ContributorCard';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import ErrorState from '../components/ui/ErrorState';
import { useTheme } from '../context/ThemeContext';
import { authApi } from '../services/api';
import { formatDistanceToNow, formatDate } from '../components/utils/time';

export default function Demo() {
  const { data: stats, isLoading, isError, refetch } = useDemoStats();
  const { dark, toggle } = useTheme();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-surface">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/90 dark:bg-surface/90 backdrop-blur-md border-b border-gray-200/80 dark:border-surface-border">
        <div className="max-w-6xl mx-auto px-5 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-7 h-7 bg-accent rounded-lg flex items-center justify-center shadow-sm">
              <BarChart2 className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-semibold text-gray-900 dark:text-white tracking-tight">DevTrack</span>
          </Link>

          <div className="flex items-center gap-2">
            <button onClick={toggle} className="btn-ghost p-2">
              {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <a href={authApi.loginUrl()} className="btn-primary text-sm px-3.5 py-1.5">
              <Github className="w-4 h-4" />
              Sign in
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-5 py-7">
        {/* Demo banner */}
        <div className="flex items-start gap-3 px-4 py-3.5 mb-7 rounded-xl bg-blue-50 dark:bg-blue-900/15 border border-blue-200 dark:border-blue-800/60 text-sm">
          <Info className="w-4 h-4 text-blue-500 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-blue-700 dark:text-blue-300">
            <span className="font-semibold">Live demo</span>
            {' — '}showing seeded data from{' '}
            <a
              href="https://github.com/facebook/react"
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-medium hover:text-blue-900 dark:hover:text-blue-100 transition-colors"
            >
              facebook/react
            </a>
            . No login required.
          </div>
        </div>

        {isLoading && <LoadingSpinner label="Loading demo data..." />}
        {isError && <ErrorState message="Demo data unavailable." onRetry={refetch} />}

        {stats && (
          <div className="space-y-5">
            {/* Repo header */}
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <Github className="w-4 h-4 text-gray-400" />
                  <span className="text-xs text-gray-400">facebook</span>
                  <span className="text-xs text-gray-300 dark:text-gray-600">/</span>
                  <span className="text-sm font-semibold text-gray-800 dark:text-white">react</span>
                </div>
                <p className="text-xs text-gray-400 ml-6">
                  Commit activity · <span className="text-accent font-medium">Last 30 days</span>
                  {' '}<span className="badge badge-gray ml-1">demo</span>
                </p>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <StatCard
                label="Total commits"
                value={stats.summary?.totalCommits ?? 0}
                icon={GitCommitHorizontal}
                accent
              />
              <StatCard
                label="Last commit"
                value={
                  stats.summary?.lastCommitDate
                    ? formatDistanceToNow(new Date(stats.summary.lastCommitDate))
                    : '—'
                }
                icon={Calendar}
              />
              <StatCard
                label="Busiest day"
                value={stats.summary?.busiestDay?.count ? `${stats.summary.busiestDay.count} commits` : '—'}
                subtext={stats.summary?.busiestDay ? formatDate(stats.summary.busiestDay.date) : undefined}
                icon={TrendingUp}
              />
            </div>

            {/* Chart */}
            <div className="card p-5">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-100">Commits over time</h2>
                {stats.summary?.totalCommits > 0 && (
                  <span className="badge badge-green">{stats.summary.totalCommits} total</span>
                )}
              </div>
              <CommitChart buckets={stats.buckets || []} />
            </div>

            {/* Two column: contributors + commits */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
              {stats.contributors?.length > 0 && (
                <div className="lg:col-span-2">
                  <div className="flex items-center gap-2 mb-3">
                    <Users className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
                    <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Contributors</h2>
                    <span className="badge badge-gray ml-auto">{stats.contributors.length}</span>
                  </div>
                  <div className="space-y-2">
                    {stats.contributors.map((c, i) => (
                      <ContributorCard
                        key={c.authorLogin}
                        contributor={c}
                        totalCommits={stats.summary?.totalCommits}
                        rank={i + 1}
                      />
                    ))}
                  </div>
                </div>
              )}

              <div className={stats.contributors?.length > 0 ? 'lg:col-span-3' : 'lg:col-span-5'}>
                <div className="flex items-center gap-2 mb-3">
                  <GitCommitHorizontal className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
                  <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Recent commits</h2>
                </div>
                <div className="card p-4">
                  <CommitList commits={stats.recentCommits || []} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="mt-10 py-8 border-t border-gray-200 dark:border-surface-border text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1 font-medium">Like what you see?</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-5">Connect your own repo in under 30 seconds.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a href={authApi.loginUrl()} className="btn-primary px-5 py-2.5 text-sm">
              <Github className="w-4 h-4" />
              Sign in with GitHub
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
            <Link to="/" className="btn-secondary px-5 py-2.5 text-sm">
              ← Back to home
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
