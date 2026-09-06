// admin/src/pages/Dashboard.tsx
import { Receipt, Wallet, Users, Bike, Clock, CheckCircle, XCircle } from 'lucide-react'
import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import StatCard from '../components/StatCard'
import api from '../lib/api'
import useLivePolling from '../hooks/useLivePolling'

interface Overview {
  orders: {
    total: number
    completed: number
    cancelled: number
    pending: number
    completionRate: number
  }
  revenue: {
    total: number
    average: number
    currency: string
  }
  customers: {
    total: number
    new: number
  }
  riders: {
    active: number
  }
}

const container = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.06 },
  },
}

export default function Dashboard() {
  const [overview, setOverview] = useState<Overview | null>(null)
  const [period, setPeriod] = useState('month')
  const [loading, setLoading] = useState(true)
  
  const navigate = useNavigate()

  const fetchOverview = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true)
    try {
      const res = await api.get(`/api/admin/analytics/overview?period=${period}`)
      setOverview(res.data.overview)
    } finally {
      if (!isSilent) setLoading(false)
    }
  }, [period])

  useEffect(() => {
    fetchOverview(false)
  }, [fetchOverview])

  useLivePolling(fetchOverview, 15000)

  const formatCurrency = (amount: number) => `₦${amount.toLocaleString()}`

  // Clean clickable style
  const clickableStyle = "cursor-pointer rounded-2xl"

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-surface-900">Dashboard Overview</h2>
          <p className="text-sm text-surface-400 mt-0.5">A snapshot of how Bwari Kitchen is doing</p>
        </div>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="border border-surface-200 rounded-xl px-3.5 py-2 text-sm text-surface-700 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 transition-shadow"
        >
          <option value="today">Today</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
          <option value="3months">Last 3 Months</option>
          <option value="year">This Year</option>
        </select>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-surface-100 p-5 h-[104px] animate-pulse">
              <div className="h-3 w-20 bg-surface-100 rounded mb-4" />
              <div className="h-6 w-24 bg-surface-100 rounded" />
            </div>
          ))}
        </div>
      ) : overview ? (
        <>
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8"
          >
            <div onClick={() => navigate('/orders', { state: { tab: 'active' } })} className={clickableStyle}>
              <StatCard
                label="Total Orders"
                value={overview.orders.total}
                subtext={`${overview.orders.completionRate}% completion rate`}
                icon={<Receipt size={18} />}
                accent="primary"
              />
            </div>
            
            {/* THE FIX: Added click routing to the Analytics page */}
            <div onClick={() => navigate('/analytics')} className={clickableStyle}>
              <StatCard
                label="Total Revenue"
                value={formatCurrency(overview.revenue.total)}
                subtext={`Avg ${formatCurrency(overview.revenue.average)} per order`}
                icon={<Wallet size={18} />}
                accent="success"
              />
            </div>

            <div onClick={() => navigate('/customers')} className={clickableStyle}>
              <StatCard
                label="Customers"
                value={overview.customers.total}
                subtext={`${overview.customers.new} new this period`}
                icon={<Users size={18} />}
                accent="primary"
              />
            </div>

            <div onClick={() => navigate('/riders')} className={clickableStyle}>
              <StatCard
                label="Active Riders"
                value={overview.riders.active}
                icon={<Bike size={18} />}
                accent="warning"
              />
            </div>
          </motion.div>

          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 md:grid-cols-3 gap-4"
          >
            <div onClick={() => navigate('/orders', { state: { tab: 'active', filter: 'pending' } })} className={clickableStyle}>
              <StatCard label="Pending Orders" value={overview.orders.pending} icon={<Clock size={18} />} accent="warning" />
            </div>

            <div onClick={() => navigate('/orders', { state: { tab: 'settled', filter: 'delivered' } })} className={clickableStyle}>
              <StatCard label="Completed Orders" value={overview.orders.completed} icon={<CheckCircle size={18} />} accent="success" />
            </div>

            <div onClick={() => navigate('/orders', { state: { tab: 'settled', filter: 'cancelled' } })} className={clickableStyle}>
              <StatCard label="Cancelled Orders" value={overview.orders.cancelled} icon={<XCircle size={18} />} accent="danger" />
            </div>
          </motion.div>
        </>
      ) : (
        <div className="text-danger">Failed to load dashboard data</div>
      )}
    </Layout>
  )
}