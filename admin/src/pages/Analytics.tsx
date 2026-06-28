import { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import api from '../lib/api'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
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

const COLORS = ['#ea580c', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6']

const PERIODS = [
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
  { value: '3months', label: 'Last 3 Months' },
  { value: 'year', label: 'This Year' },
]

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
        <h2 className="text-2xl font-bold text-gray-900">Analytics</h2>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
        >
          {PERIODS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
        </select>
      </div>

      {loading ? (
        <p className="text-gray-400">Loading analytics...</p>
      ) : (
        <div className="space-y-6">

          {/* Revenue Over Time */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <TrendingUp size={18} className="text-brand-600" />
                <h3 className="font-semibold">Revenue Over Time</h3>
              </div>
              <button
                onClick={() => handleExport('revenue')}
                className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
              >
                <Download size={14} /> Export CSV
              </button>
            </div>
            <div className="overflow-x-auto">
              <div style={{ minWidth: 500, height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={revenue}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f1f1" />
                    <XAxis dataKey="date" tickFormatter={formatDateShort} fontSize={12} />
                    <YAxis fontSize={12} tickFormatter={(v) => `₦${v / 1000}k`} />
                    <Tooltip formatter={(v: number) => formatCurrency(v)} labelFormatter={formatDateShort} />
                    <Line type="monotone" dataKey="revenue" stroke="#ea580c" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Orders Over Time */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Calendar size={18} className="text-brand-600" />
                <h3 className="font-semibold">Orders Over Time</h3>
              </div>
              <button
                onClick={() => handleExport('orders')}
                className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
              >
                <Download size={14} /> Export CSV
              </button>
            </div>
            <div className="overflow-x-auto">
              <div style={{ minWidth: 500, height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={ordersOverTime}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f1f1" />
                    <XAxis dataKey="date" tickFormatter={formatDateShort} fontSize={12} />
                    <YAxis fontSize={12} />
                    <Tooltip labelFormatter={formatDateShort} />
                    <Legend />
                    <Bar dataKey="completed" fill="#10b981" name="Completed" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="cancelled" fill="#ef4444" name="Cancelled" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Selling Items */}
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Top Selling Items</h3>
                <button
                  onClick={() => handleExport('top-items')}
                  className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
                >
                  <Download size={14} /> Export
                </button>
              </div>
              {topItems.length === 0 ? (
                <p className="text-sm text-gray-400">No data for this period</p>
              ) : (
                <div className="space-y-2">
                  {topItems.map((item, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center text-xs font-medium">
                          {i + 1}
                        </span>
                        <span>{item.itemName}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-medium">{item.totalQuantity} sold</span>
                        <span className="text-gray-400 ml-2">{formatCurrency(item.totalRevenue)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Payment Method Breakdown */}
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <div className="flex items-center gap-2 mb-4">
                <CreditCard size={18} className="text-brand-600" />
                <h3 className="font-semibold">Payment Methods</h3>
              </div>
              {paymentBreakdown.length === 0 ? (
                <p className="text-sm text-gray-400">No data for this period</p>
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
                        outerRadius={75}
                        label={({ method }) => method.replace('_', ' ')}
                        fontSize={11}
                      >
                        {paymentBreakdown.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v: number) => formatCurrency(v)} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Peak Hours */}
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <div className="flex items-center gap-2 mb-4">
                <Clock size={18} className="text-brand-600" />
                <h3 className="font-semibold">Peak Ordering Hours</h3>
              </div>
              <div className="overflow-x-auto">
                <div style={{ minWidth: 400, height: 220 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={peakHours}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f1f1" />
                      <XAxis dataKey="label" fontSize={10} interval={2} />
                      <YAxis fontSize={12} />
                      <Tooltip />
                      <Bar dataKey="orders" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Peak Days */}
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <h3 className="font-semibold mb-4">Peak Ordering Days</h3>
              <div style={{ height: 220 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={peakDays}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f1f1" />
                    <XAxis dataKey="day" fontSize={11} tickFormatter={(d) => d.slice(0, 3)} />
                    <YAxis fontSize={12} />
                    <Tooltip />
                    <Bar dataKey="orders" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Customer Retention */}
            {retention && (
              <div className="bg-white rounded-xl border border-gray-100 p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Users size={18} className="text-brand-600" />
                  <h3 className="font-semibold">Customer Retention</h3>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500">New Customers</p>
                    <p className="text-xl font-bold">{retention.newCustomers}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500">Returning</p>
                    <p className="text-xl font-bold">{retention.returningCustomers}</p>
                  </div>
                </div>
                <div className="text-sm text-gray-500">
                  Retention rate: <span className="font-medium text-gray-900">{retention.retentionRate}%</span>
                </div>
              </div>
            )}

            {/* Rider Performance */}
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <div className="flex items-center gap-2 mb-4">
                <Bike size={18} className="text-brand-600" />
                <h3 className="font-semibold">Rider Performance</h3>
              </div>
              {riderPerf.length === 0 ? (
                <p className="text-sm text-gray-400">No rider activity for this period</p>
              ) : (
                <div className="space-y-3">
                  {riderPerf.map((rider) => (
                    <div key={rider.id} className="flex items-center justify-between text-sm">
                      <span className="font-medium">{rider.fullName}</span>
                      <div className="flex items-center gap-3 text-gray-500">
                        <span>{rider.stats.completedDeliveries} delivered</span>
                        <span className="px-2 py-0.5 bg-green-50 text-green-700 rounded-full text-xs">
                          {rider.stats.completionRate}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>
      )}
    </Layout>
  )
}