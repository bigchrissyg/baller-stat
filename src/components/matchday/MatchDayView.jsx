import { useState, useRef, useCallback } from 'react'
import { useMatchDetail } from '../../hooks/useData'
import Spinner from '../ui/Spinner'

// ─── Pitch constants (mirrors MatchDetail) ────────────────────────────────────

const PITCH_POS = {
  GK:  { x: 50, y: 128 },
  LB:  { x: 80, y: 108 }, CB:  { x: 50, y: 108 }, RB:  { x: 20, y: 108 },
  CDM: { x: 50, y: 83  },
  LM:  { x: 80, y: 58  }, CM:  { x: 50, y: 68  }, RM:  { x: 18, y: 58  },
  CAM: { x: 50, y: 48  },
  LF:  { x: 78, y: 18  }, CF:  { x: 50, y: 28  }, RF:  { x: 22, y: 28  },
  ST:  { x: 50, y: 18  },
}

const POS_SVG_COLOR = {
  GK:  { fill: '#9333ea', stroke: '#7e22ce' },
  CB:  { fill: '#dc2626', stroke: '#b91c1c' },
  LB:  { fill: '#dc2626', stroke: '#b91c1c' },
  RB:  { fill: '#dc2626', stroke: '#b91c1c' },
  CM:  { fill: '#ca8a04', stroke: '#a16207' },
  CDM: { fill: '#ca8a04', stroke: '#a16207' },
  CAM: { fill: '#ca8a04', stroke: '#a16207' },
  LM:  { fill: '#ca8a04', stroke: '#a16207' },
  RM:  { fill: '#ca8a04', stroke: '#a16207' },
  CF:  { fill: '#16a34a', stroke: '#15803d' },
  LF:  { fill: '#16a34a', stroke: '#15803d' },
  RF:  { fill: '#16a34a', stroke: '#15803d' },
  ST:  { fill: '#16a34a', stroke: '#15803d' },
}

const POS_ORDER = ['GK', 'LB', 'CB', 'RB', 'CDM', 'CM', 'LM', 'RM', 'CAM', 'LF', 'CF', 'RF', 'ST']

const fmtMin = m => m % 1 !== 0 ? m.toFixed(1) : String(Math.round(m))

// ─── Blueprint pitch SVG ──────────────────────────────────────────────────────

