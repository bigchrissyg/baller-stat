const COLORS = [
  'bg-violet-500', 'bg-cyan-500', 'bg-emerald-500', 'bg-amber-500',
  'bg-rose-500',   'bg-indigo-500', 'bg-orange-500', 'bg-teal-500',
  'bg-pink-500',   'bg-lime-600',
]

function hashColor(str) {
  let h = 0
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0
  return COLORS[Math.abs(h) % COLORS.length]
}

function getInitial(email) {
  return email ? email[0].toUpperCase() : '?'
}

const MAX_SHOWN = 5

export default function PresenceAvatars({ users }) {
  if (!users || users.length === 0) return null

  const shown = users.slice(0, MAX_SHOWN)
  const overflow = users.length - MAX_SHOWN

  return (
    <div className="flex items-center" aria-label="Viewers">
      {shown.map((u, i) => (
        <div
          key={u.userId}
          className="relative group"
          style={{ marginLeft: i === 0 ? 0 : '-6px', zIndex: shown.length - i }}
        >
          <div
            className={`
              w-7 h-7 rounded-full flex items-center justify-center
              text-[11px] font-bold text-white select-none
              border-2 border-hornets-primary
              transition-opacity duration-300
              ${hashColor(u.email)}
              ${u.isActive ? 'opacity-100' : 'opacity-30'}
            `}
          >
            {getInitial(u.email)}
          </div>

          {/* Active pulse ring */}
          {u.isActive && (
            <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 border border-hornets-primary" />
          )}

          {/* Tooltip */}
          <div className="absolute top-full right-0 mt-2 px-2 py-1 bg-gray-900 text-white text-[11px] rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-lg">
            <div className="absolute bottom-full right-2 border-4 border-transparent border-b-gray-900" />
            {u.email}
            {u.isSelf && <span className="text-white/50 ml-1">(you)</span>}
            {!u.isActive && <span className="text-white/50 ml-1">· away</span>}
          </div>
        </div>
      ))}

      {overflow > 0 && (
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white/60 bg-white/10 border-2 border-hornets-primary select-none"
          style={{ marginLeft: '-6px', zIndex: 0 }}
        >
          +{overflow}
        </div>
      )}
    </div>
  )
}
