import { useState } from 'react'
import { supabase, insertPlayerAppearance } from '../../lib/supabase'

const FORMATIONS = {
  '3-4-1': {
    label: '3-4-1',
    rows: ['GK', '3 DEF', 'CM · CM · LM · RM', '1 ATK'],
  },
  '3-4-1 (balanced)': {
    label: '3-4-1 Balanced',
    rows: ['GK', '3 DEF', 'CDM · CAM · LM · RM', '1 ATK'],
  },
  '3-1-3-1': {
    label: '3-1-3-1',
    rows: ['GK', '3 DEF', '1 CDM', 'CM · LM · RM', '1 ATK'],
  },
  '4-3-1': {
    label: '4-3-1',
    rows: ['GK', '4 DEF', 'CM · LM · RM', '1 ATK'],
  },
  '3-3-2': {
    label: '3-3-2',
    rows: ['GK', '3 DEF', 'CM · LM · RM', 'CF · ST'],
  },
}

const POS_GROUP_COLOR = {
  GK:  'bg-amber-100 text-amber-800',
  CB:  'bg-blue-100 text-blue-800',
  LB:  'bg-blue-100 text-blue-800',
  RB:  'bg-blue-100 text-blue-800',
  CDM: 'bg-emerald-100 text-emerald-800',
  CM:  'bg-emerald-100 text-emerald-800',
  CAM: 'bg-emerald-100 text-emerald-800',
  LM:  'bg-emerald-100 text-emerald-800',
  RM:  'bg-emerald-100 text-emerald-800',
  CF:  'bg-rose-100 text-rose-800',
  ST:  'bg-rose-100 text-rose-800',
  LF:  'bg-rose-100 text-rose-800',
  RF:  'bg-rose-100 text-rose-800',
}

