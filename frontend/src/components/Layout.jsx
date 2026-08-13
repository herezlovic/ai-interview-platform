import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Plus, Waves } from 'lucide-react'
import { useEffect, useState } from 'react'
import { getRuntimeMode } from '../utils/api'

export default function Layout() {
  const navigate = useNavigate()
  const [mode, setMode] = useState('…')

  useEffect(() => {
    getRuntimeMode().then((m) => setMode(m === 'remote' ? 'API connected' : 'Local demo'))
  }, [])

  return (
    <div className="relative min-h-screen">
      <header className="sticky top-0 z-30 border-b border-[var(--line)] bg-white/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5">
          <button onClick={() => navigate('/')} className="group flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-600 to-teal-400 text-white shadow-lift">
              <Waves size={18} />
            </div>
            <div className="text-left">
              <div className="font-display text-lg font-semibold tracking-tight text-ink-900">Clarion</div>
              <div className="text-[11px] uppercase tracking-[0.18em] text-ink-500">Interview intelligence</div>
            </div>
          </button>

          <nav className="hidden items-center gap-1 md:flex">
            <NavLink
              to="/app"
              end
              className={({ isActive }) =>
                `rounded-xl px-3.5 py-2 text-sm font-medium transition ${
                  isActive ? 'bg-teal-600/10 text-teal-600' : 'text-ink-500 hover:text-ink-900'
                }`
              }
            >
              <span className="inline-flex items-center gap-2">
                <LayoutDashboard size={15} /> Sessions
              </span>
            </NavLink>
            <NavLink
              to="/app/new"
              className={({ isActive }) =>
                `rounded-xl px-3.5 py-2 text-sm font-medium transition ${
                  isActive ? 'bg-teal-600/10 text-teal-600' : 'text-ink-500 hover:text-ink-900'
                }`
              }
            >
              <span className="inline-flex items-center gap-2">
                <Plus size={15} /> New analysis
              </span>
            </NavLink>
          </nav>

          <div className="flex items-center gap-3">
            <span className="hidden rounded-full border border-[var(--line)] bg-white/80 px-3 py-1 text-xs text-ink-500 sm:inline">
              {mode}
            </span>
            <button onClick={() => navigate('/app/new')} className="btn-primary !py-2.5 !px-4">
              <Plus size={15} /> Analyze
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-5 py-8">
        <Outlet />
      </main>
    </div>
  )
}
