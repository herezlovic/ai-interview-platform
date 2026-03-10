import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDropzone } from 'react-dropzone'
import { interviewAPI } from '../utils/api'
import { Upload, Video, Sparkles, Loader2, AlertCircle } from 'lucide-react'
export default function NewInterview() {
  const navigate=useNavigate();const[file,setFile]=useState(null);const[form,setForm]=useState({candidate_name:'',position:'',interviewer:'',job_description:''});const[loading,setLoading]=useState(false);const[error,setError]=useState(null);const[mode,setMode]=useState('upload')
  const onDrop=useCallback(a=>{if(a[0])setFile(a[0])},[])
  const{getRootProps,getInputProps,isDragActive}=useDropzone({onDrop,accept:{'video/*':['.mp4','.webm','.mov','.avi']},maxFiles:1,disabled:mode==='demo'})
  const handleSubmit=async()=>{setLoading(true);setError(null);try{const fd=new FormData();if(form.candidate_name)fd.append('candidate_name',form.candidate_name);if(form.position)fd.append('position',form.position);if(form.interviewer)fd.append('interviewer',form.interviewer);if(form.job_description)fd.append('job_description',form.job_description);if(file&&mode==='upload')fd.append('video',file);const{data:session}=await interviewAPI.create(fd);if(mode==='demo')await interviewAPI.runDemo(session.id,form.position);navigate(`/interviews/${session.id}`)}catch(err){setError(err.response?.data?.detail||err.message||'Failed to start analysis')}finally{setLoading(false)}}
  return (
    <div className="p-8 max-w-3xl mx-auto animate-fade-in">
      <div className="mb-8"><h1 className="font-display text-3xl font-bold tracking-tight" style={{color:'var(--text-primary)'}}>New Interview Analysis</h1><p className="mt-1 text-sm" style={{color:'var(--text-secondary)'}}>Upload a recorded interview or run a demo</p></div>
      <div className="flex gap-2 mb-6 p-1 rounded-xl" style={{background:'var(--bg-card)'}}>
        {[{key:'upload',label:'Upload Video',icon:Upload},{key:'demo',label:'Demo Mode',icon:Sparkles}].map(({key,label,icon:Icon})=>(
          <button key={key} onClick={()=>setMode(key)} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all" style={{background:mode===key?'rgba(124,106,247,0.2)':'transparent',color:mode===key?'#a78bfa':'var(--text-secondary)',border:mode===key?'1px solid rgba(124,106,247,0.3)':'1px solid transparent'}}><Icon size={15}/>{label}</button>
        ))}
      </div>
      {mode==='upload'&&<div {...getRootProps()} className="mb-6 rounded-2xl border-2 border-dashed p-12 text-center cursor-pointer transition-all" style={{borderColor:isDragActive?'#7c6af7':file?'#4ade80':'rgba(255,255,255,0.1)',background:file?'rgba(74,222,128,0.03)':'var(--bg-card)'}}><input {...getInputProps()}/>{file?<><Video size={40} className="mx-auto mb-3" style={{color:'#4ade80'}}/><p className="font-medium text-sm" style={{color:'#4ade80'}}>{file.name}</p><p className="text-xs mt-1" style={{color:'var(--text-secondary)'}}>{(file.size/1024/1024).toFixed(1)} MB</p></>:<><Upload size={40} className="mx-auto mb-3 opacity-40" style={{color:'var(--text-secondary)'}}/><p className="font-medium text-sm" style={{color:'var(--text-primary)'}}>{isDragActive?'Drop video here':'Drag & drop interview video'}</p><p className="text-xs mt-1" style={{color:'var(--text-secondary)'}}>MP4, WebM, MOV · Up to 500MB</p></>}</div>}
      {mode==='demo'&&<div className="mb-6 rounded-2xl p-5 border" style={{background:'rgba(124,106,247,0.05)',borderColor:'rgba(124,106,247,0.2)'}}><div className="flex items-start gap-3"><Sparkles size={18} style={{color:'#a78bfa'}} className="mt-0.5"/><div><p className="text-sm font-medium" style={{color:'#a78bfa'}}>Demo Mode Active</p><p className="text-xs mt-1" style={{color:'var(--text-secondary)'}}>No video required. Generates a complete analysis using realistic synthetic data.</p></div></div></div>}
      <div className="space-y-4 mb-6">
        <div className="grid grid-cols-2 gap-4">
          {[{key:'candidate_name',label:'Candidate Name',placeholder:'Jane Smith'},{key:'position',label:'Position Applied',placeholder:'Senior Engineer'},{key:'interviewer',label:'Interviewer',placeholder:'Your name'}].map(({key,label,placeholder})=>(
            <div key={key} className={key==='interviewer'?'col-span-2':''}><label className="block text-xs font-medium mb-1.5" style={{color:'var(--text-secondary)'}}>{label}</label><input value={form[key]} onChange={e=>setForm(f=>({...f,[key]:e.target.value}))} placeholder={placeholder} className="w-full px-3 py-2.5 rounded-xl text-sm outline-none" style={{background:'var(--bg-card)',border:'1px solid var(--border)',color:'var(--text-primary)'}}/></div>
          ))}
        </div>
        <div><label className="block text-xs font-medium mb-1.5" style={{color:'var(--text-secondary)'}}>Job Description (optional)</label><textarea value={form.job_description} onChange={e=>setForm(f=>({...f,job_description:e.target.value}))} placeholder="Paste the job description here..." rows={4} className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-none" style={{background:'var(--bg-card)',border:'1px solid var(--border)',color:'var(--text-primary)'}}/></div>
      </div>
      {error&&<div className="flex items-center gap-2 mb-4 px-4 py-3 rounded-xl text-sm" style={{background:'rgba(248,113,113,0.1)',color:'#f87171'}}><AlertCircle size={16}/>{error}</div>}
      <button onClick={handleSubmit} disabled={loading||!(mode==='demo'||file)} className="w-full py-3.5 rounded-xl text-sm font-medium text-white flex items-center justify-center gap-2 disabled:opacity-50" style={{background:'linear-gradient(135deg,#7c6af7,#5b4fd1)'}}>
        {loading?<><Loader2 size={16} className="animate-spin"/>Starting...</>:<><Sparkles size={16}/>{mode==='demo'?'Run Demo Analysis':'Analyze Interview'}</>}
      </button>
    </div>
  )
}
