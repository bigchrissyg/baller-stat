import { useState, useEffect, useCallback } from 'react'
import {
  fetchMatches,
  fetchMatchDetail,
  fetchPlayers,
  fetchPlayer,
  fetchPlayerStats,
  fetchAllPlayersStats,
  fetchSeasons,
} from '../lib/supabase'

// ─── Matches ─────────────────────────────────────────────────────────────────

export const useMatches = () => {
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const load = async () => {
      try {
        setMatches(await fetchMatches())
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return { matches, loading, error }
}

export const useMatchDetail = (matchId) => {
  const [match, setMatch] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    if (!matchId) return
    setLoading(true)
    try {
      setMatch(await fetchMatchDetail(matchId))
      setError(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [matchId])

  useEffect(() => { load() }, [load])

  return { match, loading, error, refetch: load }
}

// ─── Players ─────────────────────────────────────────────────────────────────

export const usePlayers = () => {
  const [players, setPlayers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = async () => {
    try {
      setPlayers(await fetchPlayers())
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  return { players, loading, error, refetch: load }
}

export const usePlayer = (playerId) => {
  const [player, setPlayer] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = async () => {
    if (!playerId) return
    try {
      setPlayer(await fetchPlayer(playerId))
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [playerId])

  return { player, loading, error, refetch: load }
}

export const usePlayerStats = (playerId) => {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!playerId) return
    setLoading(true)
    const load = async () => {
      try {
        setStats(await fetchPlayerStats(playerId))
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [playerId])

  return { stats, loading, error }
}

// ─── All-player stats (overview table) ───────────────────────────────────────

export const useAllPlayersStats = () => {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const load = async () => {
      try {
        setData(await fetchAllPlayersStats())
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return { data, loading, error }
}

// ─── Seasons ─────────────────────────────────────────────────────────────────

export const useSeasons = () => {
  const [seasons, setSeasons] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const load = async () => {
      try {
        setSeasons(await fetchSeasons())
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return { seasons, loading, error }
}
