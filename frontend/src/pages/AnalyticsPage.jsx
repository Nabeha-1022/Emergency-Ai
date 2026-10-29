import { useState, useEffect } from 'react'
import { BarChart3 } from 'lucide-react'
import Header from '../components/Header'
import { getAnalytics } from '../services/api'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts'

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const { data } = await getAnalytics()
        setAnalytics(data)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchAnalytics()
  }, [])

  if (loading || !analytics) {
    return (
      <div className="flex-1 flex flex-col min-h-0">
        <Header title="Analytics" />
        <div className="flex-1 flex items-center justify-center text-gray-500">Loading analytics...</div>
      </div>
    )
  }

  const intentData = Object.entries(analytics.intent_breakdown || {}).map(([name, value]) => ({ name, value }))
  
  const actionData = [
    { name: 'Accept', value: analytics.action_breakdown?.ACCEPT || 0, color: '#2d9c6c' },
    { name: 'Modify', value: analytics.action_breakdown?.MODIFY || 0, color: '#4361ee' },
    { name: 'Reject', value: analytics.action_breakdown?.REJECT || 0, color: '#ef233c' },
  ]

  const customTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-emergency-card border border-emergency-border p-3 rounded-lg shadow-xl">
          <p className="text-white font-semibold text-sm mb-1">{label || payload[0].name}</p>
          <p className="text-emergency-blue text-sm">Count: {payload[0].value}</p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <Header title="Analytics & Reports" subtitle="System usage and performance metrics" />
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        
        {/* Top KPI row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="card bg-gradient-to-br from-emergency-blue/20 to-transparent border-emergency-blue/30">
            <p className="text-xs text-blue-300 font-semibold uppercase tracking-wider mb-1">Total Calls Analyzed</p>
            <p className="text-3xl font-black text-white">{analytics.total_calls}</p>
          </div>
          <div className="card bg-gradient-to-br from-green-500/20 to-transparent border-green-500/30">
            <p className="text-xs text-green-300 font-semibold uppercase tracking-wider mb-1">AI Acceptance Rate</p>
            <p className="text-3xl font-black text-white">
              {analytics.total_calls > 0 ? Math.round((analytics.action_breakdown?.ACCEPT || 0) / analytics.total_calls * 100) : 0}%
            </p>
          </div>
          <div className="card bg-gradient-to-br from-red-500/20 to-transparent border-red-500/30">
            <p className="text-xs text-red-300 font-semibold uppercase tracking-wider mb-1">High Severity Incidents</p>
            <p className="text-3xl font-black text-white">{analytics.high_severity}</p>
          </div>
          <div className="card bg-gradient-to-br from-purple-500/20 to-transparent border-purple-500/30">
            <p className="text-xs text-purple-300 font-semibold uppercase tracking-wider mb-1">Database Mode</p>
            <p className="text-xl font-bold text-white uppercase mt-1">{analytics.db_mode}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Intent Distribution Chart */}
          <div className="card">
            <h3 className="font-semibold text-white mb-6">Emergency Types Distribution</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={intentData} layout="vertical" margin={{ top: 0, right: 30, left: 40, bottom: 0 }}>
                  <XAxis type="number" tick={{ fill: '#6b7280' }} />
                  <YAxis dataKey="name" type="category" tick={{ fill: '#9ca3af', fontSize: 12 }} width={120} />
                  <Tooltip content={customTooltip} />
                  <Bar dataKey="value" fill="#4361ee" radius={[0, 4, 4, 0]} barSize={24} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Operator Action Chart */}
          <div className="card">
            <h3 className="font-semibold text-white mb-6">Human-in-the-Loop Actions</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={actionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {actionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={customTooltip} />
                  <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '12px', color: '#9ca3af' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
