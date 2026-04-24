import { useState, useRef, useEffect } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useAlert } from '../ui/AlertModal'
import { usePresence } from '../../hooks/usePresence'
import PresenceAvatars from '../ui/PresenceAvatars'

const navClass = (isActive) => isActive
  ? 'bg-neutral-accent text-white text-xs sm:text-[13px] font-semibold px-3 sm:px-[18px] py-[7px] rounded-md tracking-tight shadow-[0_0_0_1px_rgba(14,165,233,0.5),0_2px_8px_rgba(14,165,233,0.35),inset_0_1px_0_rgba(255,255,255,0.2)]'
  : 'text-white/55 text-xs sm:text-[13px] font-medium px-3 sm:px-[14px] py-[7px] rounded-md tracking-tight border border-transparent hover:text-white/90 hover:bg-white/[0.07] hover:border-white/10 transition-all duration-150'

function AccountMenu() {
  const { user, signOut, isAdmin } = useAuth()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const navigate = useNavigate()
  const { showAlert, AlertModal } = useAlert()

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleResetPassword = async () => {
    const { supabase } = await import('../../lib/supabase')
    await supabase.auth.resetPasswordForEmail(user.email, { redirectTo: window.location.origin })
    setOpen(false)
    showAlert('Password reset email sent — check your inbox.', 'success')
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(v => !v)}
        className={`w-8 h-8 rounded-full flex items-center justify-center border transition-all duration-150 ${
          open
            ? 'bg-neutral-accent/20 border-neutral-accent/50 text-white'
            : 'border-white/15 text-white/50 hover:text-white/80 hover:bg-white/[0.07] hover:border-white/25'
        }`}
        aria-label="Account menu"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
          <circle cx="12" cy="8" r="4" />
          <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-[#1a2235] border border-white/10 rounded-lg shadow-xl z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-white/[0.08]">
            <p className="text-[11px] text-white/40 tracking-wide">Signed in as</p>
            <p className="text-[13px] text-white/80 font-medium truncate mt-0.5">{user?.email}</p>
          </div>
          <div className="py-1">
            {isAdmin && (
              <button
                onClick={() => { setOpen(false); navigate('/settings') }}
                className="w-full text-left px-4 py-2.5 text-[13px] text-white/60 hover:text-white hover:bg-white/[0.06] transition-colors flex items-center gap-2.5"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 shrink-0">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                </svg>
                Settings
              </button>
            )}
            <button
              onClick={handleResetPassword}
              className="w-full text-left px-4 py-2.5 text-[13px] text-white/60 hover:text-white hover:bg-white/[0.06] transition-colors flex items-center gap-2.5"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 shrink-0">
                <rect x="3" y="11" width="18" height="11" rx="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              Reset password
            </button>
            <button
              onClick={() => { setOpen(false); signOut() }}
              className="w-full text-left px-4 py-2.5 text-[13px] text-white/60 hover:text-white hover:bg-white/[0.06] transition-colors flex items-center gap-2.5"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 shrink-0">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              Sign out
            </button>
          </div>
        </div>
      )}
      {AlertModal}
    </div>
  )
}

export default function Header() {
  const presenceUsers = usePresence('app:global')

  return (
    <header className="bg-hornets-primary shadow-header border-b border-white/[0.08] relative">
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-neutral-accent/40 to-transparent" />

      <div className="flex items-center justify-between px-3 sm:px-7 h-[60px] gap-2">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 shrink-0">
          <div className="w-9 h-9 rounded-[10px] bg-neutral-accent/20 border border-neutral-accent/35 flex items-center justify-center shrink-0">
            ⚽
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-semibold text-white/90 tracking-tight leading-tight">Histon Hornets Blue</p>
            <p className="text-[11px] text-white/45 tracking-wide">U12 · 2025/26 Season</p>
          </div>
        </Link>

        {/* Nav + presence + account — desktop */}
        <div className="hidden sm:flex items-center gap-3">
          <nav className="flex items-center gap-1">
            <NavLink to="/" end className={({ isActive }) => navClass(isActive)}>Dashboard</NavLink>
            <NavLink to="/players" className={({ isActive }) => navClass(isActive)}>Players</NavLink>
            <NavLink to="/stats" className={({ isActive }) => navClass(isActive)}>Stats</NavLink>
          </nav>

          <div className="w-px h-5 bg-white/10 shrink-0" />

          <PresenceAvatars users={presenceUsers} />

          <div className="w-px h-5 bg-white/10 shrink-0" />

          <AccountMenu />
        </div>

        {/* Presence + account — mobile */}
        <div className="sm:hidden flex items-center gap-2">
          <PresenceAvatars users={presenceUsers} />
          <AccountMenu />
        </div>

      </div>
    </header>
  )
}
