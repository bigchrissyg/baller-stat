import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMatches, useSeasons, useAllPlayersStats } from '../hooks/useData'
import { createMatch } from '../lib/supabase'
import { formatDate, formatDateShort, getMatchResult, getMatchTypeColor, getPositionGroup } from '../lib/utils'
import StatCard from '../components/ui/StatCard'
import Spinner from '../components/ui/Spinner'
import { PieChart, Pie, BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, ReferenceLine } from 'recharts'

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

function FixtureRow({ match }) {
  const navigate = useNavigate()
  const { result } = getMatchResult(match.histon_score, match.opposition_score)
  const hasScore = match.histon_score !== null && match.opposition_score !== null

  return (
    <button
      onClick={() => navigate(`/matches/${match.id}`)}
      className="w-full text-left bg-neutral-card rounded-xl border border-neutral-border shadow-sm hover:shadow-md hover:border-neutral-accent/30 transition-all p-4 sm:p-5 flex items-center gap-4"
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
        <div className="flex items-center gap-2 mb-1">
          <span className="sm:hidden text-xs text-neutral-muted">{formatDateShort(match.match_date)}</span>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${getMatchTypeColor(match.match_type)}`}>{match.match_type}</span>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${match.location === 'H' ? 'bg-hornets-secondary/20 text-hornets-secondary' : 'bg-hornets-tertiary/20 text-hornets-tertiary'}`}>
            {match.location === 'H' ? 'Home' : 'Away'}
          </span>
        </div>
        <p className="text-base font-semibold text-neutral-fg truncate">vs {match.opposition}</p>
        <p className="text-xs text-neutral-muted mt-0.5">{match.seasons?.name}</p>
      </div>
      <div className="shrink-0 text-right">
        {hasScore ? (
          <>
            <p className="text-xl font-bold text-neutral-fg leading-none">{match.histon_score}–{match.opposition_score}</p>
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
  // Requires goals to have half + quarter; falls back to 0 if missing.
  const hasGoalTiming = goals.some(g => g.half != null && g.quarter != null)
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
          g.half === segHalf && parseInt(g.quarter.replace('Q', '')) === segQ
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

// Heatmap colour: warm terracotta tint, intensity 0–0.55 scaled to max
const heatBg = (val, max) => {
  if (!max || max === 0 || val <= 0) return undefined
  const intensity = Math.min(val / max, 1) * 0.55
  return { backgroundColor: `rgba(201, 100, 66, ${intensity})` }
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

// ─── Top Performer Card ──────────────────────────────────────────────────────

function TopPerformerCard({ player, stat, value, icon, color, suffix = '' }) {
  return (
    <div className={`bg-gradient-to-br ${color} rounded-xl p-4 text-white relative overflow-hidden`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-lg">{icon}</span>
          <span className="text-xs font-medium uppercase tracking-wide opacity-90">{stat}</span>
        </div>
        <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full font-medium">
          #{player.rank}
        </span>
      </div>
      <div className="mb-1">
        <h4 className="font-bold text-sm truncate">{player.name}</h4>
      </div>
      <div className="text-xl font-black">
        {value}{suffix}
      </div>
      <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-white/10 rounded-full"></div>
    </div>
  )
}

// ─── Stats Overview Cards ────────────────────────────────────────────────────

function StatsOverview({ rows }) {
  const hasTimingData = rows.some(r => r.hasGoalTiming)
  const topMinutes = [...rows].sort((a, b) => b.totalMins - a.totalMins)[0]
  const topGoals = [...rows].sort((a, b) => b.goalCount - a.goalCount)[0]
  const topAssists = [...rows].sort((a, b) => b.assistCount - a.assistCount)[0]
  const topAwards = [...rows].sort((a, b) => b.awardCount - a.awardCount)[0]

  // Calculate clean quarters for defensive players (positions ending in B)
  const topCleanDefensive = [...rows]
    .map(row => ({
      ...row,
      cleanDefensiveQuarters: row.cleanAsDEF // This already represents clean quarters as defender
    }))
    .filter(row => row.cleanDefensiveQuarters > 0)
    .sort((a, b) => b.cleanDefensiveQuarters - a.cleanDefensiveQuarters)[0]

  return (
    <div className="space-y-6">
      {/* Top Performers Grid */}
      <div>
        <h3 className="text-sm font-semibold text-neutral-fg mb-4">Top Performers</h3>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {topMinutes && (
            <TopPerformerCard
              player={{ name: topMinutes.name, rank: 1 }}
              stat="Minutes"
              value={Math.round(topMinutes.totalMins)}
              icon="⏱️"
              color="from-blue-500 to-blue-600"
              suffix="'"
            />
          )}
          {topGoals && topGoals.goalCount > 0 && (
            <TopPerformerCard
              player={{ name: topGoals.name, rank: 1 }}
              stat="Goals"
              value={topGoals.goalCount}
              icon="⚽"
              color="from-green-500 to-green-600"
            />
          )}
          {topAssists && topAssists.assistCount > 0 && (
            <TopPerformerCard
              player={{ name: topAssists.name, rank: 1 }}
              stat="Assists"
              value={topAssists.assistCount}
              icon="🎯"
              color="from-purple-500 to-purple-600"
            />
          )}
          {topAwards && topAwards.awardCount > 0 && (
            <TopPerformerCard
              player={{ name: topAwards.name, rank: 1 }}
              stat="Star Player"
              value={topAwards.awardCount}
              icon="⭐"
              color="from-yellow-500 to-yellow-600"
            />
          )}
          {topCleanDefensive ? (
            <TopPerformerCard
              player={{ name: topCleanDefensive.name, rank: 1 }}
              stat="Clean Quarters"
              value={topCleanDefensive.cleanDefensiveQuarters}
              icon="🛡️"
              color="from-red-500 to-red-600"
            />
          ) : hasTimingData ? null : (
            <div className="bg-neutral-card border border-neutral-border rounded-lg p-4 text-center">
              <div className="text-2xl mb-2">🛡️</div>
              <div className="text-sm font-semibold text-neutral-fg mb-1">Clean Quarters</div>
              <div className="text-xs text-neutral-fg/60">Requires goal timing data</div>
            </div>
          )}
        </div>
      </div>

      {/* Team Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-neutral-secondary/50 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-neutral-accent mb-1">
            {rows.length}
          </div>
          <div className="text-xs text-neutral-muted font-medium uppercase tracking-wide">
            Total Players
          </div>
        </div>
        <div className="bg-neutral-secondary/50 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-hornets-secondary mb-1">
            {rows.reduce((sum, r) => sum + r.matches, 0)}
          </div>
          <div className="text-xs text-neutral-muted font-medium uppercase tracking-wide">
            Total Appearances
          </div>
        </div>
        <div className="bg-neutral-secondary/50 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-hornets-tertiary mb-1">
            {rows.reduce((sum, r) => sum + r.goalCount, 0)}
          </div>
          <div className="text-xs text-neutral-muted font-medium uppercase tracking-wide">
            Total Goals
          </div>
        </div>
        <div className="bg-neutral-secondary/50 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-hornets-quaternary mb-1">
            {rows.reduce((sum, r) => sum + r.awardCount, 0)}
          </div>
          <div className="text-xs text-neutral-muted font-medium uppercase tracking-wide">
            Star Awards
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Compact Stats Table ─────────────────────────────────────────────────────

function CompactStatsTable({ rows, columns, title, hasTimingData }) {
  const [sortKey, setSortKey] = useState(columns[0].key)
  const [sortDir, setSortDir] = useState(-1)

  const sorted = useMemo(() =>
    [...rows].sort((a, b) => {
      const av = a[sortKey] ?? 0, bv = b[sortKey] ?? 0
      if (av === bv) return 0
      return (av > bv ? 1 : -1) * sortDir
    }),
    [rows, sortKey, sortDir]
  )

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir(d => -d)
    else { setSortKey(key); setSortDir(-1) }
  }

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-neutral-fg">{title}</h3>
      <div className="bg-neutral-card rounded-xl border border-neutral-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-neutral-secondary/50 border-b border-neutral-border">
                <th className="sticky left-0 bg-neutral-secondary/50 z-10 text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide text-neutral-muted whitespace-nowrap min-w-[140px]">
                  Player
                </th>
                {columns.map(col => (
                  <th
                    key={col.key}
                    title={col.title}
                    onClick={() => toggleSort(col.key)}
                    className={`px-3 py-3 text-center font-semibold uppercase tracking-wide whitespace-nowrap cursor-pointer select-none transition-colors ${
                      sortKey === col.key
                        ? 'text-neutral-accent bg-neutral-accent/10'
                        : 'text-neutral-muted hover:text-neutral-fg'
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
            <tbody className="divide-y divide-neutral-border/50">
              {sorted.map((row) => (
                <tr key={row.id} className="hover:bg-neutral-secondary/30 transition-colors group">
                  <td className="sticky left-0 bg-neutral-card group-hover:bg-neutral-secondary/30 transition-colors z-10 px-4 py-3 font-semibold text-neutral-fg whitespace-nowrap">
                    <a href={`/players/${row.id}`} className="hover:text-neutral-accent transition-colors">{row.name}</a>
                  </td>
                  {columns.map(col => {
                    const val = row[col.key]
                    const isTimingCol = col.timingNeeded && !hasTimingData
                    return (
                      <td
                        key={col.key}
                        className={`px-3 py-3 text-center tabular-nums text-neutral-fg/80 whitespace-nowrap ${isTimingCol ? 'opacity-30' : ''}`}
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
      </div>
    </div>
  )
}

function PlayerStatsTable({ data }) {
  const [activeTab, setActiveTab] = useState('overview')

  const { appearances, goals, awards, players } = data

  const rows = useMemo(() =>
    players.map(p => computePlayerRow(p, appearances, goals, awards)),
    [players, appearances, goals, awards]
  )

  const hasTimingData = rows.some(r => r.hasGoalTiming)

  if (rows.length === 0) return null

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'playing-time', label: 'Playing Time', icon: '⏱️' },
    { id: 'attacking', label: 'Attacking', icon: '⚽' },
    { id: 'defensive', label: 'Defensive', icon: '🛡️' },
  ]

  const playingTimeCols = [
    { key: 'totalMins', label: 'Total Mins', title: 'Total minutes played', fmt: v => v > 0 ? `${Math.round(v)}'` : '—' },
    { key: 'matches', label: 'MP', title: 'Matches played', fmt: v => v },
    { key: 'avgMins', label: 'Avg/Match', title: 'Average playing time per match', fmt: v => v > 0 ? `${fmtDec(v,1)}'` : '—' },
    { key: 'gkMins', label: 'GK Mins', title: 'Minutes as goalkeeper', fmt: v => v > 0 ? `${Math.round(v)}'` : '—' },
    { key: 'defMins', label: 'DEF Mins', title: 'Minutes as defender', fmt: v => v > 0 ? `${Math.round(v)}'` : '—' },
    { key: 'midMins', label: 'MID Mins', title: 'Minutes as midfielder', fmt: v => v > 0 ? `${Math.round(v)}'` : '—' },
    { key: 'atkMins', label: 'ATK Mins', title: 'Minutes as attacker', fmt: v => v > 0 ? `${Math.round(v)}'` : '—' },
  ]

  const attackingCols = [
    { key: 'goalCount', label: 'Goals', title: 'Total goals scored', fmt: v => v || '—' },
    { key: 'assistCount', label: 'Assists', title: 'Total assists', fmt: v => v || '—' },
    { key: 'goalsPerGame', label: 'G/Match', title: 'Goals per game', fmt: v => v > 0 ? fmtDec(v, 2) : '—' },
    { key: 'assiPerGame', label: 'A/Match', title: 'Assists per game', fmt: v => v > 0 ? fmtDec(v, 2) : '—' },
  ]

  const defensiveCols = [
    { key: 'cleanAsGK', label: 'CS GK', title: 'Clean quarters as GK', fmt: v => v || '—', timingNeeded: true },
    { key: 'cleanAsDEF', label: 'CS DEF', title: 'Clean quarters as Defender', fmt: v => v || '—', timingNeeded: true },
    { key: 'cleanGKPerGame', label: 'CS GK/Match', title: 'Clean quarters as GK per game', fmt: v => v > 0 ? fmtDec(v, 2) : '—', timingNeeded: true },
    { key: 'cleanDEFPerGame', label: 'CS DEF/Match', title: 'Clean quarters as DEF per game', fmt: v => v > 0 ? fmtDec(v, 2) : '—', timingNeeded: true },
  ]

  return (
    <div className="bg-neutral-card rounded-2xl border border-neutral-border shadow-sm overflow-hidden">
      <div className="px-5 sm:px-6 py-4 border-b border-neutral-border flex items-center justify-between">
        <h2 className="text-base font-bold text-neutral-fg">Player Statistics</h2>
        {!hasTimingData && (
          <span className="text-xs text-neutral-muted">CS columns require goal timing data</span>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="px-5 sm:px-6 py-3 border-b border-neutral-border">
        <div className="flex gap-1 overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'bg-neutral-accent text-neutral-bg shadow-sm'
                  : 'text-neutral-muted hover:text-neutral-fg hover:bg-neutral-secondary'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-5 sm:p-6">
        {activeTab === 'overview' && (
          <StatsOverview rows={rows} />
        )}

        {activeTab === 'playing-time' && (
          <CompactStatsTable
            rows={rows}
            columns={playingTimeCols}
            title="Playing Time Statistics"
            hasTimingData={hasTimingData}
          />
        )}

        {activeTab === 'attacking' && (
          <CompactStatsTable
            rows={rows}
            columns={attackingCols}
            title="Attacking Statistics"
            hasTimingData={hasTimingData}
          />
        )}

        {activeTab === 'defensive' && (
          <CompactStatsTable
            rows={rows}
            columns={defensiveCols}
            title="Defensive Statistics"
            hasTimingData={hasTimingData}
          />
        )}
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
      <div className="bg-hornets-tertiary/10 border border-hornets-tertiary/30 rounded-xl p-4 text-hornets-tertiary text-sm">{error}</div>
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
  const filtered = filter === 'All' ? matches : matches.filter(m => m.match_type === filter)

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">

      {/* ── Season at a Glance ── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-neutral-fg">Season at a Glance</h2>
          {recentForm.length > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-neutral-muted mr-1">Form</span>
              {recentForm.map((r, i) => (
                <span key={i} className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${RESULT_PILL[r]}`}>{r}</span>
              ))}
            </div>
          )}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
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

        {/* ── Season Charts ── */}
        {played.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
            {/* Results Distribution */}
            <div className="bg-gradient-to-br from-result-win/5 to-result-loss/5 rounded-2xl border border-neutral-border shadow-sm p-6">
              <h3 className="text-base font-bold text-neutral-fg mb-6">Results Distribution</h3>
              <ResponsiveContainer width="100%" height={280}>
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
            <div className="bg-gradient-to-br from-hornets-secondary/5 to-hornets-tertiary/5 rounded-2xl border border-neutral-border shadow-sm p-6">
              <h3 className="text-base font-bold text-neutral-fg mb-6">Goals & Defence Analysis</h3>
              <ResponsiveContainer width="100%" height={280}>
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

            {/* Match Timeline */}
            {played.length > 1 && (
              <div className="lg:col-span-2 bg-gradient-to-br from-neutral-accent/5 to-hornets-primary/5 rounded-2xl border border-neutral-border shadow-sm p-6">
                <h3 className="text-base font-bold text-neutral-fg mb-6">Season Form Trend</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={[...played].reverse().map((m, i) => {
                    const { result } = getMatchResult(m.histon_score, m.opposition_score)
                    return {
                      match: i + 1,
                      score: m.histon_score - m.opposition_score,
                      for: m.histon_score,
                      against: m.opposition_score,
                      result,
                      date: new Date(m.match_date).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' }),
                    }
                  })}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />
                    <XAxis dataKey="date" stroke="#64748b" angle={-45} textAnchor="end" height={80} />
                    <YAxis stroke="#64748b" label={{ value: 'Goal Difference', angle: -90, position: 'insideLeft' }} />
                    <ReferenceLine y={0} stroke="#64748b" strokeWidth={2} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#111827',
                        border: '1px solid #cbd5e1',
                        borderRadius: '8px',
                        color: '#f8fafc'
                      }}
                      formatter={(value, name) => {
                        if (name === 'score') return [value, 'Goal Diff']
                        return [value, name]
                      }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="score"
                      stroke="#06b6d4"
                      strokeWidth={3}
                      dot={(props) => {
                        const { cx, cy, payload } = props
                        const color = payload.result === 'W' ? '#10b981' : payload.result === 'L' ? '#ef4444' : '#6b7280'
                        return (
                          <circle cx={cx} cy={cy} r={5} fill={color} stroke="white" strokeWidth={2} />
                        )
                      }}
                      activeDot={{ r: 7 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
                <p className="text-xs text-neutral-muted mt-4">
                  <span className="inline-flex items-center gap-2 mr-4">
                    <span className="w-3 h-3 rounded-full bg-result-win" /> Win
                  </span>
                  <span className="inline-flex items-center gap-2 mr-4">
                    <span className="w-3 h-3 rounded-full bg-result-draw" /> Draw
                  </span>
                  <span className="inline-flex items-center gap-2 mr-4">
                    <span className="w-3 h-3 rounded-full bg-result-loss" /> Loss
                  </span>

                </p>
              </div>
            )}
          </div>
        )}
      </section>

      {/* ── Fixtures ── */}
      <section>
        <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
          <div className="flex items-center gap-1 bg-neutral-card border border-neutral-border rounded-xl p-1 shadow-sm">
            {MATCH_TYPES.map(t => (
              <button key={t} onClick={() => setFilter(t)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  filter === t ? 'bg-neutral-accent text-neutral-bg shadow-sm' : 'text-neutral-muted hover:text-neutral-fg'
                }`}
              >{t}</button>
            ))}
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-neutral-accent hover:bg-neutral-accent/90 text-neutral-bg text-sm font-semibold rounded-xl transition-colors shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Fixture
          </button>
        </div>
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-neutral-muted text-sm">
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
          <div className="bg-neutral-card rounded-2xl border border-neutral-border shadow-sm p-8">
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
