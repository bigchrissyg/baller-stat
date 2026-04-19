import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useAllPlayersStats, useMatches } from '../hooks/useData'
import { insertPlayer } from '../lib/supabase'
import { getInitials } from '../lib/utils'
import Spinner from '../components/ui/Spinner'

const AVATAR_PALETTE = ['#1E3A5F', '#E8354A', '#6C3FC9', '#00D68F', '#0EA5E9', '#f59e0b', '#8b5cf6']

function minsColor(mins, matchMins) {
  if (!mins || mins <= 0) return '#E2E8F2'
  const pct = mins / (matchMins || 60)
  if (pct <= 0.50) return '#BAE6FD'  // sky-200 — pale
  if (pct <= 0.75) return '#0EA5E9'  // sky-500 — vivid
  return '#1E3A5F'                    // navy    — deep
}

function AttendanceBar({ playerApps, allMatches }) {
  const minutesByMatch = useMemo(() => {
    const map = {}
    playerApps.forEach(a => {
      map[a.match_id] = (map[a.match_id] || 0) + (a.time_end - a.time_start)
    })
    return map
  }, [playerApps])

  const sortedMatches = useMemo(() =>
    [...allMatches]
      .filter(m => m.match_date)
      .sort((a, b) => new Date(a.match_date) - new Date(b.match_date)),
    [allMatches]
  )

  if (!sortedMatches.length) return null

  return (
    <div className="flex items-center gap-[3px] flex-wrap">
      {sortedMatches.map(match => {
        const mins = minutesByMatch[match.id] || 0
        const color = minsColor(mins, match.match_length_mins)
        const date = new Date(match.match_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
        const tip = mins > 0
          ? `${date} vs ${match.opposition} · ${Math.round(mins)}′`
          : `${date} vs ${match.opposition} · Did not play`
        return (
          <div
            key={match.id}
            title={tip}
            className="w-3.5 h-3.5 rounded-[3px] shrink-0 transition-transform hover:scale-125 cursor-default"
            style={{ backgroundColor: color }}
          />
        )
      })}
    </div>
  )
}

export default function PlayerList() {
  const { canEdit } = useAuth()
  const { data: statsData, loading: statsLoading, refetch: refetchStats } = useAllPlayersStats()
  const { matches, loading: matchesLoading } = useMatches()
  const [newPlayerName, setNewPlayerName] = useState('')
  const [adding, setAdding] = useState(false)
  const [addError, setAddError] = useState(null)

  const handleAddPlayer = async (e) => {
    e.preventDefault()
    if (!newPlayerName.trim()) return
    setAdding(true)
    setAddError(null)
    try {
      await insertPlayer(newPlayerName.trim())
      setNewPlayerName('')
      await refetchStats()
    } catch (err) {
      setAddError(err.message)
    } finally {
      setAdding(false)
    }
  }

  if (statsLoading || matchesLoading) {
    return <div className="max-w-5xl mx-auto px-4 py-8"><Spinner message="Loading players…" /></div>
  }

  const { players = [], appearances = [], goals = [], awards = [] } = statsData || {}

  const playerRows = [...players]
    .sort((a, b) => (b.active ? 1 : 0) - (a.active ? 1 : 0))
    .map((player, i) => {
    const playerApps = appearances.filter(a => a.player_id === player.id)
    const matchIds = new Set(playerApps.map(a => a.match_id))
    const goalCount   = goals.filter(g => g.scorer_player_id === player.id && g.for_histon).length
    const assistCount = goals.filter(g => g.assist_player_id === player.id && g.for_histon).length
    const awardCount  = awards.filter(a => a.player_id === player.id).length
    return {
      ...player,
      playerApps,
      matchCount: matchIds.size,
      goalCount,
      assistCount,
      awardCount,
      avatarColor: AVATAR_PALETTE[i % AVATAR_PALETTE.length],
    }
  })

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-fg">Squad</h1>
        <span className="text-sm text-neutral-muted">{players.length} players</span>
      </div>

      {/* Add player */}
      {canEdit && (
        <form onSubmit={handleAddPlayer} className="bg-neutral-surface border border-neutral-border rounded-xl p-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={newPlayerName}
              onChange={e => setNewPlayerName(e.target.value)}
              placeholder="Player name…"
              className="flex-1 px-3 py-2 rounded-lg border border-neutral-border text-sm focus:outline-none focus:ring-2 focus:ring-neutral-accent bg-neutral-bg text-neutral-fg"
              disabled={adding}
            />
            <button
              type="submit"
              disabled={adding || !newPlayerName.trim()}
              className="px-4 py-2 bg-neutral-accent text-white text-sm font-semibold rounded-lg hover:bg-neutral-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {adding ? '…' : '+ Add'}
            </button>
          </div>
          {addError && <p className="mt-2 text-xs text-[#E8354A]">{addError}</p>}
        </form>
      )}

      {/* Attendance legend */}
      {matches.length > 0 && (
        <div className="flex items-center gap-4 text-xs text-neutral-muted flex-wrap">
          <span className="font-medium uppercase tracking-widest">Minutes played</span>
          {[
            { color: '#E2E8F2', label: 'None' },
            { color: '#BAE6FD', label: '≤ 50%' },
            { color: '#0EA5E9', label: '51–75%' },
            { color: '#1E3A5F', label: '75%+' },
          ].map(({ color, label }) => (
            <span key={label} className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded-[3px]" style={{ backgroundColor: color }} />
              {label}
            </span>
          ))}
        </div>
      )}

      {/* Player list */}
      {playerRows.length === 0 ? (
        <div className="text-center py-20 text-neutral-muted text-sm">No players found</div>
      ) : (
        <div className="bg-neutral-surface rounded-2xl border border-neutral-border shadow-card overflow-hidden divide-y divide-neutral-border/60">
          {playerRows.map(player => (
            <Link
              key={player.id}
              to={`/players/${player.id}`}
              className={`flex items-center gap-4 px-5 py-4 transition-colors group ${
                player.active === false
                  ? 'grayscale opacity-50 hover:opacity-60'
                  : 'hover:bg-[#0EA5E9]/4'
              }`}
            >
              {/* Avatar */}
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold text-white shrink-0 transition-transform group-hover:scale-105"
                style={{ backgroundColor: player.avatarColor }}
              >
                {getInitials(player.name)}
              </div>

              {/* Name + stats + attendance bar */}
              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-sm font-semibold text-neutral-fg group-hover:text-[#0EA5E9] transition-colors leading-none">
                    {player.name}
                  </span>
                  {player.active === false && (
                    <span className="text-[10px] font-semibold uppercase tracking-widest px-1.5 py-0.5 rounded bg-neutral-border text-neutral-muted">
                      Inactive
                    </span>
                  )}
                  <div className="flex items-center gap-1.5">
                    {player.matchCount > 0 && (
                      <span className="text-xs text-neutral-muted tabular-nums">{player.matchCount} MP</span>
                    )}
                    {player.goalCount > 0 && (
                      <span className="text-xs px-1.5 py-0.5 rounded-md bg-[#E8354A]/10 text-[#E8354A] font-bold tabular-nums">{player.goalCount}G</span>
                    )}
                    {player.assistCount > 0 && (
                      <span className="text-xs px-1.5 py-0.5 rounded-md bg-[#0EA5E9]/10 text-[#0EA5E9] font-bold tabular-nums">{player.assistCount}A</span>
                    )}
                    {player.awardCount > 0 && (
                      <span className="text-xs px-1.5 py-0.5 rounded-md bg-[#00D68F]/10 text-[#059669] font-bold tabular-nums">⭐ {player.awardCount}</span>
                    )}
                  </div>
                </div>
                <AttendanceBar playerApps={player.playerApps} allMatches={matches} />
              </div>

              {/* Chevron */}
              <svg className="w-4 h-4 text-neutral-muted/40 shrink-0 group-hover:text-[#0EA5E9]/60 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
