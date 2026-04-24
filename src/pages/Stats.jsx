import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useAllPlayersStats, useSeasons } from '../hooks/useData'
import { formatDate, getPositionGroup } from '../lib/utils'
import Spinner from '../components/ui/Spinner'

// ─── Helpers ─────────────────────────────────────────────────────────────────

const fmtDec = (n, dp = 2) => Number(n).toFixed(dp)
const fmtMin = (n) => n > 0 ? `${Math.round(n)}'` : '—'

const PERFORMER_THEMES = {
  navy:    { card: 'from-[#1E3A5F]/8 to-[#1E3A5F]/4 border-[#1E3A5F]/20',  iconBg: 'bg-[#1E3A5F]/10', bar: 'bg-[#1E3A5F]' },
  red:     { card: 'from-[#E8354A]/8 to-[#E8354A]/4 border-[#E8354A]/20',  iconBg: 'bg-[#E8354A]/10', bar: 'bg-[#E8354A]' },
  sky:     { card: 'from-[#0EA5E9]/8 to-[#0EA5E9]/4 border-[#0EA5E9]/20',  iconBg: 'bg-[#0EA5E9]/10', bar: 'bg-[#0EA5E9]' },
  emerald: { card: 'from-[#00D68F]/8 to-[#00D68F]/4 border-[#00D68F]/20',  iconBg: 'bg-[#00D68F]/10', bar: 'bg-[#00D68F]' },
  violet:  { card: 'from-[#6C3FC9]/8 to-[#6C3FC9]/4 border-[#6C3FC9]/20',  iconBg: 'bg-[#6C3FC9]/10', bar: 'bg-[#6C3FC9]' },
}

const MEDALS = ['🥇', '🥈', '🥉']

const TAB_THEME = {
  'overview':     { active: 'bg-[#1E3A5F] text-white shadow-sm', dot: 'bg-[#1E3A5F]' },
  'playing-time': { active: 'bg-[#0EA5E9] text-white shadow-sm', dot: 'bg-[#0EA5E9]' },
  'attacking':    { active: 'bg-[#E8354A] text-white shadow-sm', dot: 'bg-[#E8354A]' },
  'defensive':    { active: 'bg-[#6C3FC9] text-white shadow-sm', dot: 'bg-[#6C3FC9]' },
}

