import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { Auth } from './components/Auth'
import Header from './components/layout/Header'
import './App.css'

const Home          = lazy(() => import('./pages/Home'))
const MatchDetail   = lazy(() => import('./pages/MatchDetail'))
const PlayerList    = lazy(() => import('./pages/PlayerList'))
const PlayerProfile = lazy(() => import('./pages/PlayerProfile'))

function AppContent() {
  const { user, loading, error } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Authentication Error</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <p className="text-sm text-gray-500">Please check your Supabase configuration and RLS policies.</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Auth />
  }

  return (
    <div className="min-h-screen bg-neutral-bg flex flex-col">
      <Header />
      <main className="flex-1">
        <Suspense fallback={null}>
          <Routes>
            <Route path="/"            element={<Home />} />
            <Route path="/matches/:id" element={<MatchDetail />} />
            <Route path="/players"     element={<PlayerList />} />
            <Route path="/players/:id" element={<PlayerProfile />} />
          </Routes>
        </Suspense>
      </main>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </AuthProvider>
  )
}
