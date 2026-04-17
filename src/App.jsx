import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Header from './components/layout/Header'
import './App.css'

const Home          = lazy(() => import('./pages/Home'))
const MatchDetail   = lazy(() => import('./pages/MatchDetail'))
const PlayerList    = lazy(() => import('./pages/PlayerList'))
const PlayerProfile = lazy(() => import('./pages/PlayerProfile'))

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-50 flex flex-col">
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
    </BrowserRouter>
  )
}
