// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const FORMATIONS = {
  '3-4-1':           ['GK', 'CB', 'LB', 'RB', 'CM', 'CM', 'LM', 'RM', 'CF'],
  '3-4-1 (balanced)':['GK', 'CB', 'LB', 'RB', 'CDM', 'CAM', 'LM', 'RM', 'CF'],
  '3-1-3-1':         ['GK', 'CB', 'LB', 'RB', 'CDM', 'CM', 'LM', 'RM', 'CF'],
  '4-3-1':           ['GK', 'CB', 'CB', 'LB', 'RB', 'CM', 'LM', 'RM', 'CF'],
  '3-3-2':           ['GK', 'CB', 'LB', 'RB', 'CM', 'LM', 'RM', 'CF', 'ST'],
}

const POS_GROUP = (pos) => {
  if (pos === 'GK') return 'GK'
  if (['CB','LB','RB'].includes(pos)) return 'DEF'
  if (['CDM','CM','CAM','LM','RM'].includes(pos)) return 'MID'
  return 'ATK'
}

const TEAM_KNOWLEDGE = `
# Histon Hornets Blue U12 — Team Knowledge

## Format
9-a-side (9v9) youth football. Each match is divided into 8 equal time segments.
All substitutions must happen at segment boundaries.

## Formations (9 players on pitch including GK)
| Formation | Positions |
|-----------|-----------|
| 3-4-1     | GK · CB · LB · RB · CM · CM · LM · RM · CF |
| 3-4-1 (balanced) | GK · CB · LB · RB · CDM · CAM · LM · RM · CF |
| 3-1-3-1   | GK · CB · LB · RB · CDM · CM · LM · RM · CF |
| 4-3-1     | GK · CB · CB · LB · RB · CM · LM · RM · CF |
| 3-3-2     | GK · CB · LB · RB · CM · LM · RM · CF · ST |

## Position Groups
- GK: Goalkeeper
- DEF: CB (Centre-back), LB (Left-back), RB (Right-back)
- MID: CDM (Defensive mid), CM (Centre mid), CAM (Attacking mid), LM (Left mid), RM (Right mid)
- ATK: CF (Centre forward), ST (Striker), LF (Left forward), RF (Right forward)

## Selection Rules
1. Minimum game time: Every selected player must play at least half the match (4/8 segments)
2. Carrying injury: Should not start — bring on from the bench at the half if possible. If squad size forces a start, sub them off at half time
3. Reduced time: Play exactly half the match (4 segments), then are substituted. Can start the first half or come on for the second half
4. Coverage: Every position must have exactly one player at all times (0 to full match length)
5. Substitutions: Only at segment boundaries
6. Fair as is possible: Try to balance time on field as much as is possible, so don't have lots of players playing the whole match when you have 3+ subs

## Position Assignment Philosophy
- GK: The player with the most GK minutes. Goalkeepers rarely rotate in youth football unless you have a designated backup
- CB: Strong, reliable defenders. Favour players with highest clean-quarter rates in DEF positions
- LB / RB: Energetic, can cover wide areas. Look for DEF minutes on either flank
- CDM: Defensive-minded midfielder. Look for CM/CDM history; clean quarters in mid defensive role
- CM / LM / RM: All-rounders. Balance defensive stability with attacking contribution
- CAM: Attacking-minded midfielder. Look for CM/CAM/CF history; Favour goals-per-game and assists
- CF / ST: Most prolific scorers. Favour goals-per-game and assists
- Unknown history: If a player has no appearance history, place them based on physical profile if known; otherwise fill remaining positions
- Recency: Prioritise positions that they have done better in for the most recent matches. If they are not performing well in those, look back at history.

## Substitution Strategy
- If more than 9 players are available, the extras rotate in during the match
- Prefer swapping like-for-like (DEF for DEF, ATK for ATK) to maintain shape
- Bring on the freshest legs in the second half for attacking positions to press for goals
- If a player is both injured and in a key position, sub them at the half regardless
- Players with less playtime, ensure they cover segments in both halves of the match
`

