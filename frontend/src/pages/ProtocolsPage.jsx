import { useState, useEffect } from 'react'
import { BookOpen, Search, FileText } from 'lucide-react'
import Header from '../components/Header'
import { getProtocols } from '../services/api'
import { INTENT_EMOJIS } from '../utils/helpers'

export default function ProtocolsPage() {
  const [protocols, setProtocols] = useState({})
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedCat, setSelectedCat] = useState(null)

  useEffect(() => {
    const fetchProtos = async () => {
      try {
        const { data } = await getProtocols()
        setProtocols(data.protocols)
        setCategories(data.categories)
        if (data.categories.length > 0) setSelectedCat(data.categories[0])
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchProtos()
  }, [])

  const filteredCats = categories.filter(c => c.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <Header title="Emergency Protocols" subtitle="Knowledge base and standard operating procedures" />
      
      <div className="flex-1 overflow-hidden flex flex-col lg:flex-row p-6 gap-6">
        {/* Sidebar categories */}
        <div className="w-full lg:w-80 flex flex-col gap-4">
          <div className="card flex-none">
            <div className="relative">
              <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search protocols..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="input-field py-2.5 pl-9 bg-emergency-dark border-transparent focus:border-emergency-blue"
              />
            </div>
          </div>
          
          <div className="card flex-1 overflow-y-auto p-3">
            <div className="space-y-1">
              {loading ? (
                <div className="text-gray-500 text-sm p-4 text-center">Loading...</div>
              ) : filteredCats.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCat(cat)}
                  className={`w-full text-left px-4 py-3 rounded-xl transition-all flex items-center gap-3 text-sm font-medium ${
                    selectedCat === cat 
                      ? 'bg-emergency-blue text-white shadow-lg shadow-blue-500/20' 
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <span className="text-lg">{INTENT_EMOJIS[cat] || '📄'}</span>
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Protocol Details */}
        <div className="flex-1 card overflow-y-auto">
          {selectedCat && protocols[selectedCat] ? (
            <div className="max-w-3xl">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-emergency-blue/10 flex items-center justify-center text-xl">
                  {INTENT_EMOJIS[selectedCat] || '📄'}
                </div>
                <h2 className="text-2xl font-bold text-white">{selectedCat} Protocol</h2>
              </div>
              <p className="text-gray-400 mb-8">{protocols[selectedCat].description}</p>
              
              <div className="space-y-8">
                {['HIGH', 'MEDIUM', 'LOW'].map(severity => {
                  const steps = protocols[selectedCat].steps[severity]
                  const svcs = protocols[selectedCat].recommended_services[severity]
                  if (!steps) return null
                  
                  return (
                    <div key={severity} className="bg-emergency-dark rounded-xl border border-emergency-border overflow-hidden">
                      <div className={`px-5 py-3 border-b border-emergency-border font-bold text-sm ${
                        severity === 'HIGH' ? 'bg-red-500/10 text-red-400' :
                        severity === 'MEDIUM' ? 'bg-orange-500/10 text-orange-400' :
                        'bg-green-500/10 text-green-400'
                      }`}>
                        {severity} SEVERITY
                      </div>
                      
                      <div className="p-5">
                        <div className="mb-4">
                          <p className="text-xs text-gray-500 uppercase tracking-wider mb-2 font-semibold">Recommended Services</p>
                          <div className="flex gap-2">
                            {svcs?.map(s => (
                              <span key={s} className="px-2 py-1 rounded bg-emergency-navy border border-emergency-border text-gray-300 text-xs font-medium">
                                {s}
                              </span>
                            ))}
                          </div>
                        </div>
                        
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wider mb-3 font-semibold">Response Steps</p>
                          <ol className="space-y-3">
                            {steps.map((step, i) => (
                              <li key={i} className="flex gap-3 text-sm text-gray-300">
                                <span className="w-5 h-5 rounded-full bg-emergency-blue/20 text-emergency-blue flex flex-none items-center justify-center text-xs font-bold mt-0.5">
                                  {i + 1}
                                </span>
                                <span className="leading-relaxed">{step}</span>
                              </li>
                            ))}
                          </ol>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-gray-500">
              <FileText className="w-12 h-12 mb-4 opacity-20" />
              <p>Select a protocol to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
