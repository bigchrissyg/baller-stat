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
    return { result: 'W', color: 'bg-result-win text-white', textColor: 'text-result-win' }
  } else if (histonScore < oppositionScore) {
    return { result: 'L', color: 'bg-result-loss text-white', textColor: 'text-result-loss' }
  }
  return { result: 'D', color: 'bg-result-draw text-white', textColor: 'text-result-draw' }
}

// ─── Position colors ──────────────────────────────────────────────────────────
// GK = purple  |  Defense = red  |  Midfield = yellow  |  Attack = green

// ─── Position color scheme ──────────────────────────────────────────────────
// GK = purple | DEF (ends in B) = red | MID (ends in M) = yellow | ATK (ends in F/T) = green

export const getPositionColor = (position) => {
  const colorMap = {
    GK:  'bg-purple-600 text-white',
    CB:  'bg-red-600 text-white',
    LB:  'bg-red-600 text-white',
    RB:  'bg-red-600 text-white',
    CM:  'bg-yellow-400 text-yellow-900',
    CDM: 'bg-yellow-400 text-yellow-900',
    CAM: 'bg-yellow-400 text-yellow-900',
    LM:  'bg-yellow-400 text-yellow-900',
    RM:  'bg-yellow-400 text-yellow-900',
    CF:  'bg-green-600 text-white',
    LF:  'bg-green-600 text-white',
    RF:  'bg-green-600 text-white',
    ST:  'bg-green-600 text-white',
  }
  return colorMap[position] || 'bg-slate-200 text-slate-700'
}

// ─── Get position styles with solid and ghost states ────────────────────────
export const getPositionStyles = (position) => {
  const styleMap = {
    GK:  { solid: 'bg-purple-600 text-white',       ghost: 'bg-purple-100 text-purple-600 border border-dashed border-purple-400' },
    CB:  { solid: 'bg-red-600 text-white',          ghost: 'bg-red-100 text-red-600 border border-dashed border-red-400' },
    LB:  { solid: 'bg-red-600 text-white',          ghost: 'bg-red-100 text-red-600 border border-dashed border-red-400' },
    RB:  { solid: 'bg-red-600 text-white',          ghost: 'bg-red-100 text-red-600 border border-dashed border-red-400' },
    CM:  { solid: 'bg-yellow-400 text-yellow-900',  ghost: 'bg-yellow-100 text-yellow-600 border border-dashed border-yellow-400' },
    CDM: { solid: 'bg-yellow-400 text-yellow-900',  ghost: 'bg-yellow-100 text-yellow-600 border border-dashed border-yellow-400' },
    CAM: { solid: 'bg-yellow-400 text-yellow-900',  ghost: 'bg-yellow-100 text-yellow-600 border border-dashed border-yellow-400' },
    LM:  { solid: 'bg-yellow-400 text-yellow-900',  ghost: 'bg-yellow-100 text-yellow-600 border border-dashed border-yellow-400' },
    RM:  { solid: 'bg-yellow-400 text-yellow-900',  ghost: 'bg-yellow-100 text-yellow-600 border border-dashed border-yellow-400' },
    CF:  { solid: 'bg-green-600 text-white',        ghost: 'bg-green-100 text-green-600 border border-dashed border-green-400' },
    LF:  { solid: 'bg-green-600 text-white',        ghost: 'bg-green-100 text-green-600 border border-dashed border-green-400' },
    RF:  { solid: 'bg-green-600 text-white',        ghost: 'bg-green-100 text-green-600 border border-dashed border-green-400' },
    ST:  { solid: 'bg-green-600 text-white',        ghost: 'bg-green-100 text-green-600 border border-dashed border-green-400' },
  }
  return styleMap[position] || { solid: 'bg-slate-200 text-slate-700', ghost: 'bg-slate-100 text-slate-600 border border-dashed border-slate-400' }
}

// ─── Position suggestions based on typical formations ─────────────────────────
export const suggestPositionForSegment = (segment, matchLen) => {
  // Suggests a typical position based on which segment of the match
  // Typical formation suggestions for a 9v9 U12 team
  const suggestions = {
    0: 'GK',   // 0-7.5 mins → Goalkeeper
    1: 'CB',   // 7.5-15 mins → Defender
    2: 'LM',   // 15-22.5 mins → Left Midfielder
    3: 'CM',   // 22.5-30 mins → Central Midfielder
    4: 'GK',   // H2: 45-52.5 mins → Goalkeeper
    5: 'RB',   // H2: 52.5-60 mins → Right Back
    6: 'RM',   // H2: 60-67.5 mins → Right Midfielder
    7: 'CF',   // H2: 67.5+ mins → Forward
  }
  return suggestions[segment.index] || 'CM'
}

// ─── Calculate total minutes for a player ───────────────────────────────────
export const calculatePlayerTotalMinutes = (appearances) => {
  if (!appearances || appearances.length === 0) return 0
  return appearances.reduce((total, app) => total + (app.time_end - app.time_start), 0)
}

// ─── Get position style for dropdown ────────────────────────────────────────
export const getPositionDropdownStyle = (position) => {
  const baseStyle = 'appearance-none px-2 py-1 text-xs font-semibold rounded cursor-pointer'
  if (!position) return `${baseStyle} bg-white border border-slate-200`
  
  const colorMap = {
    GK:  `${baseStyle} bg-purple-600 text-white border border-purple-600`,
    CB:  `${baseStyle} bg-red-600 text-white border border-red-600`,
    LB:  `${baseStyle} bg-red-600 text-white border border-red-600`,
    RB:  `${baseStyle} bg-red-600 text-white border border-red-600`,
    CM:  `${baseStyle} bg-yellow-400 text-yellow-900 border border-yellow-400`,
    CDM: `${baseStyle} bg-yellow-400 text-yellow-900 border border-yellow-400`,
    CAM: `${baseStyle} bg-yellow-400 text-yellow-900 border border-yellow-400`,
    LM:  `${baseStyle} bg-yellow-400 text-yellow-900 border border-yellow-400`,
    RM:  `${baseStyle} bg-yellow-400 text-yellow-900 border border-yellow-400`,
    CF:  `${baseStyle} bg-green-600 text-white border border-green-600`,
    LF:  `${baseStyle} bg-green-600 text-white border border-green-600`,
    RF:  `${baseStyle} bg-green-600 text-white border border-green-600`,
    ST:  `${baseStyle} bg-green-600 text-white border border-green-600`,
  }
  return colorMap[position] || `${baseStyle} bg-slate-200 text-slate-700`
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
    label: `${fmtMin((i + 1) * len)}'`,
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
 * time_start/time_end are absolute match minutes.
 */
export const getPlayerSegmentPosition = (appearances, playerId, segment) => {
  let result = null
  for (const app of appearances) {
    if (app.player_id !== playerId) continue
    if (app.time_start < segment.end && app.time_end > segment.start) result = app.position
  }
  return result
}

/**
 * Returns ALL player_appearance records that cover a given segment.
 * time_start/time_end are absolute match minutes.
 */
export const findCoveringAppearances = (appearances, playerId, segment) => {
  return appearances.filter(a =>
    a.player_id === playerId &&
    a.time_start < segment.end &&
    a.time_end > segment.start
  )
}

/**
 * Returns the time_start/time_end for a new appearance created from a segment.
 * Times are absolute match minutes.
 */
export const segmentToAppearanceSlot = (segment) => {
  return { time_start: segment.start, time_end: segment.end }
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
