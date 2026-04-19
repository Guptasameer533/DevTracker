import { useState, useRef, useEffect } from 'react';
import { ChevronDown, CalendarDays, Check } from 'lucide-react';

const PRESETS = [
  { label: 'Last 7 days',   days: 7 },
  { label: 'Last 30 days',  days: 30 },
  { label: 'Last 90 days',  days: 90 },
  { label: 'Last 6 months', days: 180 },
  { label: 'Last 1 year',   days: 365 },
];

function toDateInputValue(date) {
  return date.toISOString().slice(0, 10);
}

function buildRange(days) {
  const to = new Date();
  to.setHours(23, 59, 59, 999);
  const from = new Date();
  from.setDate(from.getDate() - days);
  from.setHours(0, 0, 0, 0);
  return { from, to };
}

export default function DateRangePicker({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const [customFrom, setCustomFrom] = useState(toDateInputValue(value?.from || new Date()));
  const [customTo, setCustomTo] = useState(toDateInputValue(value?.to || new Date()));
  const [showCustom, setShowCustom] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handle(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
        setShowCustom(false);
      }
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  function selectPreset(preset) {
    setShowCustom(false);
    const range = buildRange(preset.days);
    onChange({ ...range, label: preset.label });
    setOpen(false);
  }

  function applyCustom() {
    const from = new Date(customFrom);
    from.setHours(0, 0, 0, 0);
    const to = new Date(customTo);
    to.setHours(23, 59, 59, 999);
    if (from > to) return;
    const diffDays = Math.round((to - from) / (1000 * 60 * 60 * 24));
    onChange({ from, to, label: `${customFrom} → ${customTo}`, custom: true, diffDays });
    setOpen(false);
    setShowCustom(false);
  }

  const activePreset = !value?.custom
    ? PRESETS.find((p) => {
        const r = buildRange(p.days);
        return Math.abs(r.from - value?.from) < 1000 * 60 * 60 * 24;
      })
    : null;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-200 dark:border-surface-border rounded-lg bg-white dark:bg-surface-elevated text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-surface-muted transition-colors shadow-sm"
      >
        <CalendarDays className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500 flex-shrink-0" />
        <span className="font-medium">{value?.label || 'Last 30 days'}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 mt-1.5 w-52 bg-white dark:bg-surface-elevated border border-gray-200 dark:border-surface-border rounded-xl shadow-card-md z-50 overflow-hidden animate-slide-down">
          {/* Presets */}
          <div className="p-1.5">
            {PRESETS.map((preset) => {
              const isActive = activePreset?.days === preset.days;
              return (
                <button
                  key={preset.days}
                  onClick={() => selectPreset(preset)}
                  className={`w-full flex items-center justify-between text-left px-3 py-2 text-sm rounded-lg transition-colors ${
                    isActive
                      ? 'bg-accent/10 dark:bg-accent/15 text-accent font-medium'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-surface-muted'
                  }`}
                >
                  {preset.label}
                  {isActive && <Check className="w-3.5 h-3.5" />}
                </button>
              );
            })}
          </div>

          {/* Divider */}
          <div className="h-px bg-gray-100 dark:bg-surface-border mx-1.5" />

          {/* Custom range */}
          <div className="p-1.5">
            <button
              onClick={() => setShowCustom((s) => !s)}
              className={`w-full flex items-center justify-between text-left px-3 py-2 text-sm rounded-lg transition-colors ${
                value?.custom
                  ? 'bg-accent/10 dark:bg-accent/15 text-accent font-medium'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-surface-muted'
              }`}
            >
              Custom range
              {value?.custom && <Check className="w-3.5 h-3.5" />}
            </button>

            {showCustom && (
              <div className="px-2.5 pb-2.5 pt-1 space-y-2.5">
                <div>
                  <label className="text-[11px] font-medium text-gray-400 dark:text-gray-500 mb-1 block uppercase tracking-wide">From</label>
                  <input
                    type="date"
                    value={customFrom}
                    max={customTo}
                    onChange={(e) => setCustomFrom(e.target.value)}
                    className="input-base text-sm py-1.5"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-gray-400 dark:text-gray-500 mb-1 block uppercase tracking-wide">To</label>
                  <input
                    type="date"
                    value={customTo}
                    min={customFrom}
                    max={toDateInputValue(new Date())}
                    onChange={(e) => setCustomTo(e.target.value)}
                    className="input-base text-sm py-1.5"
                  />
                </div>
                <button
                  onClick={applyCustom}
                  disabled={!customFrom || !customTo || customFrom > customTo}
                  className="btn-primary w-full text-xs py-2 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Apply range
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
