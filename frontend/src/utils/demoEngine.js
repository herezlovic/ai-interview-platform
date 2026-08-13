/** Browser-local demo engine for GitHub Pages / offline demos */

const KEY = 'clarion.sessions.v1'

const STAGES = [
  { stage: 'transcription', progress: 18, message: 'Transcribing speech with Whisper…', delay: 700 },
  { stage: 'emotion_analysis', progress: 42, message: 'Reading facial emotion timeline…', delay: 800 },
  { stage: 'communication_analysis', progress: 63, message: 'Scoring clarity and coherence…', delay: 650 },
  { stage: 'llm_analysis', progress: 84, message: 'Synthesizing behavioral assessment…', delay: 900 },
  { stage: 'report_generation', progress: 96, message: 'Building evaluation report…', delay: 500 },
]

function uid() {
  return crypto.randomUUID ? crypto.randomUUID() : `local-${Date.now()}`
}

function load() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]')
  } catch {
    return []
  }
}

function save(sessions) {
  localStorage.setItem(KEY, JSON.stringify(sessions))
}

function upsert(session) {
  const all = load().filter((s) => s.id !== session.id)
  all.unshift(session)
  save(all)
  return session
}

function buildReport(session) {
  const transcript = {
    full_text:
      "Thanks for having me. I've spent the last five years building backend systems at scale, mostly around payments and marketplace infrastructure. In my current role I led a migration from a monolith to services. We cut p99 latency by about forty percent and made releases much safer. I care a lot about clarity in design docs and mentorship. When things go wrong I try to stay calm, write down what we know, and communicate early.",
    segments: [
      { start: 0, end: 12.5, text: "Thanks for having me. I've spent the last five years building backend systems at scale.", speaker: null, confidence: 0.94 },
      { start: 12.5, end: 28, text: 'I led a migration from a monolith to services and cut p99 latency by about forty percent.', speaker: null, confidence: 0.93 },
      { start: 28, end: 45.5, text: 'I care a lot about clarity in design docs and mentorship with newer engineers.', speaker: null, confidence: 0.95 },
      { start: 45.5, end: 62, text: 'When things go wrong I stay calm, write down what we know, and communicate early.', speaker: null, confidence: 0.92 },
      { start: 62, end: 78, text: "I'm excited about owning reliability end to end on a product with real ambition.", speaker: null, confidence: 0.94 },
    ],
    language: 'en',
    duration: 78,
    word_count: 118,
    words_per_minute: 142.3,
  }

  const communication_metrics = {
    clarity_score: 8.4,
    confidence_score: 7.9,
    coherence_score: 8.1,
    vocabulary_richness: 7.6,
    filler_word_ratio: 0.028,
    average_response_length: 23.6,
    key_themes: ['systems', 'latency', 'mentorship', 'reliability', 'migration'],
    notable_phrases: [
      'cut p99 latency by about forty percent',
      'clarity in design docs and mentorship',
      'communicate early',
    ],
  }

  const timeline = Array.from({ length: 16 }, (_, i) => {
    const neutral = 0.48 + (i % 3) * 0.02
    const happy = 0.22 - (i % 4) * 0.01
    const emotions = {
      neutral,
      happy,
      surprise: 0.08,
      fear: 0.06,
      sad: 0.04,
      angry: 0.02,
      disgust: 0.01,
    }
    const total = Object.values(emotions).reduce((a, b) => a + b, 0)
    const normalized = Object.fromEntries(
      Object.entries(emotions).map(([k, v]) => [k, +(v / total).toFixed(3)])
    )
    const dominant = Object.entries(normalized).sort((a, b) => b[1] - a[1])[0][0]
    return {
      timestamp: i * 5,
      dominant_emotion: dominant,
      emotions: normalized,
      confidence: normalized[dominant],
    }
  })

  const emotional_profile = {
    dominant_emotion: 'neutral',
    emotion_distribution: {
      neutral: 0.49,
      happy: 0.22,
      surprise: 0.09,
      fear: 0.07,
      sad: 0.05,
      angry: 0.05,
      disgust: 0.03,
    },
    emotional_stability_score: 8.2,
    engagement_score: 7.4,
    stress_indicators: [],
    positive_signals: [
      'Warm, approachable presence',
      'Steady composure across the interview',
      'Consistent engagement with the interviewer',
    ],
    timeline,
  }

  const behavioral_signals = {
    eye_contact_score: 8.0,
    posture_assessment: 'Upright and engaged',
    gesture_frequency: 'Moderate',
    attentiveness_score: 8.1,
    authenticity_score: 7.8,
  }

  const role = session.position || 'the role'
  return {
    id: uid(),
    interview_id: session.id,
    candidate_name: session.candidate_name,
    position: session.position,
    created_at: new Date().toISOString(),
    overall_score: 8.0,
    technical_score: null,
    communication_score: 8.1,
    emotional_intelligence_score: 7.8,
    transcript,
    communication_metrics,
    emotional_profile,
    behavioral_signals,
    llm_analysis: {
      overall_assessment: `Candidate shows strong potential for ${role} with a composite signal of 8.0/10. Communication is excellent and emotional presence is highly stable throughout the conversation.`,
      strengths: [
        'Clear, structured storytelling with concrete outcomes',
        'Precise vocabulary that signals technical depth',
        'Composed under pressure with steady emotional presence',
        'Ownership mindset visible in how past projects are described',
      ],
      areas_for_improvement: [
        'Add more quantified impact when describing achievements',
        'Invite the interviewer into trade-off discussions earlier',
      ],
      culture_fit_indicators: [
        'Collaborative language when describing team delivery',
        'Growth orientation when reflecting on challenges',
        'Bias toward clarity and written communication',
        'Ownership of reliability and mentoring outcomes',
      ],
      red_flags: [],
      recommended_follow_up_questions: [
        'Walk me through a specific failure and what you changed afterward.',
        'How do you handle disagreement with leadership decisions?',
        'Describe mentoring a junior engineer through a hard project.',
        'What is the most complex technical trade-off you have owned?',
      ],
      hiring_recommendation: 'Yes',
      confidence_in_recommendation: 0.86,
    },
    video_duration: 78,
    processing_time: 3.4,
    analysis_mode: 'demo',
  }
}