function PosBadge({ pos }) {
  return (
    <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${POS_GROUP_COLOR[pos] || 'bg-neutral-100 text-neutral-700'}`}>
      {pos}
    </span>
  )
}

function groupAppearances(appearances) {
  const groups = { GK: [], DEF: [], MID: [], ATK: [] }
  for (const app of appearances) {
    const p = app.position
    if (p === 'GK') groups.GK.push(app)
    else if (['CB','LB','RB'].includes(p)) groups.DEF.push(app)
    else if (['CDM','CM','CAM','LM','RM'].includes(p)) groups.MID.push(app)
    else groups.ATK.push(app)
  }
  return groups
}

export default function ProposeLineupModal({ match, eligiblePlayers, onClose, onApply }) {
  const [step, setStep] = useState('formation')
  const [formation, setFormation] = useState('3-4-1')
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [flags, setFlags] = useState({}) // { [playerId]: { injured, reducedTime } }
  const [lineup, setLineup] = useState(null)
  const [error, setError] = useState(null)
  const [applying, setApplying] = useState(false)

  const matchLen = match.match_length_mins || 60
  const halfLen = matchLen / 2

  const togglePlayer = (id) => setSelectedIds(prev => {
    const next = new Set(prev)
    next.has(id) ? next.delete(id) : next.add(id)
    return next
  })

  const setFlag = (id, flag, val) =>
    setFlags(prev => ({ ...prev, [id]: { ...prev[id], [flag]: val } }))

  const selectedPlayers = eligiblePlayers
    .filter(p => selectedIds.has(p.id))
    .map(p => ({ id: p.id, name: p.name, injured: !!(flags[p.id]?.injured), reducedTime: !!(flags[p.id]?.reducedTime) }))

  const generate = async () => {
    setStep('generating')
    setError(null)
    try {
      const { data, error: fnErr } = await supabase.functions.invoke('propose-lineup', {
        body: { formation, players: selectedPlayers, matchLengthMins: matchLen },
      })
      if (fnErr) throw new Error(fnErr.message)
      if (data?.error) throw new Error(data.error)
      if (!data?.appearances) throw new Error('Unexpected response from lineup service')
      setLineup(data)
      setStep('result')
    } catch (err) {
      setError(err.message)
      setStep('error')
    }
  }

  const applyLineup = async () => {
    if (!lineup?.appearances) return
    setApplying(true)
    try {
      for (const app of lineup.appearances) {
        await insertPlayerAppearance({
          match_id: match.id,
          player_id: app.playerId,
          position: app.position,
          time_start: app.timeStart,
          time_end: app.timeEnd,
        })
      }
      onApply()
    } catch (err) {
      setError('Failed to save lineup: ' + err.message)
      setStep('error')
    } finally {
      setApplying(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-3 sm:p-6">
      <div className="bg-neutral-card rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-border shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#1E3A5F]/10 flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" stroke="#1E3A5F" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            </div>
            <div>
              <h2 className="text-sm font-bold text-neutral-fg">Generate Lineup</h2>
              <p className="text-[11px] text-neutral-muted">vs {match.opposition} · {matchLen} mins</p>
            </div>
          </div>
          <button onClick={onClose} className="text-neutral-muted hover:text-neutral-fg text-xl leading-none w-7 h-7 flex items-center justify-center rounded-lg hover:bg-neutral-secondary transition-colors">×</button>
        </div>

        {/* Step indicator */}
        {(step === 'formation' || step === 'players') && (
          <div className="flex items-center gap-1.5 px-5 pt-3 shrink-0">
            {[['formation', '1', 'Formation'], ['players', '2', 'Players']].map(([s, num, label]) => (
              <div key={s} className="flex items-center gap-1.5">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold transition-colors ${step === s ? 'bg-[#1E3A5F] text-white' : 'bg-neutral-secondary text-neutral-muted'}`}>{num}</div>
                <span className={`text-xs font-medium ${step === s ? 'text-neutral-fg' : 'text-neutral-muted'}`}>{label}</span>
                {s === 'formation' && <svg className="w-3 h-3 text-neutral-muted/40 mx-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M9 18l6-6-6-6"/></svg>}
              </div>
            ))}
          </div>
        )}

        {/* ── Step: Formation ── */}
        {step === 'formation' && (
          <div className="flex-1 overflow-y-auto p-5 space-y-3">
            <p className="text-xs text-neutral-muted">Choose a formation for this match.</p>
            <div className="grid grid-cols-2 gap-2.5">
              {Object.entries(FORMATIONS).map(([key, f]) => (
                <button key={key} onClick={() => setFormation(key)}
                  className={`text-left p-3.5 rounded-xl border-2 transition-all ${formation === key ? 'border-[#1E3A5F] bg-[#1E3A5F]/5' : 'border-neutral-border hover:border-neutral-accent/40'}`}
                >
                  <div className={`text-xl font-black tracking-tight mb-1.5 ${formation === key ? 'text-[#1E3A5F]' : 'text-neutral-fg'}`}>{f.label}</div>
                  <div className="space-y-0.5">
                    {f.rows.map((r, i) => (
                      <div key={i} className={`text-[11px] font-medium ${formation === key ? 'text-[#1E3A5F]/70' : 'text-neutral-muted'}`}>{r}</div>
                    ))}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Step: Players ── */}
        {step === 'players' && (
          <div className="flex-1 overflow-y-auto p-5 space-y-3 min-h-0">
            <div className="flex items-center justify-between">
              <p className="text-xs text-neutral-muted">Select players for this match. Need ≥ 9.</p>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${selectedIds.size >= 9 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                {selectedIds.size} selected
              </span>
            </div>
            <div className="space-y-1.5">
              {eligiblePlayers.map(p => {
                const isSelected = selectedIds.has(p.id)
                const f = flags[p.id] || {}
                return (
                  <div key={p.id} className={`rounded-xl border transition-all ${isSelected ? 'border-[#1E3A5F]/30 bg-[#1E3A5F]/3' : 'border-neutral-border'}`}>
                    <button onClick={() => togglePlayer(p.id)} className="w-full flex items-center gap-3 px-3 py-2.5 text-left">
                      <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${isSelected ? 'bg-[#1E3A5F] border-[#1E3A5F]' : 'border-neutral-border'}`}>
                        {isSelected && <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}><path d="M5 13l4 4L19 7"/></svg>}
                      </div>
                      <span className="text-sm font-medium text-neutral-fg">{p.name}</span>
                    </button>
                    {isSelected && (
                      <div className="px-3 pb-2.5 flex gap-2">
                        {[['injured', '🤕', 'Carrying injury'], ['reducedTime', '⏱️', 'Reduced time']].map(([flag, icon, label]) => (
                          <button key={flag} onClick={() => setFlag(p.id, flag, !f[flag])}
                            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-colors ${f[flag] ? 'bg-amber-100 border-amber-300 text-amber-800' : 'bg-neutral-secondary border-neutral-border text-neutral-muted hover:text-neutral-fg'}`}
                          >
                            <span>{icon}</span>{label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── Step: Generating ── */}
        {step === 'generating' && (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 p-10">
            <div className="w-12 h-12 rounded-2xl bg-[#1E3A5F]/10 flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-[#1E3A5F]/30 border-t-[#1E3A5F] rounded-full animate-spin" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-neutral-fg">Asking Claude Sonnet…</p>
              <p className="text-xs text-neutral-muted mt-1">Analysing player stats and building the optimal lineup</p>
            </div>
          </div>
        )}

        {/* ── Step: Result ── */}
        {step === 'result' && lineup && (() => {
          const groups = groupAppearances(lineup.appearances)
          const segLen = matchLen / 8
          const formatTime = (t) => `${t}'`
          return (
            <div className="flex-1 overflow-y-auto p-5 space-y-4 min-h-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-widest text-neutral-muted">Formation</span>
                <span className="text-xs font-black text-[#1E3A5F] bg-[#1E3A5F]/8 px-2 py-0.5 rounded-md">{formation}</span>
              </div>

              {[['GK', '🥅'], ['DEF', '🛡️'], ['MID', '⬡'], ['ATK', '⚽']].map(([grp, icon]) => {
                const apps = groups[grp]
                if (!apps.length) return null
                return (
                  <div key={grp}>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-muted mb-1.5">{icon} {grp}</p>
                    <div className="space-y-1">
                      {apps.map((app, i) => {
                        const isFullMatch = app.timeStart === 0 && app.timeEnd === matchLen
                        const isFirstHalf = app.timeEnd <= halfLen && app.timeStart === 0
                        const isSecondHalf = app.timeStart >= halfLen
                        const isSub = app.timeStart > 0 && app.timeStart < halfLen
                        return (
                          <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-neutral-bg border border-neutral-border/60">
                            <PosBadge pos={app.position} />
                            <span className="flex-1 text-sm font-semibold text-neutral-fg">{app.playerName}</span>
                            <div className="flex items-center gap-1.5 shrink-0">
                              {isSecondHalf && <span className="text-[10px] font-semibold text-neutral-accent bg-neutral-accent/10 px-1.5 py-0.5 rounded">SUB ON</span>}
                              {isSub && <span className="text-[10px] font-semibold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">SUB ON</span>}
                              <span className="text-[11px] font-mono text-neutral-muted">
                                {isFullMatch ? 'Full match'
                                  : isFirstHalf ? `First half`
                                  : isSecondHalf ? `${formatTime(app.timeStart)}→${formatTime(app.timeEnd)}`
                                  : `${formatTime(app.timeStart)}→${formatTime(app.timeEnd)}`}
                              </span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}

              {lineup.reasoning && (
                <div className="bg-[#1E3A5F]/5 border border-[#1E3A5F]/15 rounded-xl p-3.5">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#1E3A5F]/60 mb-1.5">Claude's Reasoning</p>
                  <p className="text-xs text-neutral-fg/80 leading-relaxed">{lineup.reasoning}</p>
                </div>
              )}
            </div>
          )
        })()}

        {/* ── Step: Error ── */}
        {step === 'error' && (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8 text-center">
            <div className="w-12 h-12 rounded-2xl bg-red-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-neutral-fg mb-1">Something went wrong</p>
              <p className="text-xs text-neutral-muted">{error}</p>
            </div>
          </div>
        )}

        {/* Footer actions */}
        <div className="px-5 py-4 border-t border-neutral-border flex gap-2 shrink-0">
          {step === 'formation' && (
            <>
              <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-neutral-border text-sm font-medium text-neutral-fg/70 hover:bg-neutral-secondary transition-colors">Cancel</button>
              <button onClick={() => setStep('players')} className="flex-1 py-2.5 rounded-xl bg-[#1E3A5F] text-white text-sm font-semibold hover:bg-[#1E3A5F]/90 transition-colors">
                Next: Players →
              </button>
            </>
          )}
          {step === 'players' && (
            <>
              <button onClick={() => setStep('formation')} className="py-2.5 px-4 rounded-xl border border-neutral-border text-sm font-medium text-neutral-fg/70 hover:bg-neutral-secondary transition-colors">← Back</button>
              <button onClick={generate} disabled={selectedIds.size < 9}
                className="flex-1 py-2.5 rounded-xl bg-[#1E3A5F] text-white text-sm font-semibold hover:bg-[#1E3A5F]/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                  <path d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2z"/><path d="M12 6v6l4 2"/>
                </svg>
                Generate Lineup
              </button>
            </>
          )}
          {step === 'result' && (
            <>
              <button onClick={() => setStep('players')} className="py-2.5 px-4 rounded-xl border border-neutral-border text-sm font-medium text-neutral-fg/70 hover:bg-neutral-secondary transition-colors">← Redo</button>
              <button onClick={applyLineup} disabled={applying}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {applying
                  ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Applying…</>
                  : <><svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M5 13l4 4L19 7"/></svg>Apply to Match</>
                }
              </button>
            </>
          )}
          {step === 'error' && (
            <>
              <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-neutral-border text-sm font-medium text-neutral-fg/70 hover:bg-neutral-secondary transition-colors">Close</button>
              <button onClick={() => setStep('players')} className="flex-1 py-2.5 rounded-xl bg-[#1E3A5F] text-white text-sm font-semibold hover:bg-[#1E3A5F]/90 transition-colors">Try Again</button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
