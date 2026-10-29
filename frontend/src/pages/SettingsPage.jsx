import Header from '../components/Header'
import { Settings as SettingsIcon, Database, Shield, Cpu } from 'lucide-react'

export default function SettingsPage() {
  return (
    <div className="flex-1 flex flex-col min-h-0">
      <Header title="Settings" subtitle="System configuration and preferences" />
      <div className="flex-1 overflow-y-auto p-6 max-w-4xl mx-auto w-full space-y-6">
        
        <div className="card">
          <div className="flex items-center gap-2 text-white font-bold mb-4">
            <Cpu className="w-5 h-5 text-emergency-blue" />
            <h2>AI Pipeline Settings</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-emergency-dark border border-emergency-border rounded-lg">
              <div>
                <p className="text-white font-medium text-sm">Speech-to-Text Engine</p>
                <p className="text-xs text-gray-500 mt-1">Currently using Whisper / Demo Fallback based on backend env vars.</p>
              </div>
              <span className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full text-xs font-bold border border-blue-500/30">Auto</span>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-emergency-dark border border-emergency-border rounded-lg">
              <div>
                <p className="text-white font-medium text-sm">Intent Classification</p>
                <p className="text-xs text-gray-500 mt-1">NLP keyword heuristics.</p>
              </div>
              <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-xs font-bold border border-green-500/30">Active</span>
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center gap-2 text-white font-bold mb-4">
            <Database className="w-5 h-5 text-emergency-blue" />
            <h2>Database Configuration</h2>
          </div>
          <p className="text-sm text-gray-400 mb-4">Database settings are controlled via backend environment variables.</p>
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 text-sm text-yellow-500 flex gap-3">
            <Shield className="w-5 h-5 shrink-0" />
            <p><strong>Note:</strong> System automatically falls back to local JSON storage (TinyDB) if MongoDB is unavailable.</p>
          </div>
        </div>

      </div>
    </div>
  )
}
