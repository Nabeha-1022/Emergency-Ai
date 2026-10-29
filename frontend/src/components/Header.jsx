import { useState, useEffect } from 'react'
import { Bell, Clock } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function Header({ title, subtitle }) {
  const { operator } = useAuth()
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const timeStr = time.toLocaleTimeString('en-IN', {
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true,
  })
  const dateStr = time.toLocaleDateString('en-IN', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
  })

  return (
    <header className="h-16 bg-emergency-navy border-b border-emergency-border flex items-center justify-between px-6 shrink-0">
      <div>
        <h2 className="font-bold text-white text-lg leading-tight">{title}</h2>
        {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-gray-400 text-sm">
          <Clock className="w-4 h-4" />
          <span className="font-mono text-xs">{timeStr}</span>
          <span className="text-gray-600">|</span>
          <span className="text-xs">{dateStr}</span>
        </div>
        <button className="relative p-2 hover:bg-white/5 rounded-lg transition-colors">
          <Bell className="w-4 h-4 text-gray-400" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-emergency-red rounded-full" />
        </button>
      </div>
    </header>
  )
}
