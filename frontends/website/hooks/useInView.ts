'use client'

import { useEffect, useState, RefObject } from 'react'

/**
 * 检测元素是否进入视口
 * 用于触发滚动动画
 */
export function useInView(
  ref: RefObject<Element | null>,
  options?: IntersectionObserverInit
): boolean {
  const [isInView, setIsInView] = useState(false)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const observer = new IntersectionObserver(([entry]) => {
      setIsInView(entry.isIntersecting)
    }, options)

    observer.observe(element)
    return () => observer.disconnect()
  }, [ref, options])

  return isInView
}
