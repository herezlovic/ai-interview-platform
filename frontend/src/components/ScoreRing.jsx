export default function ScoreRing({ score, maxScore=10, size=80, label, sublabel }) {
  const r = (size-10)/2, circ = 2*Math.PI*r, offset = circ-(score/maxScore)*circ
  const color = score>=8?'#4ade80':score>=6?'#7c6af7':score>=4?'#fbbf24':'#f87171'
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{width:size,height:size}}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6"/>
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="6" strokeLinecap="round"
            strokeDasharray={circ} strokeDashoffset={offset} transform={`rotate(-90 ${size/2} ${size/2})`}
            style={{transition:'stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)',filter:`drop-shadow(0 0 6px ${color}60)`}}/>
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-display font-bold" style={{fontSize:size*0.22,color}}>{score.toFixed(1)}</span>
        </div>
      </div>
      {label&&<div className="text-center"><div className="text-xs font-medium" style={{color:'var(--text-primary)'}}>{label}</div>{sublabel&&<div className="text-xs" style={{color:'var(--text-secondary)'}}>{sublabel}</div>}</div>}
    </div>
  )
}
