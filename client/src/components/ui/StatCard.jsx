export default function StatCard({ label, value, subtext, icon: Icon, accent = false }) {
  return (
    <div className="card p-5 flex flex-col gap-3 relative overflow-hidden group">
      {/* Top row */}
      <div className="flex items-center justify-between">
        <span className="section-label">{label}</span>
        {Icon && (
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors
            ${accent
              ? 'bg-accent/10 dark:bg-accent/20'
              : 'bg-gray-100 dark:bg-surface-muted'
            }`}>
            <Icon className={`w-4 h-4 ${accent ? 'text-accent' : 'text-gray-400 dark:text-gray-500'}`} />
          </div>
        )}
      </div>

      {/* Value */}
      <div>
        <div className="text-2xl font-bold text-gray-900 dark:text-white tabular-nums tracking-tight">
          {value ?? '—'}
        </div>
        {subtext && (
          <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">{subtext}</div>
        )}
      </div>

      {/* Subtle bottom accent line */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-accent/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    </div>
  );
}
