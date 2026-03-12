import { useEffect } from 'react'
import { useUIStore } from '../stores/uiStore'

export default function Toast() {
  const { toasts, removeToast } = useUIStore()

  return (
    <div style={{
      position: 'fixed',
      bottom: '1.5rem',
      right: '1.5rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.5rem',
      zIndex: 9999,
    }}>
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onRemove={removeToast} />
      ))}
    </div>
  )
}

function ToastItem({ toast, onRemove }: { toast: { id: string; message: string; type: string }; onRemove: (id: string) => void }) {
  useEffect(() => {
    const timer = setTimeout(() => onRemove(toast.id), 3500)
    return () => clearTimeout(timer)
  }, [toast.id, onRemove])

  const colors = {
    success: { bg: '#22c55e', border: '#16a34a' },
    error: { bg: '#ef4444', border: '#dc2626' },
    info: { bg: '#6366f1', border: '#4f46e5' },
  }
  const c = colors[toast.type as keyof typeof colors] ?? colors.info

  return (
    <div
      onClick={() => onRemove(toast.id)}
      style={{
        background: c.bg,
        border: `1px solid ${c.border}`,
        borderRadius: '10px',
        padding: '0.75rem 1.25rem',
        color: '#fff',
        fontSize: '0.9rem',
        fontWeight: 500,
        cursor: 'pointer',
        boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
        maxWidth: '320px',
        animation: 'slideIn 0.2s ease',
      }}
    >
      {toast.message}
    </div>
  )
}
