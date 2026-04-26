const variants = {
  // Match type
  league:   'bg-badge-league-bg text-badge-league-fg',
  cup:      'bg-badge-cup-bg text-badge-cup-fg',
  friendly: 'bg-badge-friendly-bg text-badge-friendly-fg',
  // Venue
  home:     'bg-badge-home-bg text-badge-home-fg',
  away:     'bg-badge-away-bg text-badge-away-fg',
  // Result
  win:      'bg-result-win text-white',
  loss:     'bg-result-loss text-white',
  draw:     'bg-result-draw text-white',
  // Position
  gk:       'bg-purple-600 text-white',
  def:      'bg-red-600 text-white',
  mid:      'bg-yellow-400 text-yellow-900',
  atk:      'bg-green-600 text-white',
  // Generic
  default:  'bg-neutral-bg text-neutral-secondary',
  accent:   'bg-neutral-accent text-white',
}

export default function Badge({ children, variant = 'default', className = '' }) {
  return (
    <span className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full ${variants[variant] ?? variants.default} ${className}`}>
      {children}
    </span>
  )
}
