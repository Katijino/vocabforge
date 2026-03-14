import { Link } from 'react-router-dom'
import { useState } from 'react'
import AnimatedSection from './AnimatedSection'

const serif = "'Instrument Serif', Georgia, serif"
const sans = "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif"

const plans = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    description: 'Great for getting started with vocabulary learning.',
    features: [
      { text: 'Unlimited vocabulary words', included: true },
      { text: '5 AI stories per month', included: true },
      { text: 'SRS flashcard review', included: true },
      { text: 'CSV / Anki import', included: true },
      { text: 'Duolingo sync', included: false },
      { text: 'Priority support', included: false },
    ],
    cta: 'Get Started',
    ctaLink: '/login',
    highlighted: false,
  },
  {
    name: 'Pro',
    price: '$10',
    period: '/month',
    description: 'For serious learners who want unlimited access.',
    badge: 'Popular',
    features: [
      { text: 'Unlimited vocabulary words', included: true },
      { text: 'Unlimited AI stories', included: true },
      { text: 'SRS flashcard review', included: true },
      { text: 'CSV / Anki import', included: true },
      { text: 'Duolingo sync', included: true },
      { text: 'Priority support', included: true },
    ],
    cta: 'Start Free Trial',
    ctaLink: '/login',
    highlighted: true,
    trial: '7-day free trial, then $10/mo',
  },
]

function PricingCard({
  plan,
  delay,
}: {
  plan: (typeof plans)[0]
  delay: number
}) {
  const [hover, setHover] = useState(false)

  return (
    <AnimatedSection delay={delay}>
      <div
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={{
          position: 'relative',
          height: '100%',
          padding: '36px 32px',
          borderRadius: 12,
          border: plan.highlighted
            ? '1px solid rgba(99,102,241,0.25)'
            : '1px solid rgba(255,255,255,0.06)',
          background: plan.highlighted ? 'rgba(99,102,241,0.04)' : 'rgba(255,255,255,0.015)',
          transition: 'border-color 0.3s, background 0.3s',
          ...(hover && !plan.highlighted
            ? { borderColor: 'rgba(255,255,255,0.1)' }
            : {}),
          ...(hover && plan.highlighted
            ? { borderColor: 'rgba(99,102,241,0.4)' }
            : {}),
        }}
      >
        {/* Badge */}
        {plan.badge && (
          <span
            style={{
              position: 'absolute',
              top: -10,
              left: 32,
              fontFamily: sans,
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: '#fff',
              background: '#6366f1',
              padding: '3px 12px',
              borderRadius: 4,
            }}
          >
            {plan.badge}
          </span>
        )}

        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <h3
            style={{
              fontFamily: sans,
              fontSize: 18,
              fontWeight: 600,
              color: '#f1f5f9',
              marginBottom: 12,
            }}
          >
            {plan.name}
          </h3>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
            <span
              style={{
                fontFamily: serif,
                fontSize: 40,
                fontWeight: 400,
                color: '#f1f5f9',
              }}
            >
              {plan.price}
            </span>
            <span style={{ fontFamily: sans, color: '#64748b', fontSize: 14 }}>
              {plan.period}
            </span>
          </div>
          {plan.trial && (
            <p
              style={{
                fontFamily: sans,
                color: '#6366f1',
                fontSize: 13,
                fontWeight: 500,
                marginTop: 8,
              }}
            >
              {plan.trial}
            </p>
          )}
          <p
            style={{
              fontFamily: sans,
              color: '#64748b',
              fontSize: 14,
              marginTop: 8,
              lineHeight: 1.5,
            }}
          >
            {plan.description}
          </p>
        </div>

        {/* Features */}
        <ul style={{ listStyle: 'none', padding: 0, marginBottom: 32 }}>
          {plan.features.map((f) => (
            <li
              key={f.text}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '7px 0',
              }}
            >
              <span
                style={{
                  fontFamily: sans,
                  fontSize: 14,
                  fontWeight: 500,
                  width: 18,
                  textAlign: 'center',
                  flexShrink: 0,
                  color: f.included ? '#6366f1' : '#334155',
                }}
              >
                {f.included ? '✓' : '—'}
              </span>
              <span
                style={{
                  fontFamily: sans,
                  fontSize: 14,
                  color: f.included ? '#94a3b8' : '#334155',
                }}
              >
                {f.text}
              </span>
            </li>
          ))}
        </ul>

        {/* CTA */}
        <Link
          to={plan.ctaLink}
          style={{
            display: 'block',
            textAlign: 'center',
            padding: '13px 0',
            borderRadius: 8,
            fontFamily: sans,
            fontWeight: 600,
            fontSize: 14,
            textDecoration: 'none',
            transition: 'all 0.2s',
            ...(plan.highlighted
              ? {
                  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  color: '#fff',
                  boxShadow: '0 2px 12px rgba(99,102,241,0.25)',
                }
              : {
                  background: 'transparent',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#94a3b8',
                }),
          }}
        >
          {plan.cta}
        </Link>
      </div>
    </AnimatedSection>
  )
}

export default function Pricing() {
  return (
    <section
      id="pricing"
      style={{
        borderTop: '1px solid rgba(255,255,255,0.06)',
        padding: '100px 48px',
      }}
    >
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <AnimatedSection style={{ marginBottom: 56 }}>
          <div
            style={{
              fontSize: 13,
              fontFamily: sans,
              fontWeight: 500,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: '#6366f1',
              marginBottom: 16,
            }}
          >
            Pricing
          </div>
          <h2
            style={{
              fontFamily: serif,
              fontSize: 'clamp(1.75rem, 3vw, 2.5rem)',
              fontWeight: 400,
              color: '#f1f5f9',
              marginBottom: 12,
            }}
          >
            Simple, transparent pricing
          </h2>
          <p
            style={{
              fontFamily: sans,
              color: '#64748b',
              fontSize: 16,
              maxWidth: 400,
              lineHeight: 1.6,
            }}
          >
            Start for free, upgrade when you're ready.
          </p>
        </AnimatedSection>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: 24,
            maxWidth: 700,
          }}
        >
          {plans.map((plan, i) => (
            <PricingCard key={plan.name} plan={plan} delay={i * 0.12} />
          ))}
        </div>
      </div>
    </section>
  )
}
