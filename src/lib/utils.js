import { format } from 'date-fns'

export const formatDate = (dateString) => {
  if (!dateString) return 'TBD'
  return format(new Date(dateString), 'dd MMM yyyy')
}

export const formatDateShort = (dateString) => {
  if (!dateString) return 'TBD'
  return format(new Date(dateString), 'dd MMM')
}

export const getMatchResult = (histonScore, oppositionScore) => {
  if (histonScore === null || oppositionScore === null) {
    return { result: 'TBD', color: 'bg-slate-100 text-slate-600' }
  }
  if (histonScore > oppositionScore) {
    return { result: 'W', color: 'bg-emerald-100 text-emerald-700', textColor: 'text-emerald-700' }
  } else if (histonScore < oppositionScore) {
    return { result: 'L', color: 'bg-rose-100 text-rose-700', textColor: 'text-rose-700' }
  }
  return { result: 'D', color: 'bg-amber-100 text-amber-700', textColor: 'text-amber-700' }
}

// ─── Position colors ──────────────────────────────────────────────────────────
// GK = purple  |  Defense = red  |  Midfield = yellow  |  Attack = green

export const getPositionColor = (position) => {
  const colorMap = {
    // Goalkeeper – purple
    GK:  'bg-purple-600 text-white',
    // Defenders – red
    CB:  'bg-red-600 text-white',
    LB:  'bg-red-600 text-white',
    RB:  'bg-red-600 text-white',
    // Midfielders – yellow
    CM:  'bg-yellow-400 text-yellow-900',
    CDM: 'bg-yellow-400 text-yellow-900',
    CAM: 'bg-yellow-400 text-yellow-900',
    LM:  'bg-yellow-400 text-yellow-900',
    RM:  'bg-yellow-400 text-yellow-900',
    // Attackers – green
    CF:  'bg-green-600 text-white',
    LF:  'bg-green-600 text-white',
    RF:  'bg-green-600 text-white',
    ST:  'bg-green-600 text-white',
  }
  return colorMap[position] || 'bg-slate-200 text-slate-700'
}

export const getPositionGroup = (position) => {
  if (position === 'GK') return 'gk'
  if (['CB', 'LB', 'RB'].includes(position)) return 'def'
  if (['CM', 'CDM', 'CAM', 'LM', 'RM'].includes(position)) return 'mid'
  if (['CF', 'LF', 'RF', 'ST'].includes(position)) return 'atk'
  return 'other'
}

export const getMatchTypeColor = (type) => {
  const map = {
    League:   'bg-indigo-100 text-indigo-700',
    Cup:      'bg-purple-100 text-purple-700',
    Friendly: 'bg-teal-100 text-teal-700',
    Training: 'bg-slate-100 text-slate-600',
  }
  return map[type] || 'bg-slate-100 text-slate-600'
}

export const getInitials = (name = '') =>
  name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

// ─── Match segment helpers ────────────────────────────────────────────────────

const fmtMin = (m) => (m % 1 !== 0 ? m.toFixed(1) : String(Math.round(m)))

/**
 * Returns an array of 8 equal time segments for a match.
 * Labels show 1 decimal place where needed (e.g. 22.5').
 */
export const getMatchSegments = (matchLengthMins) => {
  const len = matchLengthMins / 8
  return Array.from({ length: 8 }, (_, i) => ({
    index: i,
    start: i * len,
    end: (i + 1) * len,
    label: `${fmtMin(i * len)}'`,
  }))
}

/**
 * Returns which half (H1/H2) and quarter (1-4) a given absolute minute falls in.
 * Q1-Q4 are relative to the half.
 */
export const getHalfAndQuarter = (absoluteMin, matchLengthMins) => {
  const halfLen = matchLengthMins / 2
  const half = absoluteMin < halfLen ? 'H1' : 'H2'
  const relMin = absoluteMin < halfLen ? absoluteMin : absoluteMin - halfLen
  const quarter = Math.min(Math.floor(relMin / (halfLen / 4)) + 1, 4)
  return { half, quarter }
}

/**
 * Given a player's appearances in a match, returns the position they played
 * in a given time segment, or null if not playing.
 */
export const getPlayerSegmentPosition = (appearances, playerId, segment, matchLengthMins) => {
  const halfLength = matchLengthMins / 2
  for (const app of appearances) {
    if (app.player_id !== playerId) continue
    const absStart = app.half === 'H1' ? app.time_start : app.time_start + halfLength
    const absEnd   = app.half === 'H1' ? app.time_end   : app.time_end   + halfLength
    if (absStart < segment.end && absEnd > segment.start) return app.position
  }
  return null
}

/**
 * Finds the player_appearance record that covers a given segment.
 */
export const findCoveringAppearance = (appearances, playerId, segment, matchLengthMins) => {
  const halfLength = matchLengthMins / 2
  return appearances.find(a => {
    if (a.player_id !== playerId) return false
    const absStart = a.half === 'H1' ? a.time_start : a.time_start + halfLength
    const absEnd   = a.half === 'H1' ? a.time_end   : a.time_end   + halfLength
    return absStart < segment.end && absEnd > segment.start
  }) ?? null
}

/**
 * Returns the half/time_start/time_end for a new appearance created from a segment.
 */
export const segmentToAppearanceSlot = (segment, matchLengthMins) => {
  const halfLength = matchLengthMins / 2
  if (segment.start < halfLength) {
    return { half: 'H1', time_start: segment.start, time_end: Math.min(segment.end, halfLength) }
  }
  return { half: 'H2', time_start: segment.start - halfLength, time_end: segment.end - halfLength }
}

/**
 * Returns unique players from a match's player_appearances, sorted by name.
 */
export const getUniquePlayersFromAppearances = (appearances = []) => {
  const seen = new Set()
  return appearances
    .filter(a => { if (seen.has(a.player_id)) return false; seen.add(a.player_id); return true })
    .map(a => ({ id: a.player_id, name: a.players?.name ?? 'Unknown' }))
    .sort((a, b) => a.name.localeCompare(b.name))
}
