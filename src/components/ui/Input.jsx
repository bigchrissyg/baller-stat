const baseInput = 'w-full border border-neutral-border rounded-lg px-3 py-2 text-sm bg-white text-neutral-fg placeholder:text-neutral-muted focus:outline-none focus:ring-2 focus:ring-neutral-accent disabled:opacity-50 disabled:bg-neutral-bg'

const labelClass = 'block text-xs font-semibold uppercase tracking-wide text-neutral-muted mb-1'

export function Input({ label, error, hint, className = '', ...props }) {
  return (
    <div className="flex flex-col">
      {label && <label className={labelClass}>{label}</label>}
      <input className={`${baseInput} ${error ? 'border-hornets-secondary focus:ring-hornets-secondary/50' : ''} ${className}`} {...props} />
      {hint && !error && <p className="mt-1 text-xs text-neutral-muted">{hint}</p>}
      {error && <p className="mt-1 text-xs text-hornets-secondary">{error}</p>}
    </div>
  )
}

export function Select({ label, error, hint, children, className = '', ...props }) {
  return (
    <div className="flex flex-col">
      {label && <label className={labelClass}>{label}</label>}
      <select className={`${baseInput} ${error ? 'border-hornets-secondary focus:ring-hornets-secondary/50' : ''} ${className}`} {...props}>
        {children}
      </select>
      {hint && !error && <p className="mt-1 text-xs text-neutral-muted">{hint}</p>}
      {error && <p className="mt-1 text-xs text-hornets-secondary">{error}</p>}
    </div>
  )
}
