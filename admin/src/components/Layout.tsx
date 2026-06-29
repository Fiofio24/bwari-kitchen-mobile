import { ReactNode, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { BarChart3 } from 'lucide-react'
import { Star as StarIcon } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import {
  LayoutDashboard,
  Receipt,
  UtensilsCrossed,
  Bike,
  Users,
  Tag,
  Settings,
  Menu as MenuIcon,
  X,
  LogOut,
} from 'lucide-react'

const navItems = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { label: 'Analytics', path: '/analytics', icon: BarChart3 },
  { label: 'Orders', path: '/orders', icon: Receipt },
  { label: 'Menu', path: '/menu', icon: UtensilsCrossed },
  { label: 'Riders', path: '/riders', icon: Bike },
  { label: 'Customers', path: '/customers', icon: Users },
  { label: 'Promotions', path: '/promotions', icon: Tag },
  { label: 'Reviews', path: '/reviews', icon: StarIcon },
  { label: 'Settings', path: '/settings', icon: Settings },
]

export default function Layout({ children }: { children: ReactNode }) {
  const { admin, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const currentPage = navItems.find((item) => item.path === location.pathname)

  const handleNavigate = (path: string) => {
    navigate(path)
    setSidebarOpen(false)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Overlay when menu open */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Slide-in drawer menu */}
      <aside
        className={`fixed top-0 left-0 z-50 w-64 bg-white border-r border-gray-100 flex flex-col h-screen transition-transform duration-200 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h1 className="font-bold text-lg">Bwari Kitchen</h1>
            <p className="text-xs text-gray-400">Admin Dashboard</p>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path
            return (
              <button
                key={item.path}
                onClick={() => handleNavigate(item.path)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                  isActive
                    ? 'bg-brand-50 text-brand-700'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Icon size={18} />
                {item.label}
              </button>
            )
          })}
        </nav>

        <div className="p-4 border-t border-gray-100">
          <div className="text-sm font-medium truncate">{admin?.fullName}</div>
          <div className="text-xs text-gray-400 mb-3 truncate">{admin?.email}</div>
          <button
            onClick={logout}
            className="flex items-center gap-2 text-sm text-red-500 hover:text-red-700"
          >
            <LogOut size={15} />
            Logout
          </button>
        </div>
      </aside>

      {/* Top bar */}
      <header className="bg-white border-b border-gray-100 px-4 lg:px-8 py-3 flex items-center gap-3 sticky top-0 z-30">
        <button
          onClick={() => setSidebarOpen(true)}
          className="text-gray-600 hover:text-gray-900"
        >
          <MenuIcon size={22} />
        </button>
        {currentPage && (
          <span className="font-medium text-gray-800">{currentPage.label}</span>
        )}
      </header>

      <main className="p-4 lg:p-8 overflow-x-hidden min-w-0">
        {children}
      </main>
    </div>
  )
}