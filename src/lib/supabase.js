import { createClient } from '@supabase/supabase-js'

// Check for runtime-injected env vars (from Cloudflare Worker) first,
// then fall back to build-time env vars
const supabaseUrl = window.__ENV__?.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = window.__ENV__?.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file or Cloudflare Worker configuration.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// ─── Matches ────────────────────────────────────────────────────────────────

export const fetchMatches = async () => {
  const { data, error } = await supabase
    .from('matches')
    .select(`*, seasons(name)`)
    .order('match_date', { ascending: false })
  if (error) throw error
  return data
}

export const fetchMatchDetail = async (matchId) => {
  const [matchRes, appsRes] = await Promise.all([
    supabase
      .from('matches')
      .select(`
        *,
        seasons(name),
        goals(
          *,
          players:scorer_player_id(name),
          players_assist:assist_player_id(name)
        ),
        star_player_awards(*, players(name))
      `)
      .eq('id', matchId)
      .single(),
    supabase
      .from('player_appearances')
      .select('*, players(name)')
      .eq('match_id', matchId)
      .order('player_id')
      .order('time_start'),
  ])
  if (matchRes.error) throw matchRes.error
  if (appsRes.error) throw appsRes.error
  return { ...matchRes.data, player_appearances: appsRes.data ?? [] }
}

export const updateMatch = async (id, data) => {
  const { data: result, error } = await supabase
    .from('matches')
    .update(data)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return result
}

export const createMatch = async (data) => {
  const { data: match, error } = await supabase
    .from('matches')
    .insert(data)
    .select()
    .single()
  if (error) throw error
  return match
}

// ─── Players ─────────────────────────────────────────────────────────────────

export const fetchPlayers = async () => {
  const { data, error } = await supabase
    .from('players')
    .select('*')
    .order('name', { ascending: true })
  if (error) throw error
  return data
}

export const fetchPlayer = async (playerId) => {
  const { data, error } = await supabase
    .from('players')
    .select('*')
    .eq('id', playerId)
    .single()
  if (error) throw error
  return data
}

export const fetchPlayerStats = async (playerId) => {
  const { data, error } = await supabase
    .from('player_appearances')
    .select(`*, matches(match_date, opposition, histon_score, opposition_score, match_type, location)`)
    .eq('player_id', playerId)
    .order('matches(match_date)', { ascending: false })
  if (error) throw error

  const { data: goalsData, error: goalsError } = await supabase
    .from('goals')
    .select('*')
    .eq('scorer_player_id', playerId)
  if (goalsError) throw goalsError

  const { data: assistsData, error: assistsError } = await supabase
    .from('goals')
    .select('*')
    .eq('assist_player_id', playerId)
  if (assistsError) throw assistsError

  const { data: awardsData, error: awardsError } = await supabase
    .from('star_player_awards')
    .select('*, matches(match_date, opposition)')
    .eq('player_id', playerId)
  if (awardsError) throw awardsError

  return { appearances: data, goals: goalsData || [], assists: assistsData || [], awards: awardsData || [] }
}

// ─── Seasons ─────────────────────────────────────────────────────────────────

export const fetchSeasons = async () => {
  const { data, error } = await supabase
    .from('seasons')
    .select('*')
    .order('name', { ascending: true })
  if (error) throw error
  return data
}

// ─── Player Appearances (mutations) ─────────────────────────────────────────

export const insertPlayerAppearance = async (data) => {
  const { data: result, error } = await supabase
    .from('player_appearances')
    .insert(data)
    .select()
    .single()
  if (error) throw error
  return result
}

export const updatePlayerAppearance = async (id, data) => {
  const { data: result, error } = await supabase
    .from('player_appearances')
    .update(data)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return result
}

export const deletePlayerAppearance = async (id) => {
  const { error } = await supabase.from('player_appearances').delete().eq('id', id)
  if (error) throw error
}

// ─── Goals (mutations) ───────────────────────────────────────────────────────

export const insertGoal = async (data) => {
  const { data: result, error } = await supabase
    .from('goals')
    .insert(data)
    .select()
    .single()
  if (error) throw error
  return result
}

export const deleteGoal = async (id) => {
  const { error } = await supabase.from('goals').delete().eq('id', id)
  if (error) throw error
}

// ─── Star Player Awards (mutations) ─────────────────────────────────────────

export const insertStarPlayerAward = async (data) => {
  const { data: result, error } = await supabase
    .from('star_player_awards')
    .insert(data)
    .select()
    .single()
  if (error) throw error
  return result
}

export const deleteStarPlayerAward = async (id) => {
  const { error } = await supabase.from('star_player_awards').delete().eq('id', id)
  if (error) throw error
}

// ─── Bulk stats (for overview table) ─────────────────────────────────────────

/**
 * Fetches all the raw data needed to build the full player stats overview table.
 * Three parallel queries, then returns raw arrays for the caller to aggregate.
 */
export const fetchAllPlayersStats = async () => {
  const [appsRes, goalsRes, awardsRes, playersRes] = await Promise.all([
    supabase.from('player_appearances').select(
      `id, player_id, match_id, position, time_start, time_end,
       matches(match_date, histon_score, opposition_score, match_length_mins)`
    ),
    supabase.from('goals').select('*'),
    supabase.from('star_player_awards').select('*, matches(match_date)'),
    supabase.from('players').select('*').order('name', { ascending: true }),
  ])

  if (appsRes.error)     throw appsRes.error
  if (goalsRes.error)    throw goalsRes.error
  if (awardsRes.error)   throw awardsRes.error
  if (playersRes.error)  throw playersRes.error

  return {
    appearances: appsRes.data ?? [],
    goals:       goalsRes.data ?? [],
    awards:      awardsRes.data ?? [],
    players:     playersRes.data ?? [],
  }
}

// ─── Stats helpers ────────────────────────────────────────────────────────────

export const calculatePlayerAggregateStats = (playerStats) => {
  const appearances = playerStats.appearances || []
  const goals = playerStats.goals || []
  const assists = playerStats.assists || []
  const awards = playerStats.awards || []

  const positions = {}
  let totalMinutes = 0

  appearances.forEach(app => {
    const mins = app.time_end - app.time_start
    positions[app.position] = (positions[app.position] || 0) + mins
    totalMinutes += mins
  })

  return {
    appearances: appearances.length,
    matches: new Set(appearances.map(a => a.match_id)).size,
    goals: goals.filter(g => g.for_histon).length,
    assists: assists.filter(a => a.for_histon).length,
    starPlayerAwards: awards.length,
    totalMinutes: Math.round(totalMinutes * 10) / 10,
    positions,
    positionList: Object.keys(positions),
  }
}
