import axios from 'axios'

// In production (Render), VITE_API_URL is set at build time.
// The fallback chain: env var → deployed backend → localhost for local dev.
const RENDER_BACKEND = 'https://heartguard-backend.onrender.com'

const BASE_URL =
  import.meta.env.VITE_API_URL ||
  (window.location.hostname !== 'localhost' ? RENDER_BACKEND : 'http://localhost:8000')

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 60000,
  headers: { 'Content-Type': 'application/json' },
})

export async function predictHeartDisease(patientData) {
  const response = await api.post('/predict', patientData)
  return response.data
}

export async function getHealth() {
  const response = await api.get('/health')
  return response.data
}

export async function getMetrics() {
  const response = await api.get('/metrics')
  return response.data
}

export async function getHistory() {
  const response = await api.get('/history')
  return response.data
}

export async function getHistoryEntry(id) {
  const response = await api.get(`/history/${id}`)
  return response.data
}

export async function deleteHistoryEntry(id) {
  const response = await api.delete(`/history/${id}`)
  return response.data
}

export async function clearAllHistory() {
  const response = await api.delete('/history', { params: { confirm: true } })
  return response.data
}

export default api
