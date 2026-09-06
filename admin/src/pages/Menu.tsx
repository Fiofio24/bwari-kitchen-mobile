import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import LoadingButton from '../components/LoadingButton'
import { showSuccess, showError, getErrorMessage } from '../lib/toast'
import Layout from '../components/Layout'
import Modal from '../components/Modal'
import ConfirmDialog from '../components/ConfirmDialog'
import Toggle from '../components/Toggle'
import api from '../lib/api'
import useLivePolling from '../hooks/useLivePolling'
import { Tag, UtensilsCrossed, Package as PackageIcon, ChevronRight, Plus } from 'lucide-react'

interface Category {
  id: string
  name: string
  description: string | null
  imageUrl: string | null
  sortOrder: number
  isActive: boolean
  _count: { menuItems: number }
}

interface MenuItem {
  id: string
  name: string
  description: string | null
  basePrice: number
  discountPrice: number | null
  imageUrl: string | null
  isAvailable: boolean
  isFeatured: boolean
  category: { id: string; name: string }
  variants?: { id: string; label: string; price: number; sortOrder: number }[]
}

interface Package {
  id: string
  name: string
  description: string | null
  imageUrl: string | null
  totalPrice: number
  isAvailable: boolean
  isFeatured: boolean
  items: { quantity: number; menuItem: { id: string; name: string; basePrice: number } }[]
}

type Tab = 'categories' | 'items' | 'packages'

const inputClass = "w-full border border-surface-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 transition-shadow"

export default function Menu() {
  const [tab, setTab] = useState<Tab>('categories')

  const tabIcons = {
    categories: Tag,
    items: UtensilsCrossed,
    packages: PackageIcon,
  }

  return (
    <Layout>
      <h2 className="text-2xl font-bold text-surface-900 mb-4">Menu Management</h2>

      <div className="flex gap-1 mb-6 border-b border-surface-200 overflow-x-auto">
        {(['categories', 'items', 'packages'] as Tab[]).map((t) => {
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
              {t}
            </button>
          )
        })}
      </div>

      <div className={tab === 'categories' ? 'block' : 'hidden'}>
        <CategoriesTab />
      </div>
      <div className={tab === 'items' ? 'block' : 'hidden'}>
        <ItemsTab />
      </div>
      <div className={tab === 'packages' ? 'block' : 'hidden'}>
        <PackagesTab />
      </div>
    </Layout>
  )
}

