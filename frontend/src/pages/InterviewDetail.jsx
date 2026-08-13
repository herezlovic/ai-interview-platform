import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { AlertCircle, Brain, CheckCircle2, Eye, FileText, Loader2, Mic, Zap } from 'lucide-react'
import { interviewAPI, pollStatus } from '../utils/api'

const STAGES = [
  { key: 'transcription', label: 'Speech transcription', sublabel: 'Whisper', icon: Mic },
  { key: 'emotion_analysis', label: 'Emotion detection', sublabel: 'DeepFace', icon: Eye },
  { key: 'communication_analysis', label: 'Communication scoring', sublabel: 'NLP metrics', icon: Zap },
  { key: 'llm_analysis', label: 'Behavioral analysis', sublabel: 'LLM reasoning', icon: Brain },
  { key: 'report_generation', label: 'Report synthesis', sublabel: 'Final package', icon: FileText },
]

export default function InterviewDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [session, setSession] = useState(null)
  const [status, setStatus] = useState(null)
  const [currentStage, setCurrentStage] = useState(0)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    interviewAPI.get(id).then(({ data }) => setSession(data)).catch(console.error)
    const stop = pollStatus(id, (update) => {
      setStatus(update)
      if (update.stage && update.stage !== 'complete' && update.stage !== 'error') {
        const i = STAGES.findIndex((s) => s.key === update.stage)
        if (i >= 0) setCurrentStage(i)
      }
      setProgress(update.progress || 0)
      if (update.status === 'completed') navigate(`/app/reports/${id}`, { replace: true })
    })
    return stop
  }, [id, navigate])

  return (
    <div className="mx-auto max-w-2xl animate-rise">
      <div className="mb-10 text-center">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-teal-600 to-teal-400 text-white shadow-lift"
        >
          <Brain size={28} />
        </motion.div>
        <h1 className="font-display text-3xl font-semibold text-ink-900">Analyzing interview</h1>
        {session && (
          <p className="mt-2 text-sm text-ink-500">
            {session.candidate_name
              ? `Processing ${session.candidate_name}'s interview`
              : 'Processing interview recording'}
            {session.position ? ` for ${session.position}` : ''}
          </p>
        )}
      </div>

      <div className="surface mb-6 rounded-3xl p-5">
        <div className="mb-3 flex items-center justify-between gap-3">
          <span className="text-sm font-medium text-ink-900">{status?.message || 'Initializing…'}</span>
          <span className="font-mono text-sm text-teal-600">{Math.round(progress)}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-ink-900/5">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-teal-600 to-teal-400"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.45 }}
          />
        </div>
      </div>

      <div className="space-y-3">
        {STAGES.map((stage, idx) => {
          const done = idx < currentStage || progress === 100
          const active = idx === currentStage && progress > 0 && progress < 100
          const Icon = stage.icon
          return (
            <div
              key={stage.key}
              className="surface flex items-center gap-4 rounded-2xl p-4 transition"
              style={{ opacity: idx > currentStage ? 0.45 : 1 }}
            >
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                  done
                    ? 'bg-emerald-50 text-emerald-600'
                    : active
                      ? 'bg-teal-50 text-teal-600'
                      : 'bg-ink-900/5 text-ink-500'
                }`}
              >
                {done ? (
                  <CheckCircle2 size={18} />
                ) : active ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Icon size={18} />
                )}
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-ink-900">{stage.label}</div>
                <div className="text-xs text-ink-500">{stage.sublabel}</div>
              </div>
              <span
                className={`rounded-lg px-2.5 py-1 text-xs font-medium ${
                  done
                    ? 'bg-emerald-50 text-emerald-700'
                    : active
                      ? 'bg-teal-50 text-teal-700'
                      : 'bg-ink-900/5 text-ink-500'
                }`}
              >
                {done ? 'Done' : active ? 'Running' : 'Queued'}
              </span>
            </div>
          )
        })}
      </div>

      {status?.status === 'failed' && (
        <div className="surface mt-6 flex items-center gap-3 rounded-2xl p-4">
          <AlertCircle className="text-rose-600" size={18} />
          <div>
            <p className="text-sm font-medium text-rose-700">Analysis failed</p>
            <p className="text-xs text-ink-500">{status.error}</p>
          </div>
        </div>
      )}
    </div>
  )
}
