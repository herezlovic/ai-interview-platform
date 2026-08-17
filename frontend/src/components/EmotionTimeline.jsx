import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

const COLORS = {
  happy: '#0d9488',
  neutral: '#4a6d7c',
  surprise: '#d4a574',
  fear: '#c2410c',
  sad: '#64748b',
  angry: '#dc2626',
  disgust: '#7c3aed',
}

export default function EmotionTimeline({ timeline = [] }) {
  const data = timeline.map((t) => ({
    t: `${Math.round(t.timestamp)}s`,
    ...t.emotions,
    dominant: t.dominant_emotion,
  }))

  if (!data.length) {
    return <p className="text-sm text-ink-500">No emotion timeline available.</p>
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
          <CartesianGrid stroke="rgba(12,27,36,0.06)" vertical={false} />
          <XAxis dataKey="t" tick={{ fill: '#4a6d7c', fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis domain={[0, 1]} tick={{ fill: '#4a6d7c', fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{
              borderRadius: 12,
              border: '1px solid rgba(12,27,36,0.1)',
              background: 'rgba(255,255,255,0.95)',
              fontSize: 12,
            }}
          />
          {Object.keys(COLORS).map((key) => (
            <Area
              key={key}
              type="monotone"
              dataKey={key}
              stackId="1"
              stroke={COLORS[key]}
              fill={COLORS[key]}
              fillOpacity={0.35}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
