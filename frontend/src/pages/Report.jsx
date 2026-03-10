import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { interviewAPI } from '../utils/api'
import ScoreRing from '../components/ScoreRing'
import EmotionTimeline from '../components/EmotionTimeline'
import {
  Brain, ArrowLeft, MessageSquare, Eye, Activity, CheckCircle,
  XCircle, HelpCircle, ChevronDown, ChevronUp, Loader2, Clock,
  Mic, BarChart3, TrendingUp, AlertTriangle
} from 'lucide-react'
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts'

const REC_CONFIG = {
  'Strong Yes': { color: '#4ade80', bg: 'rgba(74, 222, 128, 0.1)', border: 'rgba(74, 222, 128, 0.3)' },
  'Yes': { color: '#86efac', bg: 'rgba(134, 239, 172, 0.1)', border: 'rgba(134, 239, 172, 0.3)' },
  'Maybe': { color: '#fbbf24', bg: 'rgba(251, 191, 36, 0.1)', border: 'rgba(251, 191, 36, 0.3)' },
  'No': { color: '#f87171', bg: 'rgba(248, 113, 113, 0.1)', border: 'rgba(248, 113, 113, 0.3)' },
  'Strong No': { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)', border: 'rgba(239, 68, 68, 0.3)' },
}

function Section({ title, icon: Icon, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="glass rounded-2xl overflow-hidden">
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between p-5 text-left hover:bg-white/2 transition-colors">
        <div className="flex items-center gap-3">
          <Icon size={16} style={{ color: '#7c6af7' }} />
          <span className="font-display font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{title}</span>
        </div>
        {open ? <ChevronUp size={16} style={{ color: 'var(--text-secondary)' }} /> : <ChevronDown size={16} style={{ color: 'var(--text-secondary)' }} />}
      </button>
      {open && <div className="px-5 pb-5">{children}</div>}
    </div>
  )
}

