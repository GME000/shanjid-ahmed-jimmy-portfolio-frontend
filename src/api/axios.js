import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api'
export const api = axios.create({ baseURL: API_URL })
const visitorKey = 'devfolio-visitor-id'
let visitorId = localStorage.getItem(visitorKey)
if (!visitorId) { visitorId = crypto.randomUUID(); localStorage.setItem(visitorKey, visitorId) }
api.interceptors.request.use((config) => {
  const access = localStorage.getItem('access')
  if (access) config.headers.Authorization = `Bearer ${access}`
  config.headers['X-Visitor-Id'] = visitorId
  return config
})
let refreshing = false
let waiting = []
api.interceptors.response.use((response) => response, async (error) => {
  const original = error.config
  if (error.response?.status !== 401 || original?._retry || original?.url?.includes('/auth/')) return Promise.reject(error)
  original._retry = true
  if (!refreshing) {
    refreshing = true
    try {
      const { data } = await axios.post(`${API_URL}/auth/refresh/`, { refresh: localStorage.getItem('refresh') })
      localStorage.setItem('access', data.access); waiting.forEach((resolve) => resolve(data.access)); waiting = []; refreshing = false
      return api(original)
    } catch (refreshError) {
      localStorage.clear(); waiting.forEach((resolve) => resolve(null)); waiting = []; refreshing = false; window.location.href = '/login'; return Promise.reject(refreshError)
    }
  }
  return new Promise((resolve) => waiting.push((token) => { if (!token) return resolve(Promise.reject(error)); original.headers.Authorization = `Bearer ${token}`; resolve(api(original)) }))
})
