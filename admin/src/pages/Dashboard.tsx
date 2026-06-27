import { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import StatCard from '../components/StatCard'
import api from '../lib/api'

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

export default function Dashboard() {
  const [overview, setOverview] = useState<Overview | null>(null)
  const [period, setPeriod] = useState('month')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchOverview()
  }, [period])

  const fetchOverview = async () => {
    setLoading(true)
    try {
      const res = await api.get(`/api/admin/analytics/overview?period=${period}`)
      setOverview(res.data.overview)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) =>
    `₦${amount.toLocaleString()}`

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Dashboard Overview</h2>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
        >
          <option value="today">Today</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
          <option value="3months">Last 3 Months</option>
          <option value="year">This Year</option>
        </select>
      </div>

      {loading ? (
        <div className="text-gray-400">Loading dashboard...</div>
      ) : overview ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <StatCard
              label="Total Orders"
              value={overview.orders.total}
              subtext={`${overview.orders.completionRate}% completion rate`}
              icon="🧾"
            />
            <StatCard
              label="Total Revenue"
              value={formatCurrency(overview.revenue.total)}
              subtext={`Avg ${formatCurrency(overview.revenue.average)} per order`}
              icon="💰"
            />
            <StatCard
              label="Customers"
              value={overview.customers.total}
              subtext={`${overview.customers.new} new this period`}
              icon="👥"
            />
            <StatCard
              label="Active Riders"
              value={overview.riders.active}
              icon="🛵"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard label="Pending Orders" value={overview.orders.pending} icon="⏳" />
            <StatCard label="Completed Orders" value={overview.orders.completed} icon="✅" />
            <StatCard label="Cancelled Orders" value={overview.orders.cancelled} icon="❌" />
          </div>
        </>
      ) : (
        <div className="text-red-500">Failed to load dashboard data</div>
      )}
    </Layout>
  )
}