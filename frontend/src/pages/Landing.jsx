import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, AudioLines, BrainCircuit, ScanFace } from 'lucide-react'

export default function Landing() {
  const navigate = useNavigate()

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="hero-orb -left-24 -top-24 h-80 w-80 bg-teal-400/40" />
      <div className="hero-orb right-[-4rem] top-24 h-96 w-96 bg-sand-400/35" style={{ animationDelay: '1.5s' }} />
      <div className="hero-orb bottom-10 left-1/3 h-72 w-72 bg-teal-600/20" style={{ animationDelay: '3s' }} />

      <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-5 py-6">
        <div className="font-display text-2xl font-semibold tracking-tight text-ink-900">Clarion</div>
        <button onClick={() => navigate('/app')} className="btn-ghost !py-2">
          Open app
        </button>
      </header>

      <section className="relative z-10 mx-auto flex min-h-[78vh] max-w-6xl flex-col justify-center px-5 pb-16 pt-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-3xl"
        >
          <p className="mb-5 text-xs font-semibold uppercase tracking-[0.28em] text-teal-600">
            Clarion
          </p>
          <h1 className="font-display text-5xl font-semibold leading-[1.05] tracking-tight text-ink-900 sm:text-6xl md:text-7xl">
            Hear what the interview actually said.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-500">
            Multimodal evaluation that turns speech, emotion, and reasoning into a clear hiring signal you can demo in minutes.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-3">
            <button onClick={() => navigate('/app/new')} className="btn-primary">
              Run live demo <ArrowRight size={16} />
            </button>
            <button onClick={() => navigate('/app')} className="btn-ghost">
              View sessions
            </button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          className="mt-16 grid gap-4 sm:grid-cols-3"
        >
          {[
            { icon: AudioLines, title: 'Speech', copy: 'Whisper transcription, pacing, fillers, and themes.' },
            { icon: ScanFace, title: 'Emotion', copy: 'Frame-level affect timeline and stability signals.' },
            { icon: BrainCircuit, title: 'Judgment', copy: 'LLM narrative with strengths, risks, and a recommendation.' },
          ].map(({ icon: Icon, title, copy }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 + i * 0.08 }}
              className="surface rounded-3xl p-5"
            >
              <Icon className="mb-3 text-teal-600" size={20} />
              <div className="font-display text-xl font-semibold text-ink-900">{title}</div>
              <p className="mt-2 text-sm leading-relaxed text-ink-500">{copy}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>
    </div>
  )
}
