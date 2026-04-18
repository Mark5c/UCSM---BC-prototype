import { useWebSocket } from '../../context/WebSocketContext'

export function ConnectionBadge() {
  const { status, clientId } = useWebSocket()

  const config = {
    connected: { color: 'bg-emerald-400', pulse: true, label: 'Pripojené' },
    connecting: { color: 'bg-amber-400', pulse: true, label: 'Pripájam sa…' },
    disconnected: { color: 'bg-red-400', pulse: false, label: 'Odpojené' },
  }[status]

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200">
      <span className="relative flex h-2 w-2">
        {config.pulse && (
          <span
            className={`animate-ping absolute inline-flex h-full w-full rounded-full ${config.color} opacity-60`}
          />
        )}
        <span className={`relative inline-flex rounded-full h-2 w-2 ${config.color}`} />
      </span>
      <span className="text-xs text-slate-600 font-medium">{config.label}</span>
      {status === 'connected' && (
        <span className="text-2xs text-slate-400 font-mono">{clientId}</span>
      )}
    </div>
  )
}
