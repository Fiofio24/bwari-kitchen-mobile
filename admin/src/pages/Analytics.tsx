import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import Layout from '../components/Layout'
import api from '../lib/api'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts'
import { Download, TrendingUp, Clock, Calendar, Users, Bike, CreditCard } from 'lucide-react'

interface RevenuePoint { date: string; revenue: number }
interface OrdersPoint { date: string; total: number; completed: number; cancelled: number }
interface TopItem { itemName: string; totalQuantity: number; totalRevenue: number }
interface PeakHour { hour: number; label: string; orders: number }
interface PeakDay { day: string; orders: number }
interface Retention {
  totalUniqueCustomers: number
  newCustomers: number
  returningCustomers: number
  retentionRate: number
}
interface RiderPerf {
  id: string
  fullName: string
  stats: { totalDeliveries: number; completedDeliveries: number; completionRate: number }
}
interface PaymentBreakdown { method: string; count: number; total: number }

const COLORS = ['#6366f1', '#f97316', '#22c55e', '#f59e0b', '#8b5cf6']

const PERIODS = [
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
  { value: '3months', label: 'Last 3 Months' },
  { value: 'year', label: 'This Year' },
]

const cardVariants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
}

function ChartCard({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="show"
      transition={{ duration: 0.3, delay }}
      className="bg-white rounded-2xl border border-surface-100 p-5 shadow-sm"
    >
      {children}
    </motion.div>
  )
}

function ExportButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 text-sm text-surface-500 hover:text-primary-600 transition-colors"
    >
      <Download size={14} /> Export CSV
    </button>
  )
}

