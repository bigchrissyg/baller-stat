const ACCENTS = {
  emerald: { value: 'text-emerald-600', bg: 'bg-emerald-50' },
  rose:    { value: 'text-rose-600',    bg: 'bg-rose-50' },
  amber:   { value: 'text-amber-600',   bg: 'bg-amber-50' },
  blue:    { value: 'text-blue-600',    bg: 'bg-blue-50' },
  indigo:  { value: 'text-indigo-600',  bg: 'bg-indigo-50' },
  violet:  { value: 'text-violet-600',  bg: 'bg-violet-50' },
  slate:   { value: 'text-slate-700',   bg: 'bg-slate-50' },
}

export default function StatCard({ label, value, sub, accent = 'indigo', icon }) {
  const { value: valueClass } = ACCENTS[accent] || ACCENTS.indigo

  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</p>
        {icon && <span className="text-lg">{icon}</span>}
      </div>
      <p className={`text-3xl font-bold leading-none ${valueClass}`}>{value}</p>
      {sub && <p className="text-xs text-slate-400 mt-2">{sub}</p>}
    </div>
  )
}
