import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { useAlert } from '../components/ui/AlertModal'
import Spinner from '../components/ui/Spinner'
import SpondLogo from '../components/ui/SpondLogo'

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

async function callSpondSync(body) {
  const { data, error } = await supabase.functions.invoke('spond-sync', { body })
  if (error) throw new Error(error.message)
  if (data?.error) {
    const err = new Error(data.error)
    err.code = data.error  // lets callers check err.code === 'table_missing' etc.
    throw err
  }
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

// ─── Spond SQL setup hint ─────────────────────────────────────────────────────

const SPOND_SETUP_SQL = `create table if not exists public.spond_config (
  id          bigserial primary key,
  created_by  uuid        not null references auth.users(id) on delete cascade,
  spond_email text        not null,
  spond_token text        not null,
  group_id    text,
  group_name  text,
  updated_at  timestamptz not null default now()
);
alter table public.spond_config enable row level security;
create policy "Admins manage spond config"
  on public.spond_config for all
  using (auth.uid() = created_by);`

// ─── Spond connect modal ──────────────────────────────────────────────────────

function SpondConnectModal({ onClose, onSuccess, showAlert }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await callSpondSync({ action: 'connect', email: email.trim(), password })
      onSuccess()
    } catch (err) {
      if (err.code === 'table_missing') {
        showAlert('The spond_config database table is missing. Run the setup SQL in your Supabase dashboard first.')
      } else {
        showAlert(err.message)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-lg font-semibold text-neutral-900">Connect to</span>
          <SpondLogo height={18} color="#00CC52" />
        </div>
        <p className="text-sm text-neutral-500 mb-5">Enter your Spond account credentials. Your password is never stored — only the session token.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Spond email</label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com" required autoComplete="email"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password" value={password} onChange={e => setPassword(e.target.value)}
              required autoComplete="current-password"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-neutral-accent hover:bg-neutral-accent/90 rounded-lg transition-colors disabled:opacity-50">
              {loading ? 'Connecting…' : 'Connect'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Spond fixture row ────────────────────────────────────────────────────────

const TYPE_STYLES = {
  MATCH:    'bg-cyan-100 text-cyan-700 border-cyan-200',
  TRAINING: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  EVENT:    'bg-slate-100 text-slate-600 border-slate-200',
}

function SpondFixtureRow({ fixture }) {
  const start = new Date(fixture.startTimestamp)
  const now = new Date()
  const isPast = start < now

  return (
    <li className={`flex items-center gap-4 px-5 py-3.5 ${isPast ? 'opacity-50' : ''}`}>
      {/* Date */}
      <div className="w-10 text-center shrink-0">
        <p className="text-[10px] font-bold uppercase tracking-wide text-neutral-muted">
          {start.toLocaleDateString('en-GB', { month: 'short' })}
        </p>
        <p className="text-lg font-black text-neutral-fg leading-none">{start.getDate()}</p>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${TYPE_STYLES[fixture.type] ?? TYPE_STYLES.EVENT}`}>
            {fixture.type}
          </span>
          {fixture.cancelled && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded border bg-rose-100 text-rose-600 border-rose-200">
              CANCELLED
            </span>
          )}
        </div>
        <p className={`text-sm font-semibold text-neutral-fg truncate ${fixture.cancelled ? 'line-through' : ''}`}>
          {fixture.heading}
        </p>
        <div className="flex items-center gap-2 mt-0.5 text-xs text-neutral-muted">
          <span>{start.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</span>
          {fixture.location && <><span>·</span><span className="truncate">{fixture.location}</span></>}
        </div>
      </div>

      {/* Responses */}
      <div className="shrink-0 text-right text-xs text-neutral-muted space-y-0.5">
        <p><span className="text-emerald-600 font-semibold">{fixture.responses.accepted}</span> ✓</p>
        <p><span className="text-rose-500 font-semibold">{fixture.responses.declined}</span> ✗</p>
        {fixture.responses.unanswered > 0 && (
          <p><span className="font-semibold">{fixture.responses.unanswered}</span> ?</p>
        )}
      </div>
    </li>
  )
}

// ─── Spond integration section ────────────────────────────────────────────────

function SpondSection({ showAlert }) {
  const [status, setStatus] = useState(null)
  const [groups, setGroups] = useState([])
  const [fixtures, setFixtures] = useState(null)
  const [statusLoading, setStatusLoading] = useState(true)
  const [groupsLoading, setGroupsLoading] = useState(false)
  const [fixturesLoading, setFixturesLoading] = useState(false)
  const [selectingGroup, setSelectingGroup] = useState(false)
  const [pendingGroup, setPendingGroup] = useState(null)  // group chosen, awaiting sub-group pick
  const [savingGroup, setSavingGroup] = useState(null)
  const [showConnect, setShowConnect] = useState(false)
  const [tokenExpired, setTokenExpired] = useState(false)
  const [setupError, setSetupError] = useState(false)
  const [sqlExpanded, setSqlExpanded] = useState(false)
  const [sqlCopied, setSqlCopied] = useState(false)

  useEffect(() => { loadStatus() }, [])

  const handleTokenExpired = () => setTokenExpired(true)

  const loadStatus = async () => {
    setStatusLoading(true)
    try {
      const data = await callSpondSync({ action: 'status' })
      setStatus(data)
      setTokenExpired(false)
      if (data.connected) {
        await loadGroups()
        if (data.groupId) loadFixtures()
        else setSelectingGroup(true)
      }
    } catch (err) {
      if (err.code === 'table_missing') {
        setSetupError(true)
      } else {
        showAlert(err.message)
      }
    } finally {
      setStatusLoading(false)
    }
  }

  const loadGroups = async () => {
    setGroupsLoading(true)
    try {
      const data = await callSpondSync({ action: 'groups' })
      setGroups(data.groups ?? [])
    } catch (err) {
      if (err.code === 'token_expired') handleTokenExpired()
      else showAlert(err.message)
    } finally {
      setGroupsLoading(false)
    }
  }

  const loadFixtures = async () => {
    setFixturesLoading(true)
    try {
      const data = await callSpondSync({ action: 'fixtures' })
      setFixtures(data.fixtures ?? [])
    } catch (err) {
      if (err.code === 'token_expired') handleTokenExpired()
      else showAlert(err.message)
    } finally {
      setFixturesLoading(false)
    }
  }

  const handleGroupSelect = (group) => {
    if (group.subGroups?.length > 0) {
      setPendingGroup(group)  // show sub-group picker next
    } else {
      saveGroup(group.id, group.name, null, null)
    }
  }

  const handleSubGroupSelect = (subGroup) => {
    saveGroup(pendingGroup.id, pendingGroup.name, subGroup?.id ?? null, subGroup?.name ?? null)
  }

  const saveGroup = async (groupId, groupName, subGroupId, subGroupName) => {
    setSavingGroup(groupId)
    try {
      await callSpondSync({ action: 'set-group', groupId, groupName, subGroupId, subGroupName })
      setStatus(s => ({ ...s, groupId, groupName, subGroupId, subGroupName }))
      setSelectingGroup(false)
      setPendingGroup(null)
      setFixtures(null)
      loadFixtures()
    } catch (err) {
      showAlert(err.message)
    } finally {
      setSavingGroup(null)
    }
  }

  const handleConnected = async () => {
    setShowConnect(false)
    setTokenExpired(false)
    await loadStatus()
  }

  const handleDisconnect = async () => {
    try {
      await callSpondSync({ action: 'disconnect' })
      setStatus({ connected: false, email: null, groupId: null, groupName: null, subGroupId: null, subGroupName: null })
      setGroups([])
      setFixtures(null)
      setSelectingGroup(false)
      setPendingGroup(null)
    } catch (err) {
      showAlert(err.message)
    }
  }

  const copySetupSql = () => {
    navigator.clipboard.writeText(SPOND_SETUP_SQL)
    setSqlCopied(true)
    setTimeout(() => setSqlCopied(false), 2000)
  }

  if (statusLoading) {
    return (
      <div className="bg-white rounded-2xl border border-neutral-border p-6">
        <Spinner message="Checking Spond connection…" />
      </div>
    )
  }

  if (setupError) {
    return (
      <div className="bg-white rounded-2xl border border-neutral-border p-5">
        <SpondLogo height={16} color="#374151" className="mb-2" />
        <div className="mt-2 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-semibold text-amber-800 mb-1">Database table missing</p>
          <p className="text-xs text-amber-700 mb-3">Run this SQL in your Supabase editor to enable Spond integration.</p>
          <button onClick={() => setSqlExpanded(v => !v)} className="text-xs font-semibold text-amber-800 hover:underline">
            {sqlExpanded ? '▲ Hide SQL' : '▼ Show setup SQL'}
          </button>
          {sqlExpanded && (
            <div className="mt-2 relative">
              <pre className="bg-amber-900/10 rounded-lg p-3 text-[11px] font-mono text-amber-900 overflow-x-auto whitespace-pre">{SPOND_SETUP_SQL}</pre>
              <button onClick={copySetupSql}
                className="absolute top-2 right-2 text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-200 text-amber-800 hover:bg-amber-300 transition-colors">
                {sqlCopied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }

  const isConnected = status?.connected && !tokenExpired

  return (
    <>
      <div className="bg-white rounded-2xl border border-neutral-border overflow-hidden">

        {/* Header */}
        <div className="px-5 py-4 border-b border-neutral-border bg-neutral-secondary/30 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <SpondLogo height={16} color="#374151" />
              {isConnected && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Connected
                </span>
              )}
              {tokenExpired && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700">
                  Session expired
                </span>
              )}
            </div>
            <p className="text-xs text-neutral-muted mt-0.5 truncate">
              {isConnected
                ? status.email
                : 'Connect your Spond account to sync group fixtures'}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {isConnected && status.groupId && !selectingGroup && (
              <button onClick={() => setSelectingGroup(true)}
                className="text-xs font-medium text-neutral-muted hover:text-neutral-fg transition-colors">
                Change group
              </button>
            )}
            {isConnected && (
              <button onClick={handleDisconnect}
                className="text-xs font-medium text-rose-500 hover:text-rose-600 transition-colors">
                Disconnect
              </button>
            )}
            {(!status?.connected || tokenExpired) && (
              <button onClick={() => setShowConnect(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-neutral-accent hover:bg-neutral-accent/90 rounded-lg transition-colors">
                {tokenExpired ? 'Reconnect' : 'Connect'}
              </button>
            )}
          </div>
        </div>

        {/* Group picker */}
        {isConnected && selectingGroup && !pendingGroup && (
          <div className="px-5 py-4 border-b border-neutral-border">
            <p className="text-xs font-semibold text-neutral-muted uppercase tracking-wide mb-3">Select a group</p>
            {groupsLoading ? (
              <div className="py-4"><Spinner message="Loading groups…" /></div>
            ) : groups.length === 0 ? (
              <p className="text-sm text-neutral-muted py-2">No groups found in your Spond account.</p>
            ) : (
              <ul className="space-y-2">
                {groups.map(g => (
                  <li key={g.id}>
                    <button
                      onClick={() => handleGroupSelect(g)}
                      disabled={savingGroup !== null}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border text-left transition-colors
                        ${status.groupId === g.id && !selectingGroup
                          ? 'border-neutral-accent bg-neutral-accent/5 text-neutral-accent'
                          : 'border-neutral-border bg-white hover:border-neutral-accent/50 hover:bg-neutral-secondary/30 text-neutral-fg'}
                        disabled:opacity-50`}
                    >
                      <div>
                        <span className="text-sm font-medium">{g.name}</span>
                        {g.subGroups?.length > 0 && (
                          <span className="ml-2 text-[10px] text-neutral-muted">{g.subGroups.length} sub-groups</span>
                        )}
                      </div>
                      <span className="text-xs text-neutral-muted shrink-0">{g.memberCount} members</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Sub-group picker */}
        {isConnected && selectingGroup && pendingGroup && (
          <div className="px-5 py-4 border-b border-neutral-border">
            <div className="flex items-center gap-2 mb-3">
              <button onClick={() => setPendingGroup(null)}
                className="text-xs text-neutral-muted hover:text-neutral-fg transition-colors">← Back</button>
              <p className="text-xs font-semibold text-neutral-muted uppercase tracking-wide">
                Select a sub-group in {pendingGroup.name}
              </p>
            </div>
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => handleSubGroupSelect(null)}
                  disabled={savingGroup !== null}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-neutral-border bg-white hover:border-neutral-accent/50 hover:bg-neutral-secondary/30 text-neutral-fg text-left transition-colors disabled:opacity-50"
                >
                  <span className="text-sm font-medium">All sub-groups</span>
                  <span className="text-xs text-neutral-muted">{pendingGroup.memberCount} members</span>
                </button>
              </li>
              {pendingGroup.subGroups.map(sg => (
                <li key={sg.id}>
                  <button
                    onClick={() => handleSubGroupSelect(sg)}
                    disabled={savingGroup !== null}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border text-left transition-colors
                      ${status.subGroupId === sg.id
                        ? 'border-neutral-accent bg-neutral-accent/5 text-neutral-accent'
                        : 'border-neutral-border bg-white hover:border-neutral-accent/50 hover:bg-neutral-secondary/30 text-neutral-fg'}
                      disabled:opacity-50`}
                  >
                    <span className="text-sm font-medium">{sg.name}</span>
                    <span className="text-xs text-neutral-muted shrink-0">{sg.memberCount} members</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Selected group + fixtures */}
        {isConnected && !selectingGroup && status.groupId && (
          <>
            <div className="px-5 py-3 border-b border-neutral-border flex items-center justify-between bg-neutral-secondary/20">
              <div>
                <span className="text-sm font-semibold text-neutral-fg">{status.groupName}</span>
                {status.subGroupName && (
                  <span className="ml-2 text-xs text-neutral-muted">{status.subGroupName}</span>
                )}
              </div>
              <button onClick={loadFixtures} disabled={fixturesLoading}
                className="flex items-center gap-1.5 text-xs font-semibold text-neutral-accent hover:text-neutral-accent/80 transition-colors disabled:opacity-40">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
                  className={`w-3.5 h-3.5 ${fixturesLoading ? 'animate-spin' : ''}`}>
                  <path d="M23 4v6h-6M1 20v-6h6" /><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                </svg>
                Sync
              </button>
            </div>
            {fixturesLoading ? (
              <div className="py-10"><Spinner message="Loading fixtures…" /></div>
            ) : fixtures === null ? null : fixtures.length === 0 ? (
              <p className="px-5 py-8 text-sm text-neutral-muted text-center">No events found in this group.</p>
            ) : (
              <ul className="divide-y divide-neutral-border">
                {fixtures.map(f => <SpondFixtureRow key={f.id} fixture={f} />)}
              </ul>
            )}
          </>
        )}
      </div>

      {showConnect && (
        <SpondConnectModal
          onClose={() => setShowConnect(false)}
          onSuccess={handleConnected}
          showAlert={showAlert}
        />
      )}
    </>
  )
}

// ─── Settings page ────────────────────────────────────────────────────────────

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

      {isAdmin && <SpondSection showAlert={showAlert} />}

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
