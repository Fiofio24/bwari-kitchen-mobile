import { useEffect, useState, useCallback, UIEvent } from 'react'
import LoadingButton from '../components/LoadingButton'
import { showSuccess, showError, getErrorMessage } from '../lib/toast'
import Layout from '../components/Layout'
import Modal from '../components/Modal'
import ConfirmDialog from '../components/ConfirmDialog'
import Toggle from '../components/Toggle'
import api from '../lib/api'
import useLivePolling from '../hooks/useLivePolling'
import { Tag, Percent, Wallet, Truck, Gift, Plus, Loader2 } from 'lucide-react'

interface Promotion {
  id: string
  code: string
  description: string | null
  type: 'percentage' | 'fixed' | 'free_delivery' | 'bogo'
  value: number
  minOrderAmount: number
  maxUses: number | null
  usesCount: number
  perUserLimit: number
  validFrom: string | null
  validUntil: string | null
  isActive: boolean
  createdAt: string
  _count: { usages: number }
}

interface PromotionDetail extends Promotion {
  usages: {
    discountApplied: number
    usedAt: string
    user: { fullName: string; phoneNumber: string }
    order: { orderNumber: string; totalAmount: number }
  }[]
}

const typeIcons = {
  percentage: Percent,
  fixed: Wallet,
  free_delivery: Truck,
  bogo: Gift,
}

const typeLabels = {
  percentage: 'Percentage off',
  fixed: 'Fixed amount off',
  free_delivery: 'Free delivery',
  bogo: 'Buy one get one',
}

