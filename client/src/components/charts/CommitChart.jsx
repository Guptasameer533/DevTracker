import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from 'recharts';
import { useTheme } from '../../context/ThemeContext';
import { formatDate } from '../utils/time';

function CustomTooltip({ active, payload, label, weekly }) {
  if (!active || !payload?.length) return null;
  const count = payload[0].value;
  return (
    <div className="bg-white dark:bg-surface-card border border-gray-200 dark:border-surface-border rounded-lg shadow-card-md px-3.5 py-2.5 text-sm pointer-events-none">
      <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">
        {weekly ? `Week of ${formatDate(label)}` : formatDate(label)}
      </p>
      <p className="font-bold text-gray-900 dark:text-white">
        {count} <span className="font-normal text-gray-400">{count !== 1 ? 'commits' : 'commit'}</span>
      </p>
    </div>
  );
}

function bucketByWeek(dailyBuckets) {
  const weekMap = {};
  for (const { date, count } of dailyBuckets) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = (day === 0 ? -6 : 1) - day;
    const monday = new Date(d);
    monday.setDate(d.getDate() + diff);
    const key = monday.toISOString().slice(0, 10);
    weekMap[key] = (weekMap[key] || 0) + count;
  }
  return Object.entries(weekMap)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export default function CommitChart({ buckets = [] }) {
  const { dark } = useTheme();

  const rangeDays = buckets.length;
  const weekly = rangeDays > 90;
  const data = weekly ? bucketByWeek(buckets) : buckets;

  const tickInterval = Math.max(Math.floor(data.length / 7) - 1, 0);
  const maxCount = Math.max(...data.map((d) => d.count), 1);

  const gridColor = dark ? 'rgba(48,54,61,0.6)' : 'rgba(229,231,235,0.8)';
  const axisColor = dark ? '#6e7681' : '#9ca3af';

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 4, right: 4, left: -28, bottom: 0 }} barGap={2}>
          <defs>
            <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2da44e" stopOpacity={0.95} />
              <stop offset="100%" stopColor="#2da44e" stopOpacity={0.65} />
            </linearGradient>
            <linearGradient id="barGradientDim" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2da44e" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#2da44e" stopOpacity={0.15} />
            </linearGradient>
          </defs>
          <CartesianGrid
            vertical={false}
            stroke={gridColor}
            strokeDasharray="0"
          />
          <XAxis
            dataKey="date"
            tickFormatter={formatDate}
            tick={{ fontSize: 11, fill: axisColor, fontFamily: 'Inter, sans-serif' }}
            axisLine={false}
            tickLine={false}
            interval={tickInterval}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fontSize: 11, fill: axisColor, fontFamily: 'Inter, sans-serif' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            content={<CustomTooltip weekly={weekly} />}
            cursor={{ fill: dark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)', radius: 4 }}
          />
          <Bar
            dataKey="count"
            fill="url(#barGradient)"
            radius={[4, 4, 0, 0]}
            maxBarSize={32}
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.count === 0 ? 'url(#barGradientDim)' : 'url(#barGradient)'}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
