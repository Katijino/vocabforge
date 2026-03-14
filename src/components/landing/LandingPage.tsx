import Hero from './Hero'
import SocialProof from './SocialProof'
import HowItWorks from './HowItWorks'
import Features from './Features'
import InteractiveDemo from './InteractiveDemo'
import Pricing from './Pricing'
import FinalCTA from './FinalCTA'
import Footer from './Footer'

export default function LandingPage() {
  return (
    <div
      style={{
        background: '#020617',
        color: '#f1f5f9',
        overflowX: 'hidden',
        fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      <Hero />
      <SocialProof />
      <HowItWorks />
      <Features />
      <InteractiveDemo />
      <Pricing />
      <FinalCTA />
      <Footer />
    </div>
  )
}