function MetricBar({ label, value, max = 10 }) {
  const pct = (value / max) * 100
  const color = value >= 8 ? '#4ade80' : value >= 6 ? '#7c6af7' : value >= 4 ? '#fbbf24' : '#f87171'
  return (
    <div>
      <div className="flex justify-between mb-1.5">
        <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{label}</span>
        <span className="text-xs font-mono font-medium" style={{ color }}>{value.toFixed(1)}</span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color, boxShadow: `0 0 8px ${color}60` }} />
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

  useEffect(() => {
    interviewAPI.getReport(id)
      .then(({ data }) => setReport(data))
      .catch(err => console.error('Report fetch error:', err))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return (
    <div className="flex items-center justify-center h-screen">
      <Loader2 className="animate-spin" size={32} style={{ color: '#7c6af7' }} />
    </div>
  )

  if (!report) return (
    <div className="flex flex-col items-center justify-center h-screen gap-4">
      <p style={{ color: 'var(--text-secondary)' }}>Report not found</p>
      <button onClick={() => navigate('/')} className="text-sm" style={{ color: '#7c6af7' }}>← Back to Dashboard</button>
    </div>
  )

  const { llm_analysis: llm, communication_metrics: comm, emotional_profile: emo, behavioral_signals: beh, transcript } = report
  const rec = llm.hiring_recommendation
  const recCfg = REC_CONFIG[rec] || REC_CONFIG['Maybe']

  const radarData = [
    { metric: 'Clarity', value: comm.clarity_score },
    { metric: 'Confidence', value: comm.confidence_score },
    { metric: 'Coherence', value: comm.coherence_score },
    { metric: 'Vocabulary', value: comm.vocabulary_richness },
    { metric: 'Stability', value: emo.emotional_stability_score },
    { metric: 'Engagement', value: emo.engagement_score },
    { metric: 'Eye Contact', value: beh.eye_contact_score },
    { metric: 'Authenticity', value: beh.authenticity_score },
  ]

  return (
    <div className="p-6 max-w-5xl mx-auto animate-fade-in space-y-5">
      {/* Header */}
      <div className="flex items-center gap-4 mb-2">
        <button onClick={() => navigate('/')} className="flex items-center gap-1.5 text-sm transition-colors hover:opacity-80"
          style={{ color: 'var(--text-secondary)' }}>
          <ArrowLeft size={14} /> Dashboard
        </button>
      </div>

      {/* Hero card */}
      <div className="glass rounded-3xl p-7 relative overflow-hidden noise">
        {/* Background glow */}
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl opacity-10 -translate-y-1/2 translate-x-1/2"
          style={{ background: '#7c6af7' }} />

        <div className="relative flex items-start justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <h1 className="font-display text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                {report.candidate_name || 'Candidate'} Evaluation
              </h1>
              {report.position && (
                <span className="text-xs px-3 py-1 rounded-full" style={{ background: 'rgba(124, 106, 247, 0.15)', color: '#a78bfa' }}>
                  {report.position}
                </span>
              )}
            </div>
            <p className="text-sm mb-5" style={{ color: 'var(--text-secondary)' }}>
              {new Date(report.created_at).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              <span className="mx-2 opacity-30">·</span>
              {Math.floor(report.video_duration / 60)}m {Math.round(report.video_duration % 60)}s interview
              <span className="mx-2 opacity-30">·</span>
              Processed in {report.processing_time.toFixed(1)}s
            </p>
            <p className="text-sm leading-relaxed max-w-2xl" style={{ color: 'var(--text-secondary)' }}>
              {llm.overall_assessment}
            </p>
          </div>

          {/* Overall score */}
          <div className="flex-shrink-0 text-center">
            <ScoreRing score={report.overall_score} size={100} label="Overall" />
          </div>
        </div>

        {/* Recommendation */}
        <div className="mt-5 flex items-center gap-3">
          <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl border font-display font-bold text-sm"
            style={{ background: recCfg.bg, borderColor: recCfg.border, color: recCfg.color }}>
            {rec.includes('Yes') ? <CheckCircle size={16} /> : rec.includes('No') ? <XCircle size={16} /> : <HelpCircle size={16} />}
            {rec}
          </div>
          <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            {(llm.confidence_in_recommendation * 100).toFixed(0)}% confidence
          </span>
        </div>
      </div>

      {/* Score overview */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Communication', score: report.communication_score, icon: MessageSquare },
          { label: 'Emotional IQ', score: report.emotional_intelligence_score, icon: Activity },
          { label: 'Eye Contact', score: beh.eye_contact_score, icon: Eye },
        ].map(({ label, score, icon: Icon }) => (
          <div key={label} className="glass rounded-2xl p-5 flex items-center gap-4">
            <ScoreRing score={score} size={64} />
            <div>
              <Icon size={14} style={{ color: 'var(--text-secondary)' }} className="mb-1" />
              <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Radar chart + Communication metrics */}
      <div className="grid grid-cols-2 gap-5">
        <Section title="Competency Radar" icon={BarChart3}>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="rgba(255,255,255,0.06)" />
                <PolarAngleAxis dataKey="metric" tick={{ fontSize: 10, fill: '#9d97b5' }} />
                <Radar dataKey="value" stroke="#7c6af7" fill="#7c6af7" fillOpacity={0.15} strokeWidth={1.5}
                  dot={{ fill: '#7c6af7', r: 3 }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </Section>

        <Section title="Communication Metrics" icon={Mic}>
          <div className="space-y-3.5">
            <MetricBar label="Clarity" value={comm.clarity_score} />
            <MetricBar label="Confidence" value={comm.confidence_score} />
            <MetricBar label="Coherence" value={comm.coherence_score} />
            <MetricBar label="Vocabulary Richness" value={comm.vocabulary_richness} />
            <div className="flex justify-between pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
              <div className="text-center">
                <div className="font-mono text-lg font-bold" style={{ color: '#7c6af7' }}>{transcript.words_per_minute}</div>
                <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>words/min</div>
              </div>
              <div className="text-center">
                <div className="font-mono text-lg font-bold" style={{ color: '#fbbf24' }}>{(comm.filler_word_ratio * 100).toFixed(1)}%</div>
                <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>filler words</div>
              </div>
              <div className="text-center">
                <div className="font-mono text-lg font-bold" style={{ color: '#4ade80' }}>{transcript.word_count}</div>
                <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>total words</div>
              </div>
            </div>
          </div>
        </Section>
      </div>

      {/* Emotional profile */}
      <Section title="Emotional Timeline" icon={Activity}>
        <div className="mb-4">
          <EmotionTimeline timeline={emo.timeline} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Emotion Distribution</p>
            <div className="space-y-2">
              {Object.entries(emo.emotion_distribution)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 5)
                .map(([emotion, value]) => (
                  <div key={emotion} className="flex items-center gap-2">
                    <div className="w-20 text-xs capitalize" style={{ color: 'var(--text-secondary)' }}>{emotion}</div>
                    <div className="flex-1 h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
                      <div className="h-full rounded-full" style={{
                        width: `${value * 100}%`,
                        background: emotion === 'happy' ? '#4ade80' : emotion === 'neutral' ? '#94a3b8' :
                          emotion === 'surprise' ? '#60a5fa' : emotion === 'fear' ? '#f87171' : '#a78bfa'
                      }} />
                    </div>
                    <div className="text-xs font-mono w-8 text-right" style={{ color: 'var(--text-primary)' }}>
                      {(value * 100).toFixed(0)}%
                    </div>
                  </div>
                ))}
            </div>
          </div>
          <div className="space-y-3">
            {emo.positive_signals.length > 0 && (
              <div>
                <p className="text-xs font-medium mb-2" style={{ color: '#4ade80' }}>Positive Signals</p>
                {emo.positive_signals.map((s, i) => (
                  <div key={i} className="flex items-start gap-2 mb-1">
                    <CheckCircle size={12} style={{ color: '#4ade80' }} className="mt-0.5 flex-shrink-0" />
                    <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{s}</span>
                  </div>
                ))}
              </div>
            )}
            {emo.stress_indicators.length > 0 && (
              <div>
                <p className="text-xs font-medium mb-2" style={{ color: '#fbbf24' }}>Stress Indicators</p>
                {emo.stress_indicators.map((s, i) => (
                  <div key={i} className="flex items-start gap-2 mb-1">
                    <AlertTriangle size={12} style={{ color: '#fbbf24' }} className="mt-0.5 flex-shrink-0" />
                    <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{s}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Section>

      {/* LLM Analysis */}
      <div className="grid grid-cols-2 gap-5">
        <Section title="Strengths" icon={TrendingUp}>
          <div className="space-y-2">
            {llm.strengths.map((s, i) => (
              <div key={i} className="flex items-start gap-2.5 p-3 rounded-xl" style={{ background: 'rgba(74, 222, 128, 0.04)' }}>
                <CheckCircle size={14} style={{ color: '#4ade80' }} className="mt-0.5 flex-shrink-0" />
                <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{s}</p>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Areas for Development" icon={Activity}>
          <div className="space-y-2">
            {llm.areas_for_improvement.map((s, i) => (
              <div key={i} className="flex items-start gap-2.5 p-3 rounded-xl" style={{ background: 'rgba(251, 191, 36, 0.04)' }}>
                <HelpCircle size={14} style={{ color: '#fbbf24' }} className="mt-0.5 flex-shrink-0" />
                <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{s}</p>
              </div>
            ))}
          </div>
        </Section>
      </div>

      {/* Follow-up questions */}
      <Section title="Recommended Follow-up Questions" icon={MessageSquare}>
        <div className="space-y-2">
          {llm.recommended_follow_up_questions.map((q, i) => (
            <div key={i} className="flex items-start gap-3 p-3 rounded-xl" style={{ background: 'rgba(124, 106, 247, 0.05)' }}>
              <span className="font-mono text-xs font-bold w-5 flex-shrink-0" style={{ color: '#7c6af7' }}>Q{i + 1}</span>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{q}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Transcript */}
      <Section title="Interview Transcript" icon={Mic} defaultOpen={false}>
        <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
          {transcript.segments.map((seg, i) => (
            <div key={i} className="flex gap-3">
              <div className="flex-shrink-0 w-14 text-right">
                <span className="font-mono text-xs" style={{ color: 'var(--text-secondary)' }}>
                  {Math.floor(seg.start / 60).toString().padStart(2, '0')}:{Math.round(seg.start % 60).toString().padStart(2, '0')}
                </span>
              </div>
              <p className="text-xs leading-relaxed flex-1" style={{ color: 'var(--text-primary)' }}>{seg.text}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Key themes */}
      {comm.key_themes.length > 0 && (
        <div className="glass rounded-2xl p-5">
          <p className="text-xs font-medium mb-3" style={{ color: 'var(--text-secondary)' }}>KEY THEMES IDENTIFIED</p>
          <div className="flex flex-wrap gap-2">
            {comm.key_themes.map(theme => (
              <span key={theme} className="px-3 py-1 rounded-full text-xs font-medium capitalize"
                style={{ background: 'rgba(124, 106, 247, 0.1)', color: '#a78bfa', border: '1px solid rgba(124, 106, 247, 0.2)' }}>
                {theme}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
