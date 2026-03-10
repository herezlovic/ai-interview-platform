import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
const C = {happy:'#4ade80',neutral:'#94a3b8',surprise:'#60a5fa',fear:'#f87171',angry:'#f97316',sad:'#a78bfa',disgust:'#fbbf24'}
const T = ({active,payload,label})=>active&&payload?.length?(<div className="glass rounded-lg p-3 text-xs space-y-1"><p style={{color:'var(--text-secondary)'}}>{label}s</p>{payload.filter(p=>p.value>0.03).map(p=>(<div key={p.name} className="flex items-center gap-2"><div className="w-2 h-2 rounded-full" style={{background:p.color}}/><span style={{color:'var(--text-primary)'}}>{p.name}: {(p.value*100).toFixed(0)}%</span></div>))}</div>):null
export default function EmotionTimeline({timeline}) {
  if(!timeline?.length) return null
  const data = timeline.map(f=>({time:Math.round(f.timestamp),...f.emotions}))
  return (
    <div className="w-full h-48">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{top:5,right:10,left:-20,bottom:0}}>
          <defs>{Object.entries(C).map(([e,c])=><linearGradient key={e} id={`g-${e}`} x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={c} stopOpacity={0.4}/><stop offset="95%" stopColor={c} stopOpacity={0.05}/></linearGradient>)}</defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)"/>
          <XAxis dataKey="time" tick={{fontSize:10,fill:'#9d97b5'}} tickFormatter={v=>`${v}s`}/>
          <YAxis tick={{fontSize:10,fill:'#9d97b5'}} tickFormatter={v=>`${(v*100).toFixed(0)}%`}/>
          <Tooltip content={<T/>}/>
          {Object.entries(C).map(([e,c])=><Area key={e} type="monotone" dataKey={e} stroke={c} fill={`url(#g-${e})`} strokeWidth={1.5} dot={false} stackId="e"/>)}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