export default function Analytics() {
  const [period, setPeriod] = useState('month')
  const [loading, setLoading] = useState(true)

  const [revenue, setRevenue] = useState<RevenuePoint[]>([])
  const [ordersOverTime, setOrdersOverTime] = useState<OrdersPoint[]>([])
  const [topItems, setTopItems] = useState<TopItem[]>([])
  const [peakHours, setPeakHours] = useState<PeakHour[]>([])
  const [peakDays, setPeakDays] = useState<PeakDay[]>([])
  const [retention, setRetention] = useState<Retention | null>(null)
  const [riderPerf, setRiderPerf] = useState<RiderPerf[]>([])
  const [paymentBreakdown, setPaymentBreakdown] = useState<PaymentBreakdown[]>([])

  useEffect(() => {
    fetchAll()
  }, [period])

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [
        revenueRes, ordersRes, topItemsRes, peakHoursRes,
        peakDaysRes, retentionRes, riderRes, paymentRes,
      ] = await Promise.all([
        api.get(`/api/admin/analytics/revenue?period=${period}`),
        api.get(`/api/admin/analytics/orders-over-time?period=${period}`),
        api.get(`/api/admin/analytics/top-items?period=${period}&limit=8`),
        api.get(`/api/admin/analytics/peak-hours?period=${period}`),
        api.get(`/api/admin/analytics/peak-days?period=${period}`),
        api.get(`/api/admin/analytics/customer-retention?period=${period}`),
        api.get(`/api/admin/analytics/rider-performance?period=${period}`),
        api.get(`/api/admin/analytics/payment-methods?period=${period}`),
      ])

      setRevenue(revenueRes.data.data)
      setOrdersOverTime(ordersRes.data.data)
      setTopItems(topItemsRes.data.topItems)
      setPeakHours(peakHoursRes.data.data)
      setPeakDays(peakDaysRes.data.data)
      setRetention(retentionRes.data.retention)
      setRiderPerf(riderRes.data.riders)
      setPaymentBreakdown(paymentRes.data.data)
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async (type: 'orders' | 'revenue' | 'top-items') => {
    const res = await api.get(`/api/admin/analytics/export/${type}?period=${period}`, {
      responseType: 'blob',
    })
    const url = window.URL.createObjectURL(new Blob([res.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `${type}-${period}.csv`)
    document.body.appendChild(link)
    link.click()
    link.remove()
  }

  const formatCurrency = (amount: number) => `₦${Number(amount).toLocaleString()}`
  const formatDateShort = (date: string) =>
    new Date(date).toLocaleDateString('en-NG', { month: 'short', day: 'numeric' })

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-surface-900">Analytics</h2>
          <p className="text-sm text-surface-400 mt-0.5">Deep dive into orders, revenue, and performance</p>
        </div>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="border border-surface-200 rounded-xl px-3.5 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 transition-shadow"
        >
          {PERIODS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="space-y-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-surface-100 p-5 h-64 animate-pulse">
              <div className="h-4 w-40 bg-surface-100 rounded mb-6" />
              <div className="h-40 bg-surface-50 rounded-xl" />
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-6">

          {/* Revenue Over Time */}
          <ChartCard>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center">
                  <TrendingUp size={16} className="text-primary-600" />
                </div>
                <h3 className="font-semibold text-surface-900">Revenue Over Time</h3>
              </div>
              <ExportButton onClick={() => handleExport('revenue')} />
            </div>
            <div className="overflow-x-auto">
              <div style={{ minWidth: 500, height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenue}>
                    <defs>
                      <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="date" tickFormatter={formatDateShort} fontSize={12} stroke="#94a3b8" axisLine={false} tickLine={false} />
                    <YAxis fontSize={12} tickFormatter={(v) => `₦${v / 1000}k`} stroke="#94a3b8" axisLine={false} tickLine={false} />
                    <Tooltip
                      formatter={(v: any) => formatCurrency(v)}
                      labelFormatter={(l: any) => formatDateShort(l)}
                      contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                    />
                    <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2.5} fill="url(#revenueGradient)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </ChartCard>

          {/* Orders Over Time */}
          <ChartCard delay={0.05}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center">
                  <Calendar size={16} className="text-primary-600" />
                </div>
                <h3 className="font-semibold text-surface-900">Orders Over Time</h3>
              </div>
              <ExportButton onClick={() => handleExport('orders')} />
            </div>
            <div className="overflow-x-auto">
              <div style={{ minWidth: 500, height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={ordersOverTime}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="date" tickFormatter={formatDateShort} fontSize={12} stroke="#94a3b8" axisLine={false} tickLine={false} />
                    <YAxis fontSize={12} stroke="#94a3b8" axisLine={false} tickLine={false} />
                    <Tooltip
                      formatter={(v: any) => formatCurrency(v)}
                      labelFormatter={(l: any) => formatDateShort(l)}
                      contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                    />
                    <Legend />
                    <Bar dataKey="completed" fill="#22c55e" name="Completed" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="cancelled" fill="#ef4444" name="Cancelled" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </ChartCard>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Selling Items */}
            <ChartCard delay={0.1}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-surface-900">Top Selling Items</h3>
                <ExportButton onClick={() => handleExport('top-items')} />
              </div>
              {topItems.length === 0 ? (
                <p className="text-sm text-surface-400">No data for this period</p>
              ) : (
                <div className="space-y-1">
                  {topItems.map((item, i) => (
                    <div key={i} className="flex items-center justify-between text-sm py-2 border-b border-surface-50 last:border-0">
                      <div className="flex items-center gap-2.5">
                        <span className="w-6 h-6 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center text-xs font-semibold">
                          {i + 1}
                        </span>
                        <span className="text-surface-800">{item.itemName}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-medium text-surface-900">{item.totalQuantity} sold</span>
                        <span className="text-surface-400 ml-2">{formatCurrency(item.totalRevenue)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ChartCard>

            {/* Payment Method Breakdown */}
            <ChartCard delay={0.15}>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center">
                  <CreditCard size={16} className="text-primary-600" />
                </div>
                <h3 className="font-semibold text-surface-900">Payment Methods</h3>
              </div>
              {paymentBreakdown.length === 0 ? (
                <p className="text-sm text-surface-400">No data for this period</p>
              ) : (
                <div style={{ height: 220 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={paymentBreakdown}
                        dataKey="total"
                        nameKey="method"
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={75}
                        paddingAngle={3}
                        label={({ method }) => method ? method.replace('_', ' ') : ''}
                        fontSize={11}
                      >
                        {paymentBreakdown.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="none" />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(v: any) => formatCurrency(v)}
                        contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </ChartCard>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Peak Hours */}
            <ChartCard delay={0.2}>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center">
                  <Clock size={16} className="text-primary-600" />
                </div>
                <h3 className="font-semibold text-surface-900">Peak Ordering Hours</h3>
              </div>
              <div className="overflow-x-auto">
                <div style={{ minWidth: 400, height: 220 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={peakHours}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="label" fontSize={10} interval={2} stroke="#94a3b8" axisLine={false} tickLine={false} />
                      <YAxis fontSize={12} stroke="#94a3b8" axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }} />
                      <Bar dataKey="orders" fill="#6366f1" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </ChartCard>

            {/* Peak Days */}
            <ChartCard delay={0.25}>
              <h3 className="font-semibold text-surface-900 mb-4">Peak Ordering Days</h3>
              <div style={{ height: 220 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={peakDays}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="day" fontSize={11} tickFormatter={(d) => d.slice(0, 3)} stroke="#94a3b8" axisLine={false} tickLine={false} />
                    <YAxis fontSize={12} stroke="#94a3b8" axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }} />
                    <Bar dataKey="orders" fill="#f97316" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Customer Retention */}
            {retention && (
              <ChartCard delay={0.3}>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center">
                    <Users size={16} className="text-primary-600" />
                  </div>
                  <h3 className="font-semibold text-surface-900">Customer Retention</h3>
                </div>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-surface-50 rounded-xl p-3.5">
                    <p className="text-xs text-surface-400">New Customers</p>
                    <p className="text-xl font-bold text-surface-900">{retention.newCustomers}</p>
                  </div>
                  <div className="bg-surface-50 rounded-xl p-3.5">
                    <p className="text-xs text-surface-400">Returning</p>
                    <p className="text-xl font-bold text-surface-900">{retention.returningCustomers}</p>
                  </div>
                </div>
                <div className="text-sm text-surface-500">
                  Retention rate: <span className="font-semibold text-primary-600">{retention.retentionRate}%</span>
                </div>
              </ChartCard>
            )}

            {/* Rider Performance */}
            <ChartCard delay={0.35}>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center">
                  <Bike size={16} className="text-primary-600" />
                </div>
                <h3 className="font-semibold text-surface-900">Rider Performance</h3>
              </div>
              {riderPerf.length === 0 ? (
                <p className="text-sm text-surface-400">No rider activity for this period</p>
              ) : (
                <div className="space-y-1">
                  {riderPerf.map((rider) => (
                    <div key={rider.id} className="flex items-center justify-between text-sm py-2 border-b border-surface-50 last:border-0">
                      <span className="font-medium text-surface-800">{rider.fullName}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-surface-500">{rider.stats.completedDeliveries} delivered</span>
                        <span className="px-2.5 py-1 bg-success/10 text-green-700 rounded-full text-xs font-medium">
                          {rider.stats.completionRate}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ChartCard>
          </div>

        </div>
      )}
    </Layout>
  )
}