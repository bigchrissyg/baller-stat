import { useState, useRef, useEffect } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useAlert } from '../ui/AlertModal'

const NAV_ITEMS = [
  {
    to: '/',
    end: true,
    label: 'Dashboard',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    to: '/players',
    label: 'Players',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <circle cx="9" cy="7" r="4" />
        <path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        <path d="M21 21v-2a4 4 0 0 0-3-3.85" />
      </svg>
    ),
  },
  {
    to: '/stats',
    label: 'Stats',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
  },
]

function AccountSheet() {
  const { user, signOut, isAdmin } = useAuth()
  const [open, setOpen] = useState(false)
  const sheetRef = useRef(null)
  const navigate = useNavigate()
  const { showAlert, AlertModal } = useAlert()

  useEffect(() => {
    if (!open) return
    const handler = (e) => { if (sheetRef.current && !sheetRef.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const handleResetPassword = async () => {
    const { supabase } = await import('../../lib/supabase')
    await supabase.auth.resetPasswordForEmail(user.email, { redirectTo: window.location.origin })
    setOpen(false)
    showAlert('Password reset email sent — check your inbox.', 'success')
  }

  return (
    <>
      <button
        onClick={() => setOpen(v => !v)}
        className={`flex-1 flex flex-col items-center justify-center gap-1 py-2.5 text-[10px] font-semibold tracking-wide transition-colors ${
          open ? 'text-neutral-accent' : 'text-white/40 hover:text-white/70'
        }`}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
          <circle cx="12" cy="8" r="4" />
          <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
        </svg>
        Account
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40 bg-black/40" onClick={() => setOpen(false)} />

          {/* Bottom sheet */}
          <div
            ref={sheetRef}
            className="fixed bottom-0 left-0 right-0 z-50 bg-[#1a2235] border-t border-white/10 rounded-t-2xl shadow-2xl"
            style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
          >
            <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mt-3 mb-4" />

            <div className="px-5 pb-2">
              <p className="text-[11px] text-white/40 tracking-wide">Signed in as</p>
              <p className="text-[14px] text-white/80 font-medium truncate mt-0.5">{user?.email}</p>
            </div>

            <div className="border-t border-white/[0.08] mt-3">
              {isAdmin && (
                <button
                  onClick={() => { setOpen(false); navigate('/settings') }}
                  className="w-full text-left px-5 py-4 text-[14px] text-white/70 hover:text-white hover:bg-white/[0.05] transition-colors flex items-center gap-3"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 shrink-0">
                    <circle cx="12" cy="12" r="3" />
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                  </svg>
                  Settings
                </button>
              )}
              <button
                onClick={handleResetPassword}
                className="w-full text-left px-5 py-4 text-[14px] text-white/70 hover:text-white hover:bg-white/[0.05] transition-colors flex items-center gap-3 border-t border-white/[0.06]"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 shrink-0">
                  <rect x="3" y="11" width="18" height="11" rx="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                Reset password
              </button>
              <button
                onClick={() => { setOpen(false); signOut() }}
                className="w-full text-left px-5 py-4 text-[14px] text-white/70 hover:text-white hover:bg-white/[0.05] transition-colors flex items-center gap-3 border-t border-white/[0.06]"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 shrink-0">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                Sign out
              </button>
            </div>
          </div>
        </>
      )}
      {AlertModal}
    </>
  )
}

export default function BottomNav() {
  return (
    <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-hornets-primary border-t border-white/[0.08]"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex items-stretch">
        {NAV_ITEMS.map(({ to, end, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center justify-center gap-1 py-2.5 text-[10px] font-semibold tracking-wide transition-colors ${
                isActive ? 'text-neutral-accent' : 'text-white/40 hover:text-white/70'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span className={isActive ? 'text-neutral-accent' : 'text-white/40'}>{icon}</span>
                {label}
              </>
            )}
          </NavLink>
        ))}

        <AccountSheet />
      </div>
    </nav>
  )
}
