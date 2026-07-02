import { useEffect, useState } from 'react'
import LoadingButton from '../components/LoadingButton'
import { showSuccess, showError, getErrorMessage } from '../lib/toast'
import Layout from '../components/Layout'
import Modal from '../components/Modal'
import Toggle from '../components/Toggle'
import Pagination from '../components/Pagination'
import StatusBadge from '../components/StatusBadge'
import api from '../lib/api'
import { Phone, Mail, MapPin, Search, ShieldCheck, ShieldOff } from 'lucide-react'

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
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState('')
  const [togglingId, setTogglingId] = useState<string | null>(null)

  const [selectedCustomer, setSelectedCustomer] = useState<CustomerDetail | null>(null)

  useEffect(() => {
    fetchCustomers()
  }, [page])

  const fetchCustomers = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.append('page', String(page))
      params.append('limit', '15')
      if (search) params.append('search', search)

      const res = await api.get(`/api/admin/users/customers?${params.toString()}`)
      const sorted = [...res.data.customers].sort((a: Customer, b: Customer) =>
        a.fullName.localeCompare(b.fullName)
      )
      setCustomers(sorted)
      setTotalPages(res.data.meta.totalPages)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    fetchCustomers()
  }

  const openDetail = async (customerId: string) => {
    const res = await api.get(`/api/admin/users/customers/${customerId}`)
    setSelectedCustomer(res.data.customer)
  }

  const handleToggleActive = async (customer: Customer) => {
    setTogglingId(customer.id)
    try {
      await api.patch(`/api/admin/users/${customer.id}/toggle-active`)
      fetchCustomers()
      if (selectedCustomer?.id === customer.id) openDetail(customer.id)
      showSuccess(`${customer.fullName} ${customer.isActive ? 'deactivated' : 'activated'}`)
    } catch (err: any) {
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
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Customers</h2>

      <form onSubmit={handleSearch} className="flex gap-2 mb-4">
        <div className="relative w-64">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border border-gray-300 rounded-lg pl-9 pr-3 py-2 text-sm w-full"
          />
        </div>
        <button type="submit" className="px-3 py-2 text-sm bg-gray-100 rounded-lg hover:bg-gray-200">
          Search
        </button>
      </form>

      <div className="bg-white rounded-xl border border-gray-100 overflow-x-auto">
        <table className="w-full text-sm min-w-[700px]">
          <thead>
            <tr className="bg-gray-50 text-left text-gray-500 text-xs uppercase">
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
              <tr><td colSpan={7} className="text-center py-8 text-gray-400">Loading customers...</td></tr>
            ) : customers.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-8 text-gray-400">No customers found</td></tr>
            ) : (
              customers.map((customer) => (
                <tr key={customer.id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{customer.fullName}</td>
                  <td className="px-4 py-3 text-gray-500">{customer.phoneNumber}</td>
                  <td className="px-4 py-3 text-gray-500">{customer._count.orders}</td>
                  <td className="px-4 py-3">
                    {customer.isVerified ? (
                      <ShieldCheck size={16} className="text-green-500" />
                    ) : (
                      <ShieldOff size={16} className="text-gray-300" />
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Toggle checked={customer.isActive} onChange={() => handleToggleActive(customer)} />
                  </td>
                  <td className="px-4 py-3 text-gray-500">{formatDate(customer.createdAt)}</td>
                  <td className="px-4 py-3 text-right space-x-3 whitespace-nowrap">
                    <button onClick={() => openDetail(customer.id)} className="text-brand-600 font-medium">View</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />

      {/* Customer Detail Modal */}
      <Modal
        isOpen={!!selectedCustomer}
        onClose={() => setSelectedCustomer(null)}
        title={selectedCustomer?.fullName || ''}
        maxWidth="max-w-xl"
      >
        {selectedCustomer && (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-3 space-y-2 text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <Phone size={14} /> {selectedCustomer.phoneNumber}
              </div>
              {selectedCustomer.email && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Mail size={14} /> {selectedCustomer.email}
                </div>
              )}
            </div>

            {/* Addresses */}
            <div>
              <p className="text-xs text-gray-500 mb-2">Saved Addresses</p>
              {selectedCustomer.addresses.length === 0 ? (
                <p className="text-sm text-gray-400">No saved addresses</p>
              ) : (
                <div className="space-y-2">
                  {selectedCustomer.addresses.map((addr) => (
                    <div key={addr.id} className="flex items-start gap-2 border border-gray-100 rounded-lg p-3 text-sm">
                      <MapPin size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p>
                          {addr.label && <span className="font-medium">{addr.label} — </span>}
                          {addr.streetAddress}
                          {addr.isDefault && (
                            <span className="ml-2 text-xs text-brand-600">(Default)</span>
                          )}
                        </p>
                        {addr.landmark && <p className="text-gray-400 text-xs">{addr.landmark}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Orders */}
            <div>
              <p className="text-xs text-gray-500 mb-2">Recent Orders ({selectedCustomer._count.orders} total)</p>
              {selectedCustomer.orders.length === 0 ? (
                <p className="text-sm text-gray-400">No orders yet</p>
              ) : (
                <div className="space-y-2">
                  {selectedCustomer.orders.map((order) => (
                    <div key={order.id} className="flex justify-between items-center border border-gray-100 rounded-lg px-3 py-2 text-sm">
                      <span className="font-medium">{order.orderNumber}</span>
                      <StatusBadge status={order.status} />
                      <span>{formatCurrency(order.totalAmount)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <LoadingButton
              loading={togglingId === selectedCustomer.id}
              onClick={() => handleToggleActive(selectedCustomer)}
              variant="ghost"
              className={`w-full py-2 border rounded-lg ${
                selectedCustomer.isActive
                  ? 'border-red-200 text-red-600 hover:bg-red-50'
                  : 'border-green-200 text-green-600 hover:bg-green-50'
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