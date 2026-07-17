import { useEffect, useState } from 'react'
import LoadingButton from '../components/LoadingButton'
import { showSuccess, showError, getErrorMessage } from '../lib/toast'
import Layout from '../components/Layout'
import Modal from '../components/Modal'
import ConfirmDialog from '../components/ConfirmDialog'
import Toggle from '../components/Toggle'
import api from '../lib/api'
import { Tag, UtensilsCrossed, Package as PackageIcon } from 'lucide-react'

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

export default function Menu() {
  const [tab, setTab] = useState<Tab>('categories')

  const tabIcons = {
    categories: Tag,
    items: UtensilsCrossed,
    packages: PackageIcon,
  }
  
  return (
    <Layout>
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Menu Management</h2>

      <div className="flex gap-1 mb-6 border-b border-gray-200 overflow-x-auto">
        {(['categories', 'items', 'packages'] as Tab[]).map((t) => {
          const Icon = tabIcons[t]
          return (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium capitalize border-b-2 transition whitespace-nowrap ${
                tab === t
                  ? 'border-brand-600 text-brand-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon size={16} />
              {t}
            </button>
          )
        })}
    </div>

      {tab === 'categories' && <CategoriesTab />}
      {tab === 'items' && <ItemsTab />}
      {tab === 'packages' && <PackagesTab />}
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
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => { fetchCategories() }, [])

  const fetchCategories = async () => {
    setLoading(true)
    const res = await api.get('/api/admin/menu/categories')
    const sorted = [...res.data.categories].sort((a: Category, b: Category) =>
      a.name.localeCompare(b.name)
    )
    setCategories(sorted)
    setLoading(false)
  }

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
      fetchCategories()
    } catch (err: any) {
      showError(getErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const handleToggle = async (cat: Category) => {
    setTogglingId(cat.id)
    try {
      const res = await api.patch(`/api/admin/menu/categories/${cat.id}/availability`)
      fetchCategories()
      showSuccess(res.data.message)
    } catch (err: any) {
      showError(getErrorMessage(err))
    } finally {
      setTogglingId(null)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await api.delete(`/api/admin/menu/categories/${deleteTarget.id}`)
      showSuccess('Category deleted')
      setDeleteTarget(null)
      fetchCategories()
    } catch (err: any) {
      showError(getErrorMessage(err))
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button
          onClick={openCreate}
          className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700"
        >
          + Add Category
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-x-auto">
        <table className="w-full text-sm min-w-[600px]">
          <thead>
            <tr className="bg-gray-50 text-left text-gray-500 text-xs uppercase">
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Items</th>
              <th className="px-4 py-3">Active</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} className="text-center py-8 text-gray-400">Loading...</td></tr>
            ) : categories.map((cat) => (
              <tr key={cat.id} className="border-t border-gray-100">
                <td className="px-4 py-3 font-medium">{cat.name}</td>
                <td className="px-4 py-3 text-gray-500">{cat._count.menuItems}</td>
                <td className="px-4 py-3">
                  <Toggle checked={cat.isActive} onChange={() => handleToggle(cat)} />
                </td>
                <td className="px-4 py-3 text-right space-x-3">
                  <button onClick={() => openEdit(cat)} className="text-brand-600 font-medium">Edit</button>
                  <button onClick={() => setDeleteTarget(cat)} className="text-red-500 font-medium">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Category' : 'New Category'}>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              rows={2}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Sort Order</label>
            <input
              type="number"
              value={form.sortOrder}
              onChange={(e) => setForm({ ...form, sortOrder: parseInt(e.target.value) || 0 })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
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
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [form, setForm] = useState({
    categoryId: '', name: '', description: '', basePrice: '',
    discountPrice: '', isFeatured: false,
  })
  const [variants, setVariants] = useState<{ label: string; price: string }[]>([])
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<MenuItem | null>(null)

  useEffect(() => {
    fetchCategories()
  }, [])

  useEffect(() => {
    fetchItems()
  }, [categoryFilter])

  const fetchCategories = async () => {
    setLoading(true)
    const res = await api.get('/api/admin/menu/categories')
    const sorted = [...res.data.categories].sort((a: Category, b: Category) =>
      a.name.localeCompare(b.name)
    )
    setCategories(sorted)
    setLoading(false)
  }

  const fetchItems = async () => {
    setLoading(true)
    const params = categoryFilter ? `?categoryId=${categoryFilter}` : ''
    const res = await api.get(`/api/admin/menu/items${params}`)
    const sorted = [...res.data.items].sort((a: MenuItem, b: MenuItem) =>
      a.name.localeCompare(b.name)
    )
    setItems(sorted)
    setLoading(false)
  }

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
      fetchItems()
      showSuccess(editing ? 'Item updated' : 'Item created')
    } catch (err: any) {
      showError(getErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const handleToggle = async (item: MenuItem) => {
    setTogglingId(item.id)
    try {
      const res = await api.patch(`/api/admin/menu/items/${item.id}/availability`)
      fetchItems()
      showSuccess(res.data.message)
    } catch (err: any) {
      showError(getErrorMessage(err))
    } finally {
      setTogglingId(null)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await api.delete(`/api/admin/menu/items/${deleteTarget.id}`)
      showSuccess('Item deleted')
      setDeleteTarget(null)
      fetchItems()
    } catch (err: any) {
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
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
        >
          <option value="">All Categories</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <button
          onClick={openCreate}
          className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700"
        >
          + Add Item
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-left text-gray-500 text-xs uppercase">
              <th className="px-4 py-3">Item</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Price</th>
              <th className="px-4 py-3">Available</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="text-center py-8 text-gray-400">Loading...</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-8 text-gray-400">No items in this category</td></tr>
            ) : items.map((item) => (
              <tr key={item.id} className="border-t border-gray-100">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} className="w-10 h-10 rounded-lg object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-gray-100" />
                    )}
                    <div>
                      <div className="font-medium">{item.name}</div>
                      {item.isFeatured && <span className="text-xs text-amber-600">★ Featured</span>}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-500">{item.category.name}</td>
                <td className="px-4 py-3">
                  {item.discountPrice ? (
                    <span>
                      <span className="line-through text-gray-400 mr-1">{formatCurrency(item.basePrice)}</span>
                      <span className="font-medium">{formatCurrency(item.discountPrice)}</span>
                    </span>
                  ) : formatCurrency(item.basePrice)}
                </td>
                <td className="px-4 py-3">
                  <Toggle checked={item.isAvailable} onChange={() => handleToggle(item)} />
                </td>
                <td className="px-4 py-3 text-right space-x-3">
                  <button onClick={() => openEdit(item)} className="text-brand-600 font-medium">Edit</button>
                  <button onClick={() => setDeleteTarget(item)} className="text-red-500 font-medium">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Item' : 'New Item'}>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">Category</label>
            <select
              value={form.categoryId}
              onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              rows={2}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Base Price (₦)</label>
              <input
                type="number"
                value={form.basePrice}
                onChange={(e) => setForm({ ...form, basePrice: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Discount Price (₦)</label>
              <input
                type="number"
                value={form.discountPrice}
                onChange={(e) => setForm({ ...form, discountPrice: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium">Portion Variants (optional)</label>
                  <button onClick={addVariantRow} className="text-sm text-brand-600 font-medium">+ Add variant</button>
                </div>
                {variants.length > 0 && (
                  <div className="space-y-2">
                    {variants.map((v, i) => (
                      <div key={i} className="flex gap-2 items-center">
                        <input
                          placeholder="Label (e.g. Full Portion)"
                          value={v.label}
                          onChange={(e) => updateVariantRow(i, 'label', e.target.value)}
                          className="flex-1 border border-gray-300 rounded-lg px-2 py-1.5 text-sm"
                        />
                        <input
                          type="number"
                          placeholder="Price"
                          value={v.price}
                          onChange={(e) => updateVariantRow(i, 'price', e.target.value)}
                          className="w-24 border border-gray-300 rounded-lg px-2 py-1.5 text-sm"
                        />
                        <button onClick={() => removeVariantRow(i)} className="text-red-500 px-1">&times;</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          <div>
            <label className="block text-sm font-medium mb-1">Image</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setImageFile(e.target.files?.[0] || null)}
              className="w-full text-sm"
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
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
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    fetchPackages()
    fetchItems()
  }, [])

  const fetchPackages = async () => {
    setLoading(true)
    const res = await api.get('/api/admin/menu/packages')
    const sorted = [...res.data.packages].sort((a: Package, b: Package) =>
      a.name.localeCompare(b.name)
    )
    setPackages(sorted)
    setLoading(false)
  }

  const fetchItems = async () => {
    const res = await api.get('/api/admin/menu/items?limit=100')
    const sorted = [...res.data.items].sort((a: MenuItem, b: MenuItem) =>
      a.name.localeCompare(b.name)
    )
    setItems(sorted)
  }

  // Calculate live total from current package items
  const calculatedTotal = packageItems.reduce((sum, pi) => {
    const item = items.find((i) => i.id === pi.menuItemId)
    if (!item) return sum
    const price = item.discountPrice ?? item.basePrice
    return sum + Number(price) * pi.quantity
  }, 0)

  // Auto-fill the price field whenever items change, unless admin has manually overridden it
  useEffect(() => {
    if (!priceOverridden) {
      setForm((f) => ({ ...f, totalPrice: calculatedTotal ? String(calculatedTotal) : '' }))
    }
  }, [packageItems, items])

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
    setPriceOverridden(true) // existing packages keep their saved price unless items change
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
      fetchPackages()
      showSuccess(editing ? 'Package updated' : 'Package created')
    } catch (err: any) {
      showError(getErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const handleToggle = async (pkg: Package) => {
    setTogglingId(pkg.id)
    try {
      const res = await api.patch(`/api/admin/menu/packages/${pkg.id}/availability`)
      fetchPackages()
      showSuccess(res.data.message)
    } catch (err: any) {
      showError(getErrorMessage(err))
    } finally {
      setTogglingId(null)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await api.delete(`/api/admin/menu/packages/${deleteTarget.id}`)
      showSuccess('Package deleted')
      setDeleteTarget(null)
      fetchPackages()
    } catch (err: any) {
      showError(getErrorMessage(err))
    } finally {
      setDeleting(false)
    }
  }

  const formatCurrency = (amount: number) => `₦${Number(amount).toLocaleString()}`

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button
          onClick={openCreate}
          className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700"
        >
          + Add Package
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading ? (
          <p className="text-gray-400">Loading...</p>
        ) : packages.map((pkg) => (
          <div key={pkg.id} className="bg-white rounded-xl border border-gray-100 p-4">
            <div className="flex gap-3 mb-2">
              {pkg.imageUrl ? (
                <img src={pkg.imageUrl} className="w-14 h-14 rounded-lg object-cover flex-shrink-0" />
              ) : (
                <div className="w-14 h-14 rounded-lg bg-gray-100 flex-shrink-0" />
              )}
              <div className="flex-1 flex justify-between items-start">
                <div>
                  <p className="font-medium">{pkg.name}</p>
                  <p className="text-sm text-gray-500">{formatCurrency(pkg.totalPrice)}</p>
                </div>
                <Toggle checked={pkg.isAvailable} onChange={() => handleToggle(pkg)} />
              </div>
            </div>
            <ul className="text-sm text-gray-500 mb-3 space-y-0.5">
              {pkg.items.map((item, i) => (
                <li key={i}>• {item.menuItem.name} × {item.quantity}</li>
              ))}
            </ul>
            <div className="flex gap-3 text-sm">
              <button onClick={() => openEdit(pkg)} className="text-brand-600 font-medium">Edit</button>
              <button onClick={() => setDeleteTarget(pkg)} className="text-red-500 font-medium">Delete</button>
            </div>
          </div>
        ))}
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Package' : 'New Package'} maxWidth="max-w-xl">
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              rows={2}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Image</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setImageFile(e.target.files?.[0] || null)}
              className="w-full text-sm"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium">Items</label>
              <button onClick={addItemRow} className="text-sm text-brand-600 font-medium">+ Add item</button>
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
                      className="flex-1 border border-gray-300 rounded-lg px-2 py-1.5 text-sm"
                    >
                      {items.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                    </select>
                    <input
                      type="number"
                      min="1"
                      value={pi.quantity}
                      onChange={(e) => updateItemRow(i, 'quantity', parseInt(e.target.value) || 1)}
                      className="w-16 border border-gray-300 rounded-lg px-2 py-1.5 text-sm"
                    />
                    <span className="text-xs text-gray-400 w-20 text-right">{formatCurrency(lineTotal)}</span>
                    <button onClick={() => removeItemRow(i)} className="text-red-500 px-1">&times;</button>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex justify-between items-center text-sm mb-2">
              <span className="text-gray-500">Calculated from items</span>
              <span className="font-medium">{formatCurrency(calculatedTotal)}</span>
            </div>
            <label className="block text-sm font-medium mb-1">Package Price (₦)</label>
            <div className="flex gap-2">
              <input
                type="number"
                value={form.totalPrice}
                onChange={(e) => handlePriceEdit(e.target.value)}
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
              {priceOverridden && (
                <button
                  onClick={resetToCalculated}
                  className="px-3 py-2 text-xs text-brand-600 border border-brand-200 rounded-lg hover:bg-brand-50 whitespace-nowrap"
                >
                  Use calculated
                </button>
              )}
            </div>
            {priceOverridden && (
              <p className="text-xs text-amber-600 mt-1">Price manually overridden — won't auto-update with item changes</p>
            )}
          </div>

          <label className="flex items-center gap-2 text-sm">
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