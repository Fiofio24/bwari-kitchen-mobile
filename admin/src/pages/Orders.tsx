// admin/src/pages/Orders.tsx
import { useEffect, useState, UIEvent, useCallback } from 'react'
import { ChevronRight, Clock, Archive, Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { useLocation } from 'react-router-dom'
import Layout from '../components/Layout'
import StatusBadge from '../components/StatusBadge'
import OrderDetailModal, { Order } from '../components/OrderDetailModal'
import api from '../lib/api'
import useLivePolling from '../hooks/useLivePolling'

const ACTIVE_STATUSES = ['pending', 'confirmed', 'preparing', 'ready', 'picked_up', 'on_the_way']
const SETTLED_STATUSES = ['delivered', 'cancelled', 'refunded']

type Tab = 'active' | 'settled'
type TableOrder = Order & { updatedAt?: string }

export default function Orders() {
  const location = useLocation()
  
  const initialTab = (location.state?.tab as Tab) || 'active'
  const initialFilter = location.state?.filter || '' // Capture the filter from the Dashboard click
  
  const [tab, setTab] = useState<Tab>(initialTab)

  // Ensure tab updates dynamically if user clicks dashboard links repeatedly
  useEffect(() => {
    if (location.state?.tab) {
      setTab(location.state.tab as Tab)
    }
  }, [location.state])

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

      <div className={tab === 'active' ? 'block' : 'hidden'}>
        <OrdersTable 
          statuses={ACTIVE_STATUSES} 
          emptyLabel="No active orders right now" 
          isSettled={false} 
          initialFilter={tab === 'active' ? initialFilter : ''} 
        />
      </div>
      
      <div className={tab === 'settled' ? 'block' : 'hidden'}>
        <OrdersTable 
          statuses={SETTLED_STATUSES} 
          emptyLabel="No settled orders found" 
          isSettled={true} 
          initialFilter={tab === 'settled' ? initialFilter : ''} 
        />
      </div>
    </Layout>
  )
}

