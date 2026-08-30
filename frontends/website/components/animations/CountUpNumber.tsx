'use client'

import { useEffect, useRef, useState } from 'react'
import { useInView } from '@/hooks/useInView'
import { useReducedMotion } from '@/hooks/useReducedMotion'

interface CountUpNumberProps {
  end: number
  duration?: number
  suffix?: string
  className?: string
}

/**
 * 数字滚动动画组件
 * 进入视口时从 0 递增到目标值
 */
export default function CountUpNumber({
  end,
  duration = 1200,
  suffix = '',
  className = '',
}: CountUpNumberProps) {
  const [count, setCount] = useState(end)
  const ref = useRef<HTMLSpanElement>(null)
  const isInView = useInView(ref, { threshold: 0.5 })
  const prefersReducedMotion = useReducedMotion()
  const hasAnimated = useRef(false)

  useEffect(() => {
    if (!isInView || hasAnimated.current) return

    hasAnimated.current = true

    if (prefersReducedMotion || end <= 10) return

    const startTime = Date.now()
    let animationFrame = 0
    const animate = () => {
      const now = Date.now()
      const progress = Math.min((now - startTime) / duration, 1)

      // 使用 cubic-bezier(0.4, 0.0, 0.2, 1) 缓动函数
      const easeProgress = progress < 0.5
        ? 2 * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 2) / 2

      setCount(Math.floor(end * easeProgress))

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate)
      } else {
        setCount(end)
      }
    }

    animationFrame = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animationFrame)
  }, [isInView, end, duration, prefersReducedMotion])

  return (
    <span ref={ref} className={`tabular-nums ${className}`}>
      {(prefersReducedMotion ? end : count).toLocaleString()}{suffix}
    </span>
  )
}
