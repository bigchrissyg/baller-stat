// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SPOND = 'https://api.spond.com/core/v1'
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

    const { data: { user }, error: userErr } = await admin.auth.getUser(token)
    if (userErr || !user) return json({ error: 'Unauthorized' }, 401)

    const { data: callerRow } = await admin.from('user_roles').select('role').eq('user_id', user.id).maybeSingle()
    const isAdmin = callerRow?.role === 'Admin' || BOOTSTRAP_ADMINS.includes(user.email ?? '')
    if (!isAdmin) return json({ error: 'Admin required' }, 403)

    const body = await req.json()
    const { action, debug = false } = body

    const spondHeaders = (t: string) => ({ 'Authorization': `Bearer ${t}`, 'Content-Type': 'application/json' })
    const getConfig = () => admin.from('spond_config').select('*').limit(1).maybeSingle()

    // ── Status ───────────────────────────────────────────────────────────────
    if (action === 'status') {
      const { data: config, error: configErr } = await getConfig()
      if (configErr?.code === '42P01') return json({ error: 'table_missing' }, 400)
      return json({
        connected: !!config,
        email: config?.spond_email ?? null,
        groupId: config?.group_id ?? null,
        groupName: config?.group_name ?? null,
        subGroupId: config?.sub_group_id ?? null,
        subGroupName: config?.sub_group_name ?? null,
      })
    }

    // ── Connect ──────────────────────────────────────────────────────────────
    if (action === 'connect') {
      const { email, password } = body
      if (!email || !password) throw new Error('Email and password are required')

      const loginRes = await fetch(`${SPOND}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      if (!loginRes.ok) {
        const err = await loginRes.json().catch(() => ({}))
        const msg = err.error ?? err.title ?? err.message ?? ''
        if (msg.toLowerCase().includes('wrong email or password') || loginRes.status === 401)
          throw new Error('Incorrect Spond email or password. Please check your credentials and try again.')
        throw new Error(msg || `Spond login failed (${loginRes.status})`)
      }

      const loginData = await loginRes.json()
      const spondToken = loginData.loginToken ?? loginData.token
      if (!spondToken) throw new Error('No authentication token returned from Spond')

      await admin.from('spond_config').delete().neq('id', 0)
      const { error: insertErr } = await admin.from('spond_config').insert({
        created_by: user.id,
        spond_email: email,
        spond_token: spondToken,
        updated_at: new Date().toISOString(),
      })
      if (insertErr?.code === '42P01') return json({ error: 'table_missing' }, 400)
      if (insertErr) throw new Error(insertErr.message)

      return json({ success: true })
    }

    // ── Groups ───────────────────────────────────────────────────────────────
    if (action === 'groups') {
      const { data: config } = await getConfig()
      if (!config) return json({ error: 'not_connected' }, 400)

      const res = await fetch(`${SPOND}/groups/`, { headers: spondHeaders(config.spond_token) })
      if (res.status === 401) return json({ error: 'token_expired' }, 401)
      if (!res.ok) throw new Error(`Failed to fetch groups (${res.status})`)

      const data = await res.json()
      const groups = (Array.isArray(data) ? data : []).map((g: any) => ({
        id: g.id,
        name: g.name,
        memberCount: g.members?.length ?? 0,
        subGroups: (g.subGroups ?? []).map((sg: any) => ({
          id: sg.id,
          name: sg.name,
          memberCount: sg.members?.length ?? 0,
        })),
      }))
      return json({ groups })
    }

    // ── Set group ─────────────────────────────────────────────────────────────
    if (action === 'set-group') {
      const { groupId, groupName, subGroupId = null, subGroupName = null } = body
      const { data: config } = await getConfig()
      if (!config) return json({ error: 'not_connected' }, 400)
      await admin.from('spond_config')
        .update({ group_id: groupId, group_name: groupName, sub_group_id: subGroupId, sub_group_name: subGroupName })
        .eq('id', config.id)
      return json({ success: true })
    }

    // ── Fixtures ──────────────────────────────────────────────────────────────
    if (action === 'fixtures') {
      const { data: config } = await getConfig()
      if (!config?.group_id) return json({ error: 'no_group' }, 400)

      const params = new URLSearchParams({
        groupId: config.group_id,
        ...(config.sub_group_id ? { subGroupId: config.sub_group_id } : {}),
        includeComments: 'false',
        includeHidden: 'true',
        addProfileInfo: 'false',
        scheduled: 'true',
        order: 'desc',
        max: '100',
      })

      const res = await fetch(`${SPOND}/sponds/?${params}`, { headers: spondHeaders(config.spond_token) })
      if (res.status === 401) return json({ error: 'token_expired' }, 401)
      if (!res.ok) throw new Error(`Failed to fetch events (${res.status})`)

      const events = await res.json()
      const fixtures = (Array.isArray(events) ? events : []).map((e: any) => ({
        id: e.id,
        heading: e.heading ?? 'Untitled',
        startTimestamp: e.startTimestamp,
        endTimestamp: e.endTimestamp,
        location: e.location?.feature ?? e.location?.address ?? '',
        type: e.type ?? 'EVENT',
        cancelled: e.cancelled ?? false,
        responses: {
          accepted: e.responses?.acceptedIds?.length ?? 0,
          declined: e.responses?.declinedIds?.length ?? 0,
          unanswered: e.responses?.unansweredIds?.length ?? 0,
        },
      }))

      return json({ fixtures, groupName: config.group_name })
    }

    // ── Suggest missing fixtures ──────────────────────────────────────────────
    if (action === 'suggest') {
      const { data: config } = await getConfig()
      if (!config?.group_id) return json({ error: 'no_group' }, 400)

      const now = new Date().toISOString()

      // Fetch DB matches first so we can determine the season's start date
      const { data: matches } = await admin
        .from('matches')
        .select('id, match_date, opposition, match_type, location, histon_score, spond_event_id')
        .order('match_date', { ascending: true })
        .limit(100)

      // Widen Spond fetch to cover the full season — from earliest DB match date
      const sortedDates = (matches ?? []).map((m: any) => m.match_date).filter(Boolean).sort()
      const seasonStart = sortedDates.length > 0
        ? `${sortedDates[0]}T00:00:00.000Z`
        : new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString()

      const params = new URLSearchParams({
        groupId: config.group_id,
        ...(config.sub_group_id ? { subGroupId: config.sub_group_id } : {}),
        includeComments: 'false',
        includeHidden: 'true',
        addProfileInfo: 'false',
        minStartTimestamp: seasonStart,
        order: 'asc',
        max: '100',
      })

      const spondRes = await fetch(`${SPOND}/sponds/?${params}`, { headers: spondHeaders(config.spond_token) })
      if (spondRes.status === 401) return json({ error: 'token_expired' }, 401)
      if (!spondRes.ok) throw new Error(`Failed to fetch Spond events (${spondRes.status})`)

      const events = await spondRes.json()
      const spondEvents = (Array.isArray(events) ? events : [])
        .filter((e: any) => !e.cancelled)
        .map((e: any) => ({
          id: e.id,
          heading: e.heading ?? 'Untitled',
          startTimestamp: e.startTimestamp,
          location: e.location?.feature ?? e.location?.address ?? '',
          type: e.type ?? 'EVENT',
        }))

      if (!spondEvents.length) return json({ suggestions: [], linkable: [] })

      // @ts-ignore
      const ANTHROPIC_KEY = Deno.env.get('ANTHROPIC_API_KEY')
      if (!ANTHROPIC_KEY) throw new Error('ANTHROPIC_API_KEY not configured')

      const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ANTHROPIC_KEY,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 1024,
          messages: [{
            role: 'user',
            content: `You help manage fixtures for Histon Hornets Blue, a youth football team.

Current date/time: ${now}

Database matches (include the "id" field — it is needed in your response):
${JSON.stringify(matches ?? [])}

Spond events (spanning the full season):
${JSON.stringify(spondEvents)}

Do two things:

TASK 1 — MISSING: Spond events that are football matches (not training/social/meetings), occur AFTER the current date/time, and have NO matching database entry (match by date within 1 day + opponent similarity). Extract: opposition name, home/away, match_type.

TASK 2 — LINKABLE: Database matches where spond_event_id is null/missing that DO have a matching Spond event (same date within 1 day, similar opposition). Return the database match id and the matching spond event id.

Respond with ONLY this JSON (no other text):
{"missing":[{"spond_id":"...","opposition":"...","home":true,"match_type":"Friendly"}],"linkable":[{"match_id":0,"spond_id":"..."}]}`,
          }],
        }),
      })

      if (!claudeRes.ok) throw new Error(`Claude API error (${claudeRes.status})`)

      const claudeData = await claudeRes.json()
      const claudeText = (claudeData.content?.[0]?.text ?? '[]').trim()

      let parsed: any = {}
      try {
        const jsonMatch = claudeText.match(/\{[\s\S]*\}/)
        parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : {}
      } catch { parsed = {} }

      const missing: any[] = Array.isArray(parsed.missing) ? parsed.missing : []
      const linkableRaw: any[] = Array.isArray(parsed.linkable) ? parsed.linkable : []

      const today = now.split('T')[0]
      const suggestions = missing
        .map((m: any) => {
          const event = spondEvents.find((e: any) => e.id === m.spond_id)
          if (!event) return null
          const match_date = event.startTimestamp.split('T')[0]
          if (match_date < today) return null  // only suggest future fixtures
          return {
            spond_id: m.spond_id,
            opposition: m.opposition,
            home: m.home ?? true,
            match_type: m.match_type ?? 'Friendly',
            match_date,
            heading: event.heading,
          }
        })
        .filter(Boolean)

      const linkable = linkableRaw
        .filter((l: any) => l.match_id && l.spond_id)
        .map((l: any) => ({ match_id: l.match_id, spond_id: l.spond_id }))

      return json({
        suggestions,
        linkable,
        ...(debug ? {
          _debug: {
            seasonStart,
            spondEventCount: spondEvents.length,
            spondEvents,
            dbMatchCount: (matches ?? []).length,
            claudeRaw: claudeText,
            claudeParsed: parsed,
          }
        } : {}),
      })
    }

    // ── Disconnect ────────────────────────────────────────────────────────────
    if (action === 'disconnect') {
      await admin.from('spond_config').delete().neq('id', 0)
      return json({ success: true })
    }

    return json({ error: 'Unknown action' }, 400)

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  }
})
