import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import api from '../lib/api'

interface Admin {
  id: string
  fullName: string
  email: string
  isSuperAdmin: boolean
}

interface AuthContextType {
  admin: Admin | null
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [admin, setAdmin] = useState<Admin | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('admin_token')
    if (token) {
      fetchProfile()
    } else {
      setLoading(false)
    }
  }, [])

  const fetchProfile = async () => {
    try {
      const res = await api.get('/api/admin/auth/me')
      setAdmin(res.data.admin)
    } catch {
      localStorage.removeItem('admin_token')
    } finally {
      setLoading(false)
    }
  }

  const login = async (email: string, password: string) => {
    const res = await api.post('/api/admin/auth/login', { email, password })
    localStorage.setItem('admin_token', res.data.token)
    setAdmin(res.data.admin)
  }

  const logout = () => {
    localStorage.removeItem('admin_token')
    setAdmin(null)
    window.location.href = '/login'
  }

  return (
    <AuthContext.Provider value={{ admin, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}