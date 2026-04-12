import { useState, useEffect, useCallback } from 'react'

// ─── Matches ─────────────────────────────────────────────────────────────────

export const useMatches = () => {
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const load = async () => {
      try {
        const { fetchMatches } = await import('../lib/supabase')
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
      const { fetchMatchDetail } = await import('../lib/supabase')
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

  useEffect(() => {
    const load = async () => {
      try {
        const { fetchPlayers } = await import('../lib/supabase')
        setPlayers(await fetchPlayers())
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return { players, loading, error }
}

export const usePlayer = (playerId) => {
  const [player, setPlayer] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!playerId) return
    const load = async () => {
      try {
        const { fetchPlayer } = await import('../lib/supabase')
        setPlayer(await fetchPlayer(playerId))
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [playerId])

  return { player, loading, error }
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
        const { fetchPlayerStats } = await import('../lib/supabase')
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
        const { fetchAllPlayersStats } = await import('../lib/supabase')
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
        const { fetchSeasons } = await import('../lib/supabase')
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
