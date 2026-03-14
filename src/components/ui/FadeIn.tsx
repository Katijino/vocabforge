import { useState, useEffect } from 'react'

export default function FadeIn({
  delay = 0, children, style,
}: { delay?: number; children: React.ReactNode; style?: React.CSSProperties }) {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay * 1000)
    return () => clearTimeout(t)
  }, [delay])
  return (
    <div style={{
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(18px)',
      transition: 'opacity 0.7s cubic-bezier(0.16,1,0.3,1), transform 0.7s cubic-bezier(0.16,1,0.3,1)',
      ...style,
    }}>
      {children}
    </div>
  )
}