// ═══════════════════════════════════════════
// SHARED TABLE (used by both tabs, scoped by status set)
// ═══════════════════════════════════════════
function OrdersTable({ 
  statuses, 
  emptyLabel,
  isSettled,
  initialFilter = '' // Accept the initial filter
}: { 
  statuses: string[]; 
  emptyLabel: string;
  isSettled: boolean;
  initialFilter?: string;
}) {
  const [orders, setOrders] = useState<TableOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [isFetchingMore, setIsFetchingMore] = useState(false)
  
  const [statusFilter, setStatusFilter] = useState(initialFilter)
  const [typeFilter, setTypeFilter] = useState('')
  const [search, setSearch] = useState('')
  const [selectedOrder, setSelectedOrder] = useState<TableOrder | null>(null)
  
  const [dateMode, setDateMode] = useState<'settled' | 'created'>('settled')
  const [fetchLimit, setFetchLimit] = useState(50)
  const [hasMore, setHasMore] = useState(true)

  // Listen for changes from the dashboard routing
  useEffect(() => {
    setStatusFilter(initialFilter)
    setFetchLimit(50)
  }, [statuses, initialFilter])

  const fetchOrders = useCallback(async (isSilentBackgroundFetch = false) => {
    if (!isSilentBackgroundFetch) {
      if (fetchLimit === 50) setLoading(true)
      else setIsFetchingMore(true)
    }
    
    try {
      const params = new URLSearchParams() 
      params.append('limit', fetchLimit.toString()) 

      if (statusFilter) {
        params.append('status', statusFilter)
      } else {
        params.append('status', statuses.join(','))
      }

      if (typeFilter) params.append('orderType', typeFilter)
      if (search) params.append('search', search)

      if (isSettled) {
        params.append('sort', 'desc')
        params.append('sortBy', dateMode === 'settled' ? 'updatedAt' : 'createdAt')
      } else {
        params.append('sort', 'asc')
        params.append('sortBy', 'createdAt')
      }

      const res = await api.get(`/api/admin/orders?${params.toString()}`)
      const fetchedOrders: TableOrder[] = res.data?.orders || []
      
      setOrders(fetchedOrders)
      
      if (fetchedOrders.length < fetchLimit) {
        setHasMore(false)
      } else {
        setHasMore(true)
      }
    } catch (error) {
      console.error("Fetch orders failed:", error)
    } finally {
      if (!isSilentBackgroundFetch) {
        setLoading(false)
        setIsFetchingMore(false)
      }
    }
  }, [fetchLimit, statusFilter, typeFilter, search, statuses, isSettled, dateMode])

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchOrders(false)
    }, 0)
    return () => clearTimeout(timer)
  }, [fetchOrders])

  useLivePolling(() => fetchOrders(true), 15000)

  const handleScroll = (e: UIEvent<HTMLDivElement>) => {
    const { scrollTop, clientHeight, scrollHeight } = e.currentTarget
    
    if (scrollHeight - scrollTop <= clientHeight + 50) {
      if (hasMore && !loading && !isFetchingMore) {
        setFetchLimit(prev => prev + 50)
      }
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (fetchLimit === 50) fetchOrders(false)
    else setFetchLimit(50) 
  }

  const openOrderDetail = async (orderId: string) => {
    const res = await api.get(`/api/admin/orders/${orderId}`)
    setSelectedOrder(res.data.order)
  }

  const handleOrderUpdated = (updated: TableOrder) => {
    setSelectedOrder(updated)
    setOrders((prev) => {
      if (statuses.includes(updated.status)) {
        return prev.map((o) => (o.id === updated.id ? updated : o))
      } else {
        return prev.filter((o) => o.id !== updated.id)
      }
    })
  }

  const formatCurrency = (amount: number) => `₦${Number(amount).toLocaleString()}`
  
  const formatRowDate = (order: TableOrder) => {
    let dateToUse = order.createdAt
    if (isSettled && dateMode === 'settled') {
      dateToUse = order.updatedAt || order.createdAt
    }
    return new Date(dateToUse).toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short' })
  }

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
          onChange={(e) => { setStatusFilter(e.target.value); setFetchLimit(50) }}
          className="border border-surface-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 transition-shadow"
        >
          <option value="">All statuses</option>
          {statuses.map((s) => (
            <option key={s} value={s}>{s.replace('_', ' ')}</option>
          ))}
        </select>

        <select
          value={typeFilter}
          onChange={(e) => { setTypeFilter(e.target.value); setFetchLimit(50) }}
          className="border border-surface-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 transition-shadow"
        >
          <option value="">All types</option>
          <option value="delivery">Delivery</option>
          <option value="pickup">Pickup</option>
        </select>
      </div>

      <div 
        className="bg-white rounded-2xl border border-surface-100 overflow-x-auto max-h-[70vh] overflow-y-auto relative"
        onScroll={handleScroll}
      >
        <table className="w-full text-sm min-w-[700px]">
          <thead className="sticky top-0 bg-surface-50 z-10 shadow-sm">
            <tr className="text-left text-surface-500 text-xs uppercase">
              <th className="px-4 py-3">Order</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">
                {isSettled ? (
                  <select
                    value={dateMode}
                    onChange={(e) => { setDateMode(e.target.value as 'settled' | 'created'); setFetchLimit(50) }}
                    className="bg-transparent font-bold uppercase focus:outline-none cursor-pointer text-surface-500 hover:text-surface-800 transition-colors"
                  >
                    <option value="settled">Settled Date</option>
                    <option value="created">Created Date</option>
                  </select>
                ) : (
                  'Date'
                )}
              </th>
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
                  transition={{ duration: 0.2, delay: (i % 10) * 0.02 }}
                  onClick={() => openOrderDetail(order.id)}
                  className="border-t border-surface-100 hover:bg-surface-50 cursor-pointer"
                >
                  <td className="px-4 py-3 font-medium text-surface-900">{order.orderNumber}</td>
                  <td className="px-4 py-3">
                    <div className="text-surface-800">{order.customer?.fullName}</div>
                    <div className="text-surface-400 text-xs">{order.customer?.phoneNumber}</div>
                  </td>
                  <td className="px-4 py-3 capitalize text-surface-600">{order.orderType}</td>
                  <td className="px-4 py-3"><StatusBadge status={order.status} /></td>
                  <td className="px-4 py-3 font-medium text-surface-900">{formatCurrency(order.totalAmount)}</td>
                  <td className="px-4 py-3 text-surface-500">{formatRowDate(order)}</td>
                  <td className="px-4 py-3 text-right text-surface-300">
                    <ChevronRight size={16} className="inline" />
                  </td>
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
        
        {isFetchingMore && (
          <div className="flex justify-center items-center p-4 border-t border-surface-100 text-surface-500 gap-2">
            <Loader2 size={18} className="animate-spin" />
            <span className="text-sm font-medium">Loading more orders...</span>
          </div>
        )}
      </div>

      <OrderDetailModal
        order={selectedOrder}
        onClose={() => setSelectedOrder(null)}
        onOrderUpdated={handleOrderUpdated}
      />
    </div>
  )
}