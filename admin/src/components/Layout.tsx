import { ReactNode, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { BarChart3, Star as StarIcon, History } from 'lucide-react'
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
  ChevronsLeft,
  ChevronsRight,
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
  { label: 'Activity Log', path: '/activity-log', icon: History },
]

export default function Layout({ children }: { children: ReactNode }) {
  const { admin, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)

  const currentPage = navItems.find((item) => item.path === location.pathname)

  const handleNavigate = (path: string) => {
    navigate(path)
    setMobileOpen(false)
  }

  const sidebarWidth = collapsed ? 76 : 260

  return (
    <div className="min-h-screen bg-surface-50">
      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-surface-900/40 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar — drawer on mobile, persistent collapsible on desktop */}
      <motion.aside
        initial={false}
        animate={{
          width: sidebarWidth,
          x: 0,
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className={`fixed top-0 left-0 z-50 h-screen flex flex-col
          bg-surface-900/80 backdrop-blur-xl border-r border-white/10
          text-white
          lg:translate-x-0
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
        style={{ width: sidebarWidth }}
      >
        <div className="p-5 border-b border-white/10 flex items-center justify-between overflow-hidden">
          <AnimatePresence mode="wait">
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.15 }}
                className="whitespace-nowrap"
              >
                <h1 className="font-bold text-lg bg-gradient-to-r from-primary-400 to-brand-400 bg-clip-text text-transparent">
                  Bwari Kitchen
                </h1>
                <p className="text-xs text-white/40">Admin Dashboard</p>
              </motion.div>
            )}
          </AnimatePresence>
          <button
            onClick={() => setMobileOpen(false)}
            className="text-white/50 hover:text-white lg:hidden"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto overflow-x-hidden">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path
            return (
              <button
                key={item.path}
                onClick={() => handleNavigate(item.path)}
                title={collapsed ? item.label : undefined}
                className={`relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors
                  ${isActive ? 'text-white' : 'text-white/60 hover:text-white hover:bg-white/5'}
                `}
              >
                {isActive && (
                  <motion.div
                    layoutId="active-nav-pill"
                    className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary-500/90 to-primary-600/90 shadow-lg shadow-primary-500/20"
                    transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                  />
                )}
                <Icon size={18} className="relative z-10 flex-shrink-0" />
                <AnimatePresence mode="wait">
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.1 }}
                      className="relative z-10 whitespace-nowrap"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>
            )
          })}
        </nav>

        {/* Collapse toggle — desktop only */}
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="hidden lg:flex items-center justify-center gap-2 mx-3 mb-2 py-2 rounded-xl text-white/40 hover:text-white hover:bg-white/5 transition-colors"
        >
          {collapsed ? <ChevronsRight size={16} /> : <ChevronsLeft size={16} />}
        </button>

        <div className="p-4 border-t border-white/10 overflow-hidden">
          <AnimatePresence mode="wait">
            {!collapsed ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <div className="text-sm font-medium truncate">{admin?.fullName}</div>
                <div className="text-xs text-white/40 mb-3 truncate">{admin?.email}</div>
                <button
                  onClick={logout}
                  className="flex items-center gap-2 text-sm text-red-400 hover:text-red-300 transition-colors"
                >
                  <LogOut size={15} />
                  Logout
                </button>
              </motion.div>
            ) : (
              <button
                onClick={logout}
                className="flex items-center justify-center w-full text-red-400 hover:text-red-300 transition-colors"
                title="Logout"
              >
                <LogOut size={18} />
              </button>
            )}
          </AnimatePresence>
        </div>
      </motion.aside>

      {/* Content area — offset by sidebar width on desktop */}
      <div
        className="lg:transition-all lg:duration-300"
        style={{ marginLeft: window.innerWidth >= 1024 ? sidebarWidth : 0 }}
      >
        {/* Top bar */}
        <header className="bg-white/70 backdrop-blur-xl border-b border-surface-200 px-4 lg:px-8 py-3.5 flex items-center gap-3 sticky top-0 z-30">
          <button
            onClick={() => setMobileOpen(true)}
            className="text-surface-600 hover:text-surface-900 lg:hidden"
          >
            <MenuIcon size={22} />
          </button>
          {currentPage && (
            <span className="font-semibold text-surface-800 text-lg">{currentPage.label}</span>
          )}
        </header>

        <main className="p-4 lg:p-8 overflow-x-hidden min-w-0">
          {children}
        </main>
      </div>
    </div>
  )
}