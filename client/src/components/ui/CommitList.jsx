import { formatDistanceToNow } from '../utils/time';
import { ExternalLink } from 'lucide-react';

export default function CommitList({ commits = [] }) {
  if (!commits.length) {
    return (
      <div className="py-10 text-center">
        <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-surface-muted flex items-center justify-center mx-auto mb-3">
          <span className="text-lg">📭</span>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">No commits in this period.</p>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-gray-100 dark:divide-surface-border">
      {commits.map((commit) => (
        <li key={commit.sha} className="py-3.5 flex items-start gap-3 group">
          {/* Author avatar */}
          <img
            src={`https://github.com/${commit.authorLogin}.png?size=32`}
            alt={commit.authorLogin}
            className="w-6 h-6 rounded-full flex-shrink-0 mt-0.5 border border-gray-100 dark:border-surface-border"
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />

          <div className="min-w-0 flex-1">
            {/* Commit message */}
            <a
              href={commit.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-gray-800 dark:text-gray-200 hover:text-accent dark:hover:text-accent font-medium truncate block leading-snug transition-colors"
            >
              {commit.message}
            </a>

            {/* Meta row */}
            <div className="flex items-center flex-wrap gap-x-2 gap-y-1 mt-1">
              <code className="text-[11px] font-mono bg-gray-100 dark:bg-surface-muted text-gray-500 dark:text-gray-400 px-1.5 py-0.5 rounded">
                {commit.sha}
              </code>
              <span className="text-[11px] text-gray-400 dark:text-gray-500">
                by <span className="font-medium text-gray-600 dark:text-gray-300">@{commit.authorLogin}</span>
              </span>
              <span className="text-[11px] text-gray-400 dark:text-gray-500">
                {formatDistanceToNow(new Date(commit.timestamp))}
              </span>
            </div>
          </div>

          {/* External link */}
          <a
            href={commit.url}
            target="_blank"
            rel="noopener noreferrer"
            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded text-gray-400 hover:text-accent flex-shrink-0"
            aria-label="View on GitHub"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </li>
      ))}
    </ul>
  );
}
