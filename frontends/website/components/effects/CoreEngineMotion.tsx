'use client'

import { motion, useReducedMotion } from 'framer-motion'

export function CoreEngineMotion({ className = '' }: { className?: string }) {
  const reducedMotion = useReducedMotion()
  const pathAnimation = reducedMotion
    ? { pathLength: 1, opacity: 0.72 }
    : { pathLength: [0, 1], opacity: [0.1, 0.86, 0.72] }

  return (
    <motion.svg
      viewBox="0 0 240 240"
      role="img"
      aria-label="合同业务核心引擎动效"
      className={className}
      initial={reducedMotion ? false : { opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.68, ease: [0.2, 0.8, 0.2, 1] }}
    >
      <defs>
        <radialGradient id="engineGlow" cx="50%" cy="50%" r="54%">
          <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.88" />
          <stop offset="42%" stopColor="#2bb673" stopOpacity="0.34" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="engineStroke" x1="34" y1="40" x2="206" y2="204">
          <stop stopColor="#2563eb" />
          <stop offset="0.58" stopColor="#1f8a70" />
          <stop offset="1" stopColor="#6d5dfc" />
        </linearGradient>
      </defs>

      <circle cx="120" cy="120" r="104" fill="url(#engineGlow)" opacity="0.46" />

      {[92, 68, 44].map((radius, index) => (
        <motion.circle
          key={radius}
          id={`engine-orbit-${index + 1}`}
          cx="120"
          cy="120"
          r={radius}
          fill="none"
          stroke="url(#engineStroke)"
          strokeWidth={index === 0 ? 1.4 : 1}
          strokeDasharray={index === 0 ? '4 9' : '2 8'}
          opacity={0.22 + index * 0.1}
          animate={reducedMotion ? undefined : { rotate: index % 2 ? -360 : 360 }}
          transition={{ duration: 22 + index * 8, repeat: Infinity, ease: 'linear' }}
          style={{ transformOrigin: '120px 120px' }}
        />
      ))}

      <motion.path
        id="engine-link-admin"
        d="M54 82 C86 72 96 88 120 120"
        pathLength="1"
        fill="none"
        stroke="url(#engineStroke)"
        strokeWidth="3"
        strokeLinecap="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={pathAnimation}
        transition={{ duration: 1.15, delay: 0.16, ease: [0.33, 0, 0.18, 1] }}
      />
      <motion.path
        id="engine-link-h5"
        d="M186 72 C156 84 144 96 120 120"
        pathLength="1"
        fill="none"
        stroke="url(#engineStroke)"
        strokeWidth="3"
        strokeLinecap="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={pathAnimation}
        transition={{ duration: 1.15, delay: 0.28, ease: [0.33, 0, 0.18, 1] }}
      />
      <motion.path
        id="engine-link-pdf"
        d="M192 162 C156 158 144 146 120 120"
        pathLength="1"
        fill="none"
        stroke="url(#engineStroke)"
        strokeWidth="3"
        strokeLinecap="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={pathAnimation}
        transition={{ duration: 1.15, delay: 0.4, ease: [0.33, 0, 0.18, 1] }}
      />
      <motion.path
        id="engine-link-api"
        d="M56 164 C86 154 98 142 120 120"
        pathLength="1"
        fill="none"
        stroke="url(#engineStroke)"
        strokeWidth="3"
        strokeLinecap="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={pathAnimation}
        transition={{ duration: 1.15, delay: 0.52, ease: [0.33, 0, 0.18, 1] }}
      />

      {[
        { id: 'engine-node-admin', cx: 54, cy: 82, delay: 0.16 },
        { id: 'engine-node-h5', cx: 186, cy: 72, delay: 0.28 },
        { id: 'engine-node-pdf', cx: 192, cy: 162, delay: 0.4 },
        { id: 'engine-node-api', cx: 56, cy: 164, delay: 0.52 },
      ].map((node) => (
        <motion.circle
          key={node.id}
          id={node.id}
          cx={node.cx}
          cy={node.cy}
          r="7"
          fill="#ffffff"
          stroke="url(#engineStroke)"
          strokeWidth="3"
          initial={reducedMotion ? false : { scale: 0.4, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.42, delay: node.delay, ease: [0.18, 0.9, 0.28, 1.2] }}
          style={{ transformOrigin: `${node.cx}px ${node.cy}px` }}
        />
      ))}

      <motion.g
        id="engine-core"
        initial={reducedMotion ? false : { scale: 0.78, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.58, delay: 0.34, ease: [0.2, 0.85, 0.2, 1.12] }}
        style={{ transformOrigin: '120px 120px' }}
      >
        <rect x="82" y="82" width="76" height="76" rx="22" fill="#0f3d5e" />
        <path d="M101 104h38M101 120h38M101 136h25" stroke="#ffffff" strokeWidth="7" strokeLinecap="round" />
        <path d="M148 98v44" stroke="#2bb673" strokeWidth="7" strokeLinecap="round" />
      </motion.g>
    </motion.svg>
  )
}
