import { useState, useEffect } from 'react'

export function useBreakpoint() {
  const get = () => ({ isMobile: window.innerWidth < 768, isTablet: window.innerWidth < 1024 })
  const [bp, setBp] = useState(get)
  useEffect(() => {
    const h = () => setBp(get())
    window.addEventListener('resize', h)
    return () => window.removeEventListener('resize', h)
  }, [])
  return bp
}
