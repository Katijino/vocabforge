import { fontSerif, fontSans, useTheme } from '../../hooks/useTheme'
import FadeIn from './FadeIn'

interface PageHeaderProps {
  label?: string
  title: string
  subtitle?: string
  action?: React.ReactNode
}

export default function PageHeader({ label, title, subtitle, action }: PageHeaderProps) {
  const { t } = useTheme()
  return (
    <FadeIn>
      <div style={{ marginBottom: '2.5rem', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
        <div>
          {label && (
            <div style={{ fontFamily: fontSans, fontSize: 12, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#6366f1', marginBottom: 12 }}>
              {label}
            </div>
          )}
          <h1 style={{ fontFamily: fontSerif, fontSize: 'clamp(1.75rem, 3vw, 2.5rem)', fontWeight: 400, color: t.textPrimary, margin: 0, lineHeight: 1.15, letterSpacing: '-0.01em' }}>
            {title}
          </h1>
          {subtitle && (
            <p style={{ fontFamily: fontSans, fontSize: '0.95rem', color: t.textSecondary, margin: '0.6rem 0 0', lineHeight: 1.65 }}>
              {subtitle}
            </p>
          )}
        </div>
        {action && <div style={{ flexShrink: 0 }}>{action}</div>}
      </div>
    </FadeIn>
  )
}
