export default function Spinner({ message = 'Loading...' }) {
  return (
    <div className="flex flex-col items-center justify-center h-64 gap-3">
      <div className="w-8 h-8 border-4 border-neutral-accent/30 border-t-neutral-accent rounded-full animate-spin" />
      <p className="text-sm text-neutral-muted">{message}</p>
    </div>
  )
}
