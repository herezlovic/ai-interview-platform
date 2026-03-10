import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { Brain, LayoutDashboard, Plus, Mic } from 'lucide-react'
export default function Layout() {
  const navigate = useNavigate()
  return (
    <div className="flex min-h-screen" style={{background:'var(--bg-primary)'}}>
      <aside className="w-64 flex-shrink-0 flex flex-col border-r" style={{borderColor:'var(--border)',background:'var(--bg-secondary)'}}>
        <div className="p-6 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center glow-sm" style={{background:'linear-gradient(135deg,#7c6af7,#60a5fa)'}}>
              <Brain size={18} className="text-white" />
            </div>
            <div>
              <div className="font-display text-sm font-bold" style={{color:'var(--text-primary)'}}>InterviewIQ</div>
              <div className="text-xs" style={{color:'var(--text-secondary)'}}>AI Platform</div>
            </div>
          </div>
        </div>
        <div className="px-4 py-3">
          <button onClick={() => navigate('/new')} className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white" style={{background:'linear-gradient(135deg,#7c6af7,#5b4fd1)'}}>
            <Plus size={16} /> New Interview
          </button>
        </div>
        <nav className="flex-1 px-3 py-2 space-y-1">
          {[{to:'/',icon:LayoutDashboard,label:'Dashboard'},{to:'/new',icon:Mic,label:'Analyze Interview'}].map(({to,icon:Icon,label})=>(
            <NavLink key={to} to={to} end={to==='/'} className={({isActive})=>`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all`}
              style={({isActive})=>({background:isActive?'rgba(124,106,247,0.15)':'transparent',color:isActive?'var(--text-primary)':'var(--text-secondary)',borderLeft:isActive?'2px solid #7c6af7':'2px solid transparent'})}>
              <Icon size={16}/>{label}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t" style={{borderColor:'var(--border)'}}>
          <div className="flex items-center gap-2 px-2">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"/>
            <span className="text-xs" style={{color:'var(--text-secondary)'}}>All systems operational</span>
          </div>
        </div>
      </aside>
      <main className="flex-1 overflow-auto"><Outlet /></main>
    </div>
  )
}
