import { useState, useEffect } from 'react'
import { History, Search, Filter } from 'lucide-react'
import { getCalls } from '../services/api'
import Header from '../components/Header'
import { SeverityBadge, IntentBadge, StatusBadge, ActionBadge } from '../components/Badges'
import { formatDateTime } from '../utils/helpers'

export default function CallHistoryPage() {
  const [calls, setCalls] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [severityFilter, setSeverityFilter] = useState('')
  const [intentFilter, setIntentFilter] = useState('')

  useEffect(() => {
    fetchCalls()
  }, [severityFilter, intentFilter])

  const fetchCalls = async () => {
    setLoading(true)
    try {
      const { data } = await getCalls({
        limit: 100,
        search,
        severity: severityFilter,
        intent: intentFilter,
      })
      setCalls(data.calls || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <Header title="Call History" subtitle="View and search past emergency records" />
      <div className="flex-1 overflow-y-auto p-6">
        <div className="card h-full flex flex-col">
          
          {/* Controls */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-emergency-blue" />
              <h3 className="font-semibold text-white">Call Records</h3>
            </div>
            
            <div className="flex flex-wrap gap-3">
              <div className="relative">
                <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search calls..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && fetchCalls()}
                  className="input-field py-2 pl-9 w-64"
                />
              </div>
              <select 
                value={severityFilter} 
                onChange={e => setSeverityFilter(e.target.value)}
                className="input-field py-2 w-32"
              >
                <option value="">All Severity</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
              <select 
                value={intentFilter} 
                onChange={e => setIntentFilter(e.target.value)}
                className="input-field py-2 w-40"
              >
                <option value="">All Intents</option>
                <option value="Road Accident">Road Accident</option>
                <option value="Medical Emergency">Medical</option>
                <option value="Fire">Fire</option>
                <option value="Crime">Crime</option>
              </select>
              <button onClick={fetchCalls} className="btn-primary py-2 px-3">
                <Filter className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="flex-1 overflow-y-auto min-h-[400px]">
            <table className="w-full">
              <thead className="sticky top-0 bg-emergency-card z-10 shadow-sm">
                <tr className="border-b border-emergency-border">
                  <th className="table-header">Call ID</th>
                  <th className="table-header">Date & Time</th>
                  <th className="table-header">Intent</th>
                  <th className="table-header">Severity</th>
                  <th className="table-header">Location</th>
                  <th className="table-header">Status</th>
                  <th className="table-header">Decision</th>
                  <th className="table-header text-right">Details</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={8} className="table-cell text-center text-gray-500 py-10">Loading...</td></tr>
                ) : calls.length === 0 ? (
                  <tr><td colSpan={8} className="table-cell text-center text-gray-500 py-10">No calls found</td></tr>
                ) : calls.map(call => (
                  <tr key={call.call_id} className="table-row">
                    <td className="table-cell font-mono text-emergency-blue text-xs">{call.call_id}</td>
                    <td className="table-cell text-xs">{formatDateTime(call.timestamp)}</td>
                    <td className="table-cell"><IntentBadge intent={call.intent} /></td>
                    <td className="table-cell"><SeverityBadge severity={call.severity} /></td>
                    <td className="table-cell text-gray-400">{call.entities?.location || '—'}</td>
                    <td className="table-cell"><StatusBadge status={call.status} /></td>
                    <td className="table-cell"><ActionBadge action={call.operator_action} /></td>
                    <td className="table-cell text-right">
                      <button className="text-xs text-emergency-blue hover:text-blue-400 font-semibold transition-colors">
                        View
                      </button>
                    </td>
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
