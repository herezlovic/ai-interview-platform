import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, AudioLines, BrainCircuit, ScanFace } from 'lucide-react'
import HeroVisual from '../components/HeroVisual'

export default function Landing() {
  const navigate = useNavigate()

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#07181c] text-white">
      {/* First viewport: one composition — brand, headline, support, CTAs, full-bleed visual */}
      <section className="relative min-h-[100svh]">
        <HeroVisual />

        <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-5 py-6">
          <div className="font-display text-xl font-semibold tracking-tight text-white/90">Clarion</div>
          <button
            onClick={() => navigate('/app')}
            className="rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20"
          >
            Open app
          </button>
        </header>

        <div className="relative z-10 mx-auto flex min-h-[calc(100svh-5.5rem)] max-w-6xl flex-col justify-end px-5 pb-16 pt-10 sm:justify-center sm:pb-24">
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-2xl"
          >
            <motion.h1
              className="font-display text-6xl font-semibold leading-[0.95] tracking-tight text-white sm:text-7xl md:text-8xl"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
            >
              Clarion
            </motion.h1>
            <motion.p
              className="mt-5 font-display text-2xl font-medium leading-snug tracking-tight text-teal-100/95 sm:text-3xl"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.75, delay: 0.18 }}
            >
              Hear what the interview actually said.
            </motion.p>
            <motion.p
              className="mt-5 max-w-md text-base leading-relaxed text-white/70 sm:text-lg"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.32, duration: 0.7 }}
            >
              Speech, emotion, and judgment — turned into a clear hiring signal you can demo in minutes.
            </motion.p>
            <motion.div
              className="mt-9 flex flex-wrap items-center gap-3"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.42, duration: 0.6 }}
            >
              <button onClick={() => navigate('/app/new')} className="btn-primary !shadow-[0_12px_32px_rgba(15,118,110,0.45)]">
                Run live demo <ArrowRight size={16} />
              </button>
              <button
                onClick={() => navigate('/app')}
                className="inline-flex items-center gap-2 rounded-xl border border-white/25 bg-white/10 px-5 py-3 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/18"
              >
                View sessions
              </button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Below the fold: how Clarion works */}
      <section className="relative bg-[#f4f9f8] px-5 py-20 text-ink-900">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-teal-600">How it works</p>
          <h2 className="mt-3 max-w-xl font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            Three signals. One recommendation.
          </h2>
          <p className="mt-3 max-w-lg text-sm leading-relaxed text-ink-500 sm:text-base">
            Clarion fuses transcription, affect, and LLM judgment so new hiring teams can evaluate interviews without stitching tools together.
          </p>

          <div className="mt-12 grid gap-10 sm:grid-cols-3 sm:gap-8">
            {[
              {
                icon: AudioLines,
                title: 'Speech',
                copy: 'Whisper transcription with pacing, fillers, themes, and notable phrases.',
              },
              {
                icon: ScanFace,
                title: 'Emotion',
                copy: 'Frame-level affect timeline with stability and engagement scoring.',
              },
              {
                icon: BrainCircuit,
                title: 'Judgment',
                copy: 'LLM narrative with strengths, risks, culture fit, and a hiring call.',
              },
            ].map(({ icon: Icon, title, copy }, i) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ delay: i * 0.08, duration: 0.5 }}
              >
                <Icon className="mb-4 text-teal-600" size={22} />
                <h3 className="font-display text-2xl font-semibold text-ink-900">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-500">{copy}</p>
              </motion.div>
            ))}
          </div>

          <div className="mt-16 flex flex-col items-start justify-between gap-6 border-t border-[var(--line)] pt-10 sm:flex-row sm:items-center">
            <div>
              <h3 className="font-display text-2xl font-semibold text-ink-900">New here? Start with Demo Mode.</h3>
              <p className="mt-1 text-sm text-ink-500">No upload required — see a complete Clarion report immediately.</p>
            </div>
            <button onClick={() => navigate('/app/new')} className="btn-primary shrink-0">
              Start first analysis <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}
