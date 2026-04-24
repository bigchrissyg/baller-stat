import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { useAlert } from '../components/ui/AlertModal'
import Spinner from '../components/ui/Spinner'

const ROLES = ['Player/Guardian', 'Coach', 'Admin']

const ROLE_STYLES = {
  'Admin':          'bg-violet-100 text-violet-700 border-violet-200',
  'Coach':          'bg-cyan-100 text-cyan-700 border-cyan-200',
  'Player/Guardian':'bg-slate-100 text-slate-600 border-slate-200',
}

const AVATAR_COLORS = [
  'bg-violet-500', 'bg-cyan-500', 'bg-emerald-500', 'bg-amber-500',
  'bg-rose-500', 'bg-indigo-500', 'bg-orange-500', 'bg-teal-500',
]

function hashColor(str) {
  let h = 0
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length]
}

async function callManageUsers(body) {
  const { data, error } = await supabase.functions.invoke('manage-users', { body })
  if (error) throw new Error(error.message)
  if (data?.error) throw new Error(data.error)
  return data
}

function InviteModal({ onClose, onSuccess, showAlert }) {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('Player/Guardian')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await callManageUsers({ action: 'invite', email: email.trim(), role })
      onSuccess(email.trim())
    } catch (err) {
      showAlert(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <h2 className="text-lg font-semibold text-neutral-900 mb-1">Invite User</h2>
        <p className="text-sm text-neutral-500 mb-5">They'll receive an email to set their password and join.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email address</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="name@example.com"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <select
              value={role}
              onChange={e => setRole(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-white"
            >
              {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-neutral-accent hover:bg-neutral-accent/90 rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? 'Sending…' : 'Send Invite'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

const SETUP_SQL = `-- Run this once in your Supabase SQL editor
create table if not exists public.user_roles (
  id          bigserial primary key,
  user_id     uuid        not null unique references auth.users(id) on delete cascade,
  email       text        not null,
  role        text        not null default 'Player/Guardian',
  created_at  timestamptz not null default now()
);

alter table public.user_roles enable row level security;

create policy "Users can read own role"
  on public.user_roles for select
  using (auth.uid() = user_id);`

function SetupInstructions({ error }) {
  const [copied, setCopied] = useState(false)
  const [expanded, setExpanded] = useState(false)

  const isMissingTable = error?.includes('user_roles') || error?.includes('does not exist')
  const isMissingFn    = error?.includes('Function not found') || error?.includes('non-2xx') || error?.includes('Failed to send')

  const copy = () => {
    navigator.clipboard.writeText(SETUP_SQL)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!isMissingTable && !isMissingFn) return null

  return (
    <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-left">
      <p className="text-sm font-semibold text-amber-800 mb-1">
        {isMissingFn ? 'Edge function not deployed' : 'Database table missing'}
      </p>
      <p className="text-xs text-amber-700 mb-3">
        {isMissingFn
          ? 'Deploy the manage-users function: run supabase functions deploy manage-users from the project root.'
          : 'The user_roles table needs to be created in your Supabase project.'}
      </p>
      {isMissingTable && (
        <>
          <button
            onClick={() => setExpanded(v => !v)}
            className="text-xs font-semibold text-amber-800 hover:underline"
          >
            {expanded ? '▲ Hide SQL' : '▼ Show setup SQL'}
          </button>
          {expanded && (
            <div className="mt-2 relative">
              <pre className="bg-amber-900/10 rounded-lg p-3 text-[11px] font-mono text-amber-900 overflow-x-auto whitespace-pre">
                {SETUP_SQL}
              </pre>
              <button
                onClick={copy}
                className="absolute top-2 right-2 text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-200 text-amber-800 hover:bg-amber-300 transition-colors"
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default function Settings() {
  const { user, isAdmin } = useAuth()
  const { showAlert, AlertModal } = useAlert()

  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState(null)
  const [showInvite, setShowInvite] = useState(false)
  const [updatingRole, setUpdatingRole] = useState(null)
  const [confirmRemove, setConfirmRemove] = useState(null)
  const [removing, setRemoving] = useState(null)

  useEffect(() => {
    if (!isAdmin) return
    loadUsers()
  }, [isAdmin])

  const loadUsers = async () => {
    setLoading(true)
    setFetchError(null)
    try {
      const data = await callManageUsers({ action: 'list' })
      setUsers(data.users ?? [])
    } catch (err) {
      setFetchError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSetRole = async (u, role) => {
    setUpdatingRole(u.id)
    try {
      await callManageUsers({ action: 'set-role', userId: u.id, email: u.email, role })
      setUsers(prev => prev.map(x => x.id === u.id ? { ...x, role } : x))
    } catch (err) {
      showAlert(err.message)
    } finally {
      setUpdatingRole(null)
    }
  }

  const handleRemove = async (userId) => {
    setRemoving(userId)
    try {
      await callManageUsers({ action: 'remove', userId })
      setUsers(prev => prev.filter(x => x.id !== userId))
      setConfirmRemove(null)
    } catch (err) {
      showAlert(err.message)
    } finally {
      setRemoving(null)
    }
  }

  const handleInviteSuccess = async (email) => {
    setShowInvite(false)
    showAlert(`Invite sent to ${email}`, 'success')
    await loadUsers()
  }

  if (!isAdmin) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <p className="text-neutral-muted">You don't have permission to view this page.</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-neutral-fg tracking-tight">Settings</h1>
          <p className="text-sm text-neutral-muted mt-0.5">Manage who has access to this application.</p>
        </div>
        <button
          onClick={() => setShowInvite(true)}
          className="flex items-center gap-2 px-4 py-2 bg-neutral-accent text-white text-sm font-semibold rounded-xl hover:bg-neutral-accent/90 transition-colors"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <line x1="19" y1="8" x2="19" y2="14" />
            <line x1="22" y1="11" x2="16" y2="11" />
          </svg>
          Invite User
        </button>
      </div>

      {/* User list */}
      <div className="bg-white rounded-2xl border border-neutral-border overflow-hidden">
        <div className="px-5 py-4 border-b border-neutral-border bg-neutral-secondary/30">
          <h2 className="text-sm font-semibold text-neutral-fg">Users</h2>
          <p className="text-xs text-neutral-muted mt-0.5">{users.length} {users.length === 1 ? 'person' : 'people'} with access</p>
        </div>

        {loading ? (
          <div className="py-12"><Spinner message="Loading users…" /></div>
        ) : fetchError ? (
          <div className="px-5 py-8">
            <p className="text-sm text-rose-600">{fetchError}</p>
            <SetupInstructions error={fetchError} />
            <button onClick={loadUsers} className="mt-4 text-xs text-neutral-accent hover:underline">Retry</button>
          </div>
        ) : (
          <ul className="divide-y divide-neutral-border">
            {users.map(u => (
              <li key={u.id} className="flex items-center gap-4 px-5 py-4">
                {/* Avatar */}
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0 ${hashColor(u.email)}`}>
                  {u.email[0].toUpperCase()}
                </div>

                {/* Email + status */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-neutral-fg truncate">{u.email}</span>
                    {u.id === user?.id && (
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-neutral-muted bg-neutral-secondary px-1.5 py-0.5 rounded">you</span>
                    )}
                    {!u.confirmed && (
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">Pending</span>
                    )}
                  </div>
                  {u.lastSignIn && (
                    <p className="text-xs text-neutral-muted mt-0.5">
                      Last seen {new Date(u.lastSignIn).toLocaleDateString()}
                    </p>
                  )}
                </div>

                {/* Role selector */}
                <div className="shrink-0">
                  {confirmRemove === u.id ? null : (
                    <select
                      value={u.role}
                      disabled={updatingRole === u.id || u.id === user?.id}
                      onChange={e => handleSetRole(u, e.target.value)}
                      className={`text-xs font-semibold px-2.5 py-1 rounded-lg border cursor-pointer appearance-none disabled:cursor-default focus:outline-none focus:ring-2 focus:ring-neutral-accent/40 ${ROLE_STYLES[u.role] ?? ROLE_STYLES['Player/Guardian']}`}
                    >
                      {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  )}
                </div>

                {/* Remove */}
                {u.id !== user?.id && (
                  <div className="shrink-0">
                    {confirmRemove === u.id ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-neutral-muted">Remove?</span>
                        <button
                          onClick={() => handleRemove(u.id)}
                          disabled={removing === u.id}
                          className="text-xs font-semibold text-white bg-rose-500 hover:bg-rose-600 px-2.5 py-1 rounded-lg transition-colors disabled:opacity-50"
                        >
                          {removing === u.id ? '…' : 'Confirm'}
                        </button>
                        <button
                          onClick={() => setConfirmRemove(null)}
                          className="text-xs text-neutral-muted hover:text-neutral-fg transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmRemove(u.id)}
                        className="p-1.5 text-neutral-muted/50 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Remove user"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                          <path d="M10 11v6M14 11v6" />
                          <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                        </svg>
                      </button>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Role legend */}
      <div className="bg-white rounded-2xl border border-neutral-border p-5 space-y-3">
        <h2 className="text-sm font-semibold text-neutral-fg">Roles</h2>
        <div className="space-y-2 text-sm text-neutral-muted">
          <div className="flex items-start gap-3">
            <span className={`text-xs font-semibold px-2 py-0.5 rounded border shrink-0 mt-0.5 ${ROLE_STYLES['Admin']}`}>Admin</span>
            <span>Full access — can edit all match data, manage users, and invite or remove people.</span>
          </div>
          <div className="flex items-start gap-3">
            <span className={`text-xs font-semibold px-2 py-0.5 rounded border shrink-0 mt-0.5 ${ROLE_STYLES['Coach']}`}>Coach</span>
            <span>Can view all data. Coaches may be given edit access by an admin.</span>
          </div>
          <div className="flex items-start gap-3">
            <span className={`text-xs font-semibold px-2 py-0.5 rounded border shrink-0 mt-0.5 ${ROLE_STYLES['Player/Guardian']}`}>Player / Guardian</span>
            <span>Read-only access to stats and match history.</span>
          </div>
        </div>
      </div>

      {showInvite && (
        <InviteModal
          onClose={() => setShowInvite(false)}
          onSuccess={handleInviteSuccess}
          showAlert={showAlert}
        />
      )}

      {AlertModal}
    </div>
  )
}
