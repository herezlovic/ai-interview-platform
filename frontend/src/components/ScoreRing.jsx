export default function ScoreRing({ score, size = 120, label = 'Overall', stroke = 10 }) {
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const pct = Math.max(0, Math.min(10, score)) / 10
  const offset = circumference * (1 - pct)
  const color = score >= 8 ? '#059669' : score >= 6 ? '#0f766e' : score >= 4 ? '#d97706' : '#dc2626'

  return (
    <div className="relative inline-flex flex-col items-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(12,27,36,0.08)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.8s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="font-display text-3xl font-semibold text-ink-900">{score.toFixed(1)}</div>
        <div className="text-[11px] uppercase tracking-[0.14em] text-ink-500">{label}</div>
      </div>
    </div>
  )
}
