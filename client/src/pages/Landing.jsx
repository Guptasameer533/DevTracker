import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { BarChart2, Github, ArrowRight, GitCommitHorizontal, Users, Zap, Eye, Shield, Moon, Sun } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../services/api';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { useTheme } from '../context/ThemeContext';

export default function Landing() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { dark, toggle } = useTheme();

  const params = new URLSearchParams(window.location.search);
  const oauthError = params.get('error');

  useEffect(() => {
    if (!loading && user) navigate('/dashboard', { replace: true });
  }, [user, loading, navigate]);

  if (loading) return <LoadingSpinner label="Loading..." />;

  return (
    <div className="min-h-screen bg-white dark:bg-surface flex flex-col overflow-x-hidden">

      {/* ── Header ───────────────────────────────── */}
      <header className="relative z-50 max-w-6xl mx-auto w-full px-5 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-accent rounded-lg flex items-center justify-center shadow-sm">
            <BarChart2 className="w-4 h-4 text-white" />
          </div>
          <span className="text-sm font-semibold text-gray-900 dark:text-white tracking-tight">DevTrack</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggle}
            aria-label="Toggle theme"
            className="btn-ghost p-2"
          >
            {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <Link to="/demo" className="btn-secondary text-sm px-3.5 py-1.5 hidden sm:inline-flex">
            Live demo
          </Link>
          <a href={authApi.loginUrl()} className="btn-primary text-sm px-3.5 py-1.5">
            <Github className="w-4 h-4" />
            Sign in
          </a>
        </div>
      </header>

      {/* ── Hero ─────────────────────────────────── */}
      <main className="flex-1 relative">
        {/* Background */}
        <div className="absolute inset-0 hero-glow pointer-events-none" />
        <div className="absolute inset-0 dot-grid pointer-events-none" />

        <div className="relative max-w-6xl mx-auto px-5 pt-14 pb-10 text-center">
          {/* Pill badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white dark:bg-surface-elevated border border-gray-200 dark:border-surface-border shadow-card mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse-slow flex-shrink-0" />
            <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
              Open-source · Free · Self-hostable
            </span>
          </div>

          {/* Headline */}
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-gray-900 dark:text-white leading-[1.07] tracking-tight text-balance mb-5">
            Your GitHub activity,
            <br />
            <span className="gradient-text-accent">beautifully clear</span>
          </h1>

          <p className="text-lg sm:text-xl text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-8 text-balance leading-relaxed">
            Connect a repo in 30 seconds. Visualize commit patterns, busiest days, and top contributors—all in one view.
          </p>

          {oauthError && (
            <div className="max-w-sm mx-auto mb-6 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3 text-sm text-red-600 dark:text-red-400">
              Sign-in failed ({oauthError}). Please try again.
            </div>
          )}

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-5">
            <a
              href={authApi.loginUrl()}
              className="btn-primary text-base px-6 py-3 shadow-sm"
            >
              <Github className="w-5 h-5" />
              Sign in with GitHub
              <ArrowRight className="w-4 h-4" />
            </a>
            <Link to="/demo" className="btn-secondary text-base px-6 py-3">
              <Eye className="w-4 h-4" />
              See a live demo
            </Link>
          </div>

          {/* Trust signals */}
          <div className="flex items-center justify-center gap-4 text-xs text-gray-400 dark:text-gray-500">
            <span className="flex items-center gap-1.5">
              <Shield className="w-3 h-3" />
              Read-only access
            </span>
            <span className="text-gray-200 dark:text-gray-700">·</span>
            <span>No credit card</span>
            <span className="text-gray-200 dark:text-gray-700">·</span>
            <span>Your code stays on GitHub</span>
          </div>
        </div>

        {/* ── Dashboard Preview ─────────────────── */}
        <div className="relative max-w-4xl mx-auto px-5 mb-20">
          <AppWindowPreview />
        </div>

        {/* ── Features ─────────────────────────── */}
        <div className="border-t border-gray-100 dark:border-surface-border">
          <div className="max-w-6xl mx-auto px-5 py-16">
            <p className="section-label text-center mb-10">Everything you need</p>
            <div className="grid sm:grid-cols-3 gap-10">
              {[
                {
                  icon: Zap,
                  title: 'Zero configuration',
                  desc: 'OAuth sign-in, pick a repo, you\'re done. No webhooks, no YAML, no overhead.',
                },
                {
                  icon: GitCommitHorizontal,
                  title: 'Daily commit patterns',
                  desc: 'Visualize commit frequency across any date range. Find your peak productive days.',
                },
                {
                  icon: Users,
                  title: 'Contributor leaderboard',
                  desc: 'Ranked breakdown of who\'s shipping the most with expandable commit history.',
                },
              ].map(({ icon: Icon, title, desc }) => (
                <div key={title} className="flex gap-4">
                  <div className="w-9 h-9 rounded-xl bg-accent/10 dark:bg-accent/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Icon className="w-4 h-4 text-accent" strokeWidth={2} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1.5 text-sm">{title}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── CTA Banner ───────────────────────── */}
        <div className="border-t border-gray-100 dark:border-surface-border bg-gray-50 dark:bg-surface-elevated">
          <div className="max-w-6xl mx-auto px-5 py-14 text-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Ready to see your activity?
            </h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
              Free forever. No tracking beyond your own commits.
            </p>
            <a href={authApi.loginUrl()} className="btn-primary text-sm px-5 py-2.5 shadow-sm inline-flex">
              <Github className="w-4 h-4" />
              Get started with GitHub
            </a>
          </div>
        </div>
      </main>

      {/* ── Footer ───────────────────────────────── */}
      <footer className="border-t border-gray-100 dark:border-surface-border py-5">
        <div className="max-w-6xl mx-auto px-5 flex items-center justify-between text-xs text-gray-400 dark:text-gray-500">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-accent rounded flex items-center justify-center">
              <BarChart2 className="w-3 h-3 text-white" />
            </div>
            <span className="font-medium text-gray-500 dark:text-gray-400">DevTrack</span>
          </div>
          <span>MIT License · Open source</span>
        </div>
      </footer>
    </div>
  );
}

/* ── Static dashboard preview with mac window chrome ── */
function AppWindowPreview() {
  const bars = [3, 7, 5, 12, 8, 2, 1, 9, 6, 14, 11, 4, 0, 2, 8, 13, 9, 15, 6, 3, 1, 10, 7, 11, 14, 8, 5, 12, 9, 6];
  const maxBar = 15;

  return (
    <div className="rounded-2xl overflow-hidden border border-gray-200 dark:border-surface-border shadow-card-lg">
      {/* Window chrome */}
      <div className="flex items-center gap-3 px-4 py-3 bg-gray-100 dark:bg-surface-muted border-b border-gray-200 dark:border-surface-border">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
          <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
          <div className="w-3 h-3 rounded-full bg-[#28c840]" />
        </div>
        <div className="flex-1 mx-4">
          <div className="h-6 max-w-xs mx-auto bg-white dark:bg-surface-elevated rounded border border-gray-200 dark:border-surface-border flex items-center px-3 gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-accent/60" />
            <span className="text-[10px] text-gray-400 dark:text-gray-500 font-mono">devtrack.app/dashboard</span>
          </div>
        </div>
      </div>

      {/* App content */}
      <div className="bg-gray-50 dark:bg-surface/60 p-5">
        {/* Fake navbar */}
        <div className="flex items-center gap-3 mb-5">
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 bg-accent rounded flex items-center justify-center">
              <BarChart2 className="w-3 h-3 text-white" />
            </div>
            <span className="text-xs font-semibold text-gray-700 dark:text-gray-200">DevTrack</span>
          </div>
          <div className="flex gap-1 ml-2">
            <div className="px-2 py-1 bg-gray-200 dark:bg-surface-muted rounded text-[10px] font-medium text-gray-500 dark:text-gray-400">Dashboard</div>
            <div className="px-2 py-1 rounded text-[10px] text-gray-400 dark:text-gray-500">Settings</div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-violet-500 to-blue-500" />
            <div className="text-[10px] text-gray-400 dark:text-gray-500">octocat</div>
          </div>
        </div>

        {/* Repo header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-sm font-semibold text-gray-800 dark:text-gray-100">facebook/react</div>
            <div className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">Commit activity · Last 30 days</div>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white dark:bg-surface-elevated rounded-lg border border-gray-200 dark:border-surface-border text-[10px] text-gray-500 dark:text-gray-400">
            <span>📅</span> Last 30 days
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          {[
            { label: 'Total commits', value: '142', sub: 'Last 30 days' },
            { label: 'Last commit', value: '2h ago', sub: 'main branch' },
            { label: 'Busiest day', value: '15 commits', sub: 'Wednesday' },
          ].map((s) => (
            <div key={s.label} className="bg-white dark:bg-surface-elevated rounded-xl border border-gray-200 dark:border-surface-border p-3">
              <p className="text-[9px] text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1.5">{s.label}</p>
              <p className="text-sm font-bold text-gray-900 dark:text-white tabular-nums">{s.value}</p>
              <p className="text-[9px] text-gray-400 dark:text-gray-500 mt-0.5">{s.sub}</p>
            </div>
          ))}
        </div>

        {/* Chart card */}
        <div className="bg-white dark:bg-surface-elevated rounded-xl border border-gray-200 dark:border-surface-border p-4">
          <p className="text-[11px] font-semibold text-gray-600 dark:text-gray-300 mb-4">Commits over time</p>
          <div className="flex items-end gap-0.5 h-20">
            {bars.map((b, i) => (
              <div key={i} className="flex-1 h-full flex items-end">
                <div
                  className="w-full rounded-sm"
                  style={{
                    height: b === 0 ? '2px' : `${(b / maxBar) * 100}%`,
                    background: b === 0
                      ? 'rgba(45,164,78,0.12)'
                      : `linear-gradient(to bottom, rgba(45,164,78,0.95), rgba(45,164,78,0.6))`,
                    borderRadius: '2px 2px 0 0',
                  }}
                />
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-[9px] text-gray-400 dark:text-gray-500">
            <span>30 days ago</span>
            <span>Today</span>
          </div>
        </div>
      </div>
    </div>
  );
}
