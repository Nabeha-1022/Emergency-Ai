import axios from 'axios'

const API = axios.create({
  baseURL: '/api',
  timeout: 30000,
})

// Attach JWT token to all requests
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Handle 401 globally
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('operator')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// ─── Auth ─────────────────────────────────────
export const login = (email, password) =>
  API.post('/auth/login', { email, password })

// ─── Calls ────────────────────────────────────
export const getCalls = (params = {}) =>
  API.get('/calls', { params })

export const getCall = (id) =>
  API.get(`/calls/${id}`)

// ─── Analysis ─────────────────────────────────
export const analyzeCall = (transcript, save = true) =>
  API.post('/analyze-call', { transcript, save })

export const transcribeAudio = (file) => {
  const formData = new FormData()
  formData.append('file', file)
  return API.post('/transcribe', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 60000,
  })
}

export const retrieveProtocol = (intent, severity) =>
  API.post('/retrieve-protocol', { intent, severity })

// ─── Operator Decision ────────────────────────
export const submitOperatorDecision = (data) =>
  API.post('/operator-decision', data)

// ─── Analytics ────────────────────────────────
export const getAnalytics = () =>
  API.get('/analytics')

// ─── Protocols ────────────────────────────────
export const getProtocols = () =>
  API.get('/protocols')

export default API
