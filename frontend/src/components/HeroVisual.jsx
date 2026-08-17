import { motion } from 'framer-motion'

/** Full-bleed product atmosphere for the landing hero — interview signal scene, not a card. */
export default function HeroVisual() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div className="absolute inset-0 bg-gradient-to-br from-[#0a2e33] via-[#0f4a4c] to-[#1a3d36]" />
      <div className="absolute inset-0 opacity-40 mix-blend-soft-light"
        style={{
          backgroundImage:
            'radial-gradient(ellipse at 20% 30%, rgba(45,212,191,0.35), transparent 50%), radial-gradient(ellipse at 80% 20%, rgba(232,196,140,0.22), transparent 45%), radial-gradient(ellipse at 70% 80%, rgba(15,118,110,0.4), transparent 50%)',
        }}
      />

      {/* Soft room light wash */}
      <motion.div
        className="absolute -right-20 top-[-10%] h-[70%] w-[55%] rounded-full bg-teal-400/20 blur-3xl"
        animate={{ opacity: [0.35, 0.55, 0.35], scale: [1, 1.05, 1] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
      />

      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
      >
        {/* Desk / horizon line suggesting interview space */}
        <path
          d="M0 620 C360 560 720 680 1440 600 L1440 900 L0 900 Z"
          fill="rgba(7,24,28,0.45)"
        />
        <path
          d="M180 640 C420 600 640 720 900 650"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="1.5"
        />

        {/* Candidate silhouette */}
        <g opacity="0.55">
          <ellipse cx="1080" cy="520" rx="72" ry="88" fill="rgba(232,245,242,0.12)" />
          <path
            d="M1000 700 C1010 610 1150 610 1160 700"
            fill="rgba(232,245,242,0.1)"
          />
        </g>

        {/* Waveform = speech signal */}
        <g stroke="rgba(94,234,212,0.75)" strokeWidth="2.5" strokeLinecap="round">
          {[
            [220, 40], [250, 70], [280, 28], [310, 95], [340, 48],
            [370, 110], [400, 36], [430, 88], [460, 52], [490, 120],
            [520, 44], [550, 78], [580, 32], [610, 98], [640, 56],
            [670, 86], [700, 40], [730, 72], [760, 50], [790, 64],
          ].map(([x, h], i) => (
            <motion.line
              key={x}
              x1={x}
              y1={380 - h / 2}
              x2={x}
              y2={380 + h / 2}
              initial={{ opacity: 0.3, scaleY: 0.6 }}
              animate={{ opacity: [0.35, 1, 0.45], scaleY: [0.7, 1.15, 0.8] }}
              transition={{ duration: 2.2, delay: i * 0.06, repeat: Infinity, ease: 'easeInOut' }}
              style={{ transformOrigin: `${x}px 380px` }}
            />
          ))}
        </g>

        {/* Emotion pulse dots */}
        {[0, 1, 2, 3, 4].map((i) => (
          <motion.circle
            key={i}
            cx={260 + i * 95}
            cy={480}
            r="6"
            fill={i % 2 === 0 ? 'rgba(45,212,191,0.85)' : 'rgba(232,196,140,0.8)'}
            animate={{ opacity: [0.4, 1, 0.4], y: [0, -6, 0] }}
            transition={{ duration: 2.8, delay: i * 0.2, repeat: Infinity }}
          />
        ))}

        {/* Soft score arc suggestion */}
        <motion.path
          d="M980 280 A90 90 0 1 1 980 460"
          stroke="rgba(94,234,212,0.55)"
          strokeWidth="8"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: [0.55, 0.82, 0.55] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        />
        <circle cx="1070" cy="370" r="4" fill="rgba(255,255,255,0.7)" />
      </svg>

      <div className="absolute inset-0 bg-gradient-to-t from-[#07181c]/85 via-[#07181c]/35 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#07181c]/75 via-[#07181c]/25 to-transparent md:from-[#07181c]/80 md:via-[#07181c]/40" />
    </div>
  )
}
