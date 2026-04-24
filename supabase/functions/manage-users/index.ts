// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const BOOTSTRAP_ADMINS = ['chrisgodfrey1983@gmail.com']

// @ts-ignore
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  const json = (data: unknown, status = 200) =>
    new Response(JSON.stringify(data), { status, headers: { ...CORS, 'Content-Type': 'application/json' } })

  try {
    // @ts-ignore
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
    // @ts-ignore
    const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    const token = (req.headers.get('Authorization') || '').replace('Bearer ', '')
    if (!token) return json({ error: 'Unauthorized' }, 401)

    const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    // Identify caller
    const { data: { user }, error: userErr } = await admin.auth.getUser(token)
    if (userErr || !user) return json({ error: 'Unauthorized' }, 401)

    const { data: callerRow } = await admin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle()

    const isAdmin = callerRow?.role === 'Admin' || BOOTSTRAP_ADMINS.includes(user.email ?? '')

    const body = await req.json()
    const { action } = body

    // ── List users ──────────────────────────────────────────────────────────
    if (action === 'list') {
      if (!isAdmin) return json({ error: 'Admin required' }, 403)

      const { data: { users }, error } = await admin.auth.admin.listUsers({ perPage: 1000 })
      if (error) throw error

      const { data: roles } = await admin.from('user_roles').select('user_id, role')
      const rolesMap = new Map((roles ?? []).map(r => [r.user_id, r.role]))

      const list = users.map(u => ({
        id: u.id,
        email: u.email ?? '',
        role: rolesMap.get(u.id) ?? (BOOTSTRAP_ADMINS.includes(u.email ?? '') ? 'Admin' : 'Player/Guardian'),
        createdAt: u.created_at,
        lastSignIn: u.last_sign_in_at,
        confirmed: !!u.confirmed_at,
      }))

      return json({ users: list })
    }

    // All write actions require admin
    if (!isAdmin) return json({ error: 'Admin required' }, 403)

    // ── Invite ───────────────────────────────────────────────────────────────
    if (action === 'invite') {
      const { email, role } = body
      if (!email) throw new Error('Email is required')

      const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
        redirectTo: req.headers.get('origin') ?? undefined,
      })
      if (error) throw error

      await admin.from('user_roles').upsert(
        { user_id: data.user.id, email: email.toLowerCase(), role: role ?? 'Player/Guardian' },
        { onConflict: 'user_id' }
      )

      return json({ success: true })
    }

    // ── Set role ─────────────────────────────────────────────────────────────
    if (action === 'set-role') {
      const { userId, email, role } = body
      if (!userId || !role) throw new Error('userId and role are required')

      await admin.from('user_roles').upsert(
        { user_id: userId, email: email ?? '', role },
        { onConflict: 'user_id' }
      )

      return json({ success: true })
    }

    // ── Remove user ──────────────────────────────────────────────────────────
    if (action === 'remove') {
      const { userId } = body
      if (!userId) throw new Error('userId is required')
      if (userId === user.id) throw new Error('You cannot remove your own account')

      const { error } = await admin.auth.admin.deleteUser(userId)
      if (error) throw error

      return json({ success: true })
    }

    return json({ error: 'Unknown action' }, 400)

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  }
})
