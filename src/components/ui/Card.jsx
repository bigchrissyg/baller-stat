export default function Card({ children, className = '', hover = false, padding = true, ...props }) {
  return (
    <div
      className={[
        'bg-neutral-surface rounded-md shadow-card',
        hover && 'hover:shadow-card-hover transition-shadow cursor-pointer',
        padding && 'p-3 sm:p-5',
        className,
      ].filter(Boolean).join(' ')}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardHeader({ children, className = '' }) {
  return (
    <div className={`px-6 py-4 border-b border-neutral-border ${className}`}>
      {children}
    </div>
  )
}

export function CardBody({ children, className = '' }) {
  return (
    <div className={`p-6 ${className}`}>
      {children}
    </div>
  )
}
