const UNITS = [
  { label: 'year', ms: 365 * 24 * 60 * 60 * 1000 },
  { label: 'month', ms: 30 * 24 * 60 * 60 * 1000 },
  { label: 'week', ms: 7 * 24 * 60 * 60 * 1000 },
  { label: 'day', ms: 24 * 60 * 60 * 1000 },
  { label: 'hour', ms: 60 * 60 * 1000 },
  { label: 'minute', ms: 60 * 1000 },
];

export function formatDistanceToNow(date) {
  const diff = Date.now() - date.getTime();
  if (diff < 60 * 1000) return 'just now';
  for (const { label, ms } of UNITS) {
    const value = Math.floor(diff / ms);
    if (value >= 1) {
      return `${value} ${label}${value !== 1 ? 's' : ''} ago`;
    }
  }
  return 'just now';
}

export function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}
