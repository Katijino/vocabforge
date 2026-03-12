import { Routes, Route } from 'react-router-dom'
import { useEffect } from 'react'
import { supabase } from './lib/supabase'
import { useAuthStore } from './stores/authStore'
import Navbar from './components/Navbar'
import Toast from './components/Toast'
import InstallBanner from './components/InstallBanner'
import Home from './pages/Home'
import Learn from './pages/Learn'
import Review from './pages/Review'
import Stories from './pages/Stories'
import StoryPage from './pages/StoryPage'
import Import from './pages/Import'
import Settings from './pages/Settings'
import Billing from './pages/Billing'
import Login from './pages/Login'

function App() {
  const setSession = useAuthStore((s) => s.setSession)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
    return () => subscription.unsubscribe()
  }, [setSession])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#0f172a' }}>
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
          <Route path="/login"          element={<Login />} />
        </Routes>
      </main>
      <InstallBanner />
    </div>
  )
}

export default App
