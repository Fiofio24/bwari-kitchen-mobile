import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { Toaster } from 'react-hot-toast'
import type { JSX } from 'react'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Analytics from './pages/Analytics'
import Orders from './pages/Orders'
import Menu from './pages/Menu'
import Riders from './pages/Riders'
import Customers from './pages/Customers'
import Promotions from './pages/Promotions'
import Reviews from './pages/Reviews'
import Settings from './pages/Settings'
import ActivityLog from './pages/ActivityLog'

function ProtectedRoute({ children }: { children: JSX.Element }) {
  const { admin, loading } = useAuth()

  if (loading) return <div className="p-8">Loading...</div>
  if (!admin) return <Navigate to="/login" />

  return children
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3500,
            style: {
              fontSize: '14px',
              borderRadius: '10px',
              padding: '10px 14px',
            },
            success: {
              iconTheme: { primary: '#16a34a', secondary: '#fff' },
            },
            error: {
              iconTheme: { primary: '#dc2626', secondary: '#fff' },
            },
          }}
        />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/dashboard"
            element={<ProtectedRoute><Dashboard /></ProtectedRoute>}
          />
          <Route
            path="/analytics"
            element={<ProtectedRoute><Analytics /></ProtectedRoute>}
          />
          <Route
            path="/orders"
            element={<ProtectedRoute><Orders /></ProtectedRoute>}
          />
          <Route
            path="/menu"
            element={<ProtectedRoute><Menu /></ProtectedRoute>}
          />
          <Route
            path="/riders"
            element={<ProtectedRoute><Riders /></ProtectedRoute>}
          />
          <Route
            path="/customers"
            element={<ProtectedRoute><Customers /></ProtectedRoute>}
          />
          <Route
            path="/promotions"
            element={<ProtectedRoute><Promotions /></ProtectedRoute>}
          />
          <Route
            path="/reviews"
            element={<ProtectedRoute><Reviews /></ProtectedRoute>}
          />
          <Route
            path="/settings"
            element={<ProtectedRoute><Settings /></ProtectedRoute>}
          />
          <Route
            path="/activity-log"
            element={<ProtectedRoute><ActivityLog /></ProtectedRoute>}
          />
          <Route path="/" element={<Navigate to="/dashboard" />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}