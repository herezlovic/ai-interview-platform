import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, Sparkles, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { dismissWelcome } from '../utils/onboarding'

const STEPS = [
  {
    n: '01',
    title: 'Run the live demo',
    copy: 'No video or API keys needed — Clarion builds a full evaluation in under a minute.',
  },
  {
    n: '02',
    title: 'Read the hiring signal',
    copy: 'Scores, emotion timeline, strengths, and a clear recommendation land in one report.',
  },
  {
    n: '03',
    title: 'Bring your own interviews',
    copy: 'When you are ready, upload a recording for the same multimodal pipeline.',
  },
]

export default function WelcomePanel({ open, onDismiss }) {
  const navigate = useNavigate()

  const close = () => {
    dismissWelcome()
    onDismiss?.()
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center bg-ink-900/40 p-4 sm:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={close}
        >
          <motion.div
            role="dialog"
            aria-labelledby="welcome-title"
            initial={{ opacity: 0, y: 28, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full max-w-lg overflow-hidden rounded-[1.75rem] border border-[var(--line)] bg-white shadow-lift"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="h-1.5 w-full bg-gradient-to-r from-teal-600 via-teal-400 to-sand-400" />
            <button
              onClick={close}
              className="absolute right-4 top-5 rounded-lg p-1.5 text-ink-500 transition hover:bg-mist-100 hover:text-ink-900"
              aria-label="Dismiss welcome"
            >
              <X size={16} />
            </button>

            <div className="px-6 pb-6 pt-7 sm:px-8">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-teal-600">
                Welcome to Clarion
              </p>
              <h2 id="welcome-title" className="mt-2 font-display text-3xl font-semibold tracking-tight text-ink-900">
                Your first hiring signal in three steps
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-ink-500">
                Built for new teams evaluating interview intelligence — start with Demo Mode and explore the full report.
              </p>

              <ol className="mt-7 space-y-5">
                {STEPS.map((step, i) => (
                  <motion.li
                    key={step.n}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.12 + i * 0.08 }}
                    className="flex gap-4"
                  >
                    <span className="font-mono text-xs font-medium text-teal-600">{step.n}</span>
                    <div>
                      <div className="text-sm font-semibold text-ink-900">{step.title}</div>
                      <p className="mt-0.5 text-sm leading-relaxed text-ink-500">{step.copy}</p>
                    </div>
                  </motion.li>
                ))}
              </ol>

              <div className="mt-8 flex flex-col gap-2 sm:flex-row">
                <button
                  className="btn-primary flex-1"
                  onClick={() => {
                    dismissWelcome()
                    navigate('/app/new')
                  }}
                >
                  <Sparkles size={15} /> Run live demo <ArrowRight size={15} />
                </button>
                <button className="btn-ghost flex-1" onClick={close}>
                  Browse sessions
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
