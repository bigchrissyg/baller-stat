import { useState, useEffect, useRef, Fragment } from 'react'
import { createPortal } from 'react-dom'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useMatchDetail, usePlayers, useSeasons } from '../hooks/useData'
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
  getPositionStyles,
  getMatchSegments,
  getPlayerSegmentPosition,
  getUniquePlayersFromAppearances,
  findCoveringAppearances,
  segmentToAppearanceSlot,
} from '../lib/utils'
import Spinner from '../components/ui/Spinner'
import StatCard from '../components/ui/StatCard'

const POSITIONS = ['GK', 'CB', 'LB', 'RB', 'CM', 'CDM', 'CAM', 'LM', 'RM', 'CF', 'LF', 'RF', 'ST']
const MATCH_TYPES = ['League', 'Cup', 'Friendly']
const HALVES = ['H1', 'H2']
const QUARTERS = [1, 2, 3, 4]

// ─── Position colours (consolidated from utils) ──────────────────────────────

// Helper to get styles for a position - uses centralized getPositionStyles from utils
const getPOS_STYLES = (position) => getPositionStyles(position)

const POS_GROUPS = [
  { label: 'GK',  positions: ['GK'] },
  { label: 'DEF', positions: ['CB', 'LB', 'RB'] },
  { label: 'MID', positions: ['CDM', 'CM', 'CAM', 'LM', 'RM'] },
  { label: 'ATK', positions: ['CF', 'LF', 'RF', 'ST'] },
]

// ─── Player Eligibility Filter ──────────────────────────────────────────────

/**
 * Filter players eligible for a match based on:
 * - Active status
 * - Season registration (for League/Cup matches only)
 */
function getEligiblePlayers(allPlayers, match) {
  if (!allPlayers) return []
  
  // Only show active players
  let eligible = allPlayers.filter(p => p.active !== false)
  
  // For League and Cup matches, filter by season registration
  if ((match.match_type === 'League' || match.match_type === 'Cup') && match.season_id) {
    eligible = eligible.filter(p => {
      const playerSeasonIds = (p.player_seasons || []).map(ps => ps.season_id)
      return playerSeasonIds.includes(match.season_id)
    })
  }
  // For Friendly matches, all active players are eligible
  
  return eligible
}

// ─── Rich position dropdown ───────────────────────────────────────────────────

