export default function StatCard({ label, value, sub, accent = 'accent', icon }) {
  let valueClass = 'text-neutral-fg'
  if (label === 'Goal Diff') {
    const numValue = parseFloat(value)
    if (numValue > 0) valueClass = 'text-stat-positive'
    else if (numValue < 0) valueClass = 'text-stat-negative'
  } else if (['Goals For', 'Goals Scored', 'Clean Sheets', 'Clean Quarters', 'Goals', 'Assists', 'Star Awards'].includes(label)) {
    valueClass = 'text-stat-positive'
  } else if (['Goals Against', 'Goals Conceded'].includes(label)) {
    valueClass = 'text-stat-negative'
  }

  return (
    <div className="bg-white shadow-card rounded-md p-3 sm:p-5 hover:shadow-card-hover transition-shadow">
      <div className="flex items-center justify-between mb-1.5 sm:mb-3">
        <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-widest text-neutral-muted leading-tight">{label}</p>
        {icon && <span className="text-base sm:text-lg">{icon}</span>}
      </div>
      <p className={`text-2xl sm:text-3xl font-bold font-mono leading-none ${valueClass}`}>{value}</p>
      {sub && <p className="text-[10px] sm:text-xs text-neutral-muted mt-1 sm:mt-2">{sub}</p>}
    </div>
  )
}
