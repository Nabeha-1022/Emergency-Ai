import { createContext, useContext, useState, useEffect } from 'react'
import { login as apiLogin } from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [operator, setOperator] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    const savedOperator = localStorage.getItem('operator')
    if (token && savedOperator) {
      try {
        setOperator(JSON.parse(savedOperator))
      } catch {
        localStorage.removeItem('token')
        localStorage.removeItem('operator')
      }
    }
    setLoading(false)
  }, [])

  const login = async (email, password) => {
    const { data } = await apiLogin(email, password)
    localStorage.setItem('token', data.access_token)
    const operatorInfo = {
      name: data.operator_name,
      email: data.operator_email,
    }
    localStorage.setItem('operator', JSON.stringify(operatorInfo))
    setOperator(operatorInfo)
    return operatorInfo
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('operator')
    setOperator(null)
  }

  return (
    <AuthContext.Provider value={{ operator, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