// @ts-ignore
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405, headers: CORS })

  try {
    // @ts-ignore
    const ANTHROPIC_KEY = Deno.env.get('ANTHROPIC_API_KEY')
    // @ts-ignore
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
    // @ts-ignore
    const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!ANTHROPIC_KEY) throw new Error('ANTHROPIC_API_KEY not configured on this server')

    const body = await req.json()
    const { formation, players, matchLengthMins = 60 } = body

    if (!formation || !FORMATIONS[formation]) throw new Error(`Unknown formation: ${formation}`)
    if (!players || players.length < 9) throw new Error(`Need at least 9 players, got ${players?.length ?? 0}`)

    const playerIds = players.map(p => p.id)

    // Fetch player stats using service role (bypasses RLS)
    const supabase = createClient(SUPABASE_URL, SERVICE_KEY)

    const [appsRes, goalsRes] = await Promise.all([
      supabase
        .from('player_appearances')
        .select('player_id, position, time_start, time_end')
        .in('player_id', playerIds),
      supabase
        .from('goals')
        .select('scorer_player_id, assist_player_id, for_histon')
        .or(`scorer_player_id.in.(${playerIds.join(',')}),assist_player_id.in.(${playerIds.join(',')})`),
    ])

    if (appsRes.error) throw new Error('DB error: ' + appsRes.error.message)

    // Aggregate per player
    const statsMap = {}
    for (const p of players) {
      const apps = (appsRes.data || []).filter(a => a.player_id === p.id)
      const posMins = {}
      for (const a of apps) {
        const mins = a.time_end - a.time_start
        posMins[a.position] = (posMins[a.position] || 0) + mins
      }
      // Roll up into groups
      const groupMins = { GK: 0, DEF: 0, MID: 0, ATK: 0 }
      for (const [pos, mins] of Object.entries(posMins)) {
        groupMins[POS_GROUP(pos)] = (groupMins[POS_GROUP(pos)] || 0) + mins
      }
      const goals = (goalsRes.data || []).filter(g => g.scorer_player_id === p.id && g.for_histon).length
      const assists = (goalsRes.data || []).filter(g => g.assist_player_id === p.id && g.for_histon).length
      const totalMins = Object.values(posMins).reduce((s, m) => s + m, 0)

      // Determine top positions (sorted by minutes)
      const topPositions = Object.entries(posMins)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([pos, mins]) => `${pos}(${Math.round(mins)}m)`)
        .join(', ')

      statsMap[p.id] = { posMins, groupMins, goals, assists, totalMins, topPositions }
    }

    // Build segment boundaries
    const segLen = matchLengthMins / 8
    const boundaries = Array.from({ length: 9 }, (_, i) => Math.round(i * segLen * 10) / 10)
    const halfMatch = matchLengthMins / 2
    const positions = FORMATIONS[formation]

    const playerSection = players.map(p => {
      const s = statsMap[p.id]
      const flags = []
      if (p.injured) flags.push('CARRYING INJURY — prefer as substitute')
      if (p.reducedTime) flags.push('REDUCED TIME — cap at exactly half match')
      const flagStr = flags.length ? `\n  ⚠️  ${flags.join('; ')}` : ''
      const posStr = s.topPositions || 'No history'
      const groupStr = `GK:${Math.round(s.groupMins.GK)}m  DEF:${Math.round(s.groupMins.DEF)}m  MID:${Math.round(s.groupMins.MID)}m  ATK:${Math.round(s.groupMins.ATK)}m`
      return `• ${p.name} (ID:${p.id})${flagStr}
  Positions: ${posStr}
  Group mins: ${groupStr}
  Goals: ${s.goals}  Assists: ${s.assists}  Total mins: ${Math.round(s.totalMins)}`
    }).join('\n\n')

    // GK plays the full match — outfield balancing only applies to the other 8 positions
    const outfieldCount = players.length - 1 // one GK assumed
    const outfieldTargetMins = Math.round((8 * matchLengthMins) / outfieldCount)
    const quarterMatch = matchLengthMins / 4
    const threeQuarterMatch = (matchLengthMins * 3) / 4

    const prompt = `${TEAM_KNOWLEDGE}

---

TASK: Propose a complete 9v9 lineup for a ${matchLengthMins}-minute match using the ${formation} formation.

POSITIONS TO FILL (${positions.length} slots): ${positions.join(', ')}

SEGMENT BOUNDARIES (the only valid time values, in minutes): ${boundaries.join(', ')}
First half ends / second half starts at: ${halfMatch} minutes

PLAYING TIME TARGETS:
- GOALKEEPER: plays the full match (0–${matchLengthMins}). Do not rotate the GK.
- OUTFIELD players (everyone except GK): ${outfieldCount} players sharing 8 × ${matchLengthMins} = ${8 * matchLengthMins} outfield minutes
- TARGET per outfield player: ~${outfieldTargetMins} minutes
- MINIMUM per outfield player: ${halfMatch} minutes (non-negotiable)
- Do NOT give most outfield players a full match while a few sit out a whole half — spread the minutes fairly across all ${outfieldCount} outfield players

AVAILABLE PLAYERS (${players.length} total):

${playerSection}

RULES (all mandatory):
1. GK plays 0 to ${matchLengthMins} — one single appearance entry, full match, no substitution
2. Every outfield player plays ≥ ${halfMatch} minutes total
3. Aim for ~${outfieldTargetMins} minutes per outfield player — avoid giving some the full match while others play only ${halfMatch}
4. CARRYING INJURY: must not start; bring on at or after ${halfMatch} mins. If squad size forces a start, sub off at ${halfMatch}
5. REDUCED TIME: play exactly ${halfMatch} minutes total
6. Exactly 9 players on pitch at all times
7. Every position covered continuously from 0 to ${matchLengthMins} minutes
8. All timeStart / timeEnd values must be from: ${boundaries.join(', ')}

SPLIT-HALF RULE for outfield players (critical — GK is exempt):
Any outfield player who does not play the full match MUST have their time spread across BOTH halves.
They cannot sit out an entire half. Every non-full-match outfield player must appear in at least one segment of H1 (0–${halfMatch}) AND at least one segment of H2 (${halfMatch}–${matchLengthMins}).

Example for a player playing ${halfMatch} of ${matchLengthMins} minutes:
  Option A: timeStart=0 to ${quarterMatch}, then timeStart=${threeQuarterMatch} to ${matchLengthMins}  (first quarter + last quarter)
  Option B: timeStart=${quarterMatch} to ${halfMatch}, then timeStart=${halfMatch} to ${threeQuarterMatch}  (middle two quarters)
Each window is a separate appearance entry. Choose whichever split best fits the substitution plan.

OUTPUT: Respond with ONLY a valid JSON object — no markdown, no code fences, no explanation outside the JSON:
{
  "appearances": [
    {"playerId": <number>, "playerName": "<string>", "position": "<string>", "timeStart": <number>, "timeEnd": <number>}
  ],
  "reasoning": "<2-4 sentences explaining the outfield time distribution and substitution plan>"
}

Each entry covers one continuous time window for one player in one position.
A player with split time will have multiple entries.
The sum of (timeEnd - timeStart) across all entries for each outfield player must be ≥ ${halfMatch} and as close to ${outfieldTargetMins} as possible.`

    // Call Claude Sonnet
    const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 2048,
        system: 'You are a football lineup generator. You MUST respond with ONLY a valid JSON object. No prose, no explanation, no markdown — just the raw JSON object starting with { and ending with }.',
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    if (!claudeRes.ok) {
      const errBody = await claudeRes.text()
      throw new Error(`Claude API returned ${claudeRes.status}: ${errBody.slice(0, 200)}`)
    }

    const claudeData = await claudeRes.json()
    const rawText = claudeData.content?.[0]?.text
    if (!rawText) throw new Error('Empty response from Claude')

    // Extract the JSON object robustly — find first { and last }
    const start = rawText.indexOf('{')
    const end = rawText.lastIndexOf('}')
    if (start === -1 || end === -1 || end <= start) {
      throw new Error(`Claude did not return a JSON object. Response: ${rawText.slice(0, 200)}`)
    }
    const lineup = JSON.parse(rawText.slice(start, end + 1))

    if (!Array.isArray(lineup.appearances)) throw new Error('Claude returned invalid lineup structure')

    return new Response(JSON.stringify(lineup), {
      headers: { ...CORS, 'Content-Type': 'application/json' },
    })

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  }
})
