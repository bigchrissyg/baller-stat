import { Link, NavLink } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

export default function Header() {
  const { user, signOut } = useAuth()

  return (
    <header className="bg-hornets-primary shadow-header border-b border-white/[0.08] relative">
      {/* accent glow line */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-neutral-accent/40 to-transparent" />

      <div className="flex items-center justify-between px-7 h-[60px]">

        {/* Logo + team */}
        <Link to="/" className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-[10px] bg-neutral-accent/20 border border-neutral-accent/35 flex items-center justify-center">
            ⚽
          </div>
          <div>
            <p className="text-sm font-semibold text-white/90 tracking-tight">Histon Hornets Blue</p>
            <p className="text-[11px] text-white/45 tracking-wide">U12 · 2025/26 Season</p>
          </div>
        </Link>

        <div className="flex items-center">
          {/* Nav */}
          <nav className="flex items-center gap-1">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                isActive
                  ? 'bg-neutral-accent text-white text-[13px] font-semibold px-[18px] py-[7px] rounded-md tracking-tight shadow-[0_0_0_1px_rgba(14,165,233,0.5),0_2px_8px_rgba(14,165,233,0.35),inset_0_1px_0_rgba(255,255,255,0.2)]'
                  : 'text-white/55 text-[13px] font-medium px-[14px] py-[7px] rounded-md tracking-tight border border-transparent hover:text-white/90 hover:bg-white/[0.07] hover:border-white/10 transition-all duration-150'
              }
            >
              Dashboard
            </NavLink>
            <NavLink
              to="/players"
              className={({ isActive }) =>
                isActive
                  ? 'bg-neutral-accent text-white text-[13px] font-semibold px-[18px] py-[7px] rounded-md tracking-tight shadow-[0_0_0_1px_rgba(14,165,233,0.5),0_2px_8px_rgba(14,165,233,0.35),inset_0_1px_0_rgba(255,255,255,0.2)]'
                  : 'text-white/55 text-[13px] font-medium px-[14px] py-[7px] rounded-md tracking-tight border border-transparent hover:text-white/90 hover:bg-white/[0.07] hover:border-white/10 transition-all duration-150'
              }
            >
              Players
            </NavLink>
          </nav>

          {/* Divider */}
          <div className="w-px h-5 bg-white/10 mx-3" />

          {/* User */}
          <div className="flex items-center gap-2">
            <span className="text-[12px] text-white/40 tracking-wide">
              {user?.email}
            </span>
            <div className="w-px h-5 bg-white/10 mx-1" />
            <button
              onClick={signOut}
              className="
                text-[12px] text-white/45 font-medium tracking-wide
                border border-white/12 px-3 py-[5px] rounded-md
                hover:bg-white/[0.06] hover:text-white/70
                transition-all duration-150
              "
            >
              Sign out
            </button>
          </div>
        </div>

      </div>
    </header>
  )
}
