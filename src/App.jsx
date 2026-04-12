import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Header from './components/layout/Header'
import Home from './pages/Home'
import MatchDetail from './pages/MatchDetail'
import PlayerList from './pages/PlayerList'
import PlayerProfile from './pages/PlayerProfile'
import './App.css'

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Header />
        <main className="flex-1">
          <Routes>
            <Route path="/"            element={<Home />} />
            <Route path="/matches/:id" element={<MatchDetail />} />
            <Route path="/players"     element={<PlayerList />} />
            <Route path="/players/:id" element={<PlayerProfile />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}
