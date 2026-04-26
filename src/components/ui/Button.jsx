const variants = {
  primary:     'bg-neutral-accent text-white hover:bg-neutral-accent/90 shadow-btn',
  secondary:   'border border-neutral-border text-neutral-fg hover:bg-neutral-bg shadow-btn',
  ghost:       'text-neutral-secondary hover:text-neutral-fg hover:bg-neutral-bg',
  destructive: 'bg-hornets-secondary text-white hover:bg-hornets-secondary/90 shadow-btn',
  nav: {
    active:   'bg-neutral-accent text-white text-xs sm:text-[13px] font-semibold px-3 sm:px-[18px] py-[7px] rounded-md tracking-tight shadow-[0_0_0_1px_rgba(14,165,233,0.5),0_2px_8px_rgba(14,165,233,0.35),inset_0_1px_0_rgba(255,255,255,0.2)]',
    inactive: 'text-white/55 text-xs sm:text-[13px] font-medium px-3 sm:px-[14px] py-[7px] rounded-md tracking-tight border border-transparent hover:text-white/90 hover:bg-white/[0.07] hover:border-white/10 transition-all duration-150',
  },
}

const sizes = {
  sm: 'text-xs px-3 py-1.5',
  md: 'text-sm px-4 py-2',
  lg: 'text-sm px-5 py-2.5',
}

export default function Button({ children, variant = 'primary', size = 'md', className = '', ...props }) {
  const base = 'inline-flex items-center justify-center gap-1.5 font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:pointer-events-none'
  return (
    <button className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} {...props}>
      {children}
    </button>
  )
}
