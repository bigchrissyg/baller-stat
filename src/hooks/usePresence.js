import { useEffect, useState, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

const INACTIVE_MS = 60_000 // 60s without activity → ghosted

export function usePresence(channelName) {
  const { user } = useAuth()
  const [users, setUsers] = useState([])
  const channelRef = useRef(null)

  useEffect(() => {
    if (!channelName || !user) return

    const channel = supabase.channel(channelName, {
      config: { presence: { key: user.id } },
    })
    channelRef.current = channel

    const syncUsers = () => {
      const state = channel.presenceState()
      const now = Date.now()
      const list = Object.entries(state).map(([userId, presences]) => {
        const p = presences[0]
        return {
          userId,
          email: p.email,
          lastActive: p.lastActive,
          isActive: now - p.lastActive < INACTIVE_MS,
          isSelf: userId === user.id,
        }
      })
      // Self last so others stack in front
      list.sort((a, b) => (a.isSelf ? 1 : 0) - (b.isSelf ? 1 : 0))
      setUsers(list)
    }

    channel
      .on('presence', { event: 'sync' }, syncUsers)
      .on('presence', { event: 'join' }, syncUsers)
      .on('presence', { event: 'leave' }, syncUsers)
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ email: user.email, lastActive: Date.now() })
        }
      })

    // Debounced activity tracker — updates presence payload
    let debounceTimer = null
    const handleActivity = () => {
      clearTimeout(debounceTimer)
      debounceTimer = setTimeout(async () => {
        try {
          await channel.track({ email: user.email, lastActive: Date.now() })
          syncUsers()
        } catch (_) {}
      }, 2000)
    }

    window.addEventListener('mousemove', handleActivity, { passive: true })
    window.addEventListener('click', handleActivity, { passive: true })
    window.addEventListener('keydown', handleActivity, { passive: true })

    // Periodically re-evaluate active/inactive states without re-tracking
    const uiTimer = setInterval(syncUsers, 15_000)

    return () => {
      clearTimeout(debounceTimer)
      clearInterval(uiTimer)
      window.removeEventListener('mousemove', handleActivity)
      window.removeEventListener('click', handleActivity)
      window.removeEventListener('keydown', handleActivity)
      supabase.removeChannel(channel)
    }
  }, [channelName, user])

  return users
}
