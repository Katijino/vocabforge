import { Routes, Route, Link, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { supabase } from './lib/supabase'
import { useAuthStore } from './stores/authStore'
import { useTheme } from './hooks/useTheme'
import Navbar from './components/Navbar'
import Toast from './components/Toast'
import InstallBanner from './components/InstallBanner'
import Footer from './components/Footer'
import Home from './pages/Home'
import Learn from './pages/Learn'
import Review from './pages/Review'
import Stories from './pages/Stories'
import StoryPage from './pages/StoryPage'
import Import from './pages/Import'
import Settings from './pages/Settings'
import Billing from './pages/Billing'
import Login from './pages/Login'
import Decks from './pages/Decks'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior }) }, [pathname])
  return null
}

function App() {
  const setSession = useAuthStore((s) => s.setSession)
  const { theme, t } = useTheme()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
    return () => subscription.unsubscribe()
  }, [setSession])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: t.bg }}>
      <ScrollToTop />
      <Navbar />
      <Toast />
      <main style={{ flex: 1 }}>
        <Routes>
          <Route path="/"               element={<Home />} />
          <Route path="/learn"          element={<Learn />} />
          <Route path="/review"         element={<Review />} />
          <Route path="/stories"        element={<Stories />} />
          <Route path="/stories/:id"    element={<StoryPage />} />
          <Route path="/import"         element={<Import />} />
          <Route path="/settings"       element={<Settings />} />
          <Route path="/billing"        element={<Billing />} />
          <Route path="/decks"          element={<Decks />} />
          <Route path="/login"          element={<Login />} />
          <Route path="*" element={
            <div style={{ textAlign: 'center', padding: '4rem 1.5rem', color: '#f1f5f9' }}>
              <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '1rem' }}>Page not found</h1>
              <p style={{ color: '#94a3b8', marginBottom: '1.5rem' }}>The page you're looking for doesn't exist.</p>
              <Link to="/" style={{ color: '#a5b4fc', textDecoration: 'underline' }}>Go home</Link>
            </div>
          } />
        </Routes>
      </main>
      <Footer />
      <InstallBanner />
    </div>
  )
}

export default App
