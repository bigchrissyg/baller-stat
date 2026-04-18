import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { usePlayer, usePlayerStats, useSeasons } from '../hooks/useData'
import { calculatePlayerAggregateStats, updatePlayer, insertPlayerSeason, deletePlayerSeason } from '../lib/supabase'
import { formatDate, getPositionColor, getMatchResult, getInitials } from '../lib/utils'
import Spinner from '../components/ui/Spinner'
import StatCard from '../components/ui/StatCard'
import PlayerStatsCharts from '../components/PlayerStatsCharts'

export default function PlayerProfile() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { player, loading: playerLoading, refetch: refetchPlayer } = usePlayer(id)
  const { stats, loading: statsLoading, error } = usePlayerStats(id)
  const { seasons } = useSeasons()
  
  const [isManaging, setIsManaging] = useState(false)
  const [saving, setSaving] = useState(false)

  const loading = playerLoading || statsLoading

  if (loading) return <div className="max-w-4xl mx-auto px-4 py-8"><Spinner message="Loading player…" /></div>
  if (error) return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-hornets-tertiary/10 border border-rose-200 rounded-xl p-4 text-hornets-tertiary text-sm">{error}</div>
    </div>
  )
  if (!player || !stats) return null

  const playerSeasonIds = (player.player_seasons || []).map(ps => ps.season_id)
  
  const handleToggleActive = async () => {
    setSaving(true)
    try {
      await updatePlayer(player.id, { active: !player.active })
      await refetchPlayer()
    } catch (err) {
      alert(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleToggleSeason = async (seasonId) => {
    setSaving(true)
    try {
      if (playerSeasonIds.includes(seasonId)) {
        await deletePlayerSeason(player.id, seasonId)
      } else {
        await insertPlayerSeason(player.id, seasonId)
      }
      await refetchPlayer()
    } catch (err) {
      alert(err.message)
    } finally {
      setSaving(false)
    }
  }

  const agg = calculatePlayerAggregateStats(stats)
  const { appearances } = stats

  // Unique matches played (deduplicated by match_id)
  const matchIds = [...new Set(appearances.map(a => a.match_id))]

  // Build position breakdown: position → { mins, appearances }
  const posBreakdown = Object.entries(agg.positions)
    .map(([pos, mins]) => ({ pos, mins }))
    .sort((a, b) => b.mins - a.mins)

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">

      {/* ── Back ── */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm font-medium text-neutral-muted/80 hover:text-neutral-fg transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back
      </button>

      {/* ── Player header ── */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 flex items-center gap-5">
        <div className="w-16 h-16 rounded-2xl bg-neutral-accent/100 flex items-center justify-center text-2xl font-bold text-white shrink-0">
          {getInitials(player.name)}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">{player.name}</h1>
          {posBreakdown.length > 0 && (
            <div className="flex items-center gap-1.5 mt-2 flex-wrap">
              {posBreakdown.slice(0, 3).map(({ pos }) => (
                <span key={pos} className={`text-xs font-semibold px-2 py-0.5 rounded-full ${getPositionColor(pos)}`}>
                  {pos}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Season & Active Status Management ── */}
      <div className="bg-neutral-card border border-neutral-border rounded-2xl p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between gap-4 pb-4 border-b border-neutral-border">
          <div>
            <h3 className="text-sm font-semibold text-neutral-fg">Status</h3>
            <p className="text-xs text-neutral-muted mt-1">
              {player.active ? 'Active - Available for matches' : 'Inactive - Hidden from dropdowns'}
            </p>
          </div>
          <button
            onClick={handleToggleActive}
            disabled={saving}
            className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
              player.active
                ? 'bg-green-100/50 text-green-700 hover:bg-green-100'
                : 'bg-neutral-secondary text-neutral-muted hover:bg-neutral-secondary/70'
            } disabled:opacity-50`}
          >
            {player.active ? 'Active' : 'Inactive'}
          </button>
        </div>

        {isManaging ? (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-neutral-fg">Register for Seasons</h3>
            <p className="text-xs text-neutral-muted mb-3">Select which league seasons this player is registered for</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {seasons.map(season => (
                <button
                  key={season.id}
                  onClick={() => handleToggleSeason(season.id)}
                  disabled={saving}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    playerSeasonIds.includes(season.id)
                      ? 'bg-neutral-accent text-white'
                      : 'bg-neutral-secondary text-neutral-muted hover:bg-neutral-secondary/70'
                  } disabled:opacity-50`}
                >
                  {season.name}
                </button>
              ))}
            </div>
            <button
              onClick={() => setIsManaging(false)}
              className="mt-3 text-xs font-medium text-neutral-accent hover:text-neutral-accent/80 transition-colors"
            >
              Done
            </button>
          </div>
        ) : (
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-sm font-semibold text-neutral-fg">Seasons</h3>
              {playerSeasonIds.length > 0 ? (
                <div className="flex flex-wrap gap-1 mt-2">
                  {(player.player_seasons || []).map(ps => (
                    <span key={ps.season_id} className="bg-neutral-accent/20 text-neutral-accent text-xs font-medium px-2 py-1 rounded">
                      {ps.seasons?.name}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-neutral-muted mt-1">Not registered for any seasons</p>
              )}
            </div>
            <button
              onClick={() => setIsManaging(true)}
              className="text-xs font-medium text-neutral-accent hover:text-neutral-accent/80 transition-colors"
            >
              Edit
            </button>
          </div>
        )}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <StatCard label="Matches"     value={agg.matches}           accent="indigo" />
        <StatCard label="Goals"       value={agg.goals}             accent="emerald" />
        <StatCard label="Assists"     value={agg.assists}           accent="blue" />
        <StatCard label="Star Awards" value={agg.starPlayerAwards}  accent="amber" />
        <StatCard label="Minutes"     value={`${agg.totalMinutes}'`} accent="violet" />
      </div>

      {/* ── Statistics with Charts ── */}
      <div className="bg-neutral-card rounded-2xl border border-neutral-border shadow-sm p-5 sm:p-6">
        <h2 className="text-base font-bold text-neutral-fg mb-6">Statistics & Analysis</h2>
        <PlayerStatsCharts agg={agg} posBreakdown={posBreakdown} />
      </div>

      {/* ── Match history ── */}
      {appearances.length > 0 && (
        <div className="bg-neutral-card rounded-2xl border border-neutral-border shadow-sm p-5 sm:p-6">
          <h2 className="text-base font-bold text-neutral-fg mb-4">Match History</h2>
          <div className="overflow-x-auto -mx-5 sm:mx-0">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-border">
                  <th className="text-left pl-5 sm:pl-0 pr-4 py-2 text-xs font-semibold uppercase tracking-wide text-neutral-muted">Date</th>
                  <th className="text-left pr-4 py-2 text-xs font-semibold uppercase tracking-wide text-neutral-muted">Match</th>
                  <th className="text-left pr-4 py-2 text-xs font-semibold uppercase tracking-wide text-neutral-muted">Pos</th>
                  <th className="text-left pr-4 py-2 text-xs font-semibold uppercase tracking-wide text-neutral-muted">Time</th>
                  <th className="text-right pr-5 sm:pr-0 py-2 text-xs font-semibold uppercase tracking-wide text-neutral-muted">Result</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {appearances.map(app => {
                  const { result, color } = getMatchResult(
                    app.matches?.histon_score, app.matches?.opposition_score
                  )
                  const mins = app.time_end - app.time_start
                  return (
                    <tr key={app.id} className="hover:bg-neutral-secondary/50 transition-colors">
                      <td className="pl-5 sm:pl-0 pr-4 py-3 text-neutral-muted/80 whitespace-nowrap">
                        {formatDate(app.matches?.match_date)}
                      </td>
                      <td className="pr-4 py-3 font-medium text-neutral-fg whitespace-nowrap">
                        <Link
                          to={`/matches/${app.match_id}`}
                          className="hover:text-neutral-accent transition-colors"
                        >
                          vs {app.matches?.opposition}
                        </Link>
                      </td>
                      <td className="pr-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-xs font-semibold ${getPositionColor(app.position)}`}>
                          {app.position}
                        </span>
                      </td>
                      <td className="pr-4 py-3 text-neutral-muted/80 whitespace-nowrap">
                        {app.time_start}'–{app.time_end}' <span className="text-neutral-muted/70">({mins}')</span>
                      </td>
                      <td className="pr-5 sm:pr-0 py-3 text-right">
                        {app.matches?.histon_score !== null ? (
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${color}`}>
                            {app.matches?.histon_score}–{app.matches?.opposition_score} {result}
                          </span>
                        ) : (
                          <span className="text-xs text-neutral-muted/70">—</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
