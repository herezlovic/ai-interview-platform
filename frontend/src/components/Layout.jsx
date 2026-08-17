import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { LayoutDashboard, Menu, Plus, Waves, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { getRuntimeMode } from '../utils/api'
import { getOnboarding } from '../utils/onboarding'
import WelcomePanel from './WelcomePanel'

export default function Layout() {
  const navigate = useNavigate()
  const location = useLocation()
  const [mode, setMode] = useState('…')
  const [menuOpen, setMenuOpen] = useState(false)
  const [welcomeOpen, setWelcomeOpen] = useState(false)

  useEffect(() => {
    getRuntimeMode().then((m) => setMode(m === 'remote' ? 'API connected' : 'Local demo'))
  }, [])

  useEffect(() => {
    const onboarding = getOnboarding()
    if (!onboarding.welcomeDismissed && !onboarding.completedDemo) {
      setWelcomeOpen(true)
    }
  }, [])

  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname])

  const links = [
    { to: '/app', end: true, icon: LayoutDashboard, label: 'Sessions' },
    { to: '/app/new', end: false, icon: Plus, label: 'New analysis' },
  ]

  return (
    <div className="relative min-h-screen pb-20 md:pb-0">
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
            {links.map(({ to, end, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `rounded-xl px-3.5 py-2 text-sm font-medium transition ${
                    isActive ? 'bg-teal-600/10 text-teal-600' : 'text-ink-500 hover:text-ink-900'
                  }`
                }
              >
                <span className="inline-flex items-center gap-2">
                  <Icon size={15} /> {label}
                </span>
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <span className="hidden rounded-full border border-[var(--line)] bg-white/80 px-3 py-1 text-xs text-ink-500 sm:inline">
              {mode}
            </span>
            <button onClick={() => navigate('/app/new')} className="btn-primary !hidden !py-2.5 !px-4 sm:!inline-flex">
              <Plus size={15} /> Analyze
            </button>
            <button
              className="rounded-xl border border-[var(--line)] bg-white/80 p-2.5 text-ink-700 md:hidden"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            >
              {menuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="border-t border-[var(--line)] bg-white/95 px-5 py-3 md:hidden">
            <div className="mb-2 text-xs text-ink-500">{mode}</div>
            {links.map(({ to, end, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `mb-1 flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium ${
                    isActive ? 'bg-teal-600/10 text-teal-600' : 'text-ink-700'
                  }`
                }
              >
                <Icon size={16} /> {label}
              </NavLink>
            ))}
          </div>
        )}
      </header>

      <main className="mx-auto max-w-6xl px-5 py-8">
        <Outlet />
      </main>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-[var(--line)] bg-white/90 backdrop-blur-xl md:hidden">
        <div className="mx-auto grid max-w-lg grid-cols-2 gap-1 px-3 py-2">
          {links.map(({ to, end, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 rounded-xl px-2 py-2 text-[11px] font-medium ${
                  isActive ? 'bg-teal-600/10 text-teal-700' : 'text-ink-500'
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </div>
      </nav>

      <WelcomePanel open={welcomeOpen} onDismiss={() => setWelcomeOpen(false)} />
    </div>
  )
}