export default function Promotions() {
  const [promos, setPromos] = useState<Promotion[]>([])
  const [loading, setLoading] = useState(true)
  const [isFetchingMore, setIsFetchingMore] = useState(false)
  
  // Infinite Scroll States
  const [fetchLimit, setFetchLimit] = useState(50)
  const [hasMore, setHasMore] = useState(true)

  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [form, setForm] = useState({
    description: '', type: 'percentage' as Promotion['type'],
    value: '', minOrderAmount: '', maxUses: '', perUserLimit: '1', validUntil: '',
  })
  const [creating, setCreating] = useState(false)

  const [selectedPromo, setSelectedPromo] = useState<PromotionDetail | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Promotion | null>(null)

  const fetchPromos = useCallback(async (isSilent = false) => {
    if (!isSilent) {
      if (fetchLimit === 50) setLoading(true)
      else setIsFetchingMore(true)
    }
    try {
      const res = await api.get(`/api/admin/promotions?limit=${fetchLimit}`)
      const sorted = [...res.data.promos].sort((a: Promotion, b: Promotion) =>
        a.code.localeCompare(b.code)
      )
      setPromos(sorted)
      
      if (res.data.promos.length < fetchLimit) {
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
  }, [fetchLimit])

  useEffect(() => {
    fetchPromos(false)
  }, [fetchPromos])

  useLivePolling(fetchPromos, 15000)

  const handleScroll = (e: UIEvent<HTMLDivElement>) => {
    const { scrollTop, clientHeight, scrollHeight } = e.currentTarget
    if (scrollHeight - scrollTop <= clientHeight + 50) {
      if (hasMore && !loading && !isFetchingMore) {
        setFetchLimit(prev => prev + 50)
      }
    }
  }

  const openCreate = () => {
    setForm({
      description: '', type: 'percentage',
      value: '', minOrderAmount: '', maxUses: '', perUserLimit: '1', validUntil: '',
    })
    setCreateModalOpen(true)
  }

  const handleCreate = async () => {
    if (!form.value) {
      return showError('Value is required')
    }
    setCreating(true)
    try {
      const res = await api.post('/api/admin/promotions', {
        ...form,
        validUntil: form.validUntil ? new Date(form.validUntil).toISOString() : undefined,
      })
      setCreateModalOpen(false)
      fetchPromos(true)
      showSuccess(`Promotion created — code: ${res.data.promo.code}`)
    } catch (err: any) {
      showError(getErrorMessage(err))
    } finally {
      setCreating(false)
    }
  }

  const openDetail = async (id: string) => {
    const res = await api.get(`/api/admin/promotions/${id}`)
    setSelectedPromo(res.data.promo)
  }

  const handleToggle = async (promo: Promotion) => {
    const previousPromos = promos
    const previousSelected = selectedPromo
    const newActive = !promo.isActive

    setPromos((prev) =>
      prev.map((p) => (p.id === promo.id ? { ...p, isActive: newActive } : p))
    )
    if (selectedPromo?.id === promo.id) {
      setSelectedPromo({ ...selectedPromo, isActive: newActive })
    }

    setTogglingId(promo.id)
    try {
      await api.patch(`/api/admin/promotions/${promo.id}/toggle`)
      showSuccess(`${promo.code} ${newActive ? 'activated' : 'deactivated'}`)
    } catch (err: any) {
      setPromos(previousPromos)
      setSelectedPromo(previousSelected)
      showError(getErrorMessage(err))
    } finally {
      setTogglingId(null)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const res = await api.delete(`/api/admin/promotions/${deleteTarget.id}`)
      setDeleteTarget(null)
      fetchPromos(true)
      showSuccess(res.data.message || 'Promotion deleted')
    } catch (err: any) {
      showError(getErrorMessage(err))
    } finally {
      setDeleting(false)
    }
  }

  const formatCurrency = (amount: number) => `₦${Number(amount).toLocaleString()}`
  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('en-NG', { dateStyle: 'medium' })

  const getValueDisplay = (promo: Promotion) => {
    switch (promo.type) {
      case 'percentage': return `${promo.value}% off`
      case 'fixed': return `${formatCurrency(promo.value)} off`
      case 'free_delivery': return 'Free delivery'
      case 'bogo': return '50% off (BOGO)'
    }
  }

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h2 className="text-2xl font-bold text-gray-900">Promotions</h2>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700"
        >
          <Plus size={16} /> New Promotion
        </button>
      </div>

      <div 
        className="max-h-[70vh] overflow-y-auto pr-2 relative"
        onScroll={handleScroll}
      >
        {loading ? (
          <p className="text-gray-400">Loading promotions...</p>
        ) : promos.length === 0 ? (
          <p className="text-gray-400">No promotions created yet</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {promos.map((promo) => {
              const Icon = typeIcons[promo.type]
              const expired = promo.validUntil && new Date(promo.validUntil) < new Date()
              const usedUp = promo.maxUses !== null && promo.usesCount >= promo.maxUses

                return (
                <div
                  key={promo.id}
                  onClick={() => openDetail(promo.id)}
                  className="bg-white rounded-xl border border-gray-100 p-4 cursor-pointer hover:border-brand-200 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 rounded-lg bg-brand-50 flex items-center justify-center">
                        <Icon size={18} className="text-brand-600" />
                      </div>
                      <div>
                        <p className="font-semibold tracking-wide">{promo.code}</p>
                        <p className="text-xs text-gray-400">{typeLabels[promo.type]}</p>
                      </div>
                    </div>
                    <div onClick={(e) => e.stopPropagation()}>
                      <Toggle checked={promo.isActive} onChange={() => handleToggle(promo)} />
                    </div>
                  </div>

                  <p className="text-sm font-medium mb-1">{getValueDisplay(promo)}</p>
                  {promo.description && (
                    <p className="text-xs text-gray-500 mb-3 line-clamp-2">{promo.description}</p>
                  )}

                  <div className="text-xs text-gray-400 space-y-1 mb-3">
                    <p>Min order: {formatCurrency(promo.minOrderAmount)}</p>
                    <p>
                      Used: {promo.usesCount}{promo.maxUses !== null && ` / ${promo.maxUses}`}
                    </p>
                    {promo.validUntil && (
                      <p className={expired ? 'text-red-500' : ''}>
                        Expires: {formatDate(promo.validUntil)}
                      </p>
                    )}
                  </div>

                  {(expired || usedUp) && (
                    <span className="inline-block text-xs px-2 py-0.5 rounded-full bg-red-50 text-red-600 mb-2">
                      {expired ? 'Expired' : 'Usage limit reached'}
                    </span>
                  )}

                  <div className="flex gap-3 text-sm pt-2 border-t border-gray-100">
                    <button
                      onClick={(e) => { e.stopPropagation(); setDeleteTarget(promo) }}
                      className="text-red-500 font-medium"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {isFetchingMore && (
          <div className="flex justify-center items-center p-4 text-surface-500 gap-2 mt-4">
            <Loader2 size={18} className="animate-spin" />
            <span className="text-sm font-medium">Loading more promotions...</span>
          </div>
        )}
      </div>

      {/* Create Modal */}
      <Modal isOpen={createModalOpen} onClose={() => setCreateModalOpen(false)} title="New Promotion">
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <input
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              placeholder="e.g. 20% off your first order"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Type</label>
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value as Promotion['type'] })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="percentage">Percentage off</option>
              <option value="fixed">Fixed amount off</option>
              <option value="free_delivery">Free delivery</option>
              <option value="bogo">Buy one get one (50% off)</option>
            </select>
          </div>

          {form.type !== 'free_delivery' && form.type !== 'bogo' && (
            <div>
              <label className="block text-sm font-medium mb-1">
                Value {form.type === 'percentage' ? '(%)' : '(₦)'}
              </label>
              <input
                type="number"
                value={form.value}
                onChange={(e) => setForm({ ...form, value: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                placeholder={form.type === 'percentage' ? 'e.g. 20' : 'e.g. 500'}
              />
            </div>
          )}

          {form.type === 'free_delivery' && (
            <div>
              <label className="block text-sm font-medium mb-1">Delivery Fee Value to Cover (₦)</label>
              <input
                type="number"
                value={form.value}
                onChange={(e) => setForm({ ...form, value: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                placeholder="e.g. 500"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Min Order (₦)</label>
              <input
                type="number"
                value={form.minOrderAmount}
                onChange={(e) => setForm({ ...form, minOrderAmount: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Per User Limit</label>
              <input
                type="number"
                value={form.perUserLimit}
                onChange={(e) => setForm({ ...form, perUserLimit: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Max Total Uses</label>
              <input
                type="number"
                value={form.maxUses}
                onChange={(e) => setForm({ ...form, maxUses: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                placeholder="Unlimited"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Expires On</label>
              <input
                type="date"
                value={form.validUntil}
                onChange={(e) => setForm({ ...form, validUntil: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
          </div>

          <LoadingButton loading={creating} onClick={handleCreate} className="w-full py-2.5 mt-2">
            Create Promotion
          </LoadingButton>
        </div>
      </Modal>

      {/* Usage Detail Modal */}
      <Modal
        isOpen={!!selectedPromo}
        onClose={() => setSelectedPromo(null)}
        title={`${selectedPromo?.code} — Usage History`}
        maxWidth="max-w-xl"
      >
        {selectedPromo && (
          <div>
            <div className="bg-gray-50 rounded-lg p-3 mb-4 grid grid-cols-2 gap-2 text-sm">
              <div>
                <p className="text-xs text-gray-500">Total uses</p>
                <p className="font-medium">{selectedPromo.usesCount}{selectedPromo.maxUses !== null && ` / ${selectedPromo.maxUses}`}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Per user limit</p>
                <p className="font-medium">{selectedPromo.perUserLimit}</p>
              </div>
            </div>

            {selectedPromo.usages.length === 0 ? (
              <p className="text-sm text-gray-400">No one has used this code yet</p>
            ) : (
              <div className="space-y-2">
                {selectedPromo.usages.map((usage, i) => (
                  <div key={i} className="border border-gray-100 rounded-lg p-3 text-sm">
                    <div className="flex justify-between mb-1">
                      <span className="font-medium">{usage.user.fullName}</span>
                      <span className="text-gray-400 text-xs">
                        {new Date(usage.usedAt).toLocaleDateString('en-NG', { dateStyle: 'medium' })}
                      </span>
                    </div>
                    <div className="flex justify-between text-gray-500 text-xs">
                      <span>{usage.order.orderNumber}</span>
                      <span>Saved {formatCurrency(usage.discountApplied)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete Promotion"
        message={`Delete "${deleteTarget?.code}"? If it has been used before, it will be deactivated instead of deleted to preserve order history.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        confirmLabel="Delete"
        danger
        loading={deleting}
      />
    </Layout>
  )
}