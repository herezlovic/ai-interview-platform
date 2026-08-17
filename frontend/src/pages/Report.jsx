import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Eye,
  Loader2,
  MessageSquare,
  Mic,
  Sparkles,
  X,
} from 'lucide-react'
import { PolarAngleAxis, PolarGrid, Radar, RadarChart, ResponsiveContainer } from 'recharts'
import ScoreRing from '../components/ScoreRing'
import EmotionTimeline from '../components/EmotionTimeline'
import { interviewAPI } from '../utils/api'
import { getOnboarding, markFirstReportSeen } from '../utils/onboarding'

const REC = {
  'Strong Yes': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Yes: 'bg-teal-50 text-teal-700 border-teal-200',
  Maybe: 'bg-amber-50 text-amber-700 border-amber-200',
  No: 'bg-rose-50 text-rose-700 border-rose-200',
  'Strong No': 'bg-red-50 text-red-700 border-red-200',
}

function Section({ title, icon: Icon, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <section className="surface overflow-hidden rounded-3xl">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-5 py-4 text-left"
      >
        <span className="inline-flex items-center gap-2 font-display text-lg font-semibold text-ink-900">
          <Icon size={16} className="text-teal-600" /> {title}
        </span>
        {open ? <ChevronUp size={16} className="text-ink-500" /> : <ChevronDown size={16} className="text-ink-500" />}
      </button>
      {open && <div className="border-t border-[var(--line)] px-5 py-5">{children}</div>}
    </section>
  )
}

