import { ReactNode } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const navItems = [
  { label: 'Dashboard', path: '/dashboard', icon: '📊' },
  { label: 'Orders', path: '/orders', icon: '🧾' },
  { label: 'Menu', path: '/menu', icon: '🍽️' },
  { label: 'Riders', path: '/riders', icon: '🛵' },
  { label: 'Customers', path: '/customers', icon: '👥' },
  { label: 'Promotions', path: '/promotions', icon: '🏷️' },
  { label: 'Settings', path: '/settings', icon: '⚙️' },
]

export default function Layout({ children }: { children: ReactNode }) {
  const { admin, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className="w-64 bg-white border-r border-gray-100 flex flex-col">
        <div className="p-6 border-b border-gray-100">
          <h1 className="font-bold text-lg">Bwari Kitchen</h1>
          <p className="text-xs text-gray-400">Admin Dashboard</p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                location.pathname === item.path
                  ? 'bg-brand-50 text-brand-700'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <span>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-100">
          <div className="text-sm font-medium">{admin?.fullName}</div>
          <div className="text-xs text-gray-400 mb-3">{admin?.email}</div>
          <button
            onClick={logout}
            className="text-sm text-red-500 hover:text-red-700"
          >
            Logout
          </button>
        </div>
      </aside>

      <main className="flex-1 p-8 overflow-y-auto">{children}</main>
    </div>
  )
}