import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Bike, Phone, Mail, Search, ChevronRight, Plus } from 'lucide-react'
import LoadingButton from '../components/LoadingButton'
import { showSuccess, showError, getErrorMessage } from '../lib/toast'
import Layout from '../components/Layout'
import Modal from '../components/Modal'
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

const inputClass = "w-full border border-surface-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 transition-shadow"

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
      return showError('Full name, phone number and password are required')
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
        <div>
          <h2 className="text-2xl font-bold text-surface-900">Riders</h2>
          <p className="text-sm text-surface-400 mt-0.5">Your delivery team</p>
        </div>
        <LoadingButton onClick={() => setCreateModalOpen(true)} className="px-4 py-2.5">
          <Plus size={16} /> Add Rider
        </LoadingButton>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2 mb-4">
        <div className="relative w-64">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
          <input
            type="text"
            placeholder="Search by name or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
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

      <div className="bg-white rounded-2xl border border-surface-100 overflow-x-auto">
        <table className="w-full text-sm min-w-[650px]">
          <thead>
            <tr className="bg-surface-50 text-left text-surface-500 text-xs uppercase">
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
              <tr><td colSpan={6} className="text-center py-8 text-surface-400">Loading riders...</td></tr>
            ) : riders.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-8 text-surface-400">No riders found</td></tr>
            ) : (
              riders.map((rider, i) => (
                <motion.tr
                  key={rider.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.2, delay: i * 0.02 }}
                  onClick={() => openDetail(rider.id)}
                  className="border-t border-surface-100 hover:bg-surface-50 cursor-pointer"
                >
                  <td className="px-4 py-3 font-medium text-surface-900">{rider.fullName}</td>
                  <td className="px-4 py-3 text-surface-500">{rider.phoneNumber}</td>
                  <td className="px-4 py-3 text-surface-500">{rider._count.assignedDeliveries}</td>
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <Toggle checked={rider.isActive} onChange={() => handleToggleActive(rider)} />
                  </td>
                  <td className="px-4 py-3 text-surface-500">{formatDate(rider.createdAt)}</td>
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

      {/* Create Rider Modal */}
      <Modal isOpen={createModalOpen} onClose={() => setCreateModalOpen(false)} title="Add New Rider">
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1 text-surface-700">Full Name</label>
            <input
              value={createForm.fullName}
              onChange={(e) => setCreateForm({ ...createForm, fullName: e.target.value })}
              className={inputClass}
              placeholder="e.g. Musa Ibrahim"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-surface-700">Phone Number</label>
            <input
              value={createForm.phoneNumber}
              onChange={(e) => setCreateForm({ ...createForm, phoneNumber: e.target.value })}
              className={inputClass}
              placeholder="08012345678"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-surface-700">Email (optional)</label>
            <input
              value={createForm.email}
              onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-surface-700">Password</label>
            <input
              type="password"
              value={createForm.password}
              onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
              className={inputClass}
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
              <div className="w-12 h-12 rounded-2xl bg-primary-50 flex items-center justify-center">
                <Bike size={22} className="text-primary-600" />
              </div>
              <div>
                <p className="font-medium text-surface-900">{selectedRider.fullName}</p>
                <p className="text-sm text-surface-500">
                  {selectedRider.isActive ? 'Active' : 'Deactivated'}
                </p>
              </div>
            </div>

            <div className="bg-surface-50 rounded-xl p-3.5 space-y-2 text-sm">
              <div className="flex items-center gap-2 text-surface-600">
                <Phone size={14} /> {selectedRider.phoneNumber}
              </div>
              {selectedRider.email && (
                <div className="flex items-center gap-2 text-surface-600">
                  <Mail size={14} /> {selectedRider.email}
                </div>
              )}
            </div>

            <div>
              <p className="text-xs text-surface-400 mb-2">Recent Deliveries ({selectedRider._count.assignedDeliveries} total)</p>
              {selectedRider.assignedDeliveries.length === 0 ? (
                <p className="text-sm text-surface-400">No deliveries yet</p>
              ) : (
                <div className="space-y-2">
                  {selectedRider.assignedDeliveries.map((d) => (
                    <div key={d.id} className="flex justify-between items-center border border-surface-100 rounded-xl px-3 py-2 text-sm">
                      <span className="font-medium text-surface-900">{d.orderNumber}</span>
                      <span className="text-surface-500 capitalize">{d.status.replace('_', ' ')}</span>
                      <span className="text-surface-700">{formatCurrency(d.totalAmount)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <LoadingButton
              loading={togglingId === selectedRider.id}
              onClick={() => handleToggleActive(selectedRider)}
              variant="secondary"
              className={`w-full py-2.5 ${
                selectedRider.isActive
                  ? 'border-danger/30 text-danger hover:bg-danger/5'
                  : 'border-success/30 text-green-600 hover:bg-success/5'
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