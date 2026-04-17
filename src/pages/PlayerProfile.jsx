import { useParams, useNavigate, Link } from 'react-router-dom'
import { usePlayer, usePlayerStats } from '../hooks/useData'
import { calculatePlayerAggregateStats } from '../lib/supabase'
import { formatDate, getPositionColor, getMatchResult, getInitials } from '../lib/utils'
import Spinner from '../components/ui/Spinner'
import StatCard from '../components/ui/StatCard'
import PlayerStatsCharts from '../components/PlayerStatsCharts'

export default function PlayerProfile() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { player, loading: playerLoading } = usePlayer(id)
  const { stats, loading: statsLoading, error } = usePlayerStats(id)

  const loading = playerLoading || statsLoading

  if (loading) return <div className="max-w-4xl mx-auto px-4 py-8"><Spinner message="Loading player…" /></div>
  if (error) return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-rose-700 text-sm">{error}</div>
    </div>
  )
  if (!player || !stats) return null

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
        className="flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back
      </button>

      {/* ── Player header ── */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 flex items-center gap-5">
        <div className="w-16 h-16 rounded-2xl bg-emerald-500 flex items-center justify-center text-2xl font-bold text-white shrink-0">
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

      {/* ── Season stats ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <StatCard label="Matches"     value={agg.matches}           accent="indigo" />
        <StatCard label="Goals"       value={agg.goals}             accent="emerald" />
        <StatCard label="Assists"     value={agg.assists}           accent="blue" />
        <StatCard label="Star Awards" value={agg.starPlayerAwards}  accent="amber" />
        <StatCard label="Minutes"     value={`${agg.totalMinutes}'`} accent="violet" />
      </div>

      {/* ── Statistics with Charts ── */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 sm:p-6">
        <h2 className="text-base font-bold text-slate-800 mb-6">Statistics & Analysis</h2>
        <PlayerStatsCharts agg={agg} posBreakdown={posBreakdown} />
      </div>

      {/* ── Match history ── */}
      {appearances.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 sm:p-6">
          <h2 className="text-base font-bold text-slate-800 mb-4">Match History</h2>
          <div className="overflow-x-auto -mx-5 sm:mx-0">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left pl-5 sm:pl-0 pr-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Date</th>
                  <th className="text-left pr-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Match</th>
                  <th className="text-left pr-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Pos</th>
                  <th className="text-left pr-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Time</th>
                  <th className="text-right pr-5 sm:pr-0 py-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Result</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {appearances.map(app => {
                  const { result, color } = getMatchResult(
                    app.matches?.histon_score, app.matches?.opposition_score
                  )
                  const mins = app.time_end - app.time_start
                  return (
                    <tr key={app.id} className="hover:bg-slate-50 transition-colors">
                      <td className="pl-5 sm:pl-0 pr-4 py-3 text-slate-500 whitespace-nowrap">
                        {formatDate(app.matches?.match_date)}
                      </td>
                      <td className="pr-4 py-3 font-medium text-slate-800 whitespace-nowrap">
                        <Link
                          to={`/matches/${app.match_id}`}
                          className="hover:text-emerald-600 transition-colors"
                        >
                          vs {app.matches?.opposition}
                        </Link>
                      </td>
                      <td className="pr-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-xs font-semibold ${getPositionColor(app.position)}`}>
                          {app.position}
                        </span>
                      </td>
                      <td className="pr-4 py-3 text-slate-500 whitespace-nowrap">
                        {app.time_start}'–{app.time_end}' <span className="text-slate-300">({mins}')</span>
                      </td>
                      <td className="pr-5 sm:pr-0 py-3 text-right">
                        {app.matches?.histon_score !== null ? (
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${color}`}>
                            {app.matches?.histon_score}–{app.matches?.opposition_score} {result}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-300">—</span>
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
