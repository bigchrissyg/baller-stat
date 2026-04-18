import { Link } from 'react-router-dom'
import { usePlayers } from '../hooks/useData'
import { getInitials } from '../lib/utils'
import Spinner from '../components/ui/Spinner'

const AVATAR_COLORS = [
  'bg-hornets-primary', 'bg-hornets-secondary', 'bg-hornets-tertiary', 'bg-hornets-quaternary',
  'bg-hornets-quinary', 'bg-neutral-accent', 'bg-hornets-secondary', 'bg-hornets-tertiary',
]

export default function PlayerList() {
  const { players, loading, error } = usePlayers()

  if (loading) return <div className="max-w-5xl mx-auto px-4 py-8"><Spinner message="Loading players…" /></div>
  if (error) return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="bg-hornets-tertiary/10 border border-hornets-tertiary/30 rounded-xl p-4 text-hornets-tertiary text-sm">{error}</div>
    </div>
  )

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-xl font-bold text-neutral-fg mb-6">Squad</h1>

      {players.length === 0 ? (
        <div className="text-center py-20 text-neutral-muted text-sm">No players found</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {players.map((player, i) => (
            <Link
              key={player.id}
              to={`/players/${player.id}`}
              className="group bg-neutral-card rounded-2xl border border-neutral-border shadow-sm hover:shadow-md hover:border-neutral-accent/30 transition-all p-4 flex flex-col items-center gap-3 text-center"
            >
              <div className={`w-14 h-14 rounded-xl ${AVATAR_COLORS[i % AVATAR_COLORS.length]} flex items-center justify-center text-xl font-bold text-neutral-bg group-hover:scale-105 transition-transform`}>
                {getInitials(player.name)}
              </div>
              <p className="text-sm font-semibold text-neutral-fg leading-tight">{player.name}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