function PositionSelect({ value, suggested, disabled, onChange }) {
  const [open, setOpen] = useState(false)
  const [menuStyle, setMenuStyle] = useState({})
  const triggerRef = useRef(null)
  const menuRef = useRef(null)

  const solidStyles = value ? getPOS_STYLES(value) : null

  const openMenu = () => {
    if (disabled) return
    if (open) { setOpen(false); return }
    const rect = triggerRef.current.getBoundingClientRect()
    const menuWidth = 200
    const left = rect.left + menuWidth > window.innerWidth ? rect.right - menuWidth : rect.left
    setMenuStyle({ position: 'fixed', top: rect.bottom + 4, left, width: menuWidth, zIndex: 9999 })
    setOpen(true)
  }

  const select = (pos) => {
    setOpen(false)
    if (pos !== value) onChange(pos)
  }

  useEffect(() => {
    if (!open) return
    const onDown = (e) => {
      if (!triggerRef.current?.contains(e.target) && !menuRef.current?.contains(e.target))
        setOpen(false)
    }
    const onScroll = () => setOpen(false)
    document.addEventListener('pointerdown', onDown)
    document.addEventListener('scroll', onScroll, true)
    return () => {
      document.removeEventListener('pointerdown', onDown)
      document.removeEventListener('scroll', onScroll, true)
    }
  }, [open])

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={openMenu}
        disabled={disabled}
        className={`w-14 h-11 sm:h-8 rounded text-xs font-bold transition-all disabled:opacity-40 flex items-center justify-center ${
          value ? solidStyles.solid : 'text-neutral-muted border border-dashed border-neutral-border'
        }`}
      >
        {value || <span className="text-[10px]">+pos</span>}
      </button>

      {open && createPortal(
        <div ref={menuRef} style={menuStyle} className="bg-neutral-card rounded-xl border border-neutral-border shadow-xl p-2.5 space-y-2">
          <button
            onPointerDown={() => select('')}
            className="w-full text-left text-xs text-neutral-muted hover:text-neutral-fg px-2 py-2 sm:py-0.5 rounded hover:bg-neutral-secondary"
          >
            — Remove
          </button>
          {POS_GROUPS.map(group => (
            <div key={group.label}>
              <div className="text-[9px] font-bold uppercase tracking-widest text-neutral-muted px-1 mb-1">{group.label}</div>
              <div className="flex flex-wrap gap-1.5">
                {group.positions.map(p => (
                  <button
                    key={p}
                    onPointerDown={() => select(p)}
                    className={`${getPOS_STYLES(p).solid} text-xs font-bold rounded px-3 py-2 sm:px-2 sm:py-1 hover:opacity-80 transition-opacity ${value === p ? 'ring-2 ring-offset-1 ring-neutral-muted' : ''}`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>,
        document.body
      )}
    </>
  )
}

// ─── Pitch View ──────────────────────────────────────────────────────────────

// SVG coordinate space: viewBox "0 0 100 148"
// GK defends top goal (low y), attackers push toward bottom (high y).
const PITCH_POS = {
  GK:  { x: 50, y: 20 },
  LB:  { x: 80, y: 40 }, CB:  { x: 50, y: 40 }, RB:  { x: 20, y: 40 },
  CDM: { x: 50, y: 65 },
  LM:  { x: 80, y: 90 }, CM:  { x: 50, y: 80 }, RM:  { x: 18, y: 90 },
  CAM: { x: 50, y: 100 },
  LF:  { x: 78, y: 130 }, CF:  { x: 50, y: 120 }, RF:  { x: 22, y: 120 },
  ST:  { x: 50, y: 130 },
}

const POS_SVG_COLOR = {
  GK:  { fill: '#9333ea', stroke: '#7e22ce' },
  CB:  { fill: '#dc2626', stroke: '#b91c1c' },
  LB:  { fill: '#dc2626', stroke: '#b91c1c' },
  RB:  { fill: '#dc2626', stroke: '#b91c1c' },
  CM:  { fill: '#ca8a04', stroke: '#a16207' },
  CDM: { fill: '#ca8a04', stroke: '#a16207' },
  CAM: { fill: '#ca8a04', stroke: '#a16207' },
  LM:  { fill: '#ca8a04', stroke: '#a16207' },
  RM:  { fill: '#ca8a04', stroke: '#a16207' },
  CF:  { fill: '#16a34a', stroke: '#15803d' },
  LF:  { fill: '#16a34a', stroke: '#15803d' },
  RF:  { fill: '#16a34a', stroke: '#15803d' },
  ST:  { fill: '#16a34a', stroke: '#15803d' },
}

// Renders a single pitch SVG with the given list of {id, name, position} players
function FormationPitch({ players }) {
  const byPos = {}
  for (const p of players) {
    if (!byPos[p.position]) byPos[p.position] = []
    byPos[p.position].push(p)
  }
  const placed = []
  for (const [pos, group] of Object.entries(byPos)) {
    const base = PITCH_POS[pos] || { x: 50, y: 62 }
    if (group.length === 1) {
      placed.push({ ...group[0], x: base.x, y: base.y })
    } else {
      const gap = Math.min(16, 70 / group.length)
      const half = (gap * (group.length - 1)) / 2
      group.forEach((p, i) => placed.push({ ...p, x: base.x - half + i * gap, y: base.y }))
    }
  }

  return (
    <svg viewBox="0 0 100 148" className="w-full rounded-xl shadow-md" style={{ display: 'block' }}>
      <rect width="100" height="148" fill="#1a7a3c" rx="6" />
      {[0,1,2,3,4,5,6].map(i => (
        <rect key={i} x="5" y={4 + i * 20} width="90" height="10" fill="rgba(0,0,0,0.05)" />
      ))}
      <rect x="5"  y="4"   width="90" height="140" fill="none" stroke="rgba(255,255,255,0.65)" strokeWidth="0.6" />
      <line x1="5" y1="74" x2="95"   y2="74"       stroke="rgba(255,255,255,0.65)" strokeWidth="0.6" />
      <circle cx="50" cy="74" r="11" fill="none"    stroke="rgba(255,255,255,0.65)" strokeWidth="0.6" />
      <circle cx="50" cy="74" r="0.8"               fill="rgba(255,255,255,0.65)" />
      <rect x="22" y="4"   width="56" height="22"   fill="none" stroke="rgba(255,255,255,0.65)" strokeWidth="0.6" />
      <rect x="35" y="4"   width="30" height="9"    fill="none" stroke="rgba(255,255,255,0.65)" strokeWidth="0.6" />
      <circle cx="50" cy="19"  r="0.7"              fill="rgba(255,255,255,0.65)" />
      <rect x="40" y="1"   width="20" height="4"    fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.65)" strokeWidth="0.6" />
      <rect x="22" y="122" width="56" height="22"   fill="none" stroke="rgba(255,255,255,0.65)" strokeWidth="0.6" />
      <rect x="35" y="135" width="30" height="9"    fill="none" stroke="rgba(255,255,255,0.65)" strokeWidth="0.6" />
      <circle cx="50" cy="129" r="0.7"              fill="rgba(255,255,255,0.65)" />
      <rect x="40" y="143" width="20" height="4"    fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.65)" strokeWidth="0.6" />
      {placed.map(p => {
        const c = POS_SVG_COLOR[p.position] || { fill: '#64748b', stroke: '#475569' }
        const lastName = p.name.split(' ').at(-1)
        const label = lastName.length > 9 ? lastName.slice(0, 8) + '…' : lastName
        return (
          <g key={p.id} transform={`translate(${p.x},${p.y})`}>
            <circle r="5.8" fill="rgba(0,0,0,0.25)" cx="0.4" cy="0.6" />
            <circle r="5.5" fill={c.fill} stroke={c.stroke} strokeWidth="0.6" />
            <text textAnchor="middle" dominantBaseline="central" fontSize="2.6" fontWeight="700" fill="white" y="0">
              {p.position}
            </text>
            <text textAnchor="middle" fontSize="3.1" fontWeight="600" y="10"
              stroke="rgba(0,0,0,0.5)" strokeWidth="1.4" strokeLinejoin="round" paintOrder="stroke" fill="white">
              {label}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

const fmtMin = (m) => m % 1 !== 0 ? m.toFixed(1) : String(Math.round(m))

// Show substitutions and position changes between slices
function SubstitutionsSummary({ prevSlice, currentSlice }) {
  if (!prevSlice) return null

  const prevMap = new Map(prevSlice.active.map(p => [p.id, p]))
  const currMap = new Map(currentSlice.active.map(p => [p.id, p]))

  const subOff = prevSlice.active.filter(p => !currMap.has(p.id))
  const subOn = currentSlice.active.filter(p => !prevMap.has(p.id))
  const positionChanges = currentSlice.active.filter(p => prevMap.has(p.id) && prevMap.get(p.id).position !== p.position)

  if (subOff.length === 0 && subOn.length === 0 && positionChanges.length === 0) {
    return null
  }

  return (
    <div className="mt-3 pt-3 border-t border-neutral-border text-xs space-y-1.5">
      {subOff.length > 0 && (
        <div className="flex flex-wrap gap-2 items-start">
          <span className="text-neutral-muted font-semibold">Off:</span>
          <div className="flex flex-wrap gap-1">
            {subOff.map(p => (
              <span key={p.id} className="bg-red-100 text-red-700 px-2 py-0.5 rounded">
                {p.name} <span className="font-semibold">← {p.position}</span>
              </span>
            ))}
          </div>
        </div>
      )}
      {subOn.length > 0 && (
        <div className="flex flex-wrap gap-2 items-start">
          <span className="text-neutral-muted font-semibold">On:</span>
          <div className="flex flex-wrap gap-1">
            {subOn.map(p => (
              <span key={p.id} className="bg-green-100 text-green-700 px-2 py-0.5 rounded">
                {p.name} <span className="font-semibold">→ {currMap.get(p.id).position}</span>
              </span>
            ))}
          </div>
        </div>
      )}
      {positionChanges.length > 0 && (
        <div className="flex flex-wrap gap-2 items-start">
          <span className="text-neutral-muted font-semibold">Position:</span>
          <div className="flex flex-wrap gap-1">
            {positionChanges.map(p => (
              <span key={p.id} className="bg-hornets-secondary/20 text-hornets-secondary px-2 py-0.5 rounded">
                {p.name} ({prevMap.get(p.id).position} → {p.position})
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function PitchView({ match }) {
  const allApps = match.player_appearances || []
  const matchLen = match.match_length_mins || 60

  if (allApps.filter(a => a.position).length === 0) {
    return <p className="text-sm text-neutral-muted py-8 text-center">No positions recorded yet.</p>
  }

  // Collect every time boundary where the lineup could change
  const times = [...new Set([0, ...allApps.flatMap(a => [a.time_start, a.time_end]), matchLen])]
    .sort((a, b) => a - b)

  // For each interval between consecutive boundaries, find which players are active
  const slices = []
  for (let i = 0; i < times.length - 1; i++) {
    const t1 = times[i]
    const t2 = times[i + 1]
    const mid = (t1 + t2) / 2

    // Deduplicate by player_id — last matching appearance wins
    const activeMap = new Map()
    for (const a of allApps) {
      if (a.time_start <= mid && a.time_end > mid && a.position) {
        activeMap.set(a.player_id, { id: a.player_id, name: a.players?.name ?? 'Unknown', position: a.position })
      }
    }
    const active = [...activeMap.values()]
    if (active.length === 0) continue

    const key = active.slice().sort((a, b) => a.id - b.id).map(a => `${a.id}:${a.position}`).join(',')

    if (slices.length > 0 && slices.at(-1).key === key) {
      slices.at(-1).t2 = t2   // extend the existing slice
    } else {
      slices.push({ t1, t2, active, key })
    }
  }

  if (slices.length === 0) {
    return <p className="text-sm text-neutral-muted py-8 text-center">No positions recorded yet.</p>
  }

  return (
    <div className={`grid gap-6 ${slices.length === 1 ? 'max-w-xs mx-auto' : 'grid-cols-1 sm:grid-cols-2'}`}>
      {slices.map((slice, idx) => (
        <div key={idx} className="select-none">
          <p className="text-center text-sm font-semibold text-neutral-fg/70 mb-2">
            {fmtMin(slice.t1)}' – {fmtMin(slice.t2)}'
          </p>
          <FormationPitch players={slice.active} />
          <SubstitutionsSummary prevSlice={idx > 0 ? slices[idx - 1] : null} currentSlice={slice} />
        </div>
      ))}
    </div>
  )
}

// ─── Lineup Matrix ────────────────────────────────────────────────────────────

function LineupMatrix({ match, editMode, onRefetch }) {
  const matchLen = match.match_length_mins || 60
  const segments = getMatchSegments(matchLen)
  const { players: allPlayers } = usePlayers()

  const [lineupTab, setLineupTab] = useState('matrix')
  const [busy, setBusy] = useState(false)
  const [addForm, setAddForm] = useState({ player_id: '', time_start: 0, time_end: matchLen / 2, position: 'GK' })
  const [addErr, setAddErr] = useState(null)
  const [excluded, setExcluded] = useState(new Set())
  const [appearances, setAppearances] = useState(match.player_appearances || [])

  // Sync local appearances with match data when it changes
  useEffect(() => {
    setAppearances(match.player_appearances || [])
  }, [match.player_appearances])

  const allApps = appearances
  const playersInMatch = getUniquePlayersFromAppearances(allApps)

  // Reset exclusions each time edit mode opens
  useEffect(() => { if (editMode) setExcluded(new Set()) }, [editMode])

  // Get eligible players based on season and active status
  const eligiblePlayers = getEligiblePlayers(allPlayers, match)

  // In edit mode with no appearances yet, show every eligible player so the user can fill in who played
  const matrixPlayers = editMode && allApps.length === 0
    ? eligiblePlayers.filter(p => !excluded.has(p.id)).map(p => ({ id: p.id, name: p.name }))
    : playersInMatch

  const getPlayerTotalMins = (playerId) =>
    allApps.filter(a => a.player_id === playerId)
           .reduce((sum, a) => sum + (a.time_end - a.time_start), 0)

  // Trim or delete each appearance so it no longer covers the given segment's time window
  // Returns updated appearance list for optimistic updates
  const trimOrDeleteCovering = async (covering, segment, currentApps) => {
    const updated = [...currentApps]
    
    for (const app of covering) {
      const left  = app.time_start < segment.start
      const right = app.time_end   > segment.end
      
      if (left && right) {
        // Split: shorten existing, create new for the remainder
        const idx = updated.findIndex(a => a.id === app.id)
        updated[idx] = { ...updated[idx], time_end: segment.start }
        const newId = Math.max(...updated.map(a => a.id || 0), 0) + 1
        updated.push({
          id: newId,
          player_id: app.player_id,
          match_id: app.match_id,
          position: app.position,
          time_start: segment.end,
          time_end: app.time_end,
        })
        await updatePlayerAppearance(app.id, { time_end: segment.start })
        await insertPlayerAppearance({
          player_id: app.player_id,
          match_id: app.match_id,
          position: app.position,
          time_start: segment.end,
          time_end: app.time_end,
        })
      } else if (left) {
        // Trim from right
        const idx = updated.findIndex(a => a.id === app.id)
        updated[idx] = { ...updated[idx], time_end: segment.start }
        await updatePlayerAppearance(app.id, { time_end: segment.start })
      } else if (right) {
        // Trim from left
        const idx = updated.findIndex(a => a.id === app.id)
        updated[idx] = { ...updated[idx], time_start: segment.end }
        await updatePlayerAppearance(app.id, { time_start: segment.end })
      } else {
        // Remove entirely
        const idx = updated.findIndex(a => a.id === app.id)
        updated.splice(idx, 1)
        await deletePlayerAppearance(app.id)
      }
    }
    
    return updated
  }

  // Update or adjust the appearance(s) covering a segment for a player
  const handleCellChange = async (playerId, segment, newPos) => {
    setBusy(true)
    try {
      const covering = findCoveringAppearances(allApps, playerId, segment)
      let updated = [...allApps]
      
      if (newPos === '') {
        // Remove position for this segment
        updated = await trimOrDeleteCovering(covering, segment, updated)
      } else if (covering.length === 0) {
        // Create new appearance
        const slot = segmentToAppearanceSlot(segment, matchLen)
        const result = await insertPlayerAppearance({ ...slot, player_id: playerId, match_id: match.id, position: newPos })
        const playerName = allPlayers?.find(p => p.id === playerId)?.name || 'Unknown'
        updated.push({ 
          id: result?.id || Math.max(...updated.map(a => a.id || 0), 0) + 1,
          ...slot, 
          player_id: playerId, 
          match_id: match.id, 
          position: newPos,
          players: { name: playerName }
        })
      } else if (
        covering.length === 1 &&
        covering[0].time_start === segment.start &&
        covering[0].time_end === segment.end
      ) {
        // Update existing appearance position
        const idx = updated.findIndex(a => a.id === covering[0].id)
        updated[idx] = { ...updated[idx], position: newPos }
        await updatePlayerAppearance(covering[0].id, { position: newPos })
      } else {
        // Trim/split covering records to remove this segment's window, then insert a precise new record
        updated = await trimOrDeleteCovering(covering, segment, updated)
        const result = await insertPlayerAppearance({
          player_id: playerId,
          match_id: match.id,
          position: newPos,
          time_start: segment.start,
          time_end: segment.end,
        })
        const playerName = allPlayers?.find(p => p.id === playerId)?.name || 'Unknown'
        updated.push({
          id: result?.id || Math.max(...updated.map(a => a.id || 0), 0) + 1,
          player_id: playerId,
          match_id: match.id,
          position: newPos,
          time_start: segment.start,
          time_end: segment.end,
          players: { name: playerName }
        })
      }
      
      // Optimistically update local state
      setAppearances(updated)
    } catch (e) { 
      alert(e.message)
      // Refetch on error to sync state
      await onRefetch()
    } finally { 
      setBusy(false) 
    }
  }

  // Remove a player: delete all their appearances for this match, or just hide them locally
  const handleRemovePlayer = async (playerId) => {
    const playerApps = allApps.filter(a => a.player_id === playerId)
    if (playerApps.length > 0) {
      setBusy(true)
      try {
        // Optimistically remove from state
        const updated = allApps.filter(a => a.player_id !== playerId)
        setAppearances(updated)
        
        // Delete from server
        await Promise.all(playerApps.map(a => deletePlayerAppearance(a.id)))
      } catch (e) { 
        alert(e.message)
        // Refetch on error to sync state
        await onRefetch()
      } finally { 
        setBusy(false) 
      }
    } else {
      setExcluded(prev => new Set([...prev, playerId]))
    }
  }

  // Add a custom-range appearance via the form below the matrix
  const handleAddAppearance = async (e) => {
    e.preventDefault()
    if (!addForm.player_id) return
    setBusy(true); setAddErr(null)
    try {
      const tsNum = Number(addForm.time_start)
      const teNum = Number(addForm.time_end)
      const result = await insertPlayerAppearance({
        player_id: addForm.player_id,
        position: addForm.position,
        match_id: match.id,
        time_start: tsNum,
        time_end: teNum,
      })
      
      // Optimistically add to state
      const playerName = (allPlayers || []).find(p => p.id === Number(addForm.player_id))?.name || 'Unknown'
      setAppearances([...allApps, {
        id: result?.id || Math.max(...allApps.map(a => a.id || 0), 0) + 1,
        player_id: Number(addForm.player_id),
        position: addForm.position,
        match_id: match.id,
        time_start: tsNum,
        time_end: teNum,
        players: { name: playerName }
      }])
      
      setAddForm({ player_id: '', time_start: 0, time_end: matchLen / 2, position: 'GK' })
    } catch (e) { 
      setAddErr(e.message)
      // Refetch on error to sync state
      await onRefetch()
    }
    finally { setBusy(false) }
  }

  return (
    <div className="space-y-4">
      {/* Tab switcher */}
      <div className="flex gap-1 bg-neutral-secondary rounded-lg p-1 w-fit">
        {[['matrix', 'Matrix'], ['pitch', 'Pitch']].map(([id, label]) => (
          <button key={id} onClick={() => setLineupTab(id)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              lineupTab === id ? 'bg-neutral-card text-neutral-fg shadow-sm' : 'text-neutral-muted hover:text-neutral-fg'
            }`}
          >{label}</button>
        ))}
      </div>

      {lineupTab === 'pitch' ? (
        <PitchView match={match} />
      ) : matrixPlayers.length === 0 && !editMode ? (
        <p className="text-sm text-neutral-muted py-6 text-center">No lineup recorded yet.</p>
      ) : (
      <div className="space-y-5">
      {/* Matrix */}
      <div className="overflow-x-auto overscroll-x-contain">
        <table className="min-w-full text-sm border-collapse">
          <thead>
            <tr>
              <th className="sticky left-0 z-10 bg-neutral-card pl-0 pr-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-neutral-muted whitespace-nowrap min-w-[140px]">
                Player
              </th>
              {segments.map(seg => (
                <Fragment key={seg.index}>
                  <th className="px-1 py-2 text-xs font-medium text-neutral-muted text-center whitespace-nowrap min-w-[56px]">
                    {seg.label}
                  </th>
                  {seg.index === 3 && (
                    <th className="w-6 px-0 py-2 text-[9px] font-bold text-neutral-muted uppercase tracking-widest text-center border-l border-neutral-border">
                      HT
                    </th>
                  )}
                  {seg.index === 7 && (
                    <th className="w-6 px-0 py-2 text-[9px] font-bold text-neutral-muted uppercase tracking-widest text-center border-l border-neutral-border">
                      FT
                    </th>
                  )}
                </Fragment>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {matrixPlayers.map(player => {
              const totalMins = getPlayerTotalMins(player.id)
              return (
                <tr key={player.id} className="group hover:bg-neutral-secondary/50">
                  <td className="sticky left-0 z-10 bg-neutral-card group-hover:bg-neutral-secondary/50 transition-colors pl-0 pr-3 py-2">
                    <div className="flex items-center justify-between gap-2">
                      <Link
                        to={`/players/${player.id}`}
                        className="font-semibold text-neutral-fg hover:text-neutral-accent transition-colors whitespace-nowrap text-sm"
                      >
                        {player.name}
                      </Link>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {totalMins > 0 && (
                          <span className="text-xs text-neutral-muted font-medium whitespace-nowrap">{Math.round(totalMins)}'</span>
                        )}
                        {editMode && (
                          <button
                            onClick={() => handleRemovePlayer(player.id)}
                            disabled={busy}
                            className="w-9 h-9 flex items-center justify-center rounded-lg text-neutral-muted/70 hover:text-hornets-tertiary hover:bg-red-50 transition-colors disabled:opacity-40"
                            title="Remove player"
                          >✕</button>
                        )}
                      </div>
                    </div>
                  </td>
                  {segments.map(seg => {
                    const pos = getPlayerSegmentPosition(allApps, player.id, seg)
                    return (
                      <Fragment key={seg.index}>
                        <td className="px-1 py-2 text-center">
                          {editMode ? (
                            <PositionSelect
                              value={pos || ''}
                              suggested={null}
                              disabled={busy}
                              onChange={newPos => handleCellChange(player.id, seg, newPos)}
                            />
                          ) : pos ? (
                            <span className={`inline-flex items-center justify-center w-14 h-6 rounded text-xs font-bold ${getPOS_STYLES(pos).solid}`}>
                              {pos}
                            </span>
                          ) : (
                            <span className="text-slate-200 text-xs">—</span>
                          )}
                        </td>
                        {seg.index === 3 && <td className="w-6 px-0 border-l border-neutral-border bg-neutral-secondary/50" />}
                        {seg.index === 7 && <td className="w-6 px-0 border-l border-neutral-border bg-neutral-secondary/50" />}
                      </Fragment>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Edit mode: custom-range appearance form */}
      {editMode && (
        <form onSubmit={handleAddAppearance} className="bg-neutral-accent/10 border border-neutral-accent/30 rounded-xl p-4 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-accent">Add custom time slot</p>
          <div className="flex flex-wrap gap-2 items-end">
            <select
              className="border border-neutral-border rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-neutral-accent"
              value={addForm.player_id}
              onChange={e => setAddForm(f => ({ ...f, player_id: e.target.value }))}
              required
            >
              <option value="">Player…</option>
              {eligiblePlayers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <select
              className="border border-neutral-border rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-neutral-accent"
              value={addForm.position}
              onChange={e => setAddForm(f => ({ ...f, position: e.target.value }))}
            >
              {POSITIONS.map(p => <option key={p}>{p}</option>)}
            </select>
            <input
              type="number" min={0} max={matchLen} placeholder="Start"
              className="border border-neutral-border rounded-lg px-2 py-1.5 text-xs w-16 focus:outline-none focus:ring-1 focus:ring-neutral-accent"
              value={addForm.time_start}
              onChange={e => setAddForm(f => ({ ...f, time_start: e.target.value }))}
            />
            <span className="text-neutral-muted text-xs">to</span>
            <input
              type="number" min={1} max={matchLen} placeholder="End"
              className="border border-neutral-border rounded-lg px-2 py-1.5 text-xs w-16 focus:outline-none focus:ring-1 focus:ring-neutral-accent"
              value={addForm.time_end}
              onChange={e => setAddForm(f => ({ ...f, time_end: e.target.value }))}
            />
            <button
              type="submit" disabled={busy}
              className="bg-neutral-accent/100 hover:bg-neutral-accent text-white text-xs font-semibold rounded-lg px-3 py-1.5 transition-colors disabled:opacity-50"
            >
              {busy ? '…' : '+ Add'}
            </button>
          </div>
          {addErr && <p className="text-xs text-hornets-tertiary">{addErr}</p>}
        </form>
      )}
      </div>
      )}
    </div>
  )
}

// ─── Goals & Events Section ───────────────────────────────────────────────────

function GoalsSection({ match, editMode, onRefetch }) {
  const { players: allPlayers } = usePlayers()
  const matchLen = match.match_length_mins || 60
  
  // Get eligible players based on season and active status
  const eligiblePlayers = getEligiblePlayers(allPlayers, match)
  
  const [goals, setGoals] = useState(match.goals || [])
  const [form, setForm] = useState({
    scorer_player_id: '',
    assist_player_id: '',
    for_histon: true,
    timing: 'H1Q1', // Combined field: H1Q1, H1Q2, H2Q3, H2Q4
  })
  
  const GOAL_TIMINGS = [
    { label: 'H1, Q1', value: 'H1Q1', half: 'H1', quarter: 1 },
    { label: 'H1, Q2', value: 'H1Q2', half: 'H1', quarter: 2 },
    { label: 'H2, Q3', value: 'H2Q3', half: 'H2', quarter: 3 },
    { label: 'H2, Q4', value: 'H2Q4', half: 'H2', quarter: 4 },
  ]
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState(null)

  // Sync local goals with match data when it changes
  useEffect(() => {
    setGoals(match.goals || [])
  }, [match.goals])

  const handleAdd = async (e) => {
    e.preventDefault()
    if (form.for_histon && !form.scorer_player_id) return
    setSaving(true); setErr(null)
    try {
      const timing = GOAL_TIMINGS.find(t => t.value === form.timing)
      const result = await insertGoal({
        scorer_player_id: form.scorer_player_id ? Number(form.scorer_player_id) : null,
        assist_player_id: form.assist_player_id ? Number(form.assist_player_id) : null,
        for_histon: form.for_histon,
        half: timing.half,
        quarter: timing.quarter,
        match_id: match.id,
      })
      
      // Optimistically add to state
      const scorer = form.scorer_player_id ? eligiblePlayers?.find(p => p.id === Number(form.scorer_player_id)) : null
      const assist = form.assist_player_id ? eligiblePlayers?.find(p => p.id === Number(form.assist_player_id)) : null
      setGoals([...goals, {
        id: result?.id || Math.max(...goals.map(a => a.id || 0), 0) + 1,
        scorer_player_id: form.scorer_player_id ? Number(form.scorer_player_id) : null,
        assist_player_id: form.assist_player_id ? Number(form.assist_player_id) : null,
        for_histon: form.for_histon,
        half: timing.half,
        quarter: timing.quarter,
        match_id: match.id,
        players: form.for_histon ? { name: scorer?.name || 'Unknown' } : null,
        players_assist: form.for_histon && assist ? { name: assist.name } : null,
      }])
      
      // Remember for_histon and timing for next entry, only clear player selections
      setForm(f => ({ ...f, scorer_player_id: '', assist_player_id: '' }))
    } catch (e) { 
      setErr(e.message)
      // Refetch on error to sync state
      await onRefetch()
    } finally { 
      setSaving(false) 
    }
  }

  const histonGoals = goals.filter(g => g.for_histon)
  const oppGoals    = goals.filter(g => !g.for_histon)

  // Split goals by half and interleave them chronologically
  const h1Goals = goals.filter(g => g.half === 'H1').sort((a, b) => {
    // Sort by quarter, then by creation order (index in original array)
    const quarterDiff = (a.quarter ?? 0) - (b.quarter ?? 0)
    return quarterDiff !== 0 ? quarterDiff : goals.indexOf(a) - goals.indexOf(b)
  })
  const h2Goals = goals.filter(g => g.half === 'H2').sort((a, b) => {
    // Sort by quarter, then by creation order (index in original array)
    const quarterDiff = (a.quarter ?? 0) - (b.quarter ?? 0)
    return quarterDiff !== 0 ? quarterDiff : goals.indexOf(a) - goals.indexOf(b)
  })

  const GoalTiming = ({ g }) => {
    if (!g.half) return null
    return (
      <span className="text-xs font-medium text-neutral-muted ml-1">
        {g.half}, Q{g.quarter}
      </span>
    )
  }

  return (
    <div className="space-y-4">
      {/* Kick Off marker */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-neutral-secondary" />
        <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-muted">Kick Off</span>
        <div className="flex-1 h-px bg-neutral-secondary" />
      </div>

      {h1Goals.length === 0 && h2Goals.length === 0 && !editMode && (
        <p className="text-sm text-neutral-muted py-2 text-center">No goals recorded.</p>
      )}

      {/* First half goals */}
      {h1Goals.length > 0 && (
        <div className="space-y-1.5">
          {h1Goals.map(g => (
            <div key={g.id} className={`flex items-center gap-2.5 rounded-lg px-3 py-2 border ${
              g.for_histon 
                ? 'bg-neutral-accent/10 border-neutral-accent/30' 
                : 'bg-hornets-tertiary/10 border-hornets-tertiary/30'
            }`}>
              <span className="text-base">⚽</span>
              <div className="flex-1 min-w-0">
                <span className={`text-sm ${g.for_histon ? 'font-semibold text-neutral-fg' : 'font-medium text-neutral-fg/70'}`}>
                  {g.for_histon ? (g.players?.name ?? 'Unknown') : 'Opposition goal'}
                </span>
                {g.for_histon && g.players_assist?.name && (
                  <span className="text-neutral-muted text-xs ml-2">assist: {g.players_assist.name}</span>
                )}
                <GoalTiming g={g} />
              </div>
              {editMode && (
                <button onClick={async () => { 
                  setSaving(true)
                  try {
                    setGoals(goals.filter(goal => goal.id !== g.id))
                    await deleteGoal(g.id)
                  } catch (e) {
                    alert(e.message)
                    await onRefetch()
                  } finally {
                    setSaving(false)
                  }
                }}
                  className="text-xs text-hornets-tertiary hover:text-hornets-tertiary font-medium shrink-0 disabled:opacity-50" disabled={saving}>✕</button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Half Time divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-neutral-secondary" />
        <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-muted">Half Time</span>
        <div className="flex-1 h-px bg-neutral-secondary" />
      </div>

      {/* Second half goals */}
      {h2Goals.length > 0 && (
        <div className="space-y-1.5">
          {h2Goals.map(g => (
            <div key={g.id} className={`flex items-center gap-2.5 rounded-lg px-3 py-2 border ${
              g.for_histon 
                ? 'bg-neutral-accent/10 border-neutral-accent/30' 
                : 'bg-hornets-tertiary/10 border-hornets-tertiary/30'
            }`}>
              <span className="text-base">⚽</span>
              <div className="flex-1 min-w-0">
                <span className={`text-sm ${g.for_histon ? 'font-semibold text-neutral-fg' : 'font-medium text-neutral-fg/70'}`}>
                  {g.for_histon ? (g.players?.name ?? 'Unknown') : 'Opposition goal'}
                </span>
                {g.for_histon && g.players_assist?.name && (
                  <span className="text-neutral-muted text-xs ml-2">assist: {g.players_assist.name}</span>
                )}
                <GoalTiming g={g} />
              </div>
              {editMode && (
                <button onClick={async () => { 
                  setSaving(true)
                  try {
                    setGoals(goals.filter(goal => goal.id !== g.id))
                    await deleteGoal(g.id)
                  } catch (e) {
                    alert(e.message)
                    await onRefetch()
                  } finally {
                    setSaving(false)
                  }
                }}
                  className="text-xs text-hornets-tertiary hover:text-hornets-tertiary font-medium shrink-0 disabled:opacity-50" disabled={saving}>✕</button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Full Time divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-neutral-secondary" />
        <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-muted">Full Time</span>
        <div className="flex-1 h-px bg-neutral-secondary" />
      </div>

      {/* Add goal form (edit mode) */}
      {editMode && (
        <form onSubmit={handleAdd} className="bg-neutral-secondary/50 border border-neutral-border rounded-xl p-4 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-muted/80">Log Goal</p>

          {/* For / Against — large touch toggle */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setForm(f => ({ ...f, for_histon: true }))}
              className={`py-3 rounded-xl text-sm font-bold transition-colors ${
                form.for_histon
                  ? 'bg-neutral-accent text-white shadow-sm'
                  : 'bg-neutral-card border border-neutral-border text-neutral-muted'
              }`}
            >
              ⚽ For Us
            </button>
            <button
              type="button"
              onClick={() => setForm(f => ({ ...f, for_histon: false, assist_player_id: '' }))}
              className={`py-3 rounded-xl text-sm font-bold transition-colors ${
                !form.for_histon
                  ? 'bg-[#E8354A] text-white shadow-sm'
                  : 'bg-neutral-card border border-neutral-border text-neutral-muted'
              }`}
            >
              ⚽ Against
            </button>
          </div>

          {/* Timing — pill buttons */}
          <div className="grid grid-cols-4 gap-1.5">
            {GOAL_TIMINGS.map(t => (
              <button
                key={t.value}
                type="button"
                onClick={() => setForm(f => ({ ...f, timing: t.value }))}
                className={`py-2.5 rounded-lg text-xs font-bold transition-colors ${
                  form.timing === t.value
                    ? 'bg-neutral-accent text-white shadow-sm'
                    : 'bg-neutral-card border border-neutral-border text-neutral-muted'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Scorer / Assist — taller selects */}
          <select
            className="w-full border border-neutral-border rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-accent bg-neutral-card"
            value={form.scorer_player_id}
            onChange={e => setForm(f => ({ ...f, scorer_player_id: e.target.value }))}
            required={form.for_histon}
          >
            <option value="">{form.for_histon ? 'Scorer…' : 'Scorer (optional)…'}</option>
            {eligiblePlayers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          {form.for_histon && (
            <select
              className="w-full border border-neutral-border rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-accent bg-neutral-card"
              value={form.assist_player_id}
              onChange={e => setForm(f => ({ ...f, assist_player_id: e.target.value }))}
            >
              <option value="">Assist (optional)…</option>
              {eligiblePlayers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          )}

          <button
            type="submit" disabled={saving}
            className="w-full bg-neutral-accent hover:bg-neutral-accent/90 text-white text-sm font-bold rounded-xl py-3.5 transition-colors disabled:opacity-50"
          >
            {saving ? '…' : '+ Log Goal'}
          </button>
          {err && <p className="text-xs text-hornets-tertiary">{err}</p>}
        </form>
      )}
    </div>
  )
}

// ─── Star Players ─────────────────────────────────────────────────────────────

function StarPlayersSection({ match, editMode, onRefetch }) {
  const playersInMatch = getUniquePlayersFromAppearances(match.player_appearances || [])
  const [awards, setAwards] = useState(match.star_player_awards || [])
  const [saving, setSaving] = useState(false)

  // Sync local awards with match data when it changes
  useEffect(() => {
    setAwards(match.star_player_awards || [])
  }, [match.star_player_awards])

  const toggle = async (player) => {
    const existing = awards.find(a => a.player_id === player.id)
    setSaving(true)
    try {
      if (existing) {
        // Optimistically remove
        setAwards(awards.filter(a => a.id !== existing.id))
        await deleteStarPlayerAward(existing.id)
      } else {
        // Optimistically add
        const result = await insertStarPlayerAward({ player_id: player.id, match_id: match.id })
        setAwards([...awards, {
          id: result?.id || Math.max(...awards.map(a => a.id || 0), 0) + 1,
          player_id: player.id,
          match_id: match.id,
          players: { name: player.name }
        }])
      }
      // Refresh match data to sync with server
      await onRefetch()
    } catch (e) { 
      alert(e.message)
      // Refetch on error to sync state
      await onRefetch()
    } finally { 
      setSaving(false) 
    }
  }

  if (awards.length === 0 && !editMode) return null

  return (
    <div className="space-y-2">
      {!editMode && awards.map(a => (
        <div key={a.id} className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5">
          <span className="text-amber-400 text-lg">★</span>
          <span className="font-semibold text-neutral-fg text-sm">{a.players?.name}</span>
        </div>
      ))}
      {editMode && playersInMatch.map(player => {
        const isAward = awards.some(a => a.player_id === player.id)
        return (
          <button
            key={player.id} onClick={() => toggle(player)} disabled={saving}
            className={`w-full flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium border transition-colors ${
              isAward ? 'bg-amber-50 border-amber-300 text-amber-700' : 'bg-neutral-card border-neutral-border text-neutral-fg/70 hover:bg-neutral-secondary/50'
            }`}
          >
            <span className={isAward ? 'text-amber-400' : 'text-neutral-muted/70'}>★</span>
            {player.name}
          </button>
        )
      })}
      {editMode && playersInMatch.length === 0 && (
        <p className="text-sm text-neutral-muted text-center py-2">Add players to the lineup first.</p>
      )}
    </div>
  )
}

// ─── Match Detail Page ────────────────────────────────────────────────────────

export default function MatchDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { canEdit } = useAuth()
  const { match, loading, error, refetch } = useMatchDetail(id)
  const { seasons } = useSeasons()
  const [editMode, setEditMode] = useState(false)
  const [savingType, setSavingType] = useState(false)
  const [savingScore, setSavingScore] = useState(false)
  const [savingSeason, setSavingSeason] = useState(false)
  const [savingLocation, setSavingLocation] = useState(false)
  const [scores, setScores] = useState({ histon: '', opposition: '' })
  const [seasonId, setSeasonId] = useState('')
  const [showDebug, setShowDebug] = useState(false)

  // Initialize scores and season when match loads
  useEffect(() => {
    if (match) {
      setScores({
        histon: match.histon_score !== null ? String(match.histon_score) : '0',
        opposition: match.opposition_score !== null ? String(match.opposition_score) : '0',
      })
      setSeasonId(match.season_id || '')
    }
  }, [match])

  const handleTypeChange = async (newType) => {
    setSavingType(true)
    try {
      await updateMatch(id, { match_type: newType })
      await refetch()
    } catch (e) { alert(e.message) }
    finally { setSavingType(false) }
  }

  const handleScoreChange = async () => {
    setSavingScore(true)
    try {
      await updateMatch(id, {
        histon_score: parseInt(scores.histon, 10),
        opposition_score: parseInt(scores.opposition, 10),
      })
      await refetch()
    } catch (e) { 
      alert('Error saving scores: ' + e.message)
    } finally { 
      setSavingScore(false) 
    }
  }

  const handleSeasonChange = async (newSeasonId) => {
    setSavingSeason(true)
    try {
      await updateMatch(id, { season_id: newSeasonId || null })
      await refetch()
    } catch (e) { alert(e.message) }
    finally { setSavingSeason(false) }
  }

  const handleLocationChange = async (newLocation) => {
    setSavingLocation(true)
    try {
      await updateMatch(id, { location: newLocation })
      await refetch()
    } catch (e) { alert(e.message) }
    finally { setSavingLocation(false) }
  }

  if (loading) return <div className="max-w-5xl mx-auto px-4 py-8"><Spinner message="Loading match…" /></div>
  if (error) return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="bg-hornets-tertiary/10 border border-rose-200 rounded-xl p-4 text-hornets-tertiary text-sm">{error}</div>
    </div>
  )
  if (!match) return null

  const { result, color: resultColor } = getMatchResult(match.histon_score, match.opposition_score)
  const hasResult = match.histon_score !== null && match.opposition_score !== null

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">

      {/* ── Top bar ── */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sm font-medium text-neutral-muted/80 hover:text-neutral-fg transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Dashboard
        </button>
        {canEdit && (
          <button
            onClick={() => setEditMode(e => !e)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
              editMode
                ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                : 'bg-neutral-secondary text-neutral-fg/70 hover:bg-slate-200'
            }`}
          >
            {editMode ? (
              <><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg> Done Editing</>
            ) : (
              <><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg> Edit Match</>
            )}
          </button>
        )}
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
                  className="text-xs font-semibold rounded-full px-2.5 py-1 bg-neutral-card/10 text-white border border-white/20 focus:outline-none focus:ring-1 focus:ring-neutral-accent disabled:opacity-50"
                >
                  {MATCH_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              ) : (
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-neutral-card/10 text-white/80">
                  {match.match_type}
                </span>
              )}
              {/* Location — editable in edit mode */}
              {editMode ? (
                <select
                  value={match.location}
                  disabled={savingLocation}
                  onChange={e => handleLocationChange(e.target.value)}
                  className="text-xs font-semibold rounded-full px-2.5 py-1 bg-neutral-card/10 text-white border border-white/20 focus:outline-none focus:ring-1 focus:ring-neutral-accent disabled:opacity-50"
                >
                  <option value="H">Home</option>
                  <option value="A">Away</option>
                </select>
              ) : (
                <span className="text-xs text-neutral-muted">{match.location === 'H' ? 'Home' : 'Away'}</span>
              )}
              <span className="text-xs text-neutral-muted">·</span>
              <span className="text-xs text-neutral-muted">{formatDate(match.match_date)}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">vs {match.opposition}</h1>
            <p className="text-neutral-muted text-sm mt-1">
              {editMode ? (
                <select
                  value={seasonId}
                  disabled={savingSeason}
                  onChange={e => {
                    setSeasonId(e.target.value)
                    handleSeasonChange(e.target.value)
                  }}
                  className="text-sm bg-neutral-card/20 text-white border border-white/30 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-neutral-accent disabled:opacity-50"
                >
                  <option value="">— No season —</option>
                  {seasons.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              ) : (
                <span>{match.seasons?.name || '— No season —'}</span>
              )}
              <span> · {match.match_length_mins} mins</span>
            </p>
          </div>

          {hasResult && (
            <div className="text-right shrink-0">
              {editMode ? (
                <div className="flex flex-col items-end gap-2">
                  <div className="flex items-center gap-2">
                    {/* Our score stepper */}
                    <div className="flex items-center gap-1">
                      <button type="button" disabled={savingScore} onClick={() => setScores(s => ({ ...s, histon: String(Math.max(0, Number(s.histon) - 1)) }))}
                        className="w-9 h-9 rounded-lg bg-white/10 text-white text-lg font-bold hover:bg-white/20 transition-colors disabled:opacity-40 flex items-center justify-center">−</button>
                      <span className="w-10 text-3xl font-black text-white text-center tabular-nums">{scores.histon !== '' ? scores.histon : '–'}</span>
                      <button type="button" disabled={savingScore} onClick={() => setScores(s => ({ ...s, histon: String(Number(s.histon || 0) + 1) }))}
                        className="w-9 h-9 rounded-lg bg-white/10 text-white text-lg font-bold hover:bg-white/20 transition-colors disabled:opacity-40 flex items-center justify-center">+</button>
                    </div>
                    <span className="text-neutral-muted/80 text-3xl">–</span>
                    {/* Opposition score stepper */}
                    <div className="flex items-center gap-1">
                      <button type="button" disabled={savingScore} onClick={() => setScores(s => ({ ...s, opposition: String(Math.max(0, Number(s.opposition) - 1)) }))}
                        className="w-9 h-9 rounded-lg bg-white/10 text-white text-lg font-bold hover:bg-white/20 transition-colors disabled:opacity-40 flex items-center justify-center">−</button>
                      <span className="w-10 text-3xl font-black text-white text-center tabular-nums">{scores.opposition !== '' ? scores.opposition : '–'}</span>
                      <button type="button" disabled={savingScore} onClick={() => setScores(s => ({ ...s, opposition: String(Number(s.opposition || 0) + 1) }))}
                        className="w-9 h-9 rounded-lg bg-white/10 text-white text-lg font-bold hover:bg-white/20 transition-colors disabled:opacity-40 flex items-center justify-center">+</button>
                    </div>
                  </div>
                  <button
                    onClick={handleScoreChange}
                    disabled={savingScore || scores.histon === '' || scores.opposition === ''}
                    className="px-4 py-2 bg-neutral-accent text-neutral-bg text-sm font-semibold rounded-lg hover:bg-neutral-accent/90 transition-colors disabled:opacity-50"
                  >
                    {savingScore ? 'Saving…' : '✓ Save Score'}
                  </button>
                </div>
              ) : (
                <>
                  <div className="text-4xl sm:text-5xl font-black text-white leading-none">
                    {match.histon_score}<span className="text-neutral-muted/80 mx-1">–</span>{match.opposition_score}
                  </div>
                  <span className={`inline-block mt-2 text-sm font-bold px-3 py-1 rounded-full ${resultColor}`}>
                    {result === 'W' ? 'Win' : result === 'L' ? 'Loss' : 'Draw'}
                  </span>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Score input for upcoming matches in edit mode ── */}
      {!hasResult && editMode && (
        <div className="bg-neutral-secondary/50 border border-neutral-border rounded-2xl p-5 sm:p-6">
          <h3 className="text-base font-bold text-neutral-fg mb-5">Add Match Score</h3>
          <div className="flex items-center justify-center gap-6 mb-5">
            {/* Our score stepper */}
            <div className="flex flex-col items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-neutral-muted">Our Score</span>
              <div className="flex items-center gap-2">
                <button type="button" disabled={savingScore} onClick={() => setScores(s => ({ ...s, histon: String(Math.max(0, Number(s.histon || 0) - 1)) }))}
                  className="w-11 h-11 rounded-xl bg-neutral-card border border-neutral-border text-neutral-fg text-xl font-bold hover:bg-neutral-secondary transition-colors disabled:opacity-40 flex items-center justify-center">−</button>
                <span className="w-12 text-4xl font-black text-neutral-fg text-center tabular-nums">{scores.histon !== '' ? scores.histon : '0'}</span>
                <button type="button" disabled={savingScore} onClick={() => setScores(s => ({ ...s, histon: String(Number(s.histon || 0) + 1) }))}
                  className="w-11 h-11 rounded-xl bg-neutral-card border border-neutral-border text-neutral-fg text-xl font-bold hover:bg-neutral-secondary transition-colors disabled:opacity-40 flex items-center justify-center">+</button>
              </div>
            </div>
            <span className="text-3xl text-neutral-muted/50 mt-5">–</span>
            {/* Opposition score stepper */}
            <div className="flex flex-col items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-neutral-muted">Opposition</span>
              <div className="flex items-center gap-2">
                <button type="button" disabled={savingScore} onClick={() => setScores(s => ({ ...s, opposition: String(Math.max(0, Number(s.opposition || 0) - 1)) }))}
                  className="w-11 h-11 rounded-xl bg-neutral-card border border-neutral-border text-neutral-fg text-xl font-bold hover:bg-neutral-secondary transition-colors disabled:opacity-40 flex items-center justify-center">−</button>
                <span className="w-12 text-4xl font-black text-neutral-fg text-center tabular-nums">{scores.opposition !== '' ? scores.opposition : '0'}</span>
                <button type="button" disabled={savingScore} onClick={() => setScores(s => ({ ...s, opposition: String(Number(s.opposition || 0) + 1) }))}
                  className="w-11 h-11 rounded-xl bg-neutral-card border border-neutral-border text-neutral-fg text-xl font-bold hover:bg-neutral-secondary transition-colors disabled:opacity-40 flex items-center justify-center">+</button>
              </div>
            </div>
          </div>
          <button
            onClick={handleScoreChange}
            disabled={savingScore}
            className="w-full py-3.5 bg-neutral-accent hover:bg-neutral-accent/90 text-neutral-bg text-sm font-bold rounded-xl transition-colors disabled:opacity-50"
          >
            {savingScore ? 'Saving…' : 'Save Score'}
          </button>
        </div>
      )}

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
      <div className="bg-neutral-card rounded-2xl border border-neutral-border shadow-sm overflow-hidden">
        <div className="px-5 sm:px-6 pt-5 sm:pt-6 pb-0">
          <h2 className="text-base font-bold text-neutral-fg mb-4">Lineup</h2>
        </div>
        <div className="px-5 sm:px-6 pb-5 sm:pb-6">
          <LineupMatrix match={match} editMode={editMode} onRefetch={refetch} />
        </div>
      </div>

      {/* ── Goals & Events ── */}
      <div className="bg-neutral-card rounded-2xl border border-neutral-border shadow-sm p-5 sm:p-6">
        <h2 className="text-base font-bold text-neutral-fg mb-4">Goals &amp; Events</h2>
        <GoalsSection match={match} editMode={editMode} onRefetch={refetch} />
      </div>

      {/* ── Star Players ── */}
      {((match.star_player_awards || []).length > 0 || editMode) && (
        <div className="bg-neutral-card rounded-2xl border border-neutral-border shadow-sm p-5 sm:p-6">
          <h2 className="text-base font-bold text-neutral-fg mb-4">
            <span className="text-amber-400 mr-1.5">★</span>Star Players
          </h2>
          <StarPlayersSection match={match} editMode={editMode} onRefetch={refetch} />
        </div>
      )}

      {/* ── DEBUG: raw player_appearances ── */}
      <div className="rounded-2xl border border-neutral-border overflow-hidden">
        <button
          onClick={() => setShowDebug(v => !v)}
          className="w-full flex items-center justify-between px-5 py-3 bg-neutral-secondary hover:bg-slate-200 transition-colors text-xs font-semibold text-neutral-muted/80 uppercase tracking-wide"
        >
          <span>Debug — player_appearances</span>
          <span>{showDebug ? '▲ Hide' : '▼ Show'}</span>
        </button>
        {showDebug && (() => {
          const dbgLen = match.match_length_mins || 60
          const dbgSegs = Array.from({ length: 8 }, (_, i) => ({ start: i * dbgLen / 8, end: (i + 1) * dbgLen / 8 }))
          return (
            <div className="bg-slate-900 text-blue-300 p-5 font-mono text-xs overflow-x-auto">
              <p className="text-neutral-muted mb-3">match_id={match.id} · match_length={dbgLen}</p>
              <table className="w-full border-collapse">
                <thead>
                  <tr className="text-neutral-muted border-b border-slate-700">
                    {['id','player_id','name','time_start','time_end','position','segments hit'].map(h => (
                      <th key={h} className="text-left pr-4 pb-1">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(match.player_appearances || [])
                    .slice()
                    .sort((a,b) => a.player_id - b.player_id || a.time_start - b.time_start)
                    .map(a => {
                      const hits = dbgSegs.filter(s => a.time_start < s.end && a.time_end > s.start).map((_,i) => i)
                      return (
                        <tr key={a.id} className="border-b border-slate-800">
                          <td className="pr-4 py-0.5 text-neutral-muted">{a.id}</td>
                          <td className="pr-4 py-0.5">{a.player_id}</td>
                          <td className="pr-4 py-0.5 text-neutral-muted/70">{a.players?.name ?? '?'}</td>
                          <td className="pr-4 py-0.5">{a.time_start}</td>
                          <td className="pr-4 py-0.5">{a.time_end}</td>
                          <td className="pr-4 py-0.5 text-blue-400 font-bold">{a.position}</td>
                          <td className={`pr-4 py-0.5 ${hits.length === 0 ? 'text-hornets-tertiary' : 'text-blue-400'}`}>
                            {hits.length === 0 ? 'NONE' : `[${hits.join(',')}]`}
                          </td>
                        </tr>
                      )
                    })}
                </tbody>
              </table>
            </div>
          )
        })()}
      </div>
    </div>
  )
}
