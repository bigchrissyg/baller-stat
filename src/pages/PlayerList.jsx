import { Link } from 'react-router-dom'
import { usePlayers } from '../hooks/useData'
import { getInitials } from '../lib/utils'
import Spinner from '../components/ui/Spinner'

const AVATAR_COLORS = [
  'bg-emerald-500', 'bg-blue-500', 'bg-violet-500', 'bg-amber-500',
  'bg-rose-500', 'bg-indigo-500', 'bg-teal-500', 'bg-orange-500',
]

export default function PlayerList() {
  const { players, loading, error } = usePlayers()

  if (loading) return <div className="max-w-5xl mx-auto px-4 py-8"><Spinner message="Loading players…" /></div>
  if (error) return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-rose-700 text-sm">{error}</div>
    </div>
  )

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-xl font-bold text-slate-800 mb-6">Squad</h1>

      {players.length === 0 ? (
        <div className="text-center py-20 text-slate-400 text-sm">No players found</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {players.map((player, i) => (
            <Link
              key={player.id}
              to={`/players/${player.id}`}
              className="group bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all p-4 flex flex-col items-center gap-3 text-center"
            >
              <div className={`w-14 h-14 rounded-xl ${AVATAR_COLORS[i % AVATAR_COLORS.length]} flex items-center justify-center text-xl font-bold text-white group-hover:scale-105 transition-transform`}>
                {getInitials(player.name)}
              </div>
              <p className="text-sm font-semibold text-slate-800 leading-tight">{player.name}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