function BlueprintPitch({ players, uid }) {
  const gridId = `mdv-grid-${uid}`
  const byPos = {}
  for (const p of players) {
    if (!byPos[p.position]) byPos[p.position] = []
    byPos[p.position].push(p)
  }
  const placed = []
  for (const [pos, group] of Object.entries(byPos)) {
    const base = PITCH_POS[pos] || { x: 50, y: 62 }
    if (group.length === 1) {
      placed.push({ ...group[0], x: base.x, y: base.y })
    } else {
      const gap = Math.min(16, 70 / group.length)
      const half = (gap * (group.length - 1)) / 2
      group.forEach((p, i) => placed.push({ ...p, x: base.x - half + i * gap, y: base.y }))
    }
  }

  return (
    <svg viewBox="0 0 100 148" style={{ display: 'block', width: '100%' }}>
      <defs>
        <pattern id={gridId} width="10" height="10" patternUnits="userSpaceOnUse">
          <path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(96,165,250,0.08)" strokeWidth="0.3" />
        </pattern>
      </defs>
      <rect width="100" height="148" fill="#0d1e3f" rx="6" />
      <rect width="100" height="148" fill={`url(#${gridId})`} rx="6" />
      <rect x="5"  y="4"   width="90" height="140" fill="none"                  stroke="rgba(96,165,250,0.8)" strokeWidth="0.6" />
      <line x1="5" y1="74" x2="95"   y2="74"                                    stroke="rgba(96,165,250,0.8)" strokeWidth="0.6" />
      <circle cx="50" cy="74" r="11" fill="none"                                 stroke="rgba(96,165,250,0.8)" strokeWidth="0.6" />
      <circle cx="50" cy="74" r="0.8"                                            fill="rgba(96,165,250,0.9)" />
      <rect x="22" y="4"   width="56" height="22" fill="rgba(96,165,250,0.06)"  stroke="rgba(96,165,250,0.8)" strokeWidth="0.6" />
      <rect x="35" y="4"   width="30" height="9"  fill="none"                   stroke="rgba(96,165,250,0.8)" strokeWidth="0.6" />
      <circle cx="50" cy="19"  r="0.7"                                           fill="rgba(96,165,250,0.9)" />
      <rect x="40" y="1"   width="20" height="4"  fill="rgba(96,165,250,0.15)"  stroke="rgba(96,165,250,0.8)" strokeWidth="0.6" />
      <rect x="22" y="122" width="56" height="22" fill="rgba(96,165,250,0.06)"  stroke="rgba(96,165,250,0.8)" strokeWidth="0.6" />
      <rect x="35" y="135" width="30" height="9"  fill="none"                   stroke="rgba(96,165,250,0.8)" strokeWidth="0.6" />
      <circle cx="50" cy="129" r="0.7"                                           fill="rgba(96,165,250,0.9)" />
      <rect x="40" y="143" width="20" height="4"  fill="rgba(96,165,250,0.15)"  stroke="rgba(96,165,250,0.8)" strokeWidth="0.6" />
      {placed.map(p => {
        const c = POS_SVG_COLOR[p.position] || { fill: '#64748b', stroke: '#475569' }
        const lastName = p.name.split(' ').at(-1)
        const label = lastName.length > 9 ? lastName.slice(0, 8) + '…' : lastName
        return (
          <g key={p.id} transform={`translate(${p.x},${p.y})`}>
            <circle r="5.8" fill="rgba(0,0,0,0.25)" cx="0.4" cy="0.6" />
            <circle r="5.5" fill={c.fill} stroke={c.stroke} strokeWidth="0.6" />
            <text textAnchor="middle" dominantBaseline="central" fontSize="2.6" fontWeight="700" fill="white" y="0">
              {p.position}
            </text>
            <text textAnchor="middle" fontSize="3.1" fontWeight="600" y="10"
              stroke="rgba(0,0,0,0.5)" strokeWidth="1.4" strokeLinejoin="round" paintOrder="stroke" fill="white">
              {label}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

// ─── Data helpers ─────────────────────────────────────────────────────────────

function buildSlices(match) {
  const allApps = match.player_appearances || []
  const matchLen = match.match_length_mins || 60
  if (!allApps.some(a => a.position)) return []

  const times = [...new Set([0, ...allApps.flatMap(a => [a.time_start, a.time_end]), matchLen])].sort((a, b) => a - b)
  const slices = []
  for (let i = 0; i < times.length - 1; i++) {
    const t1 = times[i], t2 = times[i + 1], mid = (t1 + t2) / 2
    const activeMap = new Map()
    for (const a of allApps) {
      if (a.time_start <= mid && a.time_end > mid && a.position)
        activeMap.set(a.player_id, { id: a.player_id, name: a.players?.name ?? 'Unknown', position: a.position })
    }
    const active = [...activeMap.values()]
    if (!active.length) continue
    const key = active.slice().sort((a, b) => a.id - b.id).map(a => `${a.id}:${a.position}`).join(',')
    if (slices.length && slices.at(-1).key === key) slices.at(-1).t2 = t2
    else slices.push({ t1, t2, active, key })
  }
  return slices
}

function buildRoster(match) {
  const allApps = match.player_appearances || []
  const byPlayer = new Map()
  for (const app of allApps) {
    if (!byPlayer.has(app.player_id))
      byPlayer.set(app.player_id, { id: app.player_id, name: app.players?.name ?? 'Unknown', apps: [] })
    byPlayer.get(app.player_id).apps.push(app)
  }
  return [...byPlayer.values()].map(p => {
    const sorted = p.apps.slice().sort((a, b) => a.time_start - b.time_start)
    const totalMins = sorted.reduce((s, a) => s + (a.time_end - a.time_start), 0)
    const isStarter = sorted[0].time_start === 0
    const positions = sorted.filter(a => a.position).map(a => a.position).filter((v, i, arr) => arr.indexOf(v) === i)
    return { ...p, totalMins, isStarter, positions, subOnMin: isStarter ? null : sorted[0].time_start }
  })
}

// ─── Lineup player row ────────────────────────────────────────────────────────

function PlayerRow({ player, isSub = false }) {
  const { positions, totalMins, subOnMin } = player
  return (
    <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-white/5 border border-white/[0.07]">
      <div className="flex items-center gap-1 shrink-0 min-w-0">
        {positions.length > 0 ? positions.map(pos => {
          const c = POS_SVG_COLOR[pos] || { fill: '#64748b' }
          return (
            <span key={pos} className="text-[11px] font-bold w-8 text-center rounded px-1 py-0.5 text-white shrink-0"
              style={{ backgroundColor: c.fill }}>
              {pos}
            </span>
          )
        }) : (
          <span className="text-[11px] text-white/30 w-8 text-center">—</span>
        )}
      </div>
      <span className="flex-1 text-sm font-medium text-white/90 truncate">{player.name}</span>
      <div className="shrink-0 text-right">
        {isSub && subOnMin != null && (
          <span className="text-[10px] text-white/40 font-medium block">{fmtMin(subOnMin)}'</span>
        )}
        <span className="text-xs font-bold text-white/50">{Math.round(totalMins)}'</span>
      </div>
    </div>
  )
}

// ─── Substitution changes chip row ────────────────────────────────────────────

function SubChanges({ prevSlice, currentSlice }) {
  if (!prevSlice) return null
  const subOff = prevSlice.active.filter(p => !currentSlice.active.find(x => x.id === p.id))
  const subOn  = currentSlice.active.filter(p => !prevSlice.active.find(x => x.id === p.id))
  const posCh  = currentSlice.active.filter(p => {
    const prev = prevSlice.active.find(x => x.id === p.id)
    return prev && prev.position !== p.position
  })
  if (!subOff.length && !subOn.length && !posCh.length) return null

  return (
    <div className="rounded-xl bg-white/5 border border-white/10 px-4 py-3 space-y-2 text-xs">
      {subOff.length > 0 && (
        <div className="flex flex-wrap gap-1.5 items-center">
          <span className="text-white/40 font-semibold mr-1">Off</span>
          {subOff.map(p => (
            <span key={p.id} className="bg-red-900/40 text-red-300 border border-red-700/40 px-2 py-0.5 rounded-full">
              {p.name.split(' ').at(-1)} <span className="text-red-400/70">← {p.position}</span>
            </span>
          ))}
        </div>
      )}
      {subOn.length > 0 && (
        <div className="flex flex-wrap gap-1.5 items-center">
          <span className="text-white/40 font-semibold mr-1">On</span>
          {subOn.map(p => (
            <span key={p.id} className="bg-green-900/40 text-green-300 border border-green-700/40 px-2 py-0.5 rounded-full">
              {p.name.split(' ').at(-1)} <span className="text-green-400/70">→ {currentSlice.active.find(x => x.id === p.id)?.position}</span>
            </span>
          ))}
        </div>
      )}
      {posCh.length > 0 && (
        <div className="flex flex-wrap gap-1.5 items-center">
          <span className="text-white/40 font-semibold mr-1">Moved</span>
          {posCh.map(p => {
            const prev = prevSlice.active.find(x => x.id === p.id)
            return (
              <span key={p.id} className="bg-blue-900/40 text-blue-300 border border-blue-700/40 px-2 py-0.5 rounded-full">
                {p.name.split(' ').at(-1)} <span className="text-blue-400/70">{prev?.position}→{p.position}</span>
              </span>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Main overlay ─────────────────────────────────────────────────────────────

export default function MatchDayView({ matches, onClose }) {
  const [matchId, setMatchId] = useState(matches[0]?.id ?? null)
  const [cardIdx, setCardIdx] = useState(0)
  const { match, loading } = useMatchDetail(matchId)
  const trackRef = useRef(null)

  const onScroll = useCallback(() => {
    const el = trackRef.current
    if (el) setCardIdx(Math.round(el.scrollLeft / el.offsetWidth))
  }, [])

  const scrollTo = idx => {
    trackRef.current?.scrollTo({ left: idx * trackRef.current.offsetWidth, behavior: 'smooth' })
  }

  const handleMatchChange = e => {
    setMatchId(Number(e.target.value))
    setCardIdx(0)
    trackRef.current?.scrollTo({ left: 0 })
  }

  const slices = match ? buildSlices(match) : []
  const roster = match ? buildRoster(match) : []
  const matchLen = match?.match_length_mins ?? 60
  const halfTime = matchLen / 2

  const starters = roster
    .filter(p => p.isStarter)
    .sort((a, b) => {
      const ra = POS_ORDER.indexOf(a.positions[0] ?? '')
      const rb = POS_ORDER.indexOf(b.positions[0] ?? '')
      return (ra === -1 ? 99 : ra) - (rb === -1 ? 99 : rb)
    })
  const subs = roster.filter(p => !p.isStarter).sort((a, b) => a.subOnMin - b.subOnMin)
  const totalCards = 1 + slices.length

  return (
    <div className="fixed inset-0 z-[100] flex flex-col" style={{ background: '#080f1e' }}>

      {/* ── Header ── */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.08] shrink-0">
        <button
          onClick={onClose}
          className="flex items-center justify-center w-8 h-8 rounded-full text-white/50 hover:text-white hover:bg-white/10 transition-colors shrink-0"
          aria-label="Close"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>

        <select
          value={matchId ?? ''}
          onChange={handleMatchChange}
          className="flex-1 min-w-0 bg-white/5 text-white text-sm font-semibold rounded-lg px-3 py-1.5 border border-white/10 focus:outline-none focus:ring-1 focus:ring-blue-400/40 appearance-none cursor-pointer"
        >
          {matches.map(m => (
            <option key={m.id} value={m.id}>
              vs {m.opposition}
              {m.match_date ? ` · ${new Date(m.match_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}` : ''}
              {m.histon_score != null ? ` (${m.histon_score}–${m.opposition_score})` : ''}
            </option>
          ))}
        </select>

        {/* Card position dots */}
        <div className="flex items-center gap-1 shrink-0">
          {Array.from({ length: Math.min(totalCards, 9) }).map((_, i) => (
            <button
              key={i}
              onClick={() => scrollTo(i)}
              className={`rounded-full transition-all duration-200 ${i === cardIdx ? 'w-4 h-1.5 bg-white' : 'w-1.5 h-1.5 bg-white/25 hover:bg-white/50'}`}
            />
          ))}
        </div>
      </div>

      {/* ── Card track ── */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <Spinner message="Loading match…" />
        </div>
      ) : !match ? (
        <div className="flex-1 flex items-center justify-center text-white/30 text-sm">No match data</div>
      ) : (
        <div
          ref={trackRef}
          onScroll={onScroll}
          className="flex-1 flex overflow-x-auto overflow-y-hidden"
          style={{ scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch' }}
        >

          {/* ══ Card 1: Lineup ══ */}
          <div className="flex-none w-full h-full overflow-y-auto" style={{ scrollSnapAlign: 'start' }}>
            <div className="px-4 pt-5 pb-10 space-y-5 max-w-lg mx-auto">

              {/* Match header */}
              <div className="rounded-2xl bg-white/[0.04] border border-white/[0.08] px-5 py-4 text-center">
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/35 mb-1">
                  {match.match_type} · {match.location === 'H' ? 'Home' : 'Away'}
                </p>
                <h2 className="text-2xl font-black text-white">vs {match.opposition}</h2>
                {match.histon_score != null && (
                  <p className="text-4xl font-black text-white mt-1 tabular-nums leading-none">
                    {match.histon_score}
                    <span className="text-white/30 mx-2">–</span>
                    {match.opposition_score}
                  </p>
                )}
                {match.match_date && (
                  <p className="text-xs text-white/35 mt-2">
                    {new Date(match.match_date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })}
                    <span className="mx-1.5 text-white/20">·</span>
                    {matchLen} mins
                  </p>
                )}
              </div>

              {roster.length === 0 && (
                <p className="text-center text-white/30 text-sm py-8">No lineup recorded for this match.</p>
              )}

              {/* Starting XI */}
              {starters.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2.5">
                    <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/35">Starting XI</span>
                    <div className="flex-1 h-px bg-white/[0.07]" />
                    <span className="text-[10px] font-bold text-white/20">{starters.length}</span>
                  </div>
                  <div className="space-y-1.5">
                    {starters.map(p => <PlayerRow key={p.id} player={p} />)}
                  </div>
                </div>
              )}

              {/* Substitutes */}
              {subs.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2.5">
                    <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/35">Substitutes</span>
                    <div className="flex-1 h-px bg-white/[0.07]" />
                    <span className="text-[10px] font-bold text-white/20">{subs.length}</span>
                  </div>
                  <div className="space-y-1.5">
                    {subs.map(p => <PlayerRow key={p.id} player={p} isSub />)}
                  </div>
                </div>
              )}

              {/* Swipe hint */}
              {slices.length > 0 && (
                <div className="flex items-center justify-center gap-1.5 text-white/20 text-xs pt-4">
                  <span>Swipe for pitch views</span>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
                    <path d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              )}
              {slices.length === 0 && roster.length > 0 && (
                <p className="text-center text-white/20 text-xs pt-4">No pitch positions recorded.</p>
              )}
            </div>
          </div>

          {/* ══ Pitch cards (one per formation slice) ══ */}
          {slices.map((slice, i) => {
            const prevSlice = i > 0 ? slices[i - 1] : null
            const half = slice.t1 < halfTime ? '1st Half' : '2nd Half'
            return (
              <div key={i} className="flex-none w-full h-full overflow-y-auto" style={{ scrollSnapAlign: 'start' }}>
                <div className="px-4 pt-5 pb-10 space-y-4 max-w-lg mx-auto">

                  {/* Time range label */}
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-px bg-white/[0.07]" />
                    <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-white/40 whitespace-nowrap">
                      {fmtMin(slice.t1)}' – {fmtMin(slice.t2)}' · {half}
                    </span>
                    <div className="flex-1 h-px bg-white/[0.07]" />
                  </div>

                  {/* Sub / position changes from previous slice */}
                  <SubChanges prevSlice={prevSlice} currentSlice={slice} />

                  {/* Pitch */}
                  <div className="max-w-xs mx-auto w-full">
                    <BlueprintPitch players={slice.active} uid={`${matchId}-s${i}`} />
                  </div>

                  {/* Navigation hints */}
                  <div className="flex items-center justify-between text-white/15 text-xs pt-2">
                    <button onClick={() => scrollTo(i)} className="flex items-center gap-1 hover:text-white/40 transition-colors">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 rotate-180">
                        <path d="M9 5l7 7-7 7" />
                      </svg>
                      {i === 0 ? 'Lineup' : `Slice ${i}`}
                    </button>
                    {i < slices.length - 1 && (
                      <button onClick={() => scrollTo(i + 2)} className="flex items-center gap-1 hover:text-white/40 transition-colors">
                        {`Slice ${i + 2}`}
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
                          <path d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
