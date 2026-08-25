import { useState } from 'react'
import LoadingButton from './LoadingButton'
import StatusBadge from './StatusBadge'
import Modal from './Modal'
import ReasonDialog from './ReasonDialog'
import { showSuccess, showError, getErrorMessage } from '../lib/toast'
import api from '../lib/api'

export interface Order {
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

interface OrderDetailModalProps {
  order: Order | null
  onClose: () => void
  onOrderUpdated: (order: Order) => void
}

const formatCurrency = (amount: number) => `₦${Number(amount).toLocaleString()}`

export default function OrderDetailModal({ order, onClose, onOrderUpdated }: OrderDetailModalProps) {
  const [riders, setRiders] = useState<{ id: string; fullName: string }[]>([])
  const [selectedRiderId, setSelectedRiderId] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [ridersLoaded, setRidersLoaded] = useState(false)

  const loadRiders = async () => {
    if (ridersLoaded) return
    const riderRes = await api.get('/api/admin/users/riders?limit=50')
    setRiders(riderRes.data.riders.filter((r: any) => r.isActive))
    setRidersLoaded(true)
  }

  if (order && !ridersLoaded) loadRiders()

  const getNextStatus = (current: string) => {
    const flow: Record<string, string> = {
      pending: 'confirmed',
      confirmed: 'preparing',
      preparing: 'ready',
      ready: order?.orderType === 'pickup' ? 'delivered' : 'picked_up',
      picked_up: 'on_the_way',
      on_the_way: 'delivered',
    }
    return flow[current]
  }

  const handleUpdateStatus = async (newStatus: string) => {
    if (!order) return
    const updated = { ...order, status: newStatus }
    onOrderUpdated(updated)

    setActionLoading(true)
    try {
      await api.patch(`/api/admin/orders/${order.id}/status`, { status: newStatus })
      showSuccess(`Order marked as ${newStatus.replace('_', ' ')}`)
    } catch (err: any) {
      onOrderUpdated(order)
      showError(getErrorMessage(err))
    } finally {
      setActionLoading(false)
    }
  }

  const handleAssignRider = async () => {
    if (!order || !selectedRiderId) return
    const rider = riders.find((r) => r.id === selectedRiderId)
    const previous = order

    if (rider) {
      onOrderUpdated({ ...order, rider: { id: rider.id, fullName: rider.fullName, phoneNumber: '' } })
    }

    setActionLoading(true)
    try {
      const res = await api.patch(`/api/admin/orders/${order.id}/assign-rider`, { riderId: selectedRiderId })
      const detailRes = await api.get(`/api/admin/orders/${order.id}`)
      onOrderUpdated(detailRes.data.order)
      setSelectedRiderId('')
      showSuccess('Rider assigned successfully')
    } catch (err: any) {
      onOrderUpdated(previous)
      showError(getErrorMessage(err))
    } finally {
      setActionLoading(false)
    }
  }

  const confirmCancelOrder = async (reason: string) => {
    if (!order) return
    const previous = order
    onOrderUpdated({ ...order, status: 'cancelled' })

    setActionLoading(true)
    try {
      await api.patch(`/api/admin/orders/${order.id}/cancel`, { reason })
      showSuccess('Order cancelled')
    } catch (err: any) {
      onOrderUpdated(previous)
      showError(getErrorMessage(err))
    } finally {
      setActionLoading(false)
      setCancelDialogOpen(false)
    }
  }

  return (
    <>
      <Modal
        isOpen={!!order}
        onClose={onClose}
        title={order ? `Order ${order.orderNumber}` : ''}
        maxWidth="max-w-2xl"
      >
        {order && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <StatusBadge status={order.status} />
              <span className="text-sm text-surface-500 capitalize">{order.orderType}</span>
            </div>

            <div className="bg-surface-50 rounded-xl p-3.5">
              <p className="text-xs text-surface-400 mb-1">Customer</p>
              <p className="font-medium text-surface-900">{order.customer.fullName}</p>
              <p className="text-sm text-surface-500">{order.customer.phoneNumber}</p>
            </div>

            {order.deliveryAddress && (
              <div className="bg-surface-50 rounded-xl p-3.5">
                <p className="text-xs text-surface-400 mb-1">Delivery Address</p>
                <p className="text-sm text-surface-800">{order.deliveryAddress.streetAddress}</p>
                {order.deliveryAddress.landmark && (
                  <p className="text-sm text-surface-500">{order.deliveryAddress.landmark}</p>
                )}
              </div>
            )}

            {order.orderType === 'delivery' && (
              <div className="bg-surface-50 rounded-xl p-3.5">
                <p className="text-xs text-surface-400 mb-2">Rider</p>
                {order.rider ? (
                  <div>
                    <p className="font-medium text-surface-900">{order.rider.fullName}</p>
                    <p className="text-sm text-surface-500">{order.rider.phoneNumber}</p>
                  </div>
                ) : ['confirmed', 'preparing', 'ready'].includes(order.status) ? (
                  <div className="flex gap-2">
                    <select
                      value={selectedRiderId}
                      onChange={(e) => setSelectedRiderId(e.target.value)}
                      className="flex-1 border border-surface-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30"
                    >
                      <option value="">Select a rider...</option>
                      {riders.map((r) => (
                        <option key={r.id} value={r.id}>{r.fullName}</option>
                      ))}
                    </select>
                    <LoadingButton
                      loading={actionLoading}
                      disabled={!selectedRiderId}
                      onClick={handleAssignRider}
                      className="px-3 py-1.5"
                    >
                      Assign
                    </LoadingButton>
                  </div>
                ) : (
                  <p className="text-sm text-surface-400">No rider assigned</p>
                )}
              </div>
            )}

            <div>
              <p className="text-xs text-surface-400 mb-2">Items</p>
              {order.orderPackages.map((pkg, i) => (
                <div key={i} className="border border-surface-100 rounded-xl p-3 mb-2">
                  <p className="font-medium text-sm text-surface-900 mb-2">{pkg.packageName}</p>
                  {pkg.items.map((item, j) => (
                    <div key={j} className="flex justify-between text-sm text-surface-600">
                      <span>{item.itemName} × {item.quantity}</span>
                      <span>{formatCurrency(item.unitPrice * item.quantity)}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>

            <div className="border-t border-surface-100 pt-3 space-y-1 text-sm">
              <div className="flex justify-between text-surface-500">
                <span>Subtotal</span>
                <span>{formatCurrency(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-surface-500">
                <span>Delivery fee</span>
                <span>{formatCurrency(order.deliveryFee)}</span>
              </div>
              <div className="flex justify-between font-semibold text-base text-surface-900 pt-1">
                <span>Total</span>
                <span>{formatCurrency(order.totalAmount)}</span>
              </div>
            </div>

            {order.payment && (
              <div className="bg-surface-50 rounded-xl p-3.5 flex justify-between items-center">
                <div>
                  <p className="text-xs text-surface-400">Payment</p>
                  <p className="text-sm capitalize text-surface-800">{order.payment.paymentMethod.replace('_', ' ')}</p>
                </div>
                <StatusBadge status={order.payment.paymentStatus} />
              </div>
            )}

            {order.specialInstructions && (
              <div className="bg-warning/5 rounded-xl p-3.5 border border-warning/20">
                <p className="text-xs text-amber-700 mb-1">Special Instructions</p>
                <p className="text-sm text-amber-800">{order.specialInstructions}</p>
              </div>
            )}

            {!['delivered', 'cancelled', 'refunded'].includes(order.status) && (
              <div className="flex gap-2 pt-2">
                {getNextStatus(order.status) && (
                  <LoadingButton
                    loading={actionLoading}
                    onClick={() => handleUpdateStatus(getNextStatus(order.status))}
                    className="flex-1 py-2"
                  >
                    Mark as {getNextStatus(order.status).replace('_', ' ')}
                  </LoadingButton>
                )}
                <LoadingButton
                  loading={actionLoading}
                  onClick={() => setCancelDialogOpen(true)}
                  variant="secondary"
                  className="px-4 py-2 border-danger/30 text-danger hover:bg-danger/5"
                >
                  Cancel Order
                </LoadingButton>
              </div>
            )}
          </div>
        )}
      </Modal>
      <ReasonDialog
        isOpen={cancelDialogOpen}
        title="Cancel Order"
        onConfirm={confirmCancelOrder}
        onCancel={() => setCancelDialogOpen(false)}
        loading={actionLoading}
      />
    </>
  )
}