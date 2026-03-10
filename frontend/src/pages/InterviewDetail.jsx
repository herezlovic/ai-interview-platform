import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { interviewAPI, pollStatus } from '../utils/api'
import { Brain, CheckCircle, AlertCircle, Loader2, Mic, Eye, Zap, FileText } from 'lucide-react'
const STAGES=[{key:'transcription',label:'Speech Transcription',sublabel:'Whisper AI',icon:Mic},{key:'emotion_analysis',label:'Emotion Detection',sublabel:'DeepFace',icon:Eye},{key:'communication_analysis',label:'Communication Analysis',sublabel:'NLP Pipeline',icon:Zap},{key:'llm_analysis',label:'Behavioral Analysis',sublabel:'LLM Reasoning',icon:Brain},{key:'report_generation',label:'Report Generation',sublabel:'Synthesis',icon:FileText}]
export default function InterviewDetail() {
  const{id}=useParams();const navigate=useNavigate();const[session,setSession]=useState(null);const[status,setStatus]=useState(null);const[currentStage,setCurrentStage]=useState(0);const[progress,setProgress]=useState(0)
  useEffect(()=>{
    interviewAPI.get(id).then(({data})=>setSession(data)).catch(console.error)
    const stop=pollStatus(id,update=>{setStatus(update);if(update.stage&&update.stage!=='complete'&&update.stage!=='error'){const i=STAGES.findIndex(s=>s.key===update.stage);if(i>=0)setCurrentStage(i)}setProgress(update.progress||0);if(update.status==='completed')navigate(`/reports/${id}`,{replace:true})})
    return stop
  },[id])
  return (
    <div className="p-8 max-w-2xl mx-auto animate-fade-in">
      <div className="text-center mb-10"><div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 glow" style={{background:'linear-gradient(135deg,#7c6af7,#60a5fa)'}}><Brain size={28} className="text-white"/></div><h1 className="font-display text-2xl font-bold" style={{color:'var(--text-primary)'}}>Analyzing Interview</h1>{session&&<p className="mt-2 text-sm" style={{color:'var(--text-secondary)'}}>{session.candidate_name?`Processing ${session.candidate_name}'s interview`:'Processing interview recording'}{session.position&&` for ${session.position}`}</p>}</div>
      <div className="glass rounded-2xl p-6 mb-6"><div className="flex items-center justify-between mb-3"><span className="text-sm font-medium" style={{color:'var(--text-primary)'}}>{status?.message||'Initializing...'}</span><span className="font-mono text-sm" style={{color:'#7c6af7'}}>{Math.round(progress)}%</span></div><div className="h-2 rounded-full overflow-hidden" style={{background:'rgba(255,255,255,0.06)'}}><div className="h-full rounded-full transition-all duration-500" style={{width:`${progress}%`,background:'linear-gradient(90deg,#7c6af7,#60a5fa)',boxShadow:'0 0 12px rgba(124,106,247,0.5)'}}/></div></div>
      <div className="space-y-3">{STAGES.map((stage,idx)=>{const done=idx<currentStage||progress===100;const active=idx===currentStage&&progress>0&&progress<100;const Icon=stage.icon;return(
        <div key={stage.key} className="glass rounded-xl p-4 flex items-center gap-4 transition-all" style={{opacity:idx>currentStage?0.4:1}}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{background:done?'rgba(74,222,128,0.1)':active?'rgba(124,106,247,0.15)':'rgba(255,255,255,0.03)'}}>
            {done?<CheckCircle size={18} style={{color:'#4ade80'}}/>:active?<Loader2 size={18} style={{color:'#7c6af7'}} className="animate-spin"/>:<Icon size={18} style={{color:'var(--text-secondary)'}}/>}
          </div>
          <div className="flex-1"><div className="text-sm font-medium" style={{color:'var(--text-primary)'}}>{stage.label}</div><div className="text-xs" style={{color:'var(--text-secondary)'}}>{stage.sublabel}</div></div>
          <span className="text-xs font-medium px-2.5 py-1 rounded-lg" style={{background:done?'rgba(74,222,128,0.1)':active?'rgba(124,106,247,0.1)':'rgba(255,255,255,0.03)',color:done?'#4ade80':active?'#a78bfa':'var(--text-secondary)'}}>{done?'Done':active?'Running':'Queued'}</span>
        </div>
      )})}</div>
      {status?.status==='failed'&&<div className="mt-6 glass rounded-xl p-4 flex items-center gap-3"><AlertCircle style={{color:'#f87171'}} size={18}/><div><p className="text-sm font-medium" style={{color:'#f87171'}}>Analysis failed</p><p className="text-xs" style={{color:'var(--text-secondary)'}}>{status.error}</p></div></div>}
    </div>
  )
}
