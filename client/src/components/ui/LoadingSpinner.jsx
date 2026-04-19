export default function LoadingSpinner({ size = 'md', label = 'Loading...' }) {
  const sizeClass = { sm: 'h-4 w-4', md: 'h-7 w-7', lg: 'h-10 w-10' }[size];

  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16" role="status" aria-label={label}>
      <div className="relative">
        <div className={`${sizeClass} rounded-full border-2 border-gray-200 dark:border-surface-muted border-t-accent animate-spin`} />
        <div className={`${sizeClass} rounded-full border-2 border-transparent border-r-accent/30 animate-spin absolute inset-0`}
             style={{ animationDuration: '1.5s', animationDirection: 'reverse' }} />
      </div>
      {label && <span className="text-sm text-gray-400 dark:text-gray-500">{label}</span>}
    </div>
  );
}
