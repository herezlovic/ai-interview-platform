import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Clock3,
  Loader2,
  Plus,
  Sparkles,
  Trash2,
  TrendingUp,
  Upload,
} from 'lucide-react'
import { interviewAPI } from '../utils/api'
import { getOnboarding } from '../utils/onboarding'

const STATUS = {
  pending: { icon: Clock3, color: '#4a6d7c', label: 'Pending' },
  processing: { icon: Loader2, color: '#0f766e', label: 'Processing', spin: true },
  completed: { icon: CheckCircle2, color: '#059669', label: 'Completed' },
  failed: { icon: AlertCircle, color: '#dc2626', label: 'Failed' },
}

const REC = {
  'Strong Yes': 'bg-emerald-50 text-emerald-700',
  Yes: 'bg-teal-50 text-teal-700',
  Maybe: 'bg-amber-50 text-amber-700',
  No: 'bg-rose-50 text-rose-700',
  'Strong No': 'bg-red-50 text-red-700',
}

export default function Dashboard() {
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const onboarding = getOnboarding()

  const fetchSessions = async () => {
    try {
      const { data } = await interviewAPI.list()
      setSessions(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSessions()
    const iv = setInterval(fetchSessions, 4000)
    return () => clearInterval(iv)
  }, [])

  const completed = sessions.filter((s) => s.status === 'completed')
  const avg =
    completed.length > 0
      ? completed.reduce((a, s) => a + (s.report?.overall_score || 0), 0) / completed.length
      : null

  const remove = async (e, id) => {
    e.stopPropagation()
    await interviewAPI.delete(id)
    fetchSessions()
  }

  const isEmpty = !loading && sessions.length === 0

  return (
    <div className="space-y-8 animate-rise">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-teal-600">Workspace</p>
          <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight text-ink-900">Sessions</h1>
          <p className="mt-2 max-w-xl text-sm text-ink-500">
            {isEmpty
              ? 'Your workspace is ready. Start with Demo Mode to see Clarion’s full evaluation report.'
              : 'Run a demo in seconds, or upload a recorded interview for the full multimodal pipeline.'}
          </p>
        </div>
        {!isEmpty && (
          <button onClick={() => navigate('/app/new')} className="btn-primary">
            <Plus size={16} /> New analysis
          </button>
        )}
      </div>

      {/* Stats only when there is history — keep empty state uncluttered for new customers */}
      {!isEmpty && (
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { label: 'Total sessions', value: sessions.length, icon: Sparkles },
            { label: 'Completed', value: completed.length, icon: CheckCircle2 },
            { label: 'Average score', value: avg ? avg.toFixed(1) : '—', icon: TrendingUp },
          ].map(({ label, value, icon: Icon }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="surface rounded-3xl p-5"
            >
              <div className="mb-3 flex items-center justify-between text-ink-500">
                <span className="text-xs uppercase tracking-[0.16em]">{label}</span>
                <Icon size={16} className="text-teal-600" />
              </div>
              <div className="font-display text-3xl font-semibold text-ink-900">{value}</div>
            </motion.div>
          ))}
        </div>
      )}

      <section className="space-y-3">
        {!isEmpty && <h2 className="font-display text-2xl font-semibold text-ink-900">Recent</h2>}
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="animate-spin text-teal-600" size={28} />
          </div>
        ) : isEmpty ? (
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            className="overflow-hidden rounded-[2rem] border border-[var(--line)] bg-gradient-to-br from-white via-white to-teal-50/60 shadow-soft"
          >
            <div className="grid md:grid-cols-[1.15fr_0.85fr]">
              <div className="px-8 py-12 sm:px-10">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-teal-600">
                  {onboarding.completedDemo ? 'Ready for more' : 'First analysis'}
                </p>
                <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-ink-900 sm:text-4xl">
                  See Clarion in action
                </h2>
                <p className="mt-3 max-w-md text-sm leading-relaxed text-ink-500">
                  Demo Mode generates a complete report — transcript, emotion timeline, scores, and hiring recommendation — without uploading a video.
                </p>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <button onClick={() => navigate('/app/new')} className="btn-primary">
                    <Sparkles size={16} /> Run live demo <ArrowRight size={16} />
                  </button>
                  <button
                    onClick={() => navigate('/app/new?mode=upload')}
                    className="btn-ghost"
                  >
                    <Upload size={16} /> Upload instead
                  </button>
                </div>
              </div>
              <div className="relative hidden border-l border-[var(--line)] bg-[#0c2f33] p-8 text-white md:block">
                <div className="absolute inset-0 opacity-50"
                  style={{
                    background:
                      'radial-gradient(circle at 30% 20%, rgba(45,212,191,0.35), transparent 55%), radial-gradient(circle at 80% 80%, rgba(212,165,116,0.25), transparent 50%)',
                  }}
                />
                <div className="relative space-y-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-200/80">You’ll get</p>
                  {['Speech + pacing metrics', 'Emotion stability timeline', 'Hiring recommendation'].map((item, i) => (
                    <motion.div
                      key={item}
                      initial={{ opacity: 0, x: 8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 + i * 0.1 }}
                      className="flex items-center gap-3 text-sm text-white/85"
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-teal-300" />
                      {item}
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          sessions.map((s, i) => {
            const cfg = STATUS[s.status] || STATUS.pending
            const Icon = cfg.icon
            const rec = s.report?.llm_analysis?.hiring_recommendation
            return (
              <motion.button
                key={s.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                onClick={() =>
                  navigate(s.status === 'completed' ? `/app/reports/${s.id}` : `/app/interviews/${s.id}`)
                }
                className="surface flex w-full items-center gap-4 rounded-3xl p-4 text-left transition hover:-translate-y-0.5 hover:shadow-lift"
              >
                <div
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl"
                  style={{ background: `${cfg.color}15`, color: cfg.color }}
                >
                  <Icon size={18} className={cfg.spin ? 'animate-spin' : ''} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="truncate font-medium text-ink-900">
                      {s.candidate_name || 'Anonymous candidate'}
                    </span>
                    {s.position && (
                      <span className="rounded-full bg-teal-600/10 px-2.5 py-0.5 text-xs text-teal-700">
                        {s.position}
                      </span>
                    )}
                  </div>
                  <div className="mt-1 text-xs text-ink-500">
                    {new Date(s.created_at).toLocaleString()} · {cfg.label}
                  </div>
                </div>
                {s.report && (
                  <div className="text-right">
                    <div className="font-display text-2xl font-semibold text-ink-900">
                      {s.report.overall_score.toFixed(1)}
                    </div>
                    <div className="text-[11px] text-ink-500">/ 10</div>
                  </div>
                )}
                {rec && (
                  <span className={`hidden rounded-full px-3 py-1 text-xs font-medium sm:inline ${REC[rec] || REC.Maybe}`}>
                    {rec}
                  </span>
                )}
                <button
                  onClick={(e) => remove(e, s.id)}
                  className="rounded-xl p-2 text-ink-500 transition hover:bg-rose-50 hover:text-rose-600"
                  aria-label="Delete session"
                >
                  <Trash2 size={16} />
                </button>
              </motion.button>
            )
          })
        )}
      </section>
    </div>
  )
}
