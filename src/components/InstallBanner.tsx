import { useState, useEffect } from 'react'

export default function InstallBanner() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent)
    const isStandalone = ('standalone' in window.navigator) && (window.navigator as { standalone?: boolean }).standalone
    const dismissed = localStorage.getItem('install-banner-dismissed')
    if (isIOS && !isStandalone && !dismissed) {
      setShow(true)
    }
  }, [])

  const dismiss = () => {
    localStorage.setItem('install-banner-dismissed', '1')
    setShow(false)
  }

  if (!show) return null

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      background: 'rgba(15,23,42,0.97)',
      borderTop: '1px solid rgba(99,102,241,0.3)',
      backdropFilter: 'blur(20px)',
      padding: '1rem 1.5rem',
      display: 'flex',
      alignItems: 'center',
      gap: '1rem',
      zIndex: 500,
    }}>
      <div style={{ flex: 1 }}>
        <div style={{ color: '#f1f5f9', fontWeight: 600, fontSize: '0.9rem', marginBottom: 2 }}>
          Add VocabForge to Home Screen
        </div>
        <div style={{ color: '#94a3b8', fontSize: '0.8rem' }}>
          Tap <strong style={{ color: '#6366f1' }}>Share</strong> then <strong style={{ color: '#6366f1' }}>Add to Home Screen</strong> for the best experience.
        </div>
      </div>
      <button
        onClick={dismiss}
        style={{
          background: 'transparent',
          border: '1px solid rgba(255,255,255,0.15)',
          borderRadius: 8,
          color: '#94a3b8',
          cursor: 'pointer',
          padding: '0.4rem 0.75rem',
          fontSize: '0.85rem',
          flexShrink: 0,
        }}
      >
        Dismiss
      </button>
    </div>
  )
}
