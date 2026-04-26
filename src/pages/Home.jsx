import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useMatches, useSeasons, useLeaguePosition } from '../hooks/useData'
import { supabase, createMatch, updateMatch } from '../lib/supabase'
import { formatDateShort, getMatchResult, getMatchTypeColor } from '../lib/utils'
import StatCard from '../components/ui/StatCard'
import Spinner from '../components/ui/Spinner'
import MatchDayView from '../components/matchday/MatchDayView'
import SpondLogo from '../components/ui/SpondLogo'
import { PieChart, Pie, BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, ReferenceLine } from 'recharts'

const MATCH_TYPES = ['All', 'League', 'Cup', 'Friendly']

const RESULT_PILL = {
  W: 'bg-result-win text-white',
  D: 'bg-result-draw text-white',
  L: 'bg-result-loss text-white',
}

// ─── Add Fixture Modal ────────────────────────────────────────────────────────

function AddFixtureModal({ onClose, onCreated }) {
  const { seasons } = useSeasons()
  const [form, setForm] = useState({
    opposition: '', match_date: '', match_type: 'League',
    location: 'H', match_length_mins: 60, season_id: '',
  })
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState(null)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true); setErr(null)
    try {
      const payload = {
        ...form,
        match_length_mins: Number(form.match_length_mins),
        season_id: form.season_id || null,
        histon_score: null, opposition_score: null,
      }
      const match = await createMatch(payload)
      onCreated(match.id)
    } catch (e) { setErr(e.message); setSaving(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-neutral-card rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-border">
          <h2 className="text-lg font-semibold text-neutral-fg">Add Fixture</h2>
          <button onClick={onClose} className="text-neutral-muted hover:text-neutral-fg text-xl leading-none">&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-neutral-muted mb-1">Opposition *</label>
            <input
              className="w-full border border-neutral-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-accent"
              value={form.opposition} onChange={e => set('opposition', e.target.value)}
              placeholder="e.g. Arsenal FC" required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-neutral-muted mb-1">Date *</label>
              <input type="date"
                className="w-full border border-neutral-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-accent"
                value={form.match_date} onChange={e => set('match_date', e.target.value)} required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-neutral-muted mb-1">Duration (mins)</label>
              <input type="number" min={10} max={120}
                className="w-full border border-neutral-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-accent"
                value={form.match_length_mins} onChange={e => set('match_length_mins', e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-neutral-muted mb-1">Type</label>
              <select
                className="w-full border border-neutral-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-accent"
                value={form.match_type} onChange={e => set('match_type', e.target.value)}
              >
                <option>League</option><option>Cup</option><option>Friendly</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-neutral-muted mb-1">Venue</label>
              <div className="flex rounded-lg overflow-hidden border border-neutral-border">
                {['H', 'A'].map(v => (
                  <button key={v} type="button" onClick={() => set('location', v)}
                    className={`flex-1 py-2 text-sm font-medium transition-colors ${form.location === v ? 'bg-neutral-accent text-neutral-bg' : 'bg-neutral-card text-neutral-fg/70 hover:bg-neutral-secondary'}`}
                  >{v === 'H' ? 'Home' : 'Away'}</button>
                ))}
              </div>
            </div>
          </div>
          {seasons.length > 0 && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-neutral-muted mb-1">Season</label>
              <select
                className="w-full border border-neutral-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-accent"
                value={form.season_id} onChange={e => set('season_id', e.target.value)}
              >
                <option value="">— Select season —</option>
                {seasons.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          )}
          {err && <p className="text-sm text-hornets-tertiary bg-hornets-tertiary/10 rounded-lg px-3 py-2">{err}</p>}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-lg border border-neutral-border text-sm font-medium text-neutral-fg/70 hover:bg-neutral-secondary transition-colors">Cancel</button>
            <button type="submit" disabled={saving}
              className="flex-1 py-2.5 rounded-lg bg-neutral-accent text-neutral-bg text-sm font-semibold hover:bg-neutral-accent/90 transition-colors disabled:opacity-50">
              {saving ? 'Creating…' : 'Create Fixture'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Fixture row ──────────────────────────────────────────────────────────────

function FixtureRow({ match, linkSpondId, onLink }) {
  const navigate = useNavigate()
  const { result } = getMatchResult(match.histon_score, match.opposition_score)
  const hasScore = match.histon_score !== null && match.opposition_score !== null

  return (
    <button
      onClick={() => navigate(`/matches/${match.id}`)}
      className="w-full text-left bg-neutral-surface shadow-card rounded-md hover:shadow-card-hover transition-shadow p-3 sm:p-5 flex items-center gap-2 sm:gap-4"
    >
      <div className="hidden sm:block w-16 text-center shrink-0">
        <p className="text-xs text-neutral-muted font-medium uppercase tracking-wide">
          {match.match_date ? new Date(match.match_date).toLocaleDateString('en-GB', { month: 'short' }) : '—'}
        </p>
        <p className="text-xl font-bold text-neutral-fg leading-none">
          {match.match_date ? new Date(match.match_date).getDate() : '—'}
        </p>
      </div>
      <div className="hidden sm:block w-px h-10 bg-neutral-border shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <span className="sm:hidden text-xs text-neutral-muted">{formatDateShort(match.match_date)}</span>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${getMatchTypeColor(match.match_type)}`}>{match.match_type}</span>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${match.location === 'H' ? 'bg-badge-home-bg text-badge-home-fg' : 'bg-badge-away-bg text-badge-away-fg'}`}>
            {match.location === 'H' ? 'Home' : 'Away'}
          </span>
        </div>
        <p className="text-sm sm:text-base font-semibold text-neutral-fg truncate">vs {match.opposition}</p>
        <p className="text-xs text-neutral-muted mt-0.5">{match.seasons?.name}</p>
      </div>
      {match.spond_event_id ? (
        <span className="shrink-0 inline-flex items-center px-1.5 py-0.5 rounded-full bg-[#00CC52]/10 border border-[#00CC52]/25">
          <SpondLogo height={9} color="#00AA44" />
        </span>
      ) : linkSpondId && (
        <span
          role="button"
          tabIndex={0}
          onClick={e => { e.stopPropagation(); onLink(match.id, linkSpondId) }}
          onKeyDown={e => e.key === 'Enter' && onLink(match.id, linkSpondId)}
          className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-[#00CC52]/40 bg-[#00CC52]/5 hover:bg-[#00CC52]/15 transition-colors cursor-pointer"
        >
          <SpondLogo height={8} color="#00AA44" />
          <span className="text-[10px] font-semibold text-[#00AA44]">Link</span>
        </span>
      )}
      <div className="shrink-0 text-right">
        {hasScore ? (
          <>
            <p className="text-base sm:text-xl font-bold font-mono text-neutral-fg leading-none">{match.histon_score}–{match.opposition_score}</p>
            <span className={`inline-block mt-1 text-xs font-bold px-2 py-0.5 rounded-full ${RESULT_PILL[result] || 'bg-neutral-secondary text-neutral-fg'}`}>{result}</span>
          </>
        ) : (
          <span className="text-sm font-medium text-neutral-muted">Upcoming</span>
        )}
      </div>
      <svg className="w-4 h-4 text-neutral-muted/50 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </button>
  )
}

// ─── Suggested Fixtures ──────────────────────────────────────────────────────

const SUGGEST_CACHE_KEY = 'spond_fixture_check'

function SuggestedFixtures({ onAdded, onLinkable }) {
  const { seasons } = useSeasons()
  const [suggestions, setSuggestions] = useState(undefined) // undefined = loading
  const [checked, setChecked] = useState(new Set())
  const [dismissed, setDismissed] = useState(new Set())
  const [adding, setAdding] = useState(false)
  const [addError, setAddError] = useState(null)

  useEffect(() => {
    const cached = sessionStorage.getItem(SUGGEST_CACHE_KEY)
    if (cached !== null) {
      const result = JSON.parse(cached)
      setSuggestions(result.suggestions ?? [])
      setChecked(new Set((result.suggestions ?? []).map(s => s.spond_id)))
      onLinkable(result.linkable ?? [])
      return
    }
    supabase.functions.invoke('spond-sync', { body: { action: 'suggest' } })
      .then(({ data, error }) => {
        const result = (!error && !data?.error) ? data : { suggestions: [], linkable: [] }
        const toCache = { suggestions: result.suggestions ?? [], linkable: result.linkable ?? [] }
        sessionStorage.setItem(SUGGEST_CACHE_KEY, JSON.stringify(toCache))
        setSuggestions(toCache.suggestions)
        setChecked(new Set(toCache.suggestions.map(s => s.spond_id)))
        onLinkable(toCache.linkable)
      })
      .catch(() => {
        sessionStorage.setItem(SUGGEST_CACHE_KEY, JSON.stringify({ suggestions: [], linkable: [] }))
        setSuggestions([])
      })
  }, [])

  const visible = (suggestions ?? []).filter(s => !dismissed.has(s.spond_id))
  const selectedList = visible.filter(s => checked.has(s.spond_id))

  const toggle = (id) => setChecked(prev => {
    const next = new Set(prev)
    next.has(id) ? next.delete(id) : next.add(id)
    return next
  })

  const toggleAll = () => {
    if (selectedList.length === visible.length) setChecked(new Set())
    else setChecked(new Set(visible.map(s => s.spond_id)))
  }

  const addFixtures = async (list) => {
    const latestSeasonId = [...seasons].sort((a, b) => b.id - a.id)[0]?.id ?? null
    setAdding(true); setAddError(null)
    try {
      for (const s of list) {
        await createMatch({
          opposition: s.opposition,
          match_date: s.match_date,
          match_type: s.match_type,
          location: s.home ? 'H' : 'A',
          match_length_mins: 60,
          season_id: latestSeasonId,
          histon_score: null,
          opposition_score: null,
          spond_event_id: s.spond_id,
        })
        setDismissed(prev => new Set([...prev, s.spond_id]))
      }
      sessionStorage.removeItem(SUGGEST_CACHE_KEY)
      onAdded()
    } catch (err) {
      setAddError(err.message)
    } finally {
      setAdding(false)
    }
  }

  if (suggestions === undefined || !visible.length) return null

  return (
    <section className="rounded-2xl border border-amber-200 overflow-hidden shadow-sm">
      <div className="px-5 py-3 bg-amber-50 border-b border-amber-200 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
          <h3 className="text-sm font-semibold text-amber-900">
            {visible.length} fixture{visible.length !== 1 ? 's' : ''} found in Spond but not logged
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={toggleAll} className="text-xs text-amber-700 hover:text-amber-900 transition-colors">
            {selectedList.length === visible.length ? 'Deselect all' : 'Select all'}
          </button>
          {selectedList.length > 0 && (
            <button
              onClick={() => addFixtures(selectedList)}
              disabled={adding}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-neutral-accent text-white hover:bg-neutral-accent/90 transition-colors disabled:opacity-50"
            >
              {adding ? 'Adding…' : selectedList.length === visible.length ? 'Add all' : `Add ${selectedList.length} selected`}
            </button>
          )}
        </div>
      </div>

      {addError && (
        <p className="px-5 py-2 text-xs text-rose-600 bg-rose-50 border-b border-amber-200">{addError}</p>
      )}

      <ul className="bg-white divide-y divide-amber-100">
        {visible.map(s => (
          <li key={s.spond_id} className="flex items-center gap-3 px-5 py-3">
            <input
              type="checkbox"
              checked={checked.has(s.spond_id)}
              onChange={() => toggle(s.spond_id)}
              className="w-4 h-4 accent-neutral-accent shrink-0"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                <span className="text-xs text-neutral-muted">
                  {new Date(s.match_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${getMatchTypeColor(s.match_type)}`}>
                  {s.match_type}
                </span>
                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${s.home ? 'bg-badge-home-bg text-badge-home-fg' : 'bg-badge-away-bg text-badge-away-fg'}`}>
                  {s.home ? 'Home' : 'Away'}
                </span>
              </div>
              <p className="text-sm font-semibold text-neutral-fg truncate">vs {s.opposition}</p>
            </div>
            <button onClick={() => setDismissed(prev => new Set([...prev, s.spond_id]))}
              className="text-neutral-muted hover:text-neutral-fg text-lg leading-none shrink-0">&times;</button>
          </li>
        ))}
      </ul>
    </section>
  )
}

// ─── Season Form Trend ───────────────────────────────────────────────────────

const RESULT_COLOR = { W: '#00D68F', D: '#94A3B8', L: '#E8354A' }
const RESULT_LABEL = { W: 'Win', D: 'Draw', L: 'Loss' }

function FormTrendChart({ played, leaguePosition, leagueLoading }) {
  if (played.length < 2) return null

  const chartData = [...played].reverse().map((m) => ({
    diff: m.histon_score - m.opposition_score,
    for: m.histon_score,
    against: m.opposition_score,
    result: m.histon_score > m.opposition_score ? 'W' : m.histon_score < m.opposition_score ? 'L' : 'D',
    opposition: m.opposition,
    date: new Date(m.match_date).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' }),
  }))

  const wins   = chartData.filter(d => d.result === 'W').length
  const draws  = chartData.filter(d => d.result === 'D').length
  const losses = chartData.filter(d => d.result === 'L').length

  const FormDot = ({ cx, cy, payload }) => (
    <circle cx={cx} cy={cy} r={6} fill={RESULT_COLOR[payload.result]} stroke="white" strokeWidth={2.5} />
  )

  const FormTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null
    const d = payload[0].payload
    const color = RESULT_COLOR[d.result]
    return (
      <div style={{ backgroundColor: '#0F172A' }} className="border border-white/10 rounded-xl px-4 py-3 shadow-2xl min-w-[170px]">
        <p className="text-white/50 text-xs mb-1 font-medium tracking-wide">{d.date}</p>
        <p className="text-white font-semibold text-sm mb-2.5">vs {d.opposition}</p>
        <div className="flex items-center justify-between gap-3">
          <span className="text-white font-bold font-mono text-xl leading-none">{d.for}–{d.against}</span>
          <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ color, backgroundColor: `${color}30` }}>
            {RESULT_LABEL[d.result]}
          </span>
        </div>
        <p className="text-white/35 text-xs mt-2">GD {d.diff >= 0 ? `+${d.diff}` : d.diff}</p>
      </div>
    )
  }

  return (
    <div className="bg-neutral-surface rounded-2xl border border-neutral-border shadow-card-md overflow-hidden">
      {/* Card header */}
      <div className="px-4 sm:px-6 pt-4 sm:pt-5 pb-0 flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-lg sm:text-2xl font-semibold tracking-tight text-neutral-fg">Season Form</h2>
          <p className="text-xs text-neutral-muted mt-0.5">{chartData.length} matches · goal difference trend</p>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2 pt-1">
          {[
            { count: wins,   color: '#00D68F', textColor: '#059669', label: 'W' },
            { count: draws,  color: '#94A3B8', textColor: '#64748B', label: 'D' },
            { count: losses, color: '#E8354A', textColor: '#E8354A', label: 'L' },
          ].map(({ count, color, textColor, label }) => (
            <span key={label}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold"
              style={{ backgroundColor: `${color}18`, color: textColor }}
            >
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
              {count}{label}
            </span>
          ))}
        </div>
      </div>

      {/* Area chart */}
      <div className="px-2 pb-0 pt-2 h-[170px] sm:h-[240px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 16, right: 24, bottom: 48, left: 10 }}>
            <defs>
              <linearGradient id="formGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor="#0EA5E9" stopOpacity={0.18} />
                <stop offset="100%" stopColor="#0EA5E9" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#E2E8F2" vertical={false} strokeDasharray="0" />
            <ReferenceLine y={0} stroke="#CBD5E1" strokeWidth={1.5} strokeDasharray="5 4" />
            <XAxis
              dataKey="date"
              tick={{ fill: '#94A3B8', fontSize: 11, fontWeight: 500 }}
              angle={-40}
              textAnchor="end"
              height={55}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{ fill: '#94A3B8', fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              width={32}
              tickFormatter={v => v > 0 ? `+${v}` : `${v}`}
            />
            <Tooltip content={<FormTooltip />} cursor={{ stroke: '#CBD5E1', strokeWidth: 1 }} />
            <Area
              type="monotone"
              dataKey="diff"
              stroke="#0EA5E9"
              strokeWidth={2.5}
              fill="url(#formGradient)"
              dot={<FormDot />}
              activeDot={{ r: 8, stroke: 'white', strokeWidth: 2.5, fill: '#0EA5E9' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* League position — FC25 style */}
      <a
        href="https://fulltime.thefa.com/table.html?league=7615527&selectedSeason=995335902&selectedDivision=416593959&selectedCompetition=0&selectedFixtureGroupKey=1_893994731"
        target="_blank"
        rel="noopener noreferrer"
        className="block mt-2 mx-0 rounded-b-2xl overflow-hidden group"
        style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' }}
      >
        {/* Header bar */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-white/[0.07]">
          <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/40">League Table</span>
          <svg className="w-3 h-3 text-white/25 group-hover:text-white/50 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </div>

        {leagueLoading ? (
          <div className="px-4 py-5 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-white/20 animate-pulse" />
            <span className="text-xs text-white/30">Fetching league position…</span>
          </div>
        ) : !leaguePosition?.rows ? (
          <div className="px-4 py-4 text-xs text-white/30">League position unavailable</div>
        ) : (
          <div className="divide-y divide-white/[0.06]">
            {leaguePosition.rows.map((row) => (
              <div
                key={row.position}
                className={`flex items-center gap-3 px-4 py-2.5 transition-colors ${
                  row.isUs
                    ? 'bg-neutral-accent/20'
                    : 'hover:bg-white/[0.03]'
                }`}
              >
                {/* Position */}
                <span className={`w-5 text-center text-sm font-black tabular-nums shrink-0 ${
                  row.isUs ? 'text-neutral-accent' : 'text-white/35'
                }`}>
                  {row.position}
                </span>

                {/* Team name */}
                <span className={`flex-1 text-sm font-semibold truncate ${
                  row.isUs ? 'text-white' : 'text-white/55'
                }`}>
                  {row.isUs ? 'Histon Hornets Blue' : row.team}
                </span>

                {/* P W D L — hidden on very small screens */}
                <div className="hidden xs:flex sm:flex items-center gap-3 shrink-0">
                  {[['P', row.played], ['W', row.won], ['D', row.drawn], ['L', row.lost]].map(([label, val]) => (
                    <div key={label} className="flex flex-col items-center w-5">
                      <span className="text-[9px] font-bold uppercase tracking-widest text-white/25 leading-none">{label}</span>
                      <span className={`text-xs font-bold tabular-nums leading-tight ${row.isUs ? 'text-white/80' : 'text-white/40'}`}>{val}</span>
                    </div>
                  ))}
                </div>

                {/* Points */}
                <div className={`w-8 text-right shrink-0 ${row.isUs ? 'text-white font-black text-sm' : 'text-white/40 font-bold text-sm'}`}>
                  {row.points}
                  <span className="text-[9px] font-semibold text-white/40 ml-0.5">pts</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </a>
    </div>
  )
}

// ─── Home page ────────────────────────────────────────────────────────────────

export default function Home() {
  const navigate = useNavigate()
  const { canEdit } = useAuth()
  const { matches, loading, error } = useMatches()
  const { seasons } = useSeasons()
  const [selectedSeason, setSelectedSeason] = useState('all')
  const [typeFilter, setTypeFilter] = useState('All')
  const [showModal, setShowModal] = useState(false)
  const [showMatchDay, setShowMatchDay] = useState(false)
  const [suggestKey, setSuggestKey] = useState(0)
  const [linkableMap, setLinkableMap] = useState({}) // matchId -> spondEventId
  const [linkedIds, setLinkedIds] = useState(new Set()) // matchIds linked this session

  // FA table URL: use selected season's URL, or fall back to most recent season with one
  const faTableUrl = (() => {
    if (selectedSeason !== 'all') {
      return seasons.find(s => String(s.id) === String(selectedSeason))?.fa_table_url ?? null
    }
    const latestSeasonId = matches.find(m => m.season_id)?.season_id
    return seasons.find(s => s.id === latestSeasonId)?.fa_table_url ?? null
  })()

  const { data: leaguePosition, loading: leagueLoading } = useLeaguePosition(faTableUrl)

  if (loading) return <div className="max-w-5xl mx-auto px-4 py-8"><Spinner message="Loading season data…" /></div>
  if (error) return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="bg-hornets-tertiary/10 border border-hornets-tertiary/30 rounded-xl p-4 text-hornets-tertiary text-sm">{error}</div>
    </div>
  )

  // ── Season filter ─────────────────────────────────────────────────────────
  const seasonMatches = selectedSeason === 'all'
    ? matches
    : matches.filter(m => String(m.season_id) === String(selectedSeason))

  // ── Season stats ──────────────────────────────────────────────────────────
  const played = seasonMatches.filter(m => m.histon_score !== null)
  const wins   = played.filter(m => m.histon_score > m.opposition_score).length
  const draws  = played.filter(m => m.histon_score === m.opposition_score).length
  const losses = played.filter(m => m.histon_score < m.opposition_score).length
  const gf     = played.reduce((s, m) => s + m.histon_score, 0)
  const ga     = played.reduce((s, m) => s + m.opposition_score, 0)
  const cs     = played.filter(m => m.opposition_score === 0).length

  // Calculate clean sheets quarters (quarters with no goals conceded)
  const cleanQuarters = played.reduce((total, match) => {
    const matchLen = match.match_length_mins || 60
    const quarterLen = matchLen / 8  // Each quarter = 2 eighths
    
    let matchCleanQuarters = 0
    // Check each of the 4 quarters in each half (8 total)
    for (const half of ['H1', 'H2']) {
      for (let q = 1; q <= 4; q++) {
        // Check if any goal was conceded in this quarter
        const concededInQuarter = (match.goals || []).some(g => 
          !g.for_histon && g.goal_half === half && g.goal_quarter === q
        )
        
        if (!concededInQuarter) {
          matchCleanQuarters++
        }
      }
    }
    
    return total + matchCleanQuarters
  }, 0)

  const recentForm = played.slice(0, 5).map(m =>
    m.histon_score > m.opposition_score ? 'W' :
    m.histon_score < m.opposition_score ? 'L' : 'D'
  )

  // ── Filtered fixtures ─────────────────────────────────────────────────────
  const filtered = seasonMatches.filter(m => typeFilter === 'All' || m.match_type === typeFilter)
  const upcomingMatches = matches.filter(m => m.histon_score === null)

  const handleLink = async (matchId, spondEventId) => {
    try {
      await updateMatch(matchId, { spond_event_id: spondEventId })
      setLinkedIds(prev => new Set([...prev, matchId]))
      setLinkableMap(prev => { const next = { ...prev }; delete next[matchId]; return next })
    } catch { /* silent — badge just won't appear */ }
  }

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-6 py-4 sm:py-8 space-y-4 sm:space-y-8">

      {/* ── Season selector ── */}
      {seasons.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold uppercase tracking-widest text-neutral-muted shrink-0">Season</span>
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => setSelectedSeason('all')}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                selectedSeason === 'all'
                  ? 'bg-neutral-fg text-white'
                  : 'bg-neutral-surface border border-neutral-border text-neutral-muted hover:text-neutral-fg'
              }`}
            >All</button>
            {[...seasons].reverse().map(s => (
              <button
                key={s.id}
                onClick={() => setSelectedSeason(String(s.id))}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                  String(selectedSeason) === String(s.id)
                    ? 'bg-neutral-accent text-white'
                    : 'bg-neutral-surface border border-neutral-border text-neutral-muted hover:text-neutral-fg'
                }`}
              >{s.name}</button>
            ))}
          </div>
        </div>
      )}

      {/* ── Season Form Trend ── */}
      {played.length > 1 && (
        <section>
          <FormTrendChart played={played} leaguePosition={leaguePosition} leagueLoading={leagueLoading} />
        </section>
      )}

      {/* ── Season at a Glance ── */}
      <section>
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <h2 className="text-lg sm:text-2xl font-semibold tracking-tight text-neutral-fg">Season at a Glance</h2>
          {recentForm.length > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-neutral-muted mr-1">Form</span>
              {recentForm.map((r, i) => (
                <span key={i} className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${RESULT_PILL[r]}`}>{r}</span>
              ))}
            </div>
          )}
        </div>
        <div className="grid grid-cols-4 sm:grid-cols-4 lg:grid-cols-7 gap-2 sm:gap-3">
          <StatCard label="Played"        value={played.length} accent="accent" />
          <StatCard label="Won"           value={wins}   accent="primary" sub={`${draws}D · ${losses}L`} />
          <StatCard label="Goals For"     value={gf}     accent="secondary" />
          <StatCard label="Goals Against" value={ga}     accent="tertiary" />
          <StatCard label="Clean Sheets"  value={cs}     accent="quaternary" />
          <StatCard label="Clean Quarters" value={cleanQuarters} accent="violet" />
          <StatCard label="Goal Diff"
            value={gf - ga >= 0 ? `+${gf - ga}` : gf - ga}
            accent={gf - ga >= 0 ? 'secondary' : 'tertiary'}
          />
        </div>
      </section>

      {/* ── Suggested fixtures from Spond ── */}
      {canEdit && (
        <SuggestedFixtures
          key={suggestKey}
          onAdded={() => { sessionStorage.removeItem(SUGGEST_CACHE_KEY); setSuggestKey(k => k + 1); navigate(0) }}
          onLinkable={list => setLinkableMap(Object.fromEntries(list.map(l => [l.match_id, l.spond_id])))}
        />
      )}

      {/* ── Fixtures ── */}
      <section>
        {/* Match Day View CTA — only when upcoming fixtures exist */}
        {upcomingMatches.length > 0 && <button
          onClick={() => setShowMatchDay(true)}
          className="w-full mb-3 sm:mb-4 flex items-center gap-4 px-5 py-4 rounded-2xl hover:brightness-110 transition-all shadow-lg text-left"
          style={{ background: 'linear-gradient(135deg, #0d1e3f 0%, #1a3260 100%)' }}
        >
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-blue-300">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <circle cx="8"  cy="8"  r="1.5" fill="currentColor" stroke="none" />
              <circle cx="16" cy="8"  r="1.5" fill="currentColor" stroke="none" />
              <circle cx="12" cy="8"  r="1.5" fill="currentColor" stroke="none" />
              <circle cx="8"  cy="17" r="1.5" fill="currentColor" stroke="none" />
              <circle cx="16" cy="17" r="1.5" fill="currentColor" stroke="none" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white">Match Day View</p>
            <p className="text-xs text-white/45 mt-0.5">Lineup · Roles · Pitch formations</p>
          </div>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-white/25 shrink-0">
            <path d="M9 5l7 7-7 7" />
          </svg>
        </button>}

        <div className="flex items-center justify-between gap-2 mb-3 sm:mb-4 flex-wrap">
          <div className="flex items-center gap-1 bg-neutral-surface shadow-card rounded-lg p-1">
            {MATCH_TYPES.map(t => (
              <button key={t} onClick={() => setTypeFilter(t)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  typeFilter === t ? 'bg-neutral-accent text-white' : 'text-neutral-secondary hover:text-neutral-fg'
                }`}
              >{t}</button>
            ))}
          </div>
          {canEdit && (
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-neutral-accent hover:bg-neutral-accent/90 text-white text-sm font-semibold rounded-lg transition-colors shadow-btn"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Fixture
            </button>
          )}
        </div>
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-neutral-muted text-sm">
            No {typeFilter !== 'All' ? typeFilter.toLowerCase() : ''} fixtures found
          </div>
        ) : (
          <div className="space-y-1.5 sm:space-y-2.5">
            {filtered.map(m => (
              <FixtureRow
                key={m.id}
                match={linkedIds.has(m.id) ? { ...m, spond_event_id: linkableMap[m.id] ?? 'linked' } : m}
                linkSpondId={!m.spond_event_id && !linkedIds.has(m.id) ? linkableMap[m.id] : null}
                onLink={handleLink}
              />
            ))}
          </div>
        )}
      </section>

      {/* ── Season Charts ── */}
      {played.length > 0 && (
        <section>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Results Distribution */}
            <div className="bg-gradient-to-br from-result-win/5 to-result-loss/5 rounded-2xl border border-neutral-border shadow-sm p-4 sm:p-6">
              <h3 className="text-base sm:text-2xl font-semibold tracking-tight text-neutral-fg mb-3 sm:mb-6">Results Distribution</h3>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Wins', value: wins, fill: '#10b981' },
                      { name: 'Draws', value: draws, fill: '#6b7280' },
                      { name: 'Losses', value: losses, fill: '#ef4444' },
                    ]}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    <Cell fill="#10b981" />
                    <Cell fill="#6b7280" />
                    <Cell fill="#ef4444" />
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#111827',
                      border: '1px solid #cbd5e1',
                      borderRadius: '8px',
                      color: '#f8fafc'
                    }}
                    formatter={(value) => [`${value} matches`, '']}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Goals Comparison */}
            <div className="bg-gradient-to-br from-hornets-secondary/5 to-hornets-tertiary/5 rounded-2xl border border-neutral-border shadow-sm p-4 sm:p-6">
              <h3 className="text-base sm:text-2xl font-semibold tracking-tight text-neutral-fg mb-3 sm:mb-6">Goals & Defence Analysis</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={[
                  { category: 'Goals For', value: gf, fill: '#06b6d4' },
                  { category: 'Goals Against', value: ga, fill: '#f97316' },
                  { category: 'Clean Quarters', value: cleanQuarters, fill: '#8b5cf6' },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />
                  <XAxis dataKey="category" stroke="#64748b" />
                  <YAxis stroke="#64748b" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#111827',
                      border: '1px solid #cbd5e1',
                      borderRadius: '8px',
                      color: '#f8fafc'
                    }}
                    formatter={(value, name) => {
                      if (name === 'value') {
                        return [value, 'Count']
                      }
                      return [value, name]
                    }}
                  />
                  <Bar dataKey="value" fill="#1e3a8a" radius={[8, 8, 0, 0]}>
                    {[
                      { fill: '#06b6d4' },
                      { fill: '#f97316' },
                      { fill: '#8b5cf6' },
                    ].map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <p className="text-xs text-neutral-muted mt-4">
                Clean Quarters: Quarters across all matches with zero goals conceded
              </p>
            </div>

          </div>
        </section>
      )}

      {canEdit && showModal && (
        <AddFixtureModal
          onClose={() => setShowModal(false)}
          onCreated={(id) => navigate(`/matches/${id}`)}
        />
      )}

      {showMatchDay && (
        <MatchDayView matches={upcomingMatches} onClose={() => setShowMatchDay(false)} />
      )}
    </div>
  )
}
