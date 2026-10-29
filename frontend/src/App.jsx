import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Sidebar from './components/Sidebar'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import LiveCallPage from './pages/LiveCallPage'
import CallHistoryPage from './pages/CallHistoryPage'
import AnalyticsPage from './pages/AnalyticsPage'
import ProtocolsPage from './pages/ProtocolsPage'
import SettingsPage from './pages/SettingsPage'

function ProtectedRoute({ children }) {
  const { operator, loading } = useAuth()
  
  if (loading) return (
    <div className="min-h-screen bg-emergency-dark flex items-center justify-center text-white">
      Loading...
    </div>
  )
  
  if (!operator) return <Navigate to="/login" replace />
  
  return (
    <div className="flex h-screen overflow-hidden bg-emergency-dark">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {children}
      </main>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          
          <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/live-call" element={<ProtectedRoute><LiveCallPage /></ProtectedRoute>} />
          <Route path="/call-history" element={<ProtectedRoute><CallHistoryPage /></ProtectedRoute>} />
          <Route path="/analytics" element={<ProtectedRoute><AnalyticsPage /></ProtectedRoute>} />
          <Route path="/protocols" element={<ProtectedRoute><ProtocolsPage /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
          
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  )
}
