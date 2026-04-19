import { useState } from 'react';
import { ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { formatDistanceToNow } from '../utils/time';

const AVATAR_COLORS = [
  'from-violet-500 to-purple-600',
  'from-blue-500 to-cyan-600',
  'from-emerald-500 to-teal-600',
  'from-amber-500 to-orange-600',
  'from-rose-500 to-pink-600',
  'from-fuchsia-500 to-purple-600',
  'from-cyan-500 to-blue-600',
  'from-orange-500 to-red-600',
];

function avatarGradient(login) {
  let h = 0;
  for (let i = 0; i < login.length; i++) h = (h * 31 + login.charCodeAt(i)) & 0xffffffff;
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

function RankBadge({ rank }) {
  const styles = {
    1: 'text-yellow-500 dark:text-yellow-400',
    2: 'text-gray-400 dark:text-gray-400',
    3: 'text-amber-600 dark:text-amber-500',
  };
  return (
    <span className={`text-xs font-bold tabular-nums w-5 text-center flex-shrink-0 ${styles[rank] || 'text-gray-300 dark:text-gray-600'}`}>
      {rank <= 3 ? ['🥇', '🥈', '🥉'][rank - 1] : `#${rank}`}
    </span>
  );
}

function Avatar({ login }) {
  const [imgError, setImgError] = useState(false);

  if (!imgError) {
    return (
      <img
        src={`https://github.com/${login}.png?size=64`}
        alt={login}
        onError={() => setImgError(true)}
        className="w-8 h-8 rounded-full flex-shrink-0 border-2 border-white dark:border-surface-elevated shadow-sm"
      />
    );
  }

  return (
    <div className={`w-8 h-8 rounded-full flex-shrink-0 bg-gradient-to-br ${avatarGradient(login)} flex items-center justify-center shadow-sm`}>
      <span className="text-white text-xs font-bold">{login[0].toUpperCase()}</span>
    </div>
  );
}

export default function ContributorCard({ contributor, totalCommits, rank }) {
  const [expanded, setExpanded] = useState(false);
  const { authorLogin, commitCount, commits = [] } = contributor;
  const pct = totalCommits > 0 ? Math.round((commitCount / totalCommits) * 100) : 0;
  const hasCommits = commits.length > 0;

  return (
    <div className={`card overflow-hidden transition-all duration-200 ${expanded ? 'shadow-card-md' : ''}`}>
      {/* Header */}
      <button
        onClick={() => hasCommits && setExpanded((e) => !e)}
        disabled={!hasCommits}
        className={`w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors
          ${hasCommits ? 'hover:bg-gray-50 dark:hover:bg-surface-muted/40 cursor-pointer' : 'cursor-default'}`}
      >
        <RankBadge rank={rank} />
        <Avatar login={authorLogin} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <a
              href={`https://github.com/${authorLogin}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-sm font-semibold text-gray-900 dark:text-white hover:text-accent dark:hover:text-accent truncate transition-colors"
            >
              {authorLogin}
            </a>
            <span className="badge badge-gray hidden sm:inline-flex">
              {pct}%
            </span>
          </div>

          {/* Progress bar */}
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1 bg-gray-100 dark:bg-surface-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-accent to-emerald-400 rounded-full transition-all duration-700"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0 ml-2">
          <div className="text-right">
            <div className="text-sm font-bold text-gray-900 dark:text-white tabular-nums">
              {commitCount}
            </div>
            <div className="text-[11px] text-gray-400 dark:text-gray-500 leading-tight">
              {commitCount === 1 ? 'commit' : 'commits'}
            </div>
          </div>
          {hasCommits && (
            <div className="text-gray-300 dark:text-gray-600">
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>
          )}
        </div>
      </button>

      {/* Expanded commits */}
      {expanded && hasCommits && (
        <div className="border-t border-gray-100 dark:border-surface-border bg-gray-50/60 dark:bg-surface/40 animate-slide-down">
          <ul className="divide-y divide-gray-100 dark:divide-surface-border px-4">
            {commits.map((c) => (
              <li key={c.sha} className="py-2.5 flex items-start gap-3 group">
                <img
                  src={`https://github.com/${authorLogin}.png?size=24`}
                  alt={authorLogin}
                  className="w-5 h-5 rounded-full flex-shrink-0 mt-0.5 opacity-60"
                  onError={(e) => (e.target.style.display = 'none')}
                />
                <div className="min-w-0 flex-1">
                  <a
                    href={c.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-gray-700 dark:text-gray-300 hover:text-accent dark:hover:text-accent line-clamp-1 block font-medium transition-colors"
                  >
                    {c.message}
                  </a>
                  <div className="flex items-center gap-2 mt-0.5">
                    <code className="text-[10px] font-mono bg-gray-100 dark:bg-surface-muted text-gray-400 dark:text-gray-500 px-1 py-0.5 rounded">
                      {c.sha}
                    </code>
                    <span className="text-[10px] text-gray-400 dark:text-gray-500">
                      {formatDistanceToNow(new Date(c.timestamp))}
                    </span>
                  </div>
                </div>
                <a
                  href={c.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded text-gray-400 hover:text-accent flex-shrink-0"
                >
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
            ))}
          </ul>
          {commitCount > commits.length && (
            <p className="px-4 pb-3 text-[11px] text-gray-400 dark:text-gray-500">
              + {commitCount - commits.length} more commits in this range
            </p>
          )}
        </div>
      )}
    </div>
  );
}
