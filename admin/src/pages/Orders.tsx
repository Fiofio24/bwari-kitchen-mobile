import { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import StatusBadge from '../components/StatusBadge'
import Pagination from '../components/Pagination'
import Modal from '../components/Modal'
import api from '../lib/api'

interface Order {
  id: string
  orderNumber: string
  orderType: string
  status: string
  subtotal: number
  deliveryFee: number
  totalAmount: number
  specialInstructions: string | null
  estimatedDeliveryTime: string | null
  createdAt: string
  customer: { id: string; fullName: string; phoneNumber: string }
  rider: { id: string; fullName: string; phoneNumber: string } | null
  deliveryAddress: { streetAddress: string; landmark: string | null; area: string | null } | null
  orderPackages: {
    packageName: string
    totalPrice: number
    items: { itemName: string; quantity: number; unitPrice: number }[]
  }[]
  payment: { paymentMethod: string; paymentStatus: string; amount: number } | null
}

const STATUS_FLOW = [
  'confirmed', 'preparing', 'ready', 'picked_up', 'on_the_way', 'delivered'
]

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [search, setSearch] = useState('')

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [riders, setRiders] = useState<{ id: string; fullName: string }[]>([])
  const [selectedRiderId, setSelectedRiderId] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    fetchOrders()
  }, [page, statusFilter, typeFilter])

  const fetchOrders = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.append('page', String(page))
      params.append('limit', '15')
      if (statusFilter) params.append('status', statusFilter)
      if (typeFilter) params.append('orderType', typeFilter)
      if (search) params.append('search', search)

      const res = await api.get(`/api/admin/orders?${params.toString()}`)
      setOrders(res.data.orders)
      setTotalPages(res.data.meta.totalPages)
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

    // Fetch riders for assignment dropdown
    const riderRes = await api.get('/api/admin/users/riders?limit=50')
    setRiders(riderRes.data.riders.filter((r: any) => r.isActive))
  }

  const getNextStatus = (current: string) => {
    const flow: Record<string, string> = {
      pending: 'confirmed',
      confirmed: 'preparing',
      preparing: 'ready',
      ready: selectedOrder?.orderType === 'pickup' ? 'delivered' : 'picked_up',
      picked_up: 'on_the_way',
      on_the_way: 'delivered',
    }
    return flow[current]
  }

  const handleUpdateStatus = async (newStatus: string) => {
    if (!selectedOrder) return
    setActionLoading(true)
    try {
      await api.patch(`/api/admin/orders/${selectedOrder.id}/status`, { status: newStatus })
      await openOrderDetail(selectedOrder.id)
      fetchOrders()
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update status')
    } finally {
      setActionLoading(false)
    }
  }

  const handleAssignRider = async () => {
    if (!selectedOrder || !selectedRiderId) return
    setActionLoading(true)
    try {
      await api.patch(`/api/admin/orders/${selectedOrder.id}/assign-rider`, {
        riderId: selectedRiderId
      })
      await openOrderDetail(selectedOrder.id)
      fetchOrders()
      setSelectedRiderId('')
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to assign rider')
    } finally {
      setActionLoading(false)
    }
  }

  const handleCancelOrder = async () => {
    if (!selectedOrder) return
    const reason = prompt('Reason for cancellation (optional):')
    if (reason === null) return

    setActionLoading(true)
    try {
      await api.patch(`/api/admin/orders/${selectedOrder.id}/cancel`, { reason })
      await openOrderDetail(selectedOrder.id)
      fetchOrders()
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to cancel order')
    } finally {
      setActionLoading(false)
    }
  }

  const formatCurrency = (amount: number) => `₦${Number(amount).toLocaleString()}`
  const formatDate = (date: string) =>
    new Date(date).toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short' })

  return (
    <Layout>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Orders</h2>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 mb-4 flex flex-wrap gap-3 items-center">
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            placeholder="Search order number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-56"
          />
          <button
            type="submit"
            className="px-3 py-2 text-sm bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            Search
          </button>
        </form>

        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
        >
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="preparing">Preparing</option>
          <option value="ready">Ready</option>
          <option value="picked_up">Picked up</option>
          <option value="on_the_way">On the way</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
        </select>

        <select
          value={typeFilter}
          onChange={(e) => { setTypeFilter(e.target.value); setPage(1) }}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
        >
          <option value="">All types</option>
          <option value="delivery">Delivery</option>
          <option value="pickup">Pickup</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-left text-gray-500 text-xs uppercase">
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
              <tr><td colSpan={7} className="text-center py-8 text-gray-400">Loading orders...</td></tr>
            ) : orders.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-8 text-gray-400">No orders found</td></tr>
            ) : (
              orders.map((order) => (
                <tr key={order.id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{order.orderNumber}</td>
                  <td className="px-4 py-3">
                    <div>{order.customer.fullName}</div>
                    <div className="text-gray-400 text-xs">{order.customer.phoneNumber}</div>
                  </td>
                  <td className="px-4 py-3 capitalize">{order.orderType}</td>
                  <td className="px-4 py-3"><StatusBadge status={order.status} /></td>
                  <td className="px-4 py-3 font-medium">{formatCurrency(order.totalAmount)}</td>
                  <td className="px-4 py-3 text-gray-500">{formatDate(order.createdAt)}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => openOrderDetail(order.id)}
                      className="text-brand-600 hover:text-brand-700 font-medium"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />

      {/* Order Detail Modal */}
      <Modal
        isOpen={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        title={selectedOrder ? `Order ${selectedOrder.orderNumber}` : ''}
        maxWidth="max-w-2xl"
      >
        {selectedOrder && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <StatusBadge status={selectedOrder.status} />
              <span className="text-sm text-gray-500 capitalize">{selectedOrder.orderType}</span>
            </div>

            {/* Customer Info */}
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-1">Customer</p>
              <p className="font-medium">{selectedOrder.customer.fullName}</p>
              <p className="text-sm text-gray-500">{selectedOrder.customer.phoneNumber}</p>
            </div>

            {/* Delivery Address */}
            {selectedOrder.deliveryAddress && (
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">Delivery Address</p>
                <p className="text-sm">{selectedOrder.deliveryAddress.streetAddress}</p>
                {selectedOrder.deliveryAddress.landmark && (
                  <p className="text-sm text-gray-500">{selectedOrder.deliveryAddress.landmark}</p>
                )}
              </div>
            )}

            {/* Rider Info / Assignment */}
            {selectedOrder.orderType === 'delivery' && (
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-2">Rider</p>
                {selectedOrder.rider ? (
                  <div>
                    <p className="font-medium">{selectedOrder.rider.fullName}</p>
                    <p className="text-sm text-gray-500">{selectedOrder.rider.phoneNumber}</p>
                  </div>
                ) : ['confirmed', 'preparing', 'ready'].includes(selectedOrder.status) ? (
                  <div className="flex gap-2">
                    <select
                      value={selectedRiderId}
                      onChange={(e) => setSelectedRiderId(e.target.value)}
                      className="flex-1 border border-gray-300 rounded-lg px-2 py-1.5 text-sm"
                    >
                      <option value="">Select a rider...</option>
                      {riders.map((r) => (
                        <option key={r.id} value={r.id}>{r.fullName}</option>
                      ))}
                    </select>
                    <button
                      onClick={handleAssignRider}
                      disabled={!selectedRiderId || actionLoading}
                      className="px-3 py-1.5 bg-brand-600 text-white rounded-lg text-sm disabled:opacity-50"
                    >
                      Assign
                    </button>
                  </div>
                ) : (
                  <p className="text-sm text-gray-400">No rider assigned</p>
                )}
              </div>
            )}

            {/* Items */}
            <div>
              <p className="text-xs text-gray-500 mb-2">Items</p>
              {selectedOrder.orderPackages.map((pkg, i) => (
                <div key={i} className="border border-gray-100 rounded-lg p-3 mb-2">
                  <p className="font-medium text-sm mb-2">{pkg.packageName}</p>
                  {pkg.items.map((item, j) => (
                    <div key={j} className="flex justify-between text-sm text-gray-600">
                      <span>{item.itemName} × {item.quantity}</span>
                      <span>{formatCurrency(item.unitPrice * item.quantity)}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="border-t border-gray-100 pt-3 space-y-1 text-sm">
              <div className="flex justify-between text-gray-500">
                <span>Subtotal</span>
                <span>{formatCurrency(selectedOrder.subtotal)}</span>
              </div>
              <div className="flex justify-between text-gray-500">
                <span>Delivery fee</span>
                <span>{formatCurrency(selectedOrder.deliveryFee)}</span>
              </div>
              <div className="flex justify-between font-semibold text-base pt-1">
                <span>Total</span>
                <span>{formatCurrency(selectedOrder.totalAmount)}</span>
              </div>
            </div>

            {/* Payment */}
            {selectedOrder.payment && (
              <div className="bg-gray-50 rounded-lg p-3 flex justify-between items-center">
                <div>
                  <p className="text-xs text-gray-500">Payment</p>
                  <p className="text-sm capitalize">{selectedOrder.payment.paymentMethod.replace('_', ' ')}</p>
                </div>
                <StatusBadge status={selectedOrder.payment.paymentStatus} />
              </div>
            )}

            {selectedOrder.specialInstructions && (
              <div className="bg-amber-50 rounded-lg p-3">
                <p className="text-xs text-amber-700 mb-1">Special Instructions</p>
                <p className="text-sm text-amber-800">{selectedOrder.specialInstructions}</p>
              </div>
            )}

            {/* Actions */}
            {!['delivered', 'cancelled', 'refunded'].includes(selectedOrder.status) && (
              <div className="flex gap-2 pt-2">
                {getNextStatus(selectedOrder.status) && (
                  <button
                    onClick={() => handleUpdateStatus(getNextStatus(selectedOrder.status))}
                    disabled={actionLoading}
                    className="flex-1 bg-brand-600 text-white py-2 rounded-lg text-sm font-medium disabled:opacity-50"
                  >
                    Mark as {getNextStatus(selectedOrder.status).replace('_', ' ')}
                  </button>
                )}
                <button
                  onClick={handleCancelOrder}
                  disabled={actionLoading}
                  className="px-4 py-2 border border-red-200 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 disabled:opacity-50"
                >
                  Cancel Order
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </Layout>
  )
}