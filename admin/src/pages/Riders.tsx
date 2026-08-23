import { useEffect, useState } from 'react'
import { Bike, Phone, Mail, Search, ChevronRight } from 'lucide-react'
import LoadingButton from '../components/LoadingButton'
import { showSuccess, showError, getErrorMessage } from '../lib/toast'
import Layout from '../components/Layout'
import Modal from '../components/Modal'
import ConfirmDialog from '../components/ConfirmDialog'
import Toggle from '../components/Toggle'
import Pagination from '../components/Pagination'
import api from '../lib/api'

interface Rider {
  id: string
  fullName: string
  phoneNumber: string
  email: string | null
  isActive: boolean
  isVerified: boolean
  createdAt: string
  _count: { assignedDeliveries: number }
}

interface RiderDetail extends Rider {
  assignedDeliveries: {
    id: string
    orderNumber: string
    status: string
    totalAmount: number
    createdAt: string
  }[]
}

export default function Riders() {
  const [riders, setRiders] = useState<Rider[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState('')

  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [createForm, setCreateForm] = useState({ fullName: '', phoneNumber: '', password: '', email: '' })
  const [creating, setCreating] = useState(false)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  const [selectedRider, setSelectedRider] = useState<RiderDetail | null>(null)

  useEffect(() => {
    fetchRiders()
  }, [page])

  const fetchRiders = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.append('page', String(page))
      params.append('limit', '15')
      if (search) params.append('search', search)

      const res = await api.get(`/api/admin/users/riders?${params.toString()}`)
      const sorted = [...res.data.riders].sort((a: Rider, b: Rider) =>
        a.fullName.localeCompare(b.fullName)
      )
      setRiders(sorted)
      setTotalPages(res.data.meta.totalPages)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    fetchRiders()
  }

  const handleCreate = async () => {
    if (!createForm.fullName || !createForm.phoneNumber || !createForm.password) {
      return alert('Full name, phone number and password are required')
    }
    setCreating(true)
    try {
      await api.post('/api/admin/users/riders', createForm)
      setCreateModalOpen(false)
      setCreateForm({ fullName: '', phoneNumber: '', password: '', email: '' })
      fetchRiders()
      showSuccess('Rider created successfully')
    
    } catch (err: any) {
      showError(getErrorMessage(err))
    } finally {
      setCreating(false)
    }
  }

  const openDetail = async (riderId: string) => {
    const res = await api.get(`/api/admin/users/riders/${riderId}`)
    setSelectedRider(res.data.rider)
  }

  const handleToggleActive = async (rider: Rider) => {
    const previousRiders = riders
    const previousSelected = selectedRider
    const newActive = !rider.isActive

    setRiders((prev) =>
      prev.map((r) => (r.id === rider.id ? { ...r, isActive: newActive } : r))
    )
    if (selectedRider?.id === rider.id) {
      setSelectedRider({ ...selectedRider, isActive: newActive })
    }

    setTogglingId(rider.id)
    try {
      await api.patch(`/api/admin/users/${rider.id}/toggle-active`)
      showSuccess(`${rider.fullName} ${newActive ? 'activated' : 'deactivated'}`)
    } catch (err: any) {
      setRiders(previousRiders)
      setSelectedRider(previousSelected)
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
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h2 className="text-2xl font-bold text-gray-900">Riders</h2>
        <button
          onClick={() => setCreateModalOpen(true)}
          className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700"
        >
          + Add Rider
        </button>
      </div>

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
        <table className="w-full text-sm min-w-[650px]">
          <thead>
            <tr className="bg-gray-50 text-left text-gray-500 text-xs uppercase">
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Phone</th>
              <th className="px-4 py-3">Deliveries</th>
              <th className="px-4 py-3">Active</th>
              <th className="px-4 py-3">Joined</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="text-center py-8 text-gray-400">Loading riders...</td></tr>
            ) : riders.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-8 text-gray-400">No riders found</td></tr>
            ) : (
              riders.map((rider) => (
                <tr
                  key={rider.id}
                  onClick={() => openDetail(rider.id)}
                  className="border-t border-gray-100 hover:bg-gray-50 cursor-pointer"
                >
                  <td className="px-4 py-3 font-medium">{rider.fullName}</td>
                  <td className="px-4 py-3 text-gray-500">{rider.phoneNumber}</td>
                  <td className="px-4 py-3 text-gray-500">{rider._count.assignedDeliveries}</td>
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <Toggle checked={rider.isActive} onChange={() => handleToggleActive(rider)} />
                  </td>
                  <td className="px-4 py-3 text-gray-500">{formatDate(rider.createdAt)}</td>
                  <td className="px-4 py-3 text-right text-gray-300">
                    <ChevronRight size={16} className="inline" />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />

      {/* Create Rider Modal */}
      <Modal isOpen={createModalOpen} onClose={() => setCreateModalOpen(false)} title="Add New Rider">
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">Full Name</label>
            <input
              value={createForm.fullName}
              onChange={(e) => setCreateForm({ ...createForm, fullName: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              placeholder="e.g. Musa Ibrahim"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Phone Number</label>
            <input
              value={createForm.phoneNumber}
              onChange={(e) => setCreateForm({ ...createForm, phoneNumber: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              placeholder="08012345678"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Email (optional)</label>
            <input
              value={createForm.email}
              onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input
              type="password"
              value={createForm.password}
              onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              placeholder="At least 6 characters"
            />
          </div>
          <LoadingButton loading={creating} onClick={handleCreate} className="w-full py-2.5">
            Create Rider
          </LoadingButton>
        </div>
      </Modal>

      {/* Rider Detail Modal */}
      <Modal
        isOpen={!!selectedRider}
        onClose={() => setSelectedRider(null)}
        title={selectedRider?.fullName || ''}
      >
        {selectedRider && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-brand-50 flex items-center justify-center">
                <Bike size={22} className="text-brand-600" />
              </div>
              <div>
                <p className="font-medium">{selectedRider.fullName}</p>
                <p className="text-sm text-gray-500">
                  {selectedRider.isActive ? 'Active' : 'Deactivated'}
                </p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-3 space-y-2 text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <Phone size={14} /> {selectedRider.phoneNumber}
              </div>
              {selectedRider.email && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Mail size={14} /> {selectedRider.email}
                </div>
              )}
            </div>

            <div>
              <p className="text-xs text-gray-500 mb-2">Recent Deliveries ({selectedRider._count.assignedDeliveries} total)</p>
              {selectedRider.assignedDeliveries.length === 0 ? (
                <p className="text-sm text-gray-400">No deliveries yet</p>
              ) : (
                <div className="space-y-2">
                  {selectedRider.assignedDeliveries.map((d) => (
                    <div key={d.id} className="flex justify-between items-center border border-gray-100 rounded-lg px-3 py-2 text-sm">
                      <span className="font-medium">{d.orderNumber}</span>
                      <span className="text-gray-500 capitalize">{d.status.replace('_', ' ')}</span>
                      <span>{formatCurrency(d.totalAmount)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <LoadingButton
              loading={togglingId === selectedRider.id}
              onClick={() => handleToggleActive(selectedRider)}
              variant="ghost"
              className={`w-full py-2 border rounded-lg ${
                selectedRider.isActive
                  ? 'border-red-200 text-red-600 hover:bg-red-50'
                  : 'border-green-200 text-green-600 hover:bg-green-50'
              }`}
            >
              {selectedRider.isActive ? 'Deactivate Rider' : 'Activate Rider'}
            </LoadingButton>
          </div>
        )}
      </Modal>
    </Layout>
  )
}