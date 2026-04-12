import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useMatchDetail, usePlayers } from '../hooks/useData'
import {
  updateMatch,
  insertPlayerAppearance,
  updatePlayerAppearance,
  deletePlayerAppearance,
  insertGoal,
  deleteGoal,
  insertStarPlayerAward,
  deleteStarPlayerAward,
} from '../lib/supabase'
import {
  formatDate,
  getMatchResult,
  getMatchTypeColor,
  getPositionColor,
  getMatchSegments,
  getPlayerSegmentPosition,
  getUniquePlayersFromAppearances,
  findCoveringAppearance,
  segmentToAppearanceSlot,
} from '../lib/utils'
import Spinner from '../components/ui/Spinner'
import StatCard from '../components/ui/StatCard'

const POSITIONS = ['GK', 'CB', 'LB', 'RB', 'CM', 'CDM', 'CAM', 'LM', 'RM', 'CF', 'LF', 'RF', 'ST']
const MATCH_TYPES = ['League', 'Cup', 'Friendly']
const HALVES = ['H1', 'H2']
const QUARTERS = [1, 2, 3, 4]

// ─── Lineup Matrix ────────────────────────────────────────────────────────────

function LineupMatrix({ match, editMode, onRefetch }) {
  const matchLen = match.match_length_mins || 60
  const segments = getMatchSegments(matchLen)
  const playersInMatch = getUniquePlayersFromAppearances(match.player_appearances || [])
  const { players: allPlayers } = usePlayers()
  const [busy, setBusy] = useState(false)
  const [addForm, setAddForm] = useState({ player_id: '', half: 'H1', time_start: 0, time_end: matchLen / 2, position: 'GK' })
  const [addErr, setAddErr] = useState(null)

  // Inline cell change: update position or create/delete appearance
  const handleCellChange = async (playerId, segment, newPos) => {
    setBusy(true)
    try {
      const existing = findCoveringAppearance(match.player_appearances || [], playerId, segment, matchLen)
      if (existing) {
        if (newPos === '') {
          await deletePlayerAppearance(existing.id)
        } else {
          await updatePlayerAppearance(existing.id, { position: newPos })
        }
      } else if (newPos !== '') {
        const slot = segmentToAppearanceSlot(segment, matchLen)
        await insertPlayerAppearance({ ...slot, player_id: playerId, match_id: match.id, position: newPos })
      }
      await onRefetch()
    } catch (e) { alert(e.message) }
    finally { setBusy(false) }
  }

  // Add a custom-range appearance via the form below the matrix
  const handleAddAppearance = async (e) => {
    e.preventDefault()
    if (!addForm.player_id) return
    setBusy(true); setAddErr(null)
    try {
      await insertPlayerAppearance({
        ...addForm,
        match_id: match.id,
        time_start: Number(addForm.time_start),
        time_end: Number(addForm.time_end),
      })
      setAddForm({ player_id: '', half: 'H1', time_start: 0, time_end: matchLen / 2, position: 'GK' })
      await onRefetch()
    } catch (e) { setAddErr(e.message) }
    finally { setBusy(false) }
  }

  const fmtMin = (m) => (m % 1 !== 0 ? m.toFixed(1) : String(Math.round(m)))

  if (playersInMatch.length === 0 && !editMode) {
    return <p className="text-sm text-slate-400 py-6 text-center">No lineup recorded yet.</p>
  }

  return (
    <div className="space-y-5">
      {/* Matrix */}
      <div className="overflow-x-auto -mx-5 sm:mx-0">
        <table className="min-w-full text-sm border-collapse">
          <thead>
            <tr>
              <th className="sticky left-0 bg-white pl-5 sm:pl-0 pr-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-400 whitespace-nowrap min-w-[120px]">
                Player
              </th>
              {segments.map(seg => (
                <th key={seg.index} className="px-1 py-2 text-xs font-medium text-slate-400 text-center whitespace-nowrap min-w-[56px]">
                  {seg.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {playersInMatch.map(player => (
              <tr key={player.id} className="hover:bg-slate-50">
                <td className="sticky left-0 bg-inherit pl-5 sm:pl-0 pr-3 py-2">
                  <Link
                    to={`/players/${player.id}`}
                    className="font-semibold text-slate-800 hover:text-emerald-600 transition-colors whitespace-nowrap text-sm"
                  >
                    {player.name}
                  </Link>
                </td>
                {segments.map(seg => {
                  const pos = getPlayerSegmentPosition(match.player_appearances || [], player.id, seg, matchLen)
                  return (
                    <td key={seg.index} className="px-1 py-2 text-center">
                      {editMode ? (
                        <select
                          value={pos || ''}
                          disabled={busy}
                          onChange={e => handleCellChange(player.id, seg, e.target.value)}
                          className="w-14 text-xs border border-slate-200 rounded-md py-0.5 px-0.5 text-center focus:outline-none focus:ring-1 focus:ring-emerald-400 disabled:opacity-40 bg-white"
                        >
                          <option value="">—</option>
                          {POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                      ) : pos ? (
                        <span className={`inline-block px-1.5 py-0.5 rounded text-xs font-bold ${getPositionColor(pos)}`}>
                          {pos}
                        </span>
                      ) : (
                        <span className="text-slate-200 text-xs">—</span>
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}

            {/* In edit mode: row for new player from any team member */}
            {editMode && (
              <tr className="border-t-2 border-dashed border-slate-200">
                <td className="sticky left-0 bg-white pl-5 sm:pl-0 pr-3 py-2">
                  <select
                    className="text-xs border border-slate-200 rounded-md px-1.5 py-1 focus:outline-none focus:ring-1 focus:ring-emerald-400 w-28"
                    value={addForm.player_id}
                    onChange={e => setAddForm(f => ({ ...f, player_id: e.target.value }))}
                  >
                    <option value="">+ Player…</option>
                    {allPlayers.filter(p => !playersInMatch.some(pm => pm.id === p.id)).map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </td>
                {segments.map((seg, i) => (
                  <td key={i} className="px-1 py-2 text-center text-slate-200 text-xs">—</td>
                ))}
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Edit mode: custom-range appearance form */}
      {editMode && (
        <form onSubmit={handleAddAppearance} className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Add custom time slot</p>
          <div className="flex flex-wrap gap-2 items-end">
            <select
              className="border border-slate-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-400"
              value={addForm.player_id}
              onChange={e => setAddForm(f => ({ ...f, player_id: e.target.value }))}
              required
            >
              <option value="">Player…</option>
              {allPlayers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <select
              className="border border-slate-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-400"
              value={addForm.position}
              onChange={e => setAddForm(f => ({ ...f, position: e.target.value }))}
            >
              {POSITIONS.map(p => <option key={p}>{p}</option>)}
            </select>
            <select
              className="border border-slate-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-400"
              value={addForm.half}
              onChange={e => setAddForm(f => ({ ...f, half: e.target.value }))}
            >
              <option value="H1">H1</option>
              <option value="H2">H2</option>
            </select>
            <input
              type="number" min={0} max={matchLen / 2} placeholder="Start"
              className="border border-slate-200 rounded-lg px-2 py-1.5 text-xs w-16 focus:outline-none focus:ring-1 focus:ring-emerald-400"
              value={addForm.time_start}
              onChange={e => setAddForm(f => ({ ...f, time_start: e.target.value }))}
            />
            <span className="text-slate-400 text-xs">to</span>
            <input
              type="number" min={1} max={matchLen / 2} placeholder="End"
              className="border border-slate-200 rounded-lg px-2 py-1.5 text-xs w-16 focus:outline-none focus:ring-1 focus:ring-emerald-400"
              value={addForm.time_end}
              onChange={e => setAddForm(f => ({ ...f, time_end: e.target.value }))}
            />
            <button
              type="submit" disabled={busy}
              className="bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold rounded-lg px-3 py-1.5 transition-colors disabled:opacity-50"
            >
              {busy ? '…' : '+ Add'}
            </button>
          </div>
          {addErr && <p className="text-xs text-rose-600">{addErr}</p>}
        </form>
      )}
    </div>
  )
}

// ─── Goals & Events Section ───────────────────────────────────────────────────

function GoalsSection({ match, editMode, onRefetch }) {
  const goals = match.goals || []
  const { players: allPlayers } = usePlayers()
  const matchLen = match.match_length_mins || 60
  const [form, setForm] = useState({
    scorer_player_id: '',
    assist_player_id: '',
    for_histon: true,
    goal_half: 'H1',
    goal_quarter: 1,
  })
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState(null)

  const handleAdd = async (e) => {
    e.preventDefault()
    if (!form.scorer_player_id) return
    setSaving(true); setErr(null)
    try {
      await insertGoal({
        ...form,
        match_id: match.id,
        assist_player_id: form.assist_player_id || null,
        goal_quarter: Number(form.goal_quarter),
      })
      setForm({ scorer_player_id: '', assist_player_id: '', for_histon: true, goal_half: 'H1', goal_quarter: 1 })
      await onRefetch()
    } catch (e) { setErr(e.message) }
    finally { setSaving(false) }
  }

  const histonGoals = goals.filter(g => g.for_histon)
  const oppGoals    = goals.filter(g => !g.for_histon)

  const GoalTiming = ({ g }) => {
    if (!g.goal_half) return null
    return (
      <span className="text-xs font-medium text-slate-400 ml-1">
        {g.goal_half}, Q{g.goal_quarter}
      </span>
    )
  }

  return (
    <div className="space-y-4">
      {/* Half Time marker */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-slate-100" />
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Kick Off</span>
        <div className="flex-1 h-px bg-slate-100" />
      </div>

      {histonGoals.length === 0 && oppGoals.length === 0 && !editMode && (
        <p className="text-sm text-slate-400 py-2 text-center">No goals recorded.</p>
      )}

      {histonGoals.length > 0 && (
        <div className="space-y-1.5">
          {histonGoals.map(g => (
            <div key={g.id} className="flex items-center gap-2.5 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2">
              <span className="text-base">⚽</span>
              <div className="flex-1 min-w-0">
                <span className="font-semibold text-slate-800 text-sm">{g.players?.name ?? 'Unknown'}</span>
                {g.players_assist?.name && (
                  <span className="text-slate-400 text-xs ml-2">assist: {g.players_assist.name}</span>
                )}
                <GoalTiming g={g} />
              </div>
              {editMode && (
                <button onClick={async () => { await deleteGoal(g.id); onRefetch() }}
                  className="text-xs text-rose-500 hover:text-rose-700 font-medium shrink-0">✕</button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Half Time divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-slate-100" />
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Half Time</span>
        <div className="flex-1 h-px bg-slate-100" />
      </div>

      {oppGoals.length > 0 && (
        <div className="space-y-1.5">
          {oppGoals.map(g => (
            <div key={g.id} className="flex items-center gap-2.5 bg-rose-50 border border-rose-100 rounded-lg px-3 py-2">
              <span className="text-base">⚽</span>
              <div className="flex-1 min-w-0">
                <span className="font-medium text-slate-600 text-sm">Opposition goal</span>
                <GoalTiming g={g} />
              </div>
              {editMode && (
                <button onClick={async () => { await deleteGoal(g.id); onRefetch() }}
                  className="text-xs text-rose-500 hover:text-rose-700 font-medium shrink-0">✕</button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Full Time divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-slate-100" />
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Full Time</span>
        <div className="flex-1 h-px bg-slate-100" />
      </div>

      {/* Add goal form (edit mode) */}
      {editMode && (
        <form onSubmit={handleAdd} className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Log Goal</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <select
              className="border border-slate-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
              value={form.scorer_player_id}
              onChange={e => setForm(f => ({ ...f, scorer_player_id: e.target.value }))}
              required
            >
              <option value="">Scorer…</option>
              {allPlayers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <select
              className="border border-slate-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
              value={form.assist_player_id}
              onChange={e => setForm(f => ({ ...f, assist_player_id: e.target.value }))}
            >
              <option value="">Assist (optional)…</option>
              {allPlayers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <div className="flex gap-2">
              <select
                className="flex-1 border border-slate-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                value={form.goal_half}
                onChange={e => setForm(f => ({ ...f, goal_half: e.target.value }))}
              >
                {HALVES.map(h => <option key={h}>{h}</option>)}
              </select>
              <select
                className="flex-1 border border-slate-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                value={form.goal_quarter}
                onChange={e => setForm(f => ({ ...f, goal_quarter: e.target.value }))}
              >
                {QUARTERS.map(q => <option key={q} value={q}>Q{q}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-3 col-span-2 sm:col-span-3">
              <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.for_histon}
                  onChange={e => setForm(f => ({ ...f, for_histon: e.target.checked }))}
                  className="accent-emerald-500"
                />
                <span className="text-slate-600">For Histon</span>
              </label>
              <button
                type="submit" disabled={saving}
                className="ml-auto bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold rounded-lg px-4 py-1.5 transition-colors disabled:opacity-50"
              >
                {saving ? '…' : '+ Log Goal'}
              </button>
            </div>
          </div>
          {err && <p className="text-xs text-rose-600">{err}</p>}
        </form>
      )}
    </div>
  )
}

// ─── Star Players ─────────────────────────────────────────────────────────────

function StarPlayersSection({ match, editMode, onRefetch }) {
  const awards = match.star_player_awards || []
  const playersInMatch = getUniquePlayersFromAppearances(match.player_appearances || [])
  const [saving, setSaving] = useState(false)

  const toggle = async (player) => {
    const existing = awards.find(a => a.player_id === player.id)
    setSaving(true)
    try {
      if (existing) await deleteStarPlayerAward(existing.id)
      else await insertStarPlayerAward({ player_id: player.id, match_id: match.id })
      await onRefetch()
    } catch (e) { alert(e.message) }
    finally { setSaving(false) }
  }

  if (awards.length === 0 && !editMode) return null

  return (
    <div className="space-y-2">
      {!editMode && awards.map(a => (
        <div key={a.id} className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5">
          <span className="text-amber-400 text-lg">★</span>
          <span className="font-semibold text-slate-800 text-sm">{a.players?.name}</span>
        </div>
      ))}
      {editMode && playersInMatch.map(player => {
        const isAward = awards.some(a => a.player_id === player.id)
        return (
          <button
            key={player.id} onClick={() => toggle(player)} disabled={saving}
            className={`w-full flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium border transition-colors ${
              isAward ? 'bg-amber-50 border-amber-300 text-amber-700' : 'bg-white border-slate-100 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <span className={isAward ? 'text-amber-400' : 'text-slate-300'}>★</span>
            {player.name}
          </button>
        )
      })}
      {editMode && playersInMatch.length === 0 && (
        <p className="text-sm text-slate-400 text-center py-2">Add players to the lineup first.</p>
      )}
    </div>
  )
}

// ─── Match Detail Page ────────────────────────────────────────────────────────

export default function MatchDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { match, loading, error, refetch } = useMatchDetail(id)
  const [editMode, setEditMode] = useState(false)
  const [savingType, setSavingType] = useState(false)

  const handleTypeChange = async (newType) => {
    setSavingType(true)
    try {
      await updateMatch(id, { match_type: newType })
      await refetch()
    } catch (e) { alert(e.message) }
    finally { setSavingType(false) }
  }

  if (loading) return <div className="max-w-5xl mx-auto px-4 py-8"><Spinner message="Loading match…" /></div>
  if (error) return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-rose-700 text-sm">{error}</div>
    </div>
  )
  if (!match) return null

  const { result, color: resultColor } = getMatchResult(match.histon_score, match.opposition_score)
  const hasResult = match.histon_score !== null

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">

      {/* ── Top bar ── */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Dashboard
        </button>
        <button
          onClick={() => setEditMode(e => !e)}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
            editMode
              ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          {editMode ? (
            <><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg> Done Editing</>
          ) : (
            <><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg> Edit Match</>
          )}
        </button>
      </div>

      {/* ── Match header ── */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              {/* Fixture type — editable in edit mode */}
              {editMode ? (
                <select
                  value={match.match_type}
                  disabled={savingType}
                  onChange={e => handleTypeChange(e.target.value)}
                  className="text-xs font-semibold rounded-full px-2.5 py-1 bg-white/10 text-white border border-white/20 focus:outline-none focus:ring-1 focus:ring-emerald-400 disabled:opacity-50"
                >
                  {MATCH_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              ) : (
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-white/10 text-white/80">
                  {match.match_type}
                </span>
              )}
              <span className="text-xs text-slate-400">{match.location === 'H' ? 'Home' : 'Away'}</span>
              <span className="text-xs text-slate-400">·</span>
              <span className="text-xs text-slate-400">{formatDate(match.match_date)}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">vs {match.opposition}</h1>
            <p className="text-slate-400 text-sm mt-1">{match.seasons?.name} · {match.match_length_mins} mins</p>
          </div>

          {hasResult && (
            <div className="text-right shrink-0">
              <div className="text-4xl sm:text-5xl font-black text-white leading-none">
                {match.histon_score}<span className="text-slate-500 mx-1">–</span>{match.opposition_score}
              </div>
              <span className={`inline-block mt-2 text-sm font-bold px-3 py-1 rounded-full ${resultColor}`}>
                {result === 'W' ? 'Win' : result === 'L' ? 'Loss' : 'Draw'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ── Match stats ── */}
      {hasResult && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard label="Goals Scored"   value={match.histon_score}     accent="emerald" />
          <StatCard label="Goals Conceded" value={match.opposition_score} accent="rose" />
          <StatCard label="Clean Sheet"    value={match.opposition_score === 0 ? 'Yes' : 'No'} accent={match.opposition_score === 0 ? 'emerald' : 'slate'} />
          <StatCard label="Players Used"   value={getUniquePlayersFromAppearances(match.player_appearances || []).length} accent="indigo" />
        </div>
      )}

      {/* ── Lineup ── */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 sm:p-6">
        <h2 className="text-base font-bold text-slate-800 mb-4">Lineup</h2>
        <LineupMatrix match={match} editMode={editMode} onRefetch={refetch} />
      </div>

      {/* ── Goals & Events ── */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 sm:p-6">
        <h2 className="text-base font-bold text-slate-800 mb-4">Goals &amp; Events</h2>
        <GoalsSection match={match} editMode={editMode} onRefetch={refetch} />
      </div>

      {/* ── Star Players ── */}
      {((match.star_player_awards || []).length > 0 || editMode) && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 sm:p-6">
          <h2 className="text-base font-bold text-slate-800 mb-4">
            <span className="text-amber-400 mr-1.5">★</span>Star Players
          </h2>
          <StarPlayersSection match={match} editMode={editMode} onRefetch={refetch} />
        </div>
      )}
    </div>
  )
}
