import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Phone, AlertTriangle, CheckCircle, Activity, ArrowRight, Siren } from 'lucide-react'
import { getAnalytics, getCalls } from '../services/api'
import { SeverityBadge, StatusBadge, ActionBadge, IntentBadge } from '../components/Badges'
import { formatDateTime, INTENT_COLORS, getSeverityColor } from '../utils/helpers'
import Header from '../components/Header'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts'

export default function DashboardPage() {
  const [analytics, setAnalytics] = useState(null)
  const [recentCalls, setRecentCalls] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [analyticsRes, callsRes] = await Promise.all([
          getAnalytics(),
          getCalls({ limit: 5 }),
        ])
        setAnalytics(analyticsRes.data)
        setRecentCalls(callsRes.data.calls || [])
      } catch (err) {
        console.error('Failed to load dashboard data:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [])

  const intentChartData = analytics
    ? Object.entries(analytics.intent_breakdown || {}).map(([name, value]) => ({ name, value }))
    : []

  const severityPieData = analytics
    ? [
        { name: 'High', value: analytics.severity_breakdown?.HIGH || 0, color: '#ef233c' },
        { name: 'Medium', value: analytics.severity_breakdown?.MEDIUM || 0, color: '#f77f00' },
        { name: 'Low', value: analytics.severity_breakdown?.LOW || 0, color: '#2d9c6c' },
      ]
    : []

  const stats = [
    {
      label: 'Total Calls',
      value: analytics?.total_calls ?? '—',
      icon: Phone,
      color: 'text-emergency-blue',
      bg: 'bg-emergency-blue/10',
      border: 'border-t-emergency-blue',
    },
    {
      label: 'Active Calls',
      value: analytics?.active_calls ?? '—',
      icon: Activity,
      color: 'text-yellow-400',
      bg: 'bg-yellow-500/10',
      border: 'border-t-yellow-500',
    },
    {
      label: 'High Severity',
      value: analytics?.high_severity ?? '—',
      icon: AlertTriangle,
      color: 'text-emergency-red',
      bg: 'bg-emergency-red/10',
      border: 'border-t-emergency-red',
    },
    {
      label: 'Resolved',
      value: analytics?.resolved_calls ?? '—',
      icon: CheckCircle,
      color: 'text-emergency-green',
      bg: 'bg-emergency-green/10',
      border: 'border-t-emergency-green',
    },
  ]

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <Header title="Dashboard" subtitle="Emergency Operations Overview" />
      <div className="flex-1 overflow-y-auto p-6 space-y-6">

        {/* Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map(({ label, value, icon: Icon, color, bg, border }) => (
            <div key={label} className={`stat-card border-t-2 ${border}`}>
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">{label}</p>
                <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center`}>
                  <Icon className={`w-4 h-4 ${color}`} />
                </div>
              </div>
              <p className={`text-3xl font-black ${color}`}>
                {loading ? <span className="animate-pulse text-gray-600">···</span> : value}
              </p>
            </div>
          ))}
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Bar chart - intents */}
          <div className="card col-span-2">
            <h3 className="font-semibold text-white text-sm mb-4 flex items-center gap-2">
              <Siren className="w-4 h-4 text-emergency-blue" />
              Calls by Emergency Type
            </h3>
            {loading ? (
              <div className="h-40 flex items-center justify-center text-gray-600 text-sm">Loading...</div>
            ) : intentChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={intentChartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#6b7280' }} />
                  <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} />
                  <Tooltip
                    contentStyle={{ background: '#1a2236', border: '1px solid #2a3655', borderRadius: 8 }}
                    labelStyle={{ color: '#fff' }}
                    itemStyle={{ color: '#4361ee' }}
                  />
                  <Bar dataKey="value" fill="#4361ee" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-40 flex items-center justify-center text-gray-600 text-sm">No data yet</div>
            )}
          </div>

          {/* Pie chart - severity */}
          <div className="card">
            <h3 className="font-semibold text-white text-sm mb-4">Severity Distribution</h3>
            {loading ? (
              <div className="h-40 flex items-center justify-center text-gray-600 text-sm">Loading...</div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={120}>
                  <PieChart>
                    <Pie data={severityPieData} cx="50%" cy="50%" innerRadius={30} outerRadius={55} dataKey="value">
                      {severityPieData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ background: '#1a2236', border: '1px solid #2a3655', borderRadius: 8 }}
                      itemStyle={{ color: '#fff' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex justify-center gap-3 mt-2">
                  {severityPieData.map(d => (
                    <div key={d.name} className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full" style={{ background: d.color }} />
                      <span className="text-xs text-gray-400">{d.name}: {d.value}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Recent Calls */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white text-sm">Recent Calls</h3>
            <Link to="/call-history" className="text-xs text-emergency-blue hover:text-blue-400 flex items-center gap-1">
              View All <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-emergency-border">
                  <th className="table-header">Call ID</th>
                  <th className="table-header">Date & Time</th>
                  <th className="table-header">Intent</th>
                  <th className="table-header">Severity</th>
                  <th className="table-header">Location</th>
                  <th className="table-header">Status</th>
                  <th className="table-header">Decision</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} className="table-cell text-center text-gray-500">Loading...</td></tr>
                ) : recentCalls.length === 0 ? (
                  <tr><td colSpan={7} className="table-cell text-center text-gray-500">No calls yet</td></tr>
                ) : recentCalls.map(call => (
                  <tr key={call.call_id} className="table-row">
                    <td className="table-cell font-mono text-emergency-blue text-xs">{call.call_id}</td>
                    <td className="table-cell text-xs">{formatDateTime(call.timestamp)}</td>
                    <td className="table-cell"><IntentBadge intent={call.intent} /></td>
                    <td className="table-cell"><SeverityBadge severity={call.severity} /></td>
                    <td className="table-cell text-gray-400">{call.entities?.location || '—'}</td>
                    <td className="table-cell"><StatusBadge status={call.status} /></td>
                    <td className="table-cell"><ActionBadge action={call.operator_action} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  )
}
