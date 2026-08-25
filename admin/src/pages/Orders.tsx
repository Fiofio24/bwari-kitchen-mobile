import { useEffect, useState } from 'react'
import { ChevronRight, Clock, Archive } from 'lucide-react'
import { motion } from 'framer-motion'
import Layout from '../components/Layout'
import StatusBadge from '../components/StatusBadge'
import Pagination from '../components/Pagination'
import OrderDetailModal, { Order } from '../components/OrderDetailModal'
import api from '../lib/api'

const ACTIVE_STATUSES = ['pending', 'confirmed', 'preparing', 'ready', 'picked_up', 'on_the_way']
const SETTLED_STATUSES = ['delivered', 'cancelled', 'refunded']

type Tab = 'active' | 'settled'

export default function Orders() {
  const [tab, setTab] = useState<Tab>('active')

  const tabIcons = {
    active: Clock,
    settled: Archive,
  }

  return (
    <Layout>
      <h2 className="text-2xl font-bold text-surface-900 mb-4">Orders</h2>

      <div className="flex gap-1 mb-6 border-b border-surface-200 overflow-x-auto">
        {(['active', 'settled'] as Tab[]).map((t) => {
          const Icon = tabIcons[t]
          return (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium capitalize border-b-2 transition-colors whitespace-nowrap ${
                tab === t
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-surface-500 hover:text-surface-800'
              }`}
            >
              <Icon size={16} />
              {t === 'active' ? 'Active Orders' : 'Settled Orders'}
            </button>
          )
        })}
      </div>

      {tab === 'active' && <OrdersTable statuses={ACTIVE_STATUSES} emptyLabel="No active orders right now" />}
      {tab === 'settled' && <OrdersTable statuses={SETTLED_STATUSES} emptyLabel="No settled orders found" />}
    </Layout>
  )
}

// ═══════════════════════════════════════════
// SHARED TABLE (used by both tabs, scoped by status set)
// ═══════════════════════════════════════════
function OrdersTable({ statuses, emptyLabel }: { statuses: string[]; emptyLabel: string }) {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [search, setSearch] = useState('')
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)

  useEffect(() => {
    setPage(1)
    setStatusFilter('')
  }, [statuses])

  useEffect(() => {
    fetchOrders()
  }, [page, statusFilter, typeFilter, statuses])

  const fetchOrders = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.append('limit', '100') // fetch generously since we filter client-side by status set
      if (statusFilter) params.append('status', statusFilter)
      if (typeFilter) params.append('orderType', typeFilter)
      if (search) params.append('search', search)

      const res = await api.get(`/api/admin/orders?${params.toString()}`)
      const scoped = res.data.orders.filter((o: Order) => statuses.includes(o.status))
      const sorted = [...scoped].sort(
        (a: Order, b: Order) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )

      const perPage = 15
      const start = (page - 1) * perPage
      setOrders(sorted.slice(start, start + perPage))
      setTotalPages(Math.max(1, Math.ceil(sorted.length / perPage)))
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    fetchOrders()
  }

  const openOrderDetail = async (orderId: string) => {
    const res = await api.get(`/api/admin/orders/${orderId}`)
    setSelectedOrder(res.data.order)
  }

  const handleOrderUpdated = (updated: Order) => {
    setSelectedOrder(updated)
    if (statuses.includes(updated.status)) {
      setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)))
    } else {
      // Status moved out of this tab's scope — drop it from the visible list
      setOrders((prev) => prev.filter((o) => o.id !== updated.id))
    }
  }

  const formatCurrency = (amount: number) => `₦${Number(amount).toLocaleString()}`
  const formatDate = (date: string) =>
    new Date(date).toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short' })

  return (
    <div>
      <div className="bg-white rounded-2xl border border-surface-100 p-4 mb-4 flex flex-wrap gap-3 items-center">
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            placeholder="Search order number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border border-surface-200 rounded-xl px-3.5 py-2 text-sm w-56 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 transition-shadow"
          />
          <button
            type="submit"
            className="px-3.5 py-2 text-sm font-medium bg-surface-100 text-surface-700 rounded-xl hover:bg-surface-200 transition-colors"
          >
            Search
          </button>
        </form>

        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
          className="border border-surface-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 transition-shadow"
        >
          <option value="">All statuses</option>
          {statuses.map((s) => (
            <option key={s} value={s}>{s.replace('_', ' ')}</option>
          ))}
        </select>

        <select
          value={typeFilter}
          onChange={(e) => { setTypeFilter(e.target.value); setPage(1) }}
          className="border border-surface-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 transition-shadow"
        >
          <option value="">All types</option>
          <option value="delivery">Delivery</option>
          <option value="pickup">Pickup</option>
        </select>
      </div>

      <div className="bg-white rounded-2xl border border-surface-100 overflow-x-auto">
        <table className="w-full text-sm min-w-[700px]">
          <thead>
            <tr className="bg-surface-50 text-left text-surface-500 text-xs uppercase">
              <th className="px-4 py-3">Order</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="text-center py-8 text-surface-400">Loading orders...</td></tr>
            ) : orders.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-8 text-surface-400">{emptyLabel}</td></tr>
            ) : (
              orders.map((order, i) => (
                <motion.tr
                  key={order.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.2, delay: i * 0.02 }}
                  onClick={() => openOrderDetail(order.id)}
                  className="border-t border-surface-100 hover:bg-surface-50 cursor-pointer"
                >
                  <td className="px-4 py-3 font-medium text-surface-900">{order.orderNumber}</td>
                  <td className="px-4 py-3">
                    <div className="text-surface-800">{order.customer.fullName}</div>
                    <div className="text-surface-400 text-xs">{order.customer.phoneNumber}</div>
                  </td>
                  <td className="px-4 py-3 capitalize text-surface-600">{order.orderType}</td>
                  <td className="px-4 py-3"><StatusBadge status={order.status} /></td>
                  <td className="px-4 py-3 font-medium text-surface-900">{formatCurrency(order.totalAmount)}</td>
                  <td className="px-4 py-3 text-surface-500">{formatDate(order.createdAt)}</td>
                  <td className="px-4 py-3 text-right text-surface-300">
                    <ChevronRight size={16} className="inline" />
                  </td>
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />

      <OrderDetailModal
        order={selectedOrder}
        onClose={() => setSelectedOrder(null)}
        onOrderUpdated={handleOrderUpdated}
      />
    </div>
  )
}