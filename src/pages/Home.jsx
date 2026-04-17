import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMatches, useSeasons, useAllPlayersStats } from '../hooks/useData'
import { createMatch } from '../lib/supabase'
import { formatDate, formatDateShort, getMatchResult, getMatchTypeColor, getPositionGroup } from '../lib/utils'
import StatCard from '../components/ui/StatCard'
import Spinner from '../components/ui/Spinner'

const MATCH_TYPES = ['All', 'League', 'Cup', 'Friendly']

const RESULT_PILL = {
  W: 'bg-emerald-500 text-white',
  D: 'bg-amber-400 text-white',
  L: 'bg-rose-500 text-white',
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
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-semibold text-slate-900">Add Fixture</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none">&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1">Opposition *</label>
            <input
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
              value={form.opposition} onChange={e => set('opposition', e.target.value)}
              placeholder="e.g. Arsenal FC" required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1">Date *</label>
              <input type="date"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                value={form.match_date} onChange={e => set('match_date', e.target.value)} required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1">Duration (mins)</label>
              <input type="number" min={10} max={120}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                value={form.match_length_mins} onChange={e => set('match_length_mins', e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1">Type</label>
              <select
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                value={form.match_type} onChange={e => set('match_type', e.target.value)}
              >
                <option>League</option><option>Cup</option><option>Friendly</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1">Venue</label>
              <div className="flex rounded-lg overflow-hidden border border-slate-200">
                {['H', 'A'].map(v => (
                  <button key={v} type="button" onClick={() => set('location', v)}
                    className={`flex-1 py-2 text-sm font-medium transition-colors ${form.location === v ? 'bg-emerald-500 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
                  >{v === 'H' ? 'Home' : 'Away'}</button>
                ))}
              </div>
            </div>
          </div>
          {seasons.length > 0 && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1">Season</label>
              <select
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                value={form.season_id} onChange={e => set('season_id', e.target.value)}
              >
                <option value="">— Select season —</option>
                {seasons.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          )}
          {err && <p className="text-sm text-rose-600 bg-rose-50 rounded-lg px-3 py-2">{err}</p>}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-lg border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">Cancel</button>
            <button type="submit" disabled={saving}
              className="flex-1 py-2.5 rounded-lg bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-600 transition-colors disabled:opacity-50">
              {saving ? 'Creating…' : 'Create Fixture'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Fixture row ──────────────────────────────────────────────────────────────

function FixtureRow({ match }) {
  const navigate = useNavigate()
  const { result } = getMatchResult(match.histon_score, match.opposition_score)
  const hasScore = match.histon_score !== null

  return (
    <button
      onClick={() => navigate(`/matches/${match.id}`)}
      className="w-full text-left bg-white rounded-xl border border-slate-100 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all p-4 sm:p-5 flex items-center gap-4"
    >
      <div className="hidden sm:block w-16 text-center shrink-0">
        <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">
          {match.match_date ? new Date(match.match_date).toLocaleDateString('en-GB', { month: 'short' }) : '—'}
        </p>
        <p className="text-xl font-bold text-slate-800 leading-none">
          {match.match_date ? new Date(match.match_date).getDate() : '—'}
        </p>
      </div>
      <div className="hidden sm:block w-px h-10 bg-slate-100 shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="sm:hidden text-xs text-slate-400">{formatDateShort(match.match_date)}</span>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${getMatchTypeColor(match.match_type)}`}>{match.match_type}</span>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${match.location === 'H' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
            {match.location === 'H' ? 'Home' : 'Away'}
          </span>
        </div>
        <p className="text-base font-semibold text-slate-800 truncate">vs {match.opposition}</p>
        <p className="text-xs text-slate-400 mt-0.5">{match.seasons?.name}</p>
      </div>
      <div className="shrink-0 text-right">
        {hasScore ? (
          <>
            <p className="text-xl font-bold text-slate-800 leading-none">{match.histon_score}–{match.opposition_score}</p>
            <span className={`inline-block mt-1 text-xs font-bold px-2 py-0.5 rounded-full ${RESULT_PILL[result] || 'bg-slate-100 text-slate-600'}`}>{result}</span>
          </>
        ) : (
          <span className="text-sm font-medium text-slate-400">Upcoming</span>
        )}
      </div>
      <svg className="w-4 h-4 text-slate-300 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </button>
  )
}

// ─── Player Stats Table ───────────────────────────────────────────────────────

function computePlayerRow(player, appearances, goals, awards) {
  const apps  = appearances.filter(a => a.player_id === player.id)
  const scored = goals.filter(g => g.scorer_player_id === player.id && g.for_histon)
  const assisted = goals.filter(g => g.assist_player_id === player.id && g.for_histon)
  const playerAwards = awards.filter(a => a.player_id === player.id)

  const matchIds = [...new Set(apps.map(a => a.match_id))]
  const matches  = matchIds.length

  let totalMins = 0, gkMins = 0, defMins = 0, midMins = 0, atkMins = 0
  apps.forEach(a => {
    const m = a.time_end - a.time_start
    totalMins += m
    const g = getPositionGroup(a.position)
    if (g === 'gk')  gkMins  += m
    if (g === 'def') defMins += m
    if (g === 'mid') midMins += m
    if (g === 'atk') atkMins += m
  })

  const avgMins      = matches > 0 ? totalMins / matches : 0
  const goalCount    = scored.length
  const assistCount  = assisted.length
  const awardCount   = playerAwards.length
  const goalsPerGame = matches > 0 ? goalCount   / matches : 0
  const assiPerGame  = matches > 0 ? assistCount / matches : 0

  // Clean quarters as GK / DEF — calculated per segment across all played matches
  // Requires goals to have goal_half + goal_quarter; falls back to 0 if missing.
  const hasGoalTiming = goals.some(g => g.goal_half != null && g.goal_quarter != null)
  let cleanAsGK = 0, cleanAsDEF = 0

  if (hasGoalTiming) {
    apps.forEach(a => {
      const match = a.matches
      if (!match || match.histon_score === null) return
      const grp = getPositionGroup(a.position)
      if (grp !== 'gk' && grp !== 'def') return
      const halfLen = (match.match_length_mins || 60) / 2
      const segLen  = (match.match_length_mins || 60) / 8
      const absStart = a.time_start
      const absEnd   = a.time_end
      for (let i = 0; i < 8; i++) {
        const ss = i * segLen, se = (i + 1) * segLen
        if (absStart >= se || absEnd <= ss) continue
        const segHalf = ss < halfLen ? 'H1' : 'H2'
        const segQ    = ss < halfLen
          ? Math.min(Math.floor(ss / (halfLen / 4)) + 1, 4)
          : Math.min(Math.floor((ss - halfLen) / (halfLen / 4)) + 1, 4)
        const conceded = goals.some(g =>
          g.match_id === a.match_id && !g.for_histon &&
          g.goal_half === segHalf && g.goal_quarter === segQ
        )
        if (!conceded) {
          if (grp === 'gk')  cleanAsGK++
          if (grp === 'def') cleanAsDEF++
        }
      }
    })
  }

  const cleanGKPerGame  = matches > 0 ? cleanAsGK  / matches : 0
  const cleanDEFPerGame = matches > 0 ? cleanAsDEF / matches : 0

  const sortedAwards = [...playerAwards].sort((a, b) =>
    new Date(b.matches?.match_date ?? 0) - new Date(a.matches?.match_date ?? 0)
  )
  const lastAwardDate = sortedAwards[0]?.matches?.match_date ?? null

  return {
    id: player.id, name: player.name,
    gkMins, defMins, midMins, atkMins,
    totalMins, matches,
    minsAttendance: totalMins,
    matchesAttended: matches,
    avgMins,
    goalCount, assistCount,
    cleanAsGK, cleanAsDEF,
    awardCount, lastAwardDate,
    goalsPerGame, assiPerGame,
    cleanGKPerGame, cleanDEFPerGame,
    hasGoalTiming,
  }
}

const fmtDec = (n, dp = 2) => Number(n).toFixed(dp)
const fmtMin = (n) => n > 0 ? `${Math.round(n)}'` : '—'

// Heatmap colour: emerald tint, intensity 0–0.55 scaled to max
const heatBg = (val, max) => {
  if (!max || max === 0 || val <= 0) return undefined
  const intensity = Math.min(val / max, 1) * 0.55
  return { backgroundColor: `rgba(16,185,129,${intensity})` }
}

const COLS = [
  { key: 'gkMins',       label: 'GK',        title: 'Total GK minutes',                    fmt: fmtMin,  heat: true },
  { key: 'defMins',      label: 'DEF',        title: 'Total Defender minutes',              fmt: fmtMin,  heat: true },
  { key: 'midMins',      label: 'MID',        title: 'Total Midfielder minutes',            fmt: fmtMin,  heat: true },
  { key: 'atkMins',      label: 'ATK',        title: 'Total Attacker minutes',              fmt: fmtMin,  heat: true },
  { key: 'totalMins',    label: 'Mins',       title: 'Total minutes played',                fmt: fmtMin,  heat: true },
  { key: 'matches',      label: 'MP',         title: 'Matches played',                      fmt: v => v,  heat: true },
  { key: 'minsAttendance', label: 'Min Att',  title: 'Minutes in attendance',               fmt: fmtMin,  heat: false },
  { key: 'matchesAttended','label': 'M Att',  title: 'Matches attended',                    fmt: v => v,  heat: false },
  { key: 'avgMins',      label: 'Avg',        title: 'Average playing time per match',      fmt: v => v > 0 ? `${fmtDec(v,1)}'` : '—', heat: true },
  { key: 'goalCount',    label: 'G',          title: 'Total goals scored',                  fmt: v => v || '—', heat: true },
  { key: 'assistCount',  label: 'A',          title: 'Total assists',                       fmt: v => v || '—', heat: true },
  { key: 'cleanAsGK',    label: 'CS GK',      title: 'Clean quarters as GK',               fmt: v => v || '—', heat: true, timingNeeded: true },
  { key: 'cleanAsDEF',   label: 'CS DEF',     title: 'Clean quarters as Defender',         fmt: v => v || '—', heat: true, timingNeeded: true },
  { key: 'awardCount',   label: '⭐',          title: 'Star Player awards',                 fmt: v => v || '—', heat: true },
  { key: 'lastAwardDate',label: 'Last ⭐',     title: 'Date of most recent Star Player award', fmt: v => v ? formatDate(v) : '—', heat: false },
  { key: 'goalsPerGame', label: 'G/G',        title: 'Goals per game',                      fmt: v => v > 0 ? fmtDec(v) : '—', heat: true },
  { key: 'assiPerGame',  label: 'A/G',        title: 'Assists per game',                    fmt: v => v > 0 ? fmtDec(v) : '—', heat: true },
  { key: 'cleanGKPerGame', label: 'CS GK/G',  title: 'Clean quarters as GK per game',      fmt: v => v > 0 ? fmtDec(v) : '—', heat: true, timingNeeded: true },
  { key: 'cleanDEFPerGame','label': 'CS D/G', title: 'Clean quarters as DEF per game',     fmt: v => v > 0 ? fmtDec(v) : '—', heat: true, timingNeeded: true },
]

function PlayerStatsTable({ data }) {
  const [sortKey, setSortKey] = useState('totalMins')
  const [sortDir, setSortDir] = useState(-1) // -1 = desc, 1 = asc

  const { appearances, goals, awards, players } = data

  const rows = useMemo(() =>
    players.map(p => computePlayerRow(p, appearances, goals, awards)),
    [players, appearances, goals, awards]
  )

  const sorted = useMemo(() =>
    [...rows].sort((a, b) => {
      const av = a[sortKey] ?? 0, bv = b[sortKey] ?? 0
      if (av === bv) return 0
      return (av > bv ? 1 : -1) * sortDir
    }),
    [rows, sortKey, sortDir]
  )

  const maxes = useMemo(() => {
    const m = {}
    COLS.forEach(c => {
      if (c.heat) m[c.key] = Math.max(...rows.map(r => Number(r[c.key]) || 0))
    })
    return m
  }, [rows])

  const hasTimingData = rows.some(r => r.hasGoalTiming)

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir(d => -d)
    else { setSortKey(key); setSortDir(-1) }
  }

  if (rows.length === 0) return null

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="px-5 sm:px-6 py-4 border-b border-slate-100 flex items-center justify-between">
        <h2 className="text-base font-bold text-slate-800">Player Statistics</h2>
        {!hasTimingData && (
          <span className="text-xs text-slate-400">CS columns require goal timing data</span>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="sticky left-0 bg-slate-50 z-10 text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 whitespace-nowrap min-w-[130px]">
                Player
              </th>
              {COLS.map(col => (
                <th
                  key={col.key}
                  title={col.title}
                  onClick={() => toggleSort(col.key)}
                  className={`px-2 py-3 text-center font-semibold uppercase tracking-wide whitespace-nowrap cursor-pointer select-none transition-colors ${
                    sortKey === col.key
                      ? 'text-emerald-600 bg-emerald-50'
                      : 'text-slate-400 hover:text-slate-600'
                  } ${col.timingNeeded && !hasTimingData ? 'opacity-40' : ''}`}
                >
                  {col.label}
                  {sortKey === col.key && (
                    <span className="ml-0.5 text-[10px]">{sortDir === -1 ? '↓' : '↑'}</span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {sorted.map((row, ri) => (
              <tr key={row.id} className="hover:bg-slate-50 transition-colors group">
                <td className="sticky left-0 bg-white group-hover:bg-slate-50 transition-colors z-10 px-4 py-2.5 font-semibold text-slate-800 whitespace-nowrap">
                  <a href={`/players/${row.id}`} className="hover:text-emerald-600 transition-colors">{row.name}</a>
                </td>
                {COLS.map(col => {
                  const val = row[col.key]
                  const numVal = Number(val) || 0
                  const style = col.heat ? heatBg(numVal, maxes[col.key]) : undefined
                  const isTimingCol = col.timingNeeded && !hasTimingData
                  return (
                    <td
                      key={col.key}
                      style={style}
                      className={`px-2 py-2.5 text-center tabular-nums text-slate-700 whitespace-nowrap ${isTimingCol ? 'opacity-30' : ''}`}
                    >
                      {col.fmt(val)}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="px-5 sm:px-6 py-3 border-t border-slate-100 flex flex-wrap gap-4 text-xs text-slate-400">
        <span>Click column headers to sort</span>
        <span>· Heatmap intensity = relative strength within the squad</span>
      </div>
    </div>
  )
}

// ─── Home page ────────────────────────────────────────────────────────────────

export default function Home() {
  const navigate = useNavigate()
  const { matches, loading, error } = useMatches()
  const { data: statsData, loading: statsLoading } = useAllPlayersStats()
  const [filter, setFilter] = useState('All')
  const [showModal, setShowModal] = useState(false)

  if (loading) return <div className="max-w-5xl mx-auto px-4 py-8"><Spinner message="Loading season data…" /></div>
  if (error) return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-rose-700 text-sm">{error}</div>
    </div>
  )

  // ── Season stats ──────────────────────────────────────────────────────────
  const played = matches.filter(m => m.histon_score !== null)
  const wins   = played.filter(m => m.histon_score > m.opposition_score).length
  const draws  = played.filter(m => m.histon_score === m.opposition_score).length
  const losses = played.filter(m => m.histon_score < m.opposition_score).length
  const gf     = played.reduce((s, m) => s + m.histon_score, 0)
  const ga     = played.reduce((s, m) => s + m.opposition_score, 0)
  const cs     = played.filter(m => m.opposition_score === 0).length

  const recentForm = played.slice(0, 5).map(m =>
    m.histon_score > m.opposition_score ? 'W' :
    m.histon_score < m.opposition_score ? 'L' : 'D'
  )

  // ── Filtered fixtures ─────────────────────────────────────────────────────
  const filtered = filter === 'All' ? matches : matches.filter(m => m.match_type === filter)

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">

      {/* ── Season at a Glance ── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-800">Season at a Glance</h2>
          {recentForm.length > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-400 mr-1">Form</span>
              {recentForm.map((r, i) => (
                <span key={i} className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${RESULT_PILL[r]}`}>{r}</span>
              ))}
            </div>
          )}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <StatCard label="Played"        value={played.length} accent="slate" />
          <StatCard label="Won"           value={wins}   accent="emerald" sub={`${draws}D · ${losses}L`} />
          <StatCard label="Goals For"     value={gf}     accent="blue" />
          <StatCard label="Goals Against" value={ga}     accent="rose" />
          <StatCard label="Clean Sheets"  value={cs}     accent="violet" />
          <StatCard label="Goal Diff"
            value={gf - ga >= 0 ? `+${gf - ga}` : gf - ga}
            accent={gf - ga >= 0 ? 'emerald' : 'rose'}
          />
        </div>
      </section>

      {/* ── Fixtures ── */}
      <section>
        <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
          <div className="flex items-center gap-1 bg-white border border-slate-100 rounded-xl p-1 shadow-sm">
            {MATCH_TYPES.map(t => (
              <button key={t} onClick={() => setFilter(t)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  filter === t ? 'bg-emerald-500 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
              >{t}</button>
            ))}
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Fixture
          </button>
        </div>
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-slate-400 text-sm">
            No {filter !== 'All' ? filter.toLowerCase() : ''} fixtures found
          </div>
        ) : (
          <div className="space-y-2.5">
            {filtered.map(m => <FixtureRow key={m.id} match={m} />)}
          </div>
        )}
      </section>

      {/* ── Player Stats Table ── */}
      <section>
        {statsLoading ? (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8">
            <Spinner message="Loading player statistics…" />
          </div>
        ) : statsData ? (
          <PlayerStatsTable data={statsData} />
        ) : null}
      </section>

      {showModal && (
        <AddFixtureModal
          onClose={() => setShowModal(false)}
          onCreated={(id) => navigate(`/matches/${id}`)}
        />
      )}
    </div>
  )
}
