import { useEffect, useRef, useState, type ReactNode, type CSSProperties } from 'react'

interface AnimatedSectionProps {
  children: ReactNode
  style?: CSSProperties
  delay?: number
  direction?: 'up' | 'down' | 'left' | 'right' | 'none'
}

export default function AnimatedSection({
  children,
  style,
  delay = 0,
  direction = 'up',
}: AnimatedSectionProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true)
          observer.unobserve(el)
        }
      },
      { threshold: 0.1 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const offsets: Record<string, string> = {
    up: 'translateY(40px)',
    down: 'translateY(-40px)',
    left: 'translateX(40px)',
    right: 'translateX(-40px)',
    none: 'none',
  }

  return (
    <div
      ref={ref}
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? 'none' : offsets[direction],
        transition: `opacity 0.7s cubic-bezier(0.25,0.1,0.25,1) ${delay}s, transform 0.7s cubic-bezier(0.25,0.1,0.25,1) ${delay}s`,
        ...style,
      }}
    >
      {children}
    </div>
  )
}
