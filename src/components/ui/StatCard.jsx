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
    <div className="bg-white shadow-card rounded-md p-5 hover:shadow-card-hover transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold uppercase tracking-widest text-neutral-muted">{label}</p>
        {icon && <span className="text-lg">{icon}</span>}
      </div>
      <p className={`text-3xl font-bold font-mono leading-none ${valueClass}`}>{value}</p>
      {sub && <p className="text-xs text-neutral-muted mt-2">{sub}</p>}
    </div>
  )
}