async function runPipeline(sessionId) {
  const sessions = load()
  const session = sessions.find((s) => s.id === sessionId)
  if (!session) return

  session.status = 'processing'
  upsert(session)

  for (const step of STAGES) {
    await new Promise((r) => setTimeout(r, step.delay))
    const current = load().find((s) => s.id === sessionId)
    if (!current) return
    current.stage = step.stage
    current.progress = step.progress
    current.message = step.message
    current.status = 'processing'
    upsert(current)
  }

  const finalSession = load().find((s) => s.id === sessionId)
  if (!finalSession) return
  finalSession.report = buildReport(finalSession)
  finalSession.status = 'completed'
  finalSession.stage = 'complete'
  finalSession.progress = 100
  finalSession.message = 'Analysis complete'
  upsert(finalSession)
}

export const localDemoAPI = {
  async create(form) {
    const session = {
      id: uid(),
      candidate_name: form.candidate_name || 'Alex Rivera',
      position: form.position || 'Staff Engineer',
      interviewer: form.interviewer || null,
      job_description: form.job_description || null,
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      video_path: null,
      report: null,
      error_message: null,
      stage: 'queued',
      progress: 0,
      message: 'Waiting to start',
      is_demo: true,
    }
    return upsert(session)
  },
  async list() {
    return load()
  },
  async get(id) {
    const session = load().find((s) => s.id === id)
    if (!session) throw new Error('Session not found')
    return session
  },
  async runDemo(id, position) {
    const session = load().find((s) => s.id === id)
    if (!session) throw new Error('Session not found')
    if (position) session.position = position
    session.is_demo = true
    upsert(session)
    runPipeline(id)
    return { message: 'Demo analysis started', session_id: id }
  },
  async getStatus(id) {
    const session = load().find((s) => s.id === id)
    if (!session) throw new Error('Session not found')
    return {
      session_id: id,
      status: session.status,
      stage: session.stage,
      progress: session.progress,
      message: session.message,
      has_report: !!session.report,
      error: session.error_message,
    }
  },
  async getReport(id) {
    const session = load().find((s) => s.id === id)
    if (!session?.report) throw new Error('Report not ready')
    return session.report
  },
  async delete(id) {
    save(load().filter((s) => s.id !== id))
    return { deleted: true, session_id: id }
  },
}