function MetricBar({ label, value, max = 10 }) {
  const pct = (value / max) * 100
  const color = value >= 8 ? '#059669' : value >= 6 ? '#0f766e' : value >= 4 ? '#d97706' : '#dc2626'
  return (
    <div>
      <div className="mb-1.5 flex justify-between text-xs">
        <span className="text-ink-500">{label}</span>
        <span className="font-mono font-medium" style={{ color }}>
          {value.toFixed(1)}
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-ink-900/5">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  )
}

export default function Report() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showTranscript, setShowTranscript] = useState(false)
  const [showGuide, setShowGuide] = useState(false)

  useEffect(() => {
    interviewAPI
      .getReport(id)
      .then(({ data }) => setReport(data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    if (!loading && report && !getOnboarding().firstReportSeen) {
      setShowGuide(true)
    }
  }, [loading, report])

  const dismissGuide = () => {
    markFirstReportSeen()
    setShowGuide(false)
  }

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="animate-spin text-teal-600" size={28} />
      </div>
    )
  }

  if (!report) {
    return (
      <div className="py-24 text-center">
        <p className="text-ink-500">Report not found</p>
        <button onClick={() => navigate('/app')} className="btn-ghost mt-4">
          Back to sessions
        </button>
      </div>
    )
  }

  const { llm_analysis: llm, communication_metrics: comm, emotional_profile: emo, behavioral_signals: beh, transcript } =
    report
  const rec = llm.hiring_recommendation
  const radarData = [
    { metric: 'Clarity', value: comm.clarity_score },
    { metric: 'Confidence', value: comm.confidence_score },
    { metric: 'Coherence', value: comm.coherence_score },
    { metric: 'Vocabulary', value: comm.vocabulary_richness },
    { metric: 'Stability', value: emo.emotional_stability_score },
    { metric: 'Engagement', value: emo.engagement_score },
    { metric: 'Eye contact', value: beh.eye_contact_score },
    { metric: 'Authenticity', value: beh.authenticity_score },
  ]

  return (
    <div className="space-y-5 animate-rise">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button onClick={() => navigate('/app')} className="btn-ghost !py-2">
          <ArrowLeft size={15} /> Sessions
        </button>
        <span className="rounded-full border border-[var(--line)] bg-white/70 px-3 py-1 text-xs text-ink-500">
          Mode: {report.analysis_mode || 'demo'}
        </span>
      </div>

      <AnimatePresence>
        {showGuide && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="relative overflow-hidden rounded-3xl border border-teal-600/20 bg-gradient-to-r from-teal-50 to-white px-5 py-4"
          >
            <button
              onClick={dismissGuide}
              className="absolute right-3 top-3 rounded-lg p-1.5 text-ink-500 hover:bg-white"
              aria-label="Dismiss guide"
            >
              <X size={14} />
            </button>
            <div className="flex flex-col gap-3 pr-8 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <Sparkles className="mt-0.5 shrink-0 text-teal-600" size={18} />
                <div>
                  <p className="text-sm font-semibold text-ink-900">Your first Clarion report</p>
                  <p className="mt-0.5 text-sm text-ink-500">
                    Start with the overall score and recommendation, then open Communication and Emotion for evidence.
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  dismissGuide()
                  navigate('/app/new')
                }}
                className="btn-primary shrink-0 !py-2.5"
              >
                Run another <ArrowRight size={14} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="surface rounded-[2rem] p-6 md:p-8"
      >
        <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-teal-600">Candidate report</p>
            <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight text-ink-900">
              {report.candidate_name || 'Anonymous candidate'}
            </h1>
            <p className="mt-2 text-sm text-ink-500">
              {report.position || 'Unspecified role'} · {Math.round(report.video_duration)}s analyzed ·{' '}
              {report.processing_time}s processing
            </p>
            <div className={`mt-4 inline-flex rounded-full border px-3 py-1.5 text-sm font-semibold ${REC[rec] || REC.Maybe}`}>
              {rec}
              <span className="ml-2 font-normal opacity-70">
                {(llm.confidence_in_recommendation * 100).toFixed(0)}% confidence
              </span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-6">
            <ScoreRing score={report.overall_score} label="Overall" />
            <ScoreRing score={report.communication_score} size={96} stroke={8} label="Comm" />
            <ScoreRing score={report.emotional_intelligence_score} size={96} stroke={8} label="EQ" />
          </div>
        </div>
        <p className="mt-6 max-w-3xl text-sm leading-relaxed text-ink-700">{llm.overall_assessment}</p>
      </motion.div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Section title="Signal radar" icon={Activity}>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="rgba(12,27,36,0.12)" />
                <PolarAngleAxis dataKey="metric" tick={{ fill: '#4a6d7c', fontSize: 11 }} />
                <Radar dataKey="value" stroke="#0f766e" fill="#14b8a6" fillOpacity={0.28} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </Section>

        <Section title="Communication" icon={MessageSquare}>
          <div className="space-y-3">
            <MetricBar label="Clarity" value={comm.clarity_score} />
            <MetricBar label="Confidence" value={comm.confidence_score} />
            <MetricBar label="Coherence" value={comm.coherence_score} />
            <MetricBar label="Vocabulary richness" value={comm.vocabulary_richness} />
            <div className="grid grid-cols-2 gap-3 pt-2 text-sm">
              <div className="rounded-2xl bg-mist-100 px-3 py-3">
                <div className="text-xs text-ink-500">Filler ratio</div>
                <div className="mt-1 font-mono font-medium">{(comm.filler_word_ratio * 100).toFixed(1)}%</div>
              </div>
              <div className="rounded-2xl bg-mist-100 px-3 py-3">
                <div className="text-xs text-ink-500">Words / min</div>
                <div className="mt-1 font-mono font-medium">{transcript.words_per_minute}</div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 pt-2">
              {comm.key_themes.map((t) => (
                <span key={t} className="rounded-full bg-teal-600/10 px-2.5 py-1 text-xs text-teal-700">
                  {t}
                </span>
              ))}
            </div>
          </div>
        </Section>
      </div>

      <Section title="Emotion timeline" icon={Eye}>
        <EmotionTimeline timeline={emo.timeline} />
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl bg-mist-100 px-3 py-3 text-sm">
            <div className="text-xs text-ink-500">Dominant</div>
            <div className="mt-1 font-medium capitalize">{emo.dominant_emotion}</div>
          </div>
          <div className="rounded-2xl bg-mist-100 px-3 py-3 text-sm">
            <div className="text-xs text-ink-500">Stability</div>
            <div className="mt-1 font-medium">{emo.emotional_stability_score.toFixed(1)} / 10</div>
          </div>
          <div className="rounded-2xl bg-mist-100 px-3 py-3 text-sm">
            <div className="text-xs text-ink-500">Engagement</div>
            <div className="mt-1 font-medium">{emo.engagement_score.toFixed(1)} / 10</div>
          </div>
        </div>
      </Section>

      <div className="grid gap-5 lg:grid-cols-2">
        <Section title="Strengths" icon={CheckCircle2}>
          <ul className="space-y-2">
            {llm.strengths.map((s) => (
              <li key={s} className="rounded-2xl bg-emerald-50/80 px-3 py-2.5 text-sm text-emerald-900">
                {s}
              </li>
            ))}
          </ul>
        </Section>
        <Section title="Growth areas" icon={AlertTriangle}>
          <ul className="space-y-2">
            {llm.areas_for_improvement.map((s) => (
              <li key={s} className="rounded-2xl bg-amber-50/80 px-3 py-2.5 text-sm text-amber-900">
                {s}
              </li>
            ))}
          </ul>
        </Section>
      </div>

      <Section title="Culture fit & follow-ups" icon={Activity}>
        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-ink-500">Culture fit</h3>
            <ul className="space-y-2">
              {llm.culture_fit_indicators.map((s) => (
                <li key={s} className="text-sm text-ink-700">
                  · {s}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-ink-500">Ask next</h3>
            <ul className="space-y-2">
              {llm.recommended_follow_up_questions.map((s) => (
                <li key={s} className="rounded-2xl bg-mist-100 px-3 py-2.5 text-sm text-ink-700">
                  {s}
                </li>
              ))}
            </ul>
          </div>
        </div>
        {llm.red_flags?.length > 0 && (
          <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
            <strong>Red flags:</strong> {llm.red_flags.join(' · ')}
          </div>
        )}
      </Section>

      <Section title="Behavioral signals" icon={Eye} defaultOpen={false}>
        <div className="grid gap-3 sm:grid-cols-2">
          <MetricBar label="Eye contact (heuristic)" value={beh.eye_contact_score} />
          <MetricBar label="Attentiveness" value={beh.attentiveness_score} />
          <MetricBar label="Authenticity" value={beh.authenticity_score} />
          <div className="rounded-2xl bg-mist-100 px-3 py-3 text-sm">
            <div className="text-xs text-ink-500">Posture</div>
            <div className="mt-1 font-medium">{beh.posture_assessment}</div>
            <div className="mt-2 text-xs text-ink-500">Gestures</div>
            <div className="mt-1 font-medium">{beh.gesture_frequency}</div>
          </div>
        </div>
        <p className="mt-3 text-xs text-ink-500">
          Behavioral scores are derived from emotional distribution heuristics unless a full vision model is enabled.
        </p>
      </Section>

      <Section title="Transcript" icon={Mic} defaultOpen={false}>
        <button onClick={() => setShowTranscript((v) => !v)} className="btn-ghost !py-2 text-xs">
          {showTranscript ? 'Hide full transcript' : 'Show full transcript'}
        </button>
        {showTranscript && (
          <div className="mt-4 space-y-3">
            {transcript.segments.map((seg, i) => (
              <div key={`${seg.start}-${i}`} className="rounded-2xl bg-mist-100 px-3 py-3">
                <div className="mb-1 font-mono text-[11px] text-ink-500">
                  {seg.start.toFixed(1)}s – {seg.end.toFixed(1)}s
                </div>
                <p className="text-sm text-ink-800">{seg.text}</p>
              </div>
            ))}
          </div>
        )}
      </Section>
    </div>
  )
}
