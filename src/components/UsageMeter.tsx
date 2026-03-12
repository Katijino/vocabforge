interface UsageMeterProps {
  used: number
  limit: number
  label: string
}

export default function UsageMeter({ used, limit, label }: UsageMeterProps) {
  const pct = Math.min(100, Math.round((used / limit) * 100))
  const isNearLimit = pct >= 80
  const color = pct >= 100 ? '#ef4444' : isNearLimit ? '#f59e0b' : '#6366f1'

  return (
    <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span>{label}</span>
        <span style={{ color: isNearLimit ? color : '#94a3b8', fontWeight: isNearLimit ? 600 : 400 }}>
          {used} / {limit}
        </span>
      </div>
      <div style={{
        height: 4,
        background: 'rgba(255,255,255,0.08)',
        borderRadius: 2,
        overflow: 'hidden',
      }}>
        <div style={{
          height: '100%',
          width: `${pct}%`,
          background: color,
          borderRadius: 2,
          transition: 'width 0.3s ease',
        }} />
      </div>
    </div>
  )
}
