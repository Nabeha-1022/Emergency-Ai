import { getSeverityClass, getStatusClass, getActionClass } from '../utils/helpers'

export function SeverityBadge({ severity }) {
  return <span className={getSeverityClass(severity)}>{severity || '—'}</span>
}

export function StatusBadge({ status }) {
  return <span className={getStatusClass(status)}>{status || '—'}</span>
}

export function ActionBadge({ action }) {
  if (!action) return <span className="text-gray-500 text-xs">—</span>
  return <span className={getActionClass(action)}>{action}</span>
}

export function IntentBadge({ intent }) {
  return (
    <span className="bg-blue-500/10 text-blue-300 border border-blue-500/20 px-2 py-0.5 rounded-full text-xs font-medium">
      {intent || '—'}
    </span>
  )
}

export function ConfidenceBadge({ value }) {
  const pct = Math.round((value || 0) * 100)
  const color = pct >= 90 ? 'text-green-400' : pct >= 75 ? 'text-yellow-400' : 'text-orange-400'
  return <span className={`font-mono text-sm font-bold ${color}`}>{pct}%</span>
}