// ═══════════════════════════════════════════
// CATEGORIES TAB
// ═══════════════════════════════════════════
function CategoriesTab() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Category | null>(null)
  const [form, setForm] = useState({ name: '', description: '', sortOrder: 0 })
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const fetchCategories = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true)
    try {
      const res = await api.get('/api/admin/menu/categories')
      const sorted = [...res.data.categories].sort((a: Category, b: Category) =>
        a.name.localeCompare(b.name)
      )
      setCategories(sorted)
    } finally {
      if (!isSilent) setLoading(false)
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => fetchCategories(false), 0)
    return () => clearTimeout(timer)
  }, [fetchCategories])
  
  useLivePolling(fetchCategories, 15000)

  const openCreate = () => {
    setEditing(null)
    setForm({ name: '', description: '', sortOrder: categories.length + 1 })
    setModalOpen(true)
  }

  const openEdit = (cat: Category) => {
    setEditing(cat)
    setForm({ name: cat.name, description: cat.description || '', sortOrder: cat.sortOrder })
    setModalOpen(true)
  }

  const handleSave = async () => {
    if (!form.name.trim()) return showError('Name is required')
    setSaving(true)
    try {
      if (editing) {
        await api.patch(`/api/admin/menu/categories/${editing.id}`, form)
        showSuccess('Category updated')
      } else {
        await api.post('/api/admin/menu/categories', form)
        showSuccess('Category created')
      }
      setModalOpen(false)
      fetchCategories(true)
    } catch (err) {
      showError(getErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const handleToggle = async (cat: Category) => {
    const previousCategories = categories
    const newActive = !cat.isActive

    setCategories((prev) =>
      prev.map((c) => (c.id === cat.id ? { ...c, isActive: newActive } : c))
    )

    try {
      const res = await api.patch(`/api/admin/menu/categories/${cat.id}/availability`)
      showSuccess(res.data.message)
    } catch (err) {
      setCategories(previousCategories)
      showError(getErrorMessage(err))
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await api.delete(`/api/admin/menu/categories/${deleteTarget.id}`)
      showSuccess('Category deleted')
      setDeleteTarget(null)
      fetchCategories(true)
    } catch (err) {
      showError(getErrorMessage(err))
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <LoadingButton onClick={openCreate} className="px-4 py-2.5">
          <Plus size={16} /> Add Category
        </LoadingButton>
      </div>

      <div className="bg-white rounded-2xl border border-surface-100 overflow-x-auto">
        <table className="w-full text-sm min-w-[600px]">
          <thead>
            <tr className="bg-surface-50 text-left text-surface-500 text-xs uppercase">
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Items</th>
              <th className="px-4 py-3">Active</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} className="text-center py-8 text-surface-400">Loading...</td></tr>
            ) : categories.map((cat, i) => (
              <motion.tr
                key={cat.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2, delay: i * 0.02 }}
                onClick={() => openEdit(cat)}
                className="border-t border-surface-100 hover:bg-surface-50 cursor-pointer"
              >
                <td className="px-4 py-3 font-medium text-surface-900">{cat.name}</td>
                <td className="px-4 py-3 text-surface-500">{cat._count.menuItems}</td>
                <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                  <Toggle checked={cat.isActive} onChange={() => handleToggle(cat)} />
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-3">
                    <button
                      onClick={(e) => { e.stopPropagation(); setDeleteTarget(cat) }}
                      className="text-danger font-medium hover:text-red-700 transition-colors"
                    >
                      Delete
                    </button>
                    <ChevronRight size={16} className="text-surface-300" />
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Category' : 'New Category'}>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1 text-surface-700">Name</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-surface-700">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className={inputClass}
              rows={2}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-surface-700">Sort Order</label>
            <input
              type="number"
              value={form.sortOrder}
              onChange={(e) => setForm({ ...form, sortOrder: parseInt(e.target.value) || 0 })}
              className={inputClass}
            />
          </div>
          <LoadingButton loading={saving} onClick={handleSave} className="w-full py-2.5 mt-2">
            {editing ? 'Save Changes' : 'Create Category'}
          </LoadingButton>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete Category"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This only works if it has no items.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        confirmLabel="Delete"
        danger
        loading={deleting}
      />
    </div>
  )
}

// ═══════════════════════════════════════════
// ITEMS TAB
// ═══════════════════════════════════════════
function ItemsTab() {
  const [items, setItems] = useState<MenuItem[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [categoryFilter, setCategoryFilter] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<MenuItem | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [form, setForm] = useState({
    categoryId: '', name: '', description: '', basePrice: '',
    discountPrice: '', isFeatured: false,
  })
  const [variants, setVariants] = useState<{ label: string; price: string }[]>([])
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<MenuItem | null>(null)

  const fetchCategories = useCallback(async () => {
    const res = await api.get('/api/admin/menu/categories')
    const sorted = [...res.data.categories].sort((a: Category, b: Category) =>
      a.name.localeCompare(b.name)
    )
    setCategories(sorted)
  }, [])

  const fetchItems = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true)
    try {
      const params = categoryFilter ? `?categoryId=${categoryFilter}` : ''
      const res = await api.get(`/api/admin/menu/items${params}`)
      const sorted = [...res.data.items].sort((a: MenuItem, b: MenuItem) =>
        a.name.localeCompare(b.name)
      )
      setItems(sorted)
    } finally {
      if (!isSilent) setLoading(false)
    }
  }, [categoryFilter])

  useEffect(() => { 
    const timer = setTimeout(() => fetchCategories(), 0)
    return () => clearTimeout(timer)
  }, [fetchCategories])

  useEffect(() => { 
    const timer = setTimeout(() => fetchItems(false), 0)
    return () => clearTimeout(timer)
  }, [fetchItems])
  
  useLivePolling(fetchItems, 15000)

  const openCreate = () => {
    setEditing(null)
    setForm({ categoryId: categories[0]?.id || '', name: '', description: '', basePrice: '', discountPrice: '', isFeatured: false })
    setVariants([])
    setImageFile(null)
    setModalOpen(true)
  }

  const openEdit = (item: MenuItem) => {
    setEditing(item)
    setForm({
      categoryId: item.category.id,
      name: item.name,
      description: item.description || '',
      basePrice: String(item.basePrice),
      discountPrice: item.discountPrice ? String(item.discountPrice) : '',
      isFeatured: item.isFeatured,
    })
    setVariants((item.variants || []).map(v => ({ label: v.label, price: String(v.price) })))
    setImageFile(null)
    setModalOpen(true)
  }

  const addVariantRow = () => {
    setVariants([...variants, { label: '', price: '' }])
  }

  const updateVariantRow = (index: number, field: 'label' | 'price', value: string) => {
    const updated = [...variants]
    updated[index] = { ...updated[index], [field]: value }
    setVariants(updated)
  }

  const removeVariantRow = (index: number) => {
    setVariants(variants.filter((_, i) => i !== index))
  }

  const handleSave = async () => {
    if (!form.name.trim() || !form.basePrice) return showError('Name and price are required')

    const invalidVariant = variants.find(v => !v.label.trim() || !v.price || isNaN(parseFloat(v.price)))
    if (invalidVariant) return showError('Each variant needs a label and a valid price')

    setSaving(true)
    try {
      let itemId = editing?.id
      const payload = {
        ...form,
        variants: variants.map((v, i) => ({ label: v.label, price: parseFloat(v.price), sortOrder: i })),
      }

      if (editing) {
        await api.patch(`/api/admin/menu/items/${editing.id}`, payload)
      } else {
        const res = await api.post('/api/admin/menu/items', payload)
        itemId = res.data.item.id
      }

      if (imageFile && itemId) {
        const formData = new FormData()
        formData.append('image', imageFile)
        await api.post(`/api/upload/menu-item/${itemId}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
      }

      setModalOpen(false)
      fetchItems(true)
      showSuccess(editing ? 'Item updated' : 'Item created')
    } catch (err) {
      showError(getErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const handleToggle = async (item: MenuItem) => {
    const previousItems = items
    const newAvailable = !item.isAvailable

    setItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, isAvailable: newAvailable } : i))
    )

    try {
      const res = await api.patch(`/api/admin/menu/items/${item.id}/availability`)
      showSuccess(res.data.message)
    } catch (err) {
      setItems(previousItems)
      showError(getErrorMessage(err))
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await api.delete(`/api/admin/menu/items/${deleteTarget.id}`)
      showSuccess('Item deleted')
      setDeleteTarget(null)
      fetchItems(true)
    } catch (err) {
      showError(getErrorMessage(err))
    } finally {
      setDeleting(false)
    }
  }

  const formatCurrency = (amount: number) => `₦${Number(amount).toLocaleString()}`

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className={inputClass + ' w-auto'}
        >
          <option value="">All Categories</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <LoadingButton onClick={openCreate} className="px-4 py-2.5">
          <Plus size={16} /> Add Item
        </LoadingButton>
      </div>

      <div className="bg-white rounded-2xl border border-surface-100 overflow-x-auto">
        <table className="w-full text-sm min-w-[700px]">
          <thead>
            <tr className="bg-surface-50 text-left text-surface-500 text-xs uppercase">
              <th className="px-4 py-3">Item</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Price</th>
              <th className="px-4 py-3">Available</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="text-center py-8 text-surface-400">Loading...</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-8 text-surface-400">No items in this category</td></tr>
            ) : items.map((item, i) => (
              <motion.tr
                key={item.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2, delay: i * 0.02 }}
                onClick={() => openEdit(item)}
                className="border-t border-surface-100 hover:bg-surface-50 cursor-pointer"
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} className="w-10 h-10 rounded-xl object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-surface-100" />
                    )}
                    <div>
                      <div className="font-medium text-surface-900">{item.name}</div>
                      {item.isFeatured && <span className="text-xs text-brand-600 font-medium">★ Featured</span>}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-surface-500">{item.category.name}</td>
                <td className="px-4 py-3">
                  {item.discountPrice ? (
                    <span>
                      <span className="line-through text-surface-400 mr-1">{formatCurrency(item.basePrice)}</span>
                      <span className="font-medium text-surface-900">{formatCurrency(item.discountPrice)}</span>
                    </span>
                  ) : <span className="text-surface-900">{formatCurrency(item.basePrice)}</span>}
                </td>
                <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                  <Toggle checked={item.isAvailable} onChange={() => handleToggle(item)} />
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-3">
                    <button
                      onClick={(e) => { e.stopPropagation(); setDeleteTarget(item) }}
                      className="text-danger font-medium hover:text-red-700 transition-colors"
                    >
                      Delete
                    </button>
                    <ChevronRight size={16} className="text-surface-300" />
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Item' : 'New Item'}>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1 text-surface-700">Category</label>
            <select
              value={form.categoryId}
              onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
              className={inputClass}
            >
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-surface-700">Name</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-surface-700">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className={inputClass}
              rows={2}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1 text-surface-700">Base Price (₦)</label>
              <input
                type="number"
                value={form.basePrice}
                onChange={(e) => setForm({ ...form, basePrice: e.target.value })}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-surface-700">Discount Price (₦)</label>
              <input
                type="number"
                value={form.discountPrice}
                onChange={(e) => setForm({ ...form, discountPrice: e.target.value })}
                className={inputClass}
              />
            </div>
            <div className="col-span-2">
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-surface-700">Portion Variants (optional)</label>
                <button onClick={addVariantRow} className="text-sm text-primary-600 font-medium hover:text-primary-700">+ Add variant</button>
              </div>
              {variants.length > 0 && (
                <div className="space-y-2">
                  {variants.map((v, i) => (
                    <div key={i} className="flex gap-2 items-center">
                      <input
                        placeholder="Label (e.g. Full Portion)"
                        value={v.label}
                        onChange={(e) => updateVariantRow(i, 'label', e.target.value)}
                        className="flex-1 border border-surface-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30"
                      />
                      <input
                        type="number"
                        placeholder="Price"
                        value={v.price}
                        onChange={(e) => updateVariantRow(i, 'price', e.target.value)}
                        className="w-24 border border-surface-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30"
                      />
                      <button onClick={() => removeVariantRow(i)} className="text-danger px-1 hover:text-red-700">&times;</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-surface-700">Image</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setImageFile(e.target.files?.[0] || null)}
              className="w-full text-sm"
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-surface-700">
            <input
              type="checkbox"
              checked={form.isFeatured}
              onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })}
            />
            Featured item
          </label>
          <LoadingButton loading={saving} onClick={handleSave} className="w-full py-2.5 mt-2">
            {editing ? 'Save Changes' : 'Create Item'}
          </LoadingButton>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete Item"
        message={`Are you sure you want to delete "${deleteTarget?.name}"?`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        confirmLabel="Delete"
        danger
        loading={deleting}
      />
    </div>
  )
}

// ═══════════════════════════════════════════
// PACKAGES TAB
// ═══════════════════════════════════════════
function PackagesTab() {
  const [packages, setPackages] = useState<Package[]>([])
  const [items, setItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Package | null>(null)
  const [form, setForm] = useState({ name: '', description: '', totalPrice: '', isFeatured: false })
  const [packageItems, setPackageItems] = useState<{ menuItemId: string; quantity: number }[]>([])
  const [priceOverridden, setPriceOverridden] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Package | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const fetchItems = useCallback(async () => {
    const res = await api.get('/api/admin/menu/items?limit=100')
    const sorted = [...res.data.items].sort((a: MenuItem, b: MenuItem) =>
      a.name.localeCompare(b.name)
    )
    setItems(sorted)
  }, [])

  const fetchPackages = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true)
    try {
      const res = await api.get('/api/admin/menu/packages')
      const sorted = [...res.data.packages].sort((a: Package, b: Package) =>
        a.name.localeCompare(b.name)
      )
      setPackages(sorted)
    } finally {
      if (!isSilent) setLoading(false)
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPackages(false)
      fetchItems()
    }, 0)
    return () => clearTimeout(timer)
  }, [fetchPackages, fetchItems])
  
  useLivePolling(fetchPackages, 15000)

  const calculatedTotal = packageItems.reduce((sum, pi) => {
    const item = items.find((i) => i.id === pi.menuItemId)
    if (!item) return sum
    const price = item.discountPrice ?? item.basePrice
    return sum + Number(price) * pi.quantity
  }, 0)

  useEffect(() => {
    if (!priceOverridden) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setForm((f) => ({ ...f, totalPrice: calculatedTotal ? String(calculatedTotal) : '' }))
    }
  }, [packageItems, items, priceOverridden, calculatedTotal])

  const openCreate = () => {
    setEditing(null)
    setForm({ name: '', description: '', totalPrice: '', isFeatured: false })
    setPackageItems([])
    setPriceOverridden(false)
    setImageFile(null)
    setModalOpen(true)
  }

  const openEdit = (pkg: Package) => {
    setEditing(pkg)
    setForm({ name: pkg.name, description: pkg.description || '', totalPrice: String(pkg.totalPrice), isFeatured: pkg.isFeatured })
    setPackageItems(pkg.items.map((i) => ({ menuItemId: i.menuItem.id, quantity: i.quantity })))
    setPriceOverridden(true)
    setImageFile(null)
    setModalOpen(true)
  }

  const addItemRow = () => {
    if (items.length === 0) return
    setPackageItems([...packageItems, { menuItemId: items[0].id, quantity: 1 }])
  }

  const updateItemRow = (index: number, field: 'menuItemId' | 'quantity', value: string | number) => {
    const updated = [...packageItems]
    updated[index] = { ...updated[index], [field]: value }
    setPackageItems(updated)
  }

  const removeItemRow = (index: number) => {
    setPackageItems(packageItems.filter((_, i) => i !== index))
  }

  const handlePriceEdit = (value: string) => {
    setForm({ ...form, totalPrice: value })
    setPriceOverridden(true)
  }

  const resetToCalculated = () => {
    setForm({ ...form, totalPrice: String(calculatedTotal) })
    setPriceOverridden(false)
  }

  const handleSave = async () => {
    if (!form.name.trim() || !form.totalPrice) return showError('Name and price are required')
    if (packageItems.length === 0) return showError('Add at least one item')

    setSaving(true)
    try {
      const payload = { ...form, items: packageItems }
      let packageId = editing?.id

      if (editing) {
        await api.patch(`/api/admin/menu/packages/${editing.id}`, payload)
      } else {
        const res = await api.post('/api/admin/menu/packages', payload)
        packageId = res.data.package.id
      }

      if (imageFile && packageId) {
        const formData = new FormData()
        formData.append('image', imageFile)
        await api.post(`/api/upload/package/${packageId}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
      }

      setModalOpen(false)
      fetchPackages(true)
      showSuccess(editing ? 'Package updated' : 'Package created')
    } catch (err) {
      showError(getErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const handleToggle = async (pkg: Package) => {
    const previousPackages = packages
    const newAvailable = !pkg.isAvailable

    setPackages((prev) =>
      prev.map((p) => (p.id === pkg.id ? { ...p, isAvailable: newAvailable } : p))
    )

    try {
      const res = await api.patch(`/api/admin/menu/packages/${pkg.id}/availability`)
      showSuccess(res.data.message)
    } catch (err) {
      setPackages(previousPackages)
      showError(getErrorMessage(err))
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await api.delete(`/api/admin/menu/packages/${deleteTarget.id}`)
      showSuccess('Package deleted')
      setDeleteTarget(null)
      fetchPackages(true)
    } catch (err) {
      showError(getErrorMessage(err))
    } finally {
      setDeleting(false)
    }
  }

  const formatCurrency = (amount: number) => `₦${Number(amount).toLocaleString()}`

  return (
    <div>
      <div className="flex justify-end mb-4">
        <LoadingButton onClick={openCreate} className="px-4 py-2.5">
          <Plus size={16} /> Add Package
        </LoadingButton>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading ? (
          <p className="text-surface-400">Loading...</p>
        ) : packages.map((pkg, i) => (
          <motion.div
            key={pkg.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: i * 0.04 }}
            onClick={() => openEdit(pkg)}
            className="bg-white rounded-2xl border border-surface-100 p-4 cursor-pointer hover:border-primary-200 hover:shadow-lg hover:shadow-surface-900/5 transition-all"
          >
            <div className="flex gap-3 mb-2">
              {pkg.imageUrl ? (
                <img src={pkg.imageUrl} className="w-14 h-14 rounded-xl object-cover flex-shrink-0" />
              ) : (
                <div className="w-14 h-14 rounded-xl bg-surface-100 flex-shrink-0" />
              )}
              <div className="flex-1 flex justify-between items-start">
                <div>
                  <p className="font-medium text-surface-900">{pkg.name}</p>
                  <p className="text-sm text-surface-500">{formatCurrency(pkg.totalPrice)}</p>
                </div>
                <div onClick={(e) => e.stopPropagation()}>
                  <Toggle checked={pkg.isAvailable} onChange={() => handleToggle(pkg)} />
                </div>
              </div>
            </div>
            <ul className="text-sm text-surface-500 mb-3 space-y-0.5">
              {pkg.items.map((item, j) => (
                <li key={j}>• {item.menuItem.name} × {item.quantity}</li>
              ))}
            </ul>
            <div className="flex gap-3 text-sm pt-2 border-t border-surface-50">
              <button
                onClick={(e) => { e.stopPropagation(); setDeleteTarget(pkg) }}
                className="text-danger font-medium hover:text-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Package' : 'New Package'} maxWidth="max-w-xl">
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1 text-surface-700">Name</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-surface-700">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className={inputClass}
              rows={2}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-surface-700">Image</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setImageFile(e.target.files?.[0] || null)}
              className="w-full text-sm"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-surface-700">Items</label>
              <button onClick={addItemRow} className="text-sm text-primary-600 font-medium hover:text-primary-700">+ Add item</button>
            </div>
            <div className="space-y-2">
              {packageItems.map((pi, i) => {
                const item = items.find((it) => it.id === pi.menuItemId)
                const lineTotal = item ? Number(item.discountPrice ?? item.basePrice) * pi.quantity : 0
                return (
                  <div key={i} className="flex gap-2 items-center">
                    <select
                      value={pi.menuItemId}
                      onChange={(e) => updateItemRow(i, 'menuItemId', e.target.value)}
                      className="flex-1 border border-surface-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30"
                    >
                      {items.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                    </select>
                    <input
                      type="number"
                      min="1"
                      value={pi.quantity}
                      onChange={(e) => updateItemRow(i, 'quantity', parseInt(e.target.value) || 1)}
                      className="w-16 border border-surface-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30"
                    />
                    <span className="text-xs text-surface-400 w-20 text-right">{formatCurrency(lineTotal)}</span>
                    <button onClick={() => removeItemRow(i)} className="text-danger px-1 hover:text-red-700">&times;</button>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="bg-surface-50 rounded-xl p-3.5">
            <div className="flex justify-between items-center text-sm mb-2">
              <span className="text-surface-500">Calculated from items</span>
              <span className="font-medium text-surface-900">{formatCurrency(calculatedTotal)}</span>
            </div>
            <label className="block text-sm font-medium mb-1 text-surface-700">Package Price (₦)</label>
            <div className="flex gap-2">
              <input
                type="number"
                value={form.totalPrice}
                onChange={(e) => handlePriceEdit(e.target.value)}
                className={inputClass}
              />
              {priceOverridden && (
                <button
                  onClick={resetToCalculated}
                  className="px-3 py-2 text-xs text-primary-600 border border-primary-200 rounded-xl hover:bg-primary-50 whitespace-nowrap transition-colors"
                >
                  Use calculated
                </button>
              )}
            </div>
            {priceOverridden && (
              <p className="text-xs text-amber-600 mt-1.5">Price manually overridden — won't auto-update with item changes</p>
            )}
          </div>

          <label className="flex items-center gap-2 text-sm text-surface-700">
            <input
              type="checkbox"
              checked={form.isFeatured}
              onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })}
            />
            Featured package
          </label>

          <LoadingButton loading={saving} onClick={handleSave} className="w-full py-2.5 mt-2">
            {editing ? 'Save Changes' : 'Create Package'}
          </LoadingButton>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete Package"
        message={`Are you sure you want to delete "${deleteTarget?.name}"?`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        confirmLabel="Delete"
        danger
        loading={deleting}
      />
    </div>
  )
}