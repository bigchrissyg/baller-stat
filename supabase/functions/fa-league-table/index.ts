const TEAM_SEARCH = 'histon hornets'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return n + (s[(v - 20) % 10] ?? s[v] ?? s[0])
}

function parseCells(rowHtml: string): string[] {
  return [...rowHtml.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map(m =>
    m[1].replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').trim()
  )
}

function parseRow(cells: string[], isUs: boolean) {
  const pos = parseInt(cells[0], 10)
  return {
    position: pos,
    ordinal:  ordinal(pos),
    team:     cells[1],
    played:   parseInt(cells[2], 10),
    won:      parseInt(cells[3], 10),
    drawn:    parseInt(cells[4], 10),
    lost:     parseInt(cells[5], 10),
    points:   parseInt(cells[6], 10),
    isUs,
  }
}

// @ts-ignore - Deno global available at runtime on Supabase Edge Functions
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })
  if (req.method !== 'GET') return new Response('Method not allowed', { status: 405, headers: CORS })

  try {
    const { searchParams } = new URL(req.url)
    const tableUrl = searchParams.get('url')
    if (!tableUrl) return new Response(JSON.stringify({ error: 'Missing required query param: url' }), { status: 400, headers: CORS })

    const res = await fetch(tableUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    })

    if (!res.ok) throw new Error(`FA Full-Time responded with ${res.status}`)

    const html = await res.text()

    const tbodyMatch = html.match(/<tbody[^>]*>([\s\S]*?)<\/tbody>/i)
    if (!tbodyMatch) throw new Error('Could not find table body in FA Full-Time response')

    const allCells = [...tbodyMatch[1].matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)]
      .map(r => parseCells(r[1]))
      .filter(c => c.length >= 7)

    const ourIdx = allCells.findIndex(c => c[1].toLowerCase().includes(TEAM_SEARCH))
    if (ourIdx === -1) throw new Error(`Team matching "${TEAM_SEARCH}" not found in table (${allCells.length} rows parsed)`)

    const tableRows = []
    if (ourIdx > 0)                   tableRows.push(parseRow(allCells[ourIdx - 1], false))
    tableRows.push(parseRow(allCells[ourIdx], true))
    if (ourIdx < allCells.length - 1) tableRows.push(parseRow(allCells[ourIdx + 1], false))

    return new Response(JSON.stringify({ rows: tableRows, total: allCells.length, fetchedAt: new Date().toISOString() }), {
      headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  }
})