function computePlayerRow(player, appearances, goals, awards) {
  const apps         = appearances.filter(a => a.player_id === player.id)
  const scored       = goals.filter(g => g.scorer_player_id === player.id && g.for_histon)
  const assisted     = goals.filter(g => g.assist_player_id === player.id && g.for_histon)
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
      for (let i = 0; i < 8; i++) {
        const ss = i * segLen, se = (i + 1) * segLen
        if (a.time_start >= se || a.time_end <= ss) continue
        const segHalf = ss < halfLen ? 'H1' : 'H2'
        const segQ    = ss < halfLen
          ? Math.min(Math.floor(ss / (halfLen / 4)) + 1, 4)
          : Math.min(Math.floor((ss - halfLen) / (halfLen / 4)) + 1, 4)
        const conceded = goals.some(g =>
          g.match_id === a.match_id && !g.for_histon &&
          g.half === segHalf && parseInt(g.quarter?.replace?.('Q', '') ?? g.quarter) === segQ
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
    avgMins,
    goalCount, assistCount,
    cleanAsGK, cleanAsDEF,
    awardCount, lastAwardDate,
    goalsPerGame, assiPerGame,
    cleanGKPerGame, cleanDEFPerGame,
    hasGoalTiming,
  }
}

// ─── Top Performers Card ──────────────────────────────────────────────────────

function TopPerformersTable({ title, data, icon, suffix = '', theme = 'sky' }) {
  const t = PERFORMER_THEMES[theme] || PERFORMER_THEMES.sky
  const max = data.length > 0 ? Math.max(...data.map(d => d.value)) : 1
  return (
    <div className={`bg-gradient-to-br ${t.card} border rounded-2xl p-4 flex flex-col gap-3`}>
      <div className="flex items-center gap-2.5">
        <div className={`w-9 h-9 rounded-xl ${t.iconBg} flex items-center justify-center text-base shrink-0`}>{icon}</div>
        <h4 className="font-semibold text-neutral-fg text-sm leading-tight">{title}</h4>
      </div>
      <div className="space-y-3">
        {data.slice(0, 3).map((player, index) => {
          const pct = max > 0 ? Math.round((player.value / max) * 100) : 0
          return (
            <div key={player.name} className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-sm shrink-0 leading-none">{MEDALS[index]}</span>
                  <span className="text-sm text-neutral-fg font-medium truncate">{player.name}</span>
                </div>
                <span className="text-sm font-bold font-mono text-neutral-fg shrink-0">{player.value}{suffix}</span>
              </div>
              <div className="h-1.5 rounded-full bg-black/10 overflow-hidden">
                <div className={`h-full rounded-full ${t.bar} transition-all duration-500`} style={{ width: `${pct}%` }} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Stats Overview ───────────────────────────────────────────────────────────

function StatsOverview({ rows }) {
  const hasTimingData = rows.some(r => r.hasGoalTiming)
  const topMinutes      = [...rows].filter(p => p.matches > 0).sort((a, b) => (b.totalMins / b.matches) - (a.totalMins / a.matches)).slice(0, 3).map(p => ({ name: p.name, value: Math.round(p.totalMins / p.matches) }))
  const topGoals        = [...rows].filter(p => p.goalCount > 0).sort((a, b) => b.goalCount - a.goalCount).slice(0, 3).map(p => ({ name: p.name, value: p.goalCount }))
  const topAssists      = [...rows].filter(p => p.assistCount > 0).sort((a, b) => b.assistCount - a.assistCount).slice(0, 3).map(p => ({ name: p.name, value: p.assistCount }))
  const topAwards       = [...rows].filter(p => p.awardCount > 0).sort((a, b) => b.awardCount - a.awardCount).slice(0, 3).map(p => ({ name: p.name, value: p.awardCount }))
  const topCleanDef     = [...rows].filter(p => p.cleanAsDEF > 0).sort((a, b) => b.cleanAsDEF - a.cleanAsDEF).slice(0, 3).map(p => ({ name: p.name, value: p.cleanAsDEF }))

  const summaryCards = [
    { label: 'Players',      value: rows.length,                                   icon: '👥', bg: 'bg-[#1E3A5F]',  ring: 'ring-[#1E3A5F]/20' },
    { label: 'Appearances',  value: rows.reduce((s, r) => s + r.matches, 0),        icon: '📋', bg: 'bg-[#0EA5E9]',  ring: 'ring-[#0EA5E9]/20' },
    { label: 'Goals Scored', value: rows.reduce((s, r) => s + r.goalCount, 0),      icon: '⚽', bg: 'bg-[#E8354A]',  ring: 'ring-[#E8354A]/20' },
    { label: 'Star Awards',  value: rows.reduce((s, r) => s + r.awardCount, 0),     icon: '⭐', bg: 'bg-[#00D68F]',  ring: 'ring-[#00D68F]/20' },
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
        {summaryCards.map(({ label, value, icon, bg, ring }) => (
          <div key={label} className={`${bg} ring-4 ${ring} rounded-xl sm:rounded-2xl p-3 sm:p-5 text-white shadow-card-md flex flex-col gap-1.5 sm:gap-2`}>
            <span className="text-xl sm:text-2xl leading-none">{icon}</span>
            <div className="text-2xl sm:text-3xl font-bold font-mono leading-none">{value}</div>
            <div className="text-[10px] sm:text-xs font-semibold uppercase tracking-widest text-white/70">{label}</div>
          </div>
        ))}
      </div>
      <div>
        <h3 className="text-sm font-semibold uppercase tracking-widest text-neutral-muted mb-3">Top Performers</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
          {topMinutes.length > 0   && <TopPerformersTable title="Avg Minutes"    data={topMinutes}  icon="⏱️" theme="navy"    suffix="'" />}
          {topGoals.length > 0     && <TopPerformersTable title="Goals"          data={topGoals}    icon="⚽" theme="red"     />}
          {topAssists.length > 0   && <TopPerformersTable title="Assists"        data={topAssists}  icon="🎯" theme="sky"     />}
          {topAwards.length > 0    && <TopPerformersTable title="Star Awards"    data={topAwards}   icon="⭐" theme="emerald" />}
          {topCleanDef.length > 0  && <TopPerformersTable title="Clean Quarters" data={topCleanDef} icon="🛡️" theme="violet" />}
          {!hasTimingData && topCleanDef.length === 0 && (
            <div className="bg-gradient-to-br from-[#6C3FC9]/8 to-[#6C3FC9]/4 border border-[#6C3FC9]/20 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 text-center min-h-[140px]">
              <div className="w-9 h-9 rounded-xl bg-[#6C3FC9]/10 flex items-center justify-center text-base">🛡️</div>
              <div className="text-sm font-semibold text-neutral-fg">Clean Quarters</div>
              <div className="text-xs text-neutral-muted leading-snug">Requires goal timing data</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Compact Stats Table ──────────────────────────────────────────────────────

function CompactStatsTable({ rows, columns, hasTimingData }) {
  const [sortKey, setSortKey] = useState(columns[0].key)
  const [sortDir, setSortDir] = useState(-1)

  const sorted = useMemo(() =>
    [...rows].sort((a, b) => {
      const av = a[sortKey] ?? 0, bv = b[sortKey] ?? 0
      return av === bv ? 0 : (av > bv ? 1 : -1) * sortDir
    }),
    [rows, sortKey, sortDir]
  )

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir(d => -d)
    else { setSortKey(key); setSortDir(-1) }
  }

  return (
    <div className="rounded-xl border border-neutral-border overflow-hidden shadow-card">
      <div className="overflow-x-auto overscroll-x-contain">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-neutral-bg border-b border-neutral-border">
              <th className="sticky left-0 bg-neutral-bg z-10 text-left px-4 py-3 text-xs font-bold uppercase tracking-widest text-neutral-muted whitespace-nowrap min-w-[140px]">Player</th>
              {columns.map(col => (
                <th key={col.key} title={col.title} onClick={() => toggleSort(col.key)}
                  className={`px-3 py-3 text-center text-xs font-bold uppercase tracking-widest whitespace-nowrap cursor-pointer select-none transition-all ${
                    sortKey === col.key ? 'text-[#0EA5E9] bg-[#0EA5E9]/8' : 'text-neutral-muted hover:text-neutral-fg hover:bg-neutral-secondary/30'
                  } ${col.timingNeeded && !hasTimingData ? 'opacity-40' : ''}`}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.label}
                    {sortKey === col.key
                      ? <span className="text-[10px] font-black">{sortDir === -1 ? '↓' : '↑'}</span>
                      : <span className="text-[10px] opacity-30">↕</span>}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-border/50 bg-white">
            {sorted.map((row, i) => (
              <tr key={row.id} className={`hover:bg-[#0EA5E9]/4 transition-colors group ${i % 2 === 1 ? 'bg-neutral-bg/40' : ''}`}>
                <td className={`sticky left-0 z-10 px-4 py-3 font-semibold text-neutral-fg whitespace-nowrap transition-colors group-hover:bg-[#0EA5E9]/4 ${i % 2 === 1 ? 'bg-neutral-bg/40' : 'bg-white'}`}>
                  <Link to={`/players/${row.id}`} className="hover:text-[#0EA5E9] transition-colors">{row.name}</Link>
                </td>
                {columns.map(col => {
                  const isTimingCol = col.timingNeeded && !hasTimingData
                  const isActiveSort = col.key === sortKey
                  return (
                    <td key={col.key} className={`px-3 py-3 text-center tabular-nums whitespace-nowrap transition-colors ${isTimingCol ? 'opacity-30' : ''} ${isActiveSort ? 'text-neutral-fg font-semibold bg-[#0EA5E9]/5' : 'text-neutral-fg/75'}`}>
                      {col.fmt(row[col.key])}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── Stats Page ───────────────────────────────────────────────────────────────

export default function Stats() {
  const { data, loading, error } = useAllPlayersStats()
  const { seasons } = useSeasons()
  const [selectedSeason, setSelectedSeason] = useState('all')
  const [activeTab, setActiveTab] = useState('overview')

  if (loading) return <div className="max-w-5xl mx-auto px-4 py-8"><Spinner message="Loading statistics…" /></div>
  if (error)   return <div className="max-w-5xl mx-auto px-4 py-8"><p className="text-sm text-red-500">{error}</p></div>
  if (!data)   return null

  const { players, goals, awards } = data

  // Filter appearances and goals/awards by selected season
  const appearances = selectedSeason === 'all'
    ? data.appearances
    : data.appearances.filter(a => String(a.matches?.season_id) === String(selectedSeason))

  const filteredGoals = selectedSeason === 'all'
    ? goals
    : goals.filter(g => String(g.matches?.season_id) === String(selectedSeason))

  const filteredAwards = selectedSeason === 'all'
    ? awards
    : awards.filter(a => String(a.matches?.season_id) === String(selectedSeason))

  const rows = players.map(p => computePlayerRow(p, appearances, filteredGoals, filteredAwards))
    .filter(r => r.matches > 0 || selectedSeason === 'all')

  const hasTimingData = rows.some(r => r.hasGoalTiming)

  const tabs = [
    {
      id: 'overview', label: 'Overview',
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>,
    },
    {
      id: 'playing-time', label: 'Playing Time',
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15 15"/></svg>,
    },
    {
      id: 'attacking', label: 'Attacking',
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
    },
    {
      id: 'defensive', label: 'Defensive',
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
    },
  ]

  const playingTimeCols = [
    { key: 'matches',   label: 'MP',        title: 'Matches played',                 fmt: v => v },
    { key: 'totalMins', label: 'Total',     title: 'Total minutes played',           fmt: fmtMin },
    { key: 'avgMins',   label: 'Avg/Match', title: 'Average minutes per match',      fmt: v => v > 0 ? `${fmtDec(v,1)}'` : '—' },
    { key: 'gkMins',    label: 'GK',        title: 'Minutes as goalkeeper',          fmt: fmtMin },
    { key: 'defMins',   label: 'DEF',       title: 'Minutes as defender',            fmt: fmtMin },
    { key: 'midMins',   label: 'MID',       title: 'Minutes as midfielder',          fmt: fmtMin },
    { key: 'atkMins',   label: 'ATK',       title: 'Minutes as attacker',            fmt: fmtMin },
  ]

  const attackingCols = [
    { key: 'goalCount',    label: 'Goals',   title: 'Total goals scored',  fmt: v => v || '—' },
    { key: 'assistCount',  label: 'Assists', title: 'Total assists',       fmt: v => v || '—' },
    { key: 'goalsPerGame', label: 'G/Match', title: 'Goals per game',      fmt: v => v > 0 ? fmtDec(v, 2) : '—' },
    { key: 'assiPerGame',  label: 'A/Match', title: 'Assists per game',    fmt: v => v > 0 ? fmtDec(v, 2) : '—' },
  ]

  const defensiveCols = [
    { key: 'cleanAsGK',      label: 'CS GK',      title: 'Clean quarters as GK',          fmt: v => v || '—', timingNeeded: true },
    { key: 'cleanAsDEF',     label: 'CS DEF',     title: 'Clean quarters as Defender',    fmt: v => v || '—', timingNeeded: true },
    { key: 'cleanGKPerGame', label: 'CS GK/Match', title: 'Clean quarters as GK per game', fmt: v => v > 0 ? fmtDec(v, 2) : '—', timingNeeded: true },
    { key: 'cleanDEFPerGame','label': 'CS D/Match','title': 'Clean quarters as DEF/game',  fmt: v => v > 0 ? fmtDec(v, 2) : '—', timingNeeded: true },
  ]

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-6 py-4 sm:py-8 space-y-4 sm:space-y-6">

      {/* Season selector */}
      {seasons.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold uppercase tracking-widest text-neutral-muted shrink-0">Season</span>
          <div className="flex items-center gap-1.5 flex-wrap">
            <button onClick={() => setSelectedSeason('all')}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${selectedSeason === 'all' ? 'bg-neutral-fg text-white' : 'bg-neutral-surface border border-neutral-border text-neutral-muted hover:text-neutral-fg'}`}
            >All</button>
            {[...seasons].reverse().map(s => (
              <button key={s.id} onClick={() => setSelectedSeason(String(s.id))}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${String(selectedSeason) === String(s.id) ? 'bg-neutral-accent text-white' : 'bg-neutral-surface border border-neutral-border text-neutral-muted hover:text-neutral-fg'}`}
              >{s.name}</button>
            ))}
          </div>
        </div>
      )}

      {/* Main stats card */}
      <div className="rounded-2xl border border-neutral-border shadow-card-md overflow-hidden bg-neutral-surface">

        {/* Header */}
        <div className="bg-gradient-to-r from-[#1E3A5F] to-[#1E3A5F]/85 px-4 sm:px-6 py-4 sm:py-5 flex items-center justify-between">
          <div>
            <h1 className="text-lg sm:text-2xl font-semibold tracking-tight text-white">Player Statistics</h1>
            <p className="text-xs text-white/50 mt-0.5 font-medium uppercase tracking-widest">
              {selectedSeason === 'all' ? 'All Seasons' : (seasons.find(s => String(s.id) === String(selectedSeason))?.name ?? '')}
            </p>
          </div>
          {!hasTimingData && (
            <span className="text-xs text-white/50 bg-white/10 rounded-lg px-3 py-1.5">CS requires goal timing</span>
          )}
        </div>

        {/* Tabs */}
        <div className="border-b border-neutral-border bg-neutral-bg/50">
          {/* Mobile: 2×2 grid */}
          <div className="grid grid-cols-2 sm:hidden">
            {tabs.map(tab => {
              const isActive = activeTab === tab.id
              const theme = TAB_THEME[tab.id]
              return (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center justify-center gap-2 px-3 py-3 text-sm font-semibold transition-all border-b border-neutral-border/50 odd:border-r odd:border-neutral-border/50 ${
                    isActive ? theme.active : 'text-neutral-muted hover:text-neutral-fg hover:bg-neutral-secondary/40'
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </div>
          {/* Desktop: single row */}
          <div className="hidden sm:flex gap-1 px-6 py-3">
            {tabs.map(tab => {
              const isActive = activeTab === tab.id
              const theme = TAB_THEME[tab.id]
              return (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                    isActive ? theme.active : 'text-neutral-muted hover:text-neutral-fg hover:bg-neutral-secondary/50'
                  }`}
                >
                  {!isActive && <span className={`w-2 h-2 rounded-full ${theme.dot} opacity-60`} />}
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Content */}
        {rows.length === 0 ? (
          <div className="p-10 text-center text-sm text-neutral-muted">No player data for this season.</div>
        ) : (
          <div className="p-3 sm:p-6">
            {activeTab === 'overview'     && <StatsOverview rows={rows} />}
            {activeTab === 'playing-time' && <CompactStatsTable rows={rows} columns={playingTimeCols} hasTimingData={hasTimingData} />}
            {activeTab === 'attacking'    && <CompactStatsTable rows={rows} columns={attackingCols}    hasTimingData={hasTimingData} />}
            {activeTab === 'defensive'    && <CompactStatsTable rows={rows} columns={defensiveCols}    hasTimingData={hasTimingData} />}
          </div>
        )}
      </div>
    </div>
  )
}
