import { RefreshCw } from 'lucide-react';

export default function ErrorState({ message, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
      <div className="w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/40 flex items-center justify-center">
        <span className="text-xl">⚠️</span>
      </div>
      <div>
        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          {message || "Couldn't load data"}
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
          Check your connection and try again.
        </p>
      </div>
      {onRetry && (
        <button onClick={onRetry} className="btn-secondary text-sm gap-2">
          <RefreshCw className="w-3.5 h-3.5" />
          Retry
        </button>
      )}
    </div>
  );
}
