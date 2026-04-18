import { Link, NavLink } from 'react-router-dom'

export default function Header() {
  return (
    <header className="text-neutral-bg sticky top-0 z-50 shadow-lg border-b border-neutral-accent/20" style={{ backgroundColor: '#141413' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-8 h-8 bg-neutral-accent rounded-lg flex items-center justify-center text-base font-bold">
            ⚽
          </div>
          <div>
            <p className="font-bold text-sm leading-tight tracking-tight">Histon Hornets Blue</p>
            <p className="text-neutral-bg/70 text-xs">U12 · 2025/26 Season</p>
          </div>
        </Link>

        <nav className="flex items-center gap-1">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-neutral-accent text-neutral-bg'
                  : 'text-neutral-bg/70 hover:text-neutral-bg hover:bg-neutral-fg/80'
              }`
            }
          >
            Dashboard
          </NavLink>
          <NavLink
            to="/players"
            className={({ isActive }) =>
              `px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-neutral-accent text-neutral-bg'
                  : 'text-neutral-bg/70 hover:text-neutral-bg hover:bg-neutral-fg/80'
              }`
            }
          >
            Players
          </NavLink>
        </nav>
      </div>
    </header>
  )
}
