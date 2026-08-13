import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  Loader2,
  Plus,
  Sparkles,
  Trash2,
  TrendingUp,
} from 'lucide-react'
import { interviewAPI } from '../utils/api'

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

  return (
    <div className="space-y-8 animate-rise">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-teal-600">Workspace</p>
          <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight text-ink-900">Sessions</h1>
          <p className="mt-2 max-w-xl text-sm text-ink-500">
            Run a demo in seconds, or upload a recorded interview for the full multimodal pipeline.
          </p>
        </div>
        <button onClick={() => navigate('/app/new')} className="btn-primary">
          <Plus size={16} /> New analysis
        </button>
      </div>

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

      <section className="space-y-3">
        <h2 className="font-display text-2xl font-semibold text-ink-900">Recent</h2>
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="animate-spin text-teal-600" size={28} />
          </div>
        ) : sessions.length === 0 ? (
          <div className="surface rounded-[2rem] px-8 py-16 text-center">
            <p className="font-display text-2xl font-semibold text-ink-900">No interviews yet</p>
            <p className="mx-auto mt-2 max-w-md text-sm text-ink-500">
              Start with Demo Mode to generate a full report without uploading a video.
            </p>
            <button onClick={() => navigate('/app/new')} className="btn-primary mt-6">
              Start first analysis
            </button>
          </div>
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
                  <span className={`rounded-full px-3 py-1 text-xs font-medium ${REC[rec] || REC.Maybe}`}>
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
