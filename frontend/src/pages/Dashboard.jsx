import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { interviewAPI } from '../utils/api'
import { Brain, Clock, CheckCircle, AlertCircle, Loader2, Plus, TrendingUp, Users } from 'lucide-react'
const SC = {pending:{icon:Clock,color:'#94a3b8',label:'Pending'},processing:{icon:Loader2,color:'#7c6af7',label:'Processing',spin:true},completed:{icon:CheckCircle,color:'#4ade80',label:'Completed'},failed:{icon:AlertCircle,color:'#f87171',label:'Failed'}}
const RB = {'Strong Yes':{color:'#4ade80',bg:'rgba(74,222,128,0.1)'},'Yes':{color:'#86efac',bg:'rgba(134,239,172,0.1)'},'Maybe':{color:'#fbbf24',bg:'rgba(251,191,36,0.1)'},'No':{color:'#f87171',bg:'rgba(248,113,113,0.1)'},'Strong No':{color:'#ef4444',bg:'rgba(239,68,68,0.1)'}}
export default function Dashboard() {
  const [sessions,setSessions]=useState([]);const [loading,setLoading]=useState(true);const navigate=useNavigate()
  useEffect(()=>{fetchSessions();const iv=setInterval(fetchSessions,5000);return()=>clearInterval(iv)},[])
  const fetchSessions=async()=>{try{const{data}=await interviewAPI.list();setSessions(data)}catch(e){console.error(e)}finally{setLoading(false)}}
  const stats={total:sessions.length,completed:sessions.filter(s=>s.status==='completed').length,processing:sessions.filter(s=>s.status==='processing').length,avgScore:sessions.filter(s=>s.report).reduce((a,s,_,arr)=>a+s.report.overall_score/arr.length,0)}
  return (
    <div className="p-8 space-y-8 animate-fade-in">
      <div className="flex items-end justify-between">
        <div><h1 className="font-display text-3xl font-bold tracking-tight" style={{color:'var(--text-primary)'}}>Interview Intelligence</h1><p className="mt-1 text-sm" style={{color:'var(--text-secondary)'}}>Multimodal AI-powered candidate evaluation</p></div>
        <button onClick={()=>navigate('/new')} className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-white" style={{background:'linear-gradient(135deg,#7c6af7,#5b4fd1)'}}><Plus size={16}/>Analyze Interview</button>
      </div>
      <div className="grid grid-cols-4 gap-4">
        {[{label:'Total',value:stats.total,icon:Users,color:'#7c6af7'},{label:'Completed',value:stats.completed,icon:CheckCircle,color:'#4ade80'},{label:'Processing',value:stats.processing,icon:Loader2,color:'#fbbf24'},{label:'Avg Score',value:stats.avgScore?stats.avgScore.toFixed(1):'—',icon:TrendingUp,color:'#60a5fa'}].map(({label,value,icon:Icon,color})=>(
          <div key={label} className="glass rounded-2xl p-5"><div className="flex items-center justify-between mb-3"><span className="text-xs uppercase tracking-wider" style={{color:'var(--text-secondary)'}}>{label}</span><Icon size={16} style={{color}}/></div><div className="font-display text-3xl font-bold" style={{color:'var(--text-primary)'}}>{value}</div></div>
        ))}
      </div>
      <div>
        <h2 className="font-display text-lg font-semibold mb-4" style={{color:'var(--text-primary)'}}>Recent Sessions</h2>
        {loading?<div className="flex items-center justify-center py-20"><Loader2 className="animate-spin" size={32} style={{color:'#7c6af7'}}/></div>:sessions.length===0?(
          <div className="glass rounded-2xl p-16 text-center"><Brain size={48} className="mx-auto mb-4 opacity-30" style={{color:'var(--text-secondary)'}}/><p className="font-display text-lg font-medium" style={{color:'var(--text-primary)'}}>No interviews yet</p><p className="text-sm mt-1 mb-6" style={{color:'var(--text-secondary)'}}>Upload a video or run a demo to get started</p><button onClick={()=>navigate('/new')} className="px-6 py-2.5 rounded-xl text-sm font-medium text-white" style={{background:'linear-gradient(135deg,#7c6af7,#5b4fd1)'}}>Start First Analysis</button></div>
        ):(
          <div className="space-y-3">{sessions.map(s=>{const cfg=SC[s.status]||SC.pending;const SI=cfg.icon;const rec=s.report?.llm_analysis?.hiring_recommendation;const badge=rec?RB[rec]:null;return(
            <div key={s.id} onClick={()=>s.status==='completed'?navigate(`/reports/${s.id}`):navigate(`/interviews/${s.id}`)} className="glass rounded-2xl p-5 flex items-center gap-5 cursor-pointer transition-all hover:border-purple-500/30">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{background:`${cfg.color}15`}}><SI size={18} style={{color:cfg.color}} className={cfg.spin?'animate-spin':''}/></div>
              <div className="flex-1 min-w-0"><div className="flex items-center gap-2"><span className="font-medium text-sm" style={{color:'var(--text-primary)'}}>{s.candidate_name||'Anonymous Candidate'}</span>{s.position&&<span className="text-xs px-2 py-0.5 rounded-full" style={{background:'rgba(124,106,247,0.1)',color:'#a78bfa'}}>{s.position}</span>}</div><div className="text-xs mt-0.5" style={{color:'var(--text-secondary)'}}>{new Date(s.created_at).toLocaleDateString('en-US',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})}</div></div>
              {s.report&&<div className="text-right"><div className="font-display text-2xl font-bold" style={{color:'#7c6af7'}}>{s.report.overall_score.toFixed(1)}</div><div className="text-xs" style={{color:'var(--text-secondary)'}}>/ 10</div></div>}
              {badge&&<div className="px-3 py-1.5 rounded-lg text-xs font-medium" style={{background:badge.bg,color:badge.color}}>{rec}</div>}
              {!s.report&&<span className="text-xs px-2.5 py-1 rounded-lg" style={{background:`${cfg.color}15`,color:cfg.color}}>{cfg.label}</span>}
            </div>
          )})}</div>
        )}
      </div>
    </div>
  )
}
