import { useEffect, useState, useCallback, UIEvent } from 'react'
import { motion } from 'framer-motion'
import LoadingButton from '../components/LoadingButton'
import { showSuccess, showError, getErrorMessage } from '../lib/toast'
import Layout from '../components/Layout'
import Modal from '../components/Modal'
import Toggle from '../components/Toggle'
import StatusBadge from '../components/StatusBadge'
import api from '../lib/api'
import useLivePolling from '../hooks/useLivePolling'
import { Phone, Mail, MapPin, Search, ShieldCheck, ShieldOff, ChevronRight, Loader2 } from 'lucide-react'

interface Customer {
  id: string
  fullName: string
  phoneNumber: string
  email: string | null
  isActive: boolean
  isVerified: boolean
  createdAt: string
  _count: { orders: number }
}

interface CustomerDetail extends Customer {
  addresses: {
    id: string
    label: string | null
    streetAddress: string
    landmark: string | null
    area: string | null
    isDefault: boolean
  }[]
  orders: {
    id: string
    orderNumber: string
    status: string
    totalAmount: number
    createdAt: string
  }[]
}

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [isFetchingMore, setIsFetchingMore] = useState(false)
  
  // Infinite Scroll States
  const [fetchLimit, setFetchLimit] = useState(50)
  const [hasMore, setHasMore] = useState(true)
  
  const [searchInput, setSearchInput] = useState('')
  const [appliedSearch, setAppliedSearch] = useState('')
  const [togglingId, setTogglingId] = useState<string | null>(null)

  const [selectedCustomer, setSelectedCustomer] = useState<CustomerDetail | null>(null)

  const fetchCustomers = useCallback(async (isSilent = false) => {
    if (!isSilent) {
      if (fetchLimit === 50) setLoading(true)
      else setIsFetchingMore(true)
    }
    
    try {
      const params = new URLSearchParams()
      params.append('limit', fetchLimit.toString())
      if (appliedSearch) params.append('search', appliedSearch)

      const res = await api.get(`/api/admin/users/customers?${params.toString()}`)
      const sorted = [...res.data.customers].sort((a: Customer, b: Customer) =>
        a.fullName.localeCompare(b.fullName)
      )
      setCustomers(sorted)
      
      if (res.data.customers.length < fetchLimit) {
        setHasMore(false)
      } else {
        setHasMore(true)
      }
    } finally {
      if (!isSilent) {
        setLoading(false)
        setIsFetchingMore(false)
      }
    }
  }, [fetchLimit, appliedSearch])

  useEffect(() => {
    fetchCustomers(false)
  }, [fetchCustomers])
  
  useLivePolling(fetchCustomers, 15000)

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
    setAppliedSearch(searchInput)
    setFetchLimit(50)
  }

  const openDetail = async (customerId: string) => {
    const res = await api.get(`/api/admin/users/customers/${customerId}`)
    setSelectedCustomer(res.data.customer)
  }

  const handleToggleActive = async (customer: Customer) => {
    const previousCustomers = customers
    const previousSelected = selectedCustomer
    const newActive = !customer.isActive

    setCustomers((prev) =>
      prev.map((c) => (c.id === customer.id ? { ...c, isActive: newActive } : c))
    )
    if (selectedCustomer?.id === customer.id) {
      setSelectedCustomer({ ...selectedCustomer, isActive: newActive })
    }

    setTogglingId(customer.id)
    try {
      await api.patch(`/api/admin/users/${customer.id}/toggle-active`)
      showSuccess(`${customer.fullName} ${newActive ? 'activated' : 'deactivated'}`)
    } catch (err: any) {
      setCustomers(previousCustomers)
      setSelectedCustomer(previousSelected)
      showError(getErrorMessage(err))
    } finally {
      setTogglingId(null)
    }
  }

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('en-NG', { dateStyle: 'medium' })
  const formatCurrency = (amount: number) => `₦${Number(amount).toLocaleString()}`

  return (
    <Layout>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-surface-900">Customers</h2>
        <p className="text-sm text-surface-400 mt-0.5">Everyone who has signed up to order from Bwari Kitchen</p>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2 mb-4">
        <div className="relative w-64">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
          <input
            type="text"
            placeholder="Search by name or phone..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="border border-surface-200 rounded-xl pl-9 pr-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 transition-shadow"
          />
        </div>
        <button
          type="submit"
          className="px-3.5 py-2 text-sm font-medium bg-surface-100 text-surface-700 rounded-xl hover:bg-surface-200 transition-colors"
        >
          Search
        </button>
      </form>

      <div 
        className="bg-white rounded-2xl border border-surface-100 overflow-x-auto max-h-[70vh] overflow-y-auto relative"
        onScroll={handleScroll}
      >
        <table className="w-full text-sm min-w-[700px]">
          <thead className="sticky top-0 bg-surface-50 z-10 shadow-sm">
            <tr className="text-left text-surface-500 text-xs uppercase">
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Phone</th>
              <th className="px-4 py-3">Orders</th>
              <th className="px-4 py-3">Verified</th>
              <th className="px-4 py-3">Active</th>
              <th className="px-4 py-3">Joined</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="text-center py-8 text-surface-400">Loading customers...</td></tr>
            ) : customers.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-8 text-surface-400">No customers found</td></tr>
            ) : (
              customers.map((customer, i) => (
                <motion.tr
                  key={customer.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.2, delay: (i % 10) * 0.02 }}
                  onClick={() => openDetail(customer.id)}
                  className="border-t border-surface-100 hover:bg-surface-50 cursor-pointer"
                >
                  <td className="px-4 py-3 font-medium text-surface-900">{customer.fullName}</td>
                  <td className="px-4 py-3 text-surface-500">{customer.phoneNumber}</td>
                  <td className="px-4 py-3 text-surface-500">{customer._count.orders}</td>
                  <td className="px-4 py-3">
                    {customer.isVerified ? (
                      <ShieldCheck size={16} className="text-success" />
                    ) : (
                      <ShieldOff size={16} className="text-surface-300" />
                    )}
                  </td>
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <Toggle checked={customer.isActive} onChange={() => handleToggleActive(customer)} />
                  </td>
                  <td className="px-4 py-3 text-surface-500">{formatDate(customer.createdAt)}</td>
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
            <span className="text-sm font-medium">Loading more customers...</span>
          </div>
        )}
      </div>

      {/* Customer Detail Modal */}
      <Modal
        isOpen={!!selectedCustomer}
        onClose={() => setSelectedCustomer(null)}
        title={selectedCustomer?.fullName || ''}
        maxWidth="max-w-xl"
      >
        {selectedCustomer && (
          <div className="space-y-4">
            <div className="bg-surface-50 rounded-xl p-3.5 space-y-2 text-sm">
              <div className="flex items-center gap-2 text-surface-600">
                <Phone size={14} /> {selectedCustomer.phoneNumber}
              </div>
              {selectedCustomer.email && (
                <div className="flex items-center gap-2 text-surface-600">
                  <Mail size={14} /> {selectedCustomer.email}
                </div>
              )}
            </div>

            {/* Addresses */}
            <div>
              <p className="text-xs text-surface-400 mb-2">Saved Addresses</p>
              {selectedCustomer.addresses.length === 0 ? (
                <p className="text-sm text-surface-400">No saved addresses</p>
              ) : (
                <div className="space-y-2">
                  {selectedCustomer.addresses.map((addr) => (
                    <div key={addr.id} className="flex items-start gap-2 border border-surface-100 rounded-xl p-3 text-sm">
                      <MapPin size={14} className="text-surface-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-surface-800">
                          {addr.label && <span className="font-medium">{addr.label} — </span>}
                          {addr.streetAddress}
                          {addr.isDefault && (
                            <span className="ml-2 text-xs text-primary-600 font-medium">(Default)</span>
                          )}
                        </p>
                        {addr.landmark && <p className="text-surface-400 text-xs">{addr.landmark}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Orders */}
            <div>
              <p className="text-xs text-surface-400 mb-2">Recent Orders ({selectedCustomer._count.orders} total)</p>
              {selectedCustomer.orders.length === 0 ? (
                <p className="text-sm text-surface-400">No orders yet</p>
              ) : (
                <div className="space-y-2">
                  {selectedCustomer.orders.map((order) => (
                    <div key={order.id} className="flex justify-between items-center border border-surface-100 rounded-xl px-3 py-2 text-sm">
                      <span className="font-medium text-surface-900">{order.orderNumber}</span>
                      <StatusBadge status={order.status} />
                      <span className="text-surface-700">{formatCurrency(order.totalAmount)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <LoadingButton
              loading={togglingId === selectedCustomer.id}
              onClick={() => handleToggleActive(selectedCustomer)}
              variant="secondary"
              className={`w-full py-2.5 ${
                selectedCustomer.isActive
                  ? 'border-danger/30 text-danger hover:bg-danger/5'
                  : 'border-success/30 text-green-600 hover:bg-success/5'
              }`}
            >
              {selectedCustomer.isActive ? 'Deactivate Customer' : 'Activate Customer'}
            </LoadingButton>
          </div>
        )}
      </Modal>
    </Layout>
  )
}