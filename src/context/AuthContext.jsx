import { createContext, useEffect, useState } from 'react'
import { api } from '../api/axios'
export const AuthContext = createContext(null)
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); const [loading, setLoading] = useState(true)
  useEffect(() => { if (!localStorage.getItem('access')) return setLoading(false); api.get('/auth/me/').then(({ data }) => setUser(data)).catch(() => localStorage.clear()).finally(() => setLoading(false)) }, [])
  const login = async (credentials) => { const { data } = await api.post('/auth/login/', credentials); localStorage.setItem('access', data.access); localStorage.setItem('refresh', data.refresh); setUser(data.user); return data }
  const logout = async () => { try { await api.post('/auth/logout/', { refresh: localStorage.getItem('refresh') }) } finally { localStorage.clear(); setUser(null) } }
  return <AuthContext.Provider value={{ user, isOwner: Boolean(user?.is_superuser ?? user), login, logout, loading }}>{children}</AuthContext.Provider>
}
