const ACCENTS = {
  primary:  { value: 'text-hornets-primary', bg: 'bg-hornets-primary/10' },
  secondary: { value: 'text-hornets-secondary', bg: 'bg-hornets-secondary/10' },
  tertiary: { value: 'text-hornets-tertiary', bg: 'bg-hornets-tertiary/10' },
  quaternary: { value: 'text-hornets-quaternary', bg: 'bg-hornets-quaternary/10' },
  quinary: { value: 'text-hornets-quinary', bg: 'bg-hornets-quinary/10' },
  accent:   { value: 'text-neutral-accent', bg: 'bg-neutral-accent/10' },
}

export default function StatCard({ label, value, sub, accent = 'accent', icon }) {
  const { value: valueClass } = ACCENTS[accent] || ACCENTS.accent

  return (
    <div className="bg-neutral-card rounded-xl border border-neutral-border shadow-sm p-5 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-neutral-muted">{label}</p>
        {icon && <span className="text-lg">{icon}</span>}
      </div>
      <p className={`text-3xl font-bold leading-none ${valueClass}`}>{value}</p>
      {sub && <p className="text-xs text-neutral-muted mt-2">{sub}</p>}
    </div>
  )
}
