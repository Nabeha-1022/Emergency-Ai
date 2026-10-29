// Severity helpers
export const getSeverityClass = (severity) => {
  switch (severity?.toUpperCase()) {
    case 'HIGH': return 'severity-high'
    case 'MEDIUM': return 'severity-medium'
    case 'LOW': return 'severity-low'
    default: return 'severity-low'
  }
}

export const getSeverityColor = (severity) => {
  switch (severity?.toUpperCase()) {
    case 'HIGH': return '#ef233c'
    case 'MEDIUM': return '#f77f00'
    case 'LOW': return '#2d9c6c'
    default: return '#6b7280'
  }
}

export const getStatusClass = (status) => {
  switch (status?.toUpperCase()) {
    case 'PENDING': return 'status-pending'
    case 'RESOLVED': return 'status-resolved'
    case 'ESCALATED': return 'status-escalated'
    default: return 'status-pending'
  }
}

export const getActionClass = (action) => {
  switch (action?.toUpperCase()) {
    case 'ACCEPT': return 'action-accept'
    case 'MODIFY': return 'action-modify'
    case 'REJECT': return 'action-reject'
    default: return ''
  }
}

// Intent icons / colors
export const INTENT_COLORS = {
  'Road Accident': '#f77f00',
  'Medical Emergency': '#ef233c',
  'Fire': '#ff4500',
  'Crime': '#7b2ff7',
  'Missing Person': '#fcbf49',
  'Natural Disaster': '#00b4d8',
  'Other Emergency': '#6b7280',
}

export const INTENT_EMOJIS = {
  'Road Accident': '🚗',
  'Medical Emergency': '🏥',
  'Fire': '🔥',
  'Crime': '🚨',
  'Missing Person': '🔍',
  'Natural Disaster': '🌊',
  'Other Emergency': '⚠️',
}

// Date / time formatting
export const formatDate = (iso) => {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

export const formatTime = (iso) => {
  if (!iso) return '—'
  return new Date(iso).toLocaleTimeString('en-IN', {
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true,
  })
}

export const formatDateTime = (iso) => {
  if (!iso) return '—'
  return `${formatDate(iso)} ${formatTime(iso)}`
}

// Confidence badge color
export const getConfidenceColor = (conf) => {
  if (conf >= 0.9) return 'text-green-400'
  if (conf >= 0.75) return 'text-yellow-400'
  return 'text-orange-400'
}

export const pct = (val) => `${Math.round((val || 0) * 100)}%`
