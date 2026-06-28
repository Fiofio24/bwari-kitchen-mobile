import { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import api from '../lib/api'
import { Store, Clock, Banknote, MapPin, Power, Save } from 'lucide-react'

interface AppSetting {
  id: string
  key: string
  value: string
  description: string | null
}

interface Branch {
  id: string
  name: string
  address: string
  landmark: string | null
  area: string | null
  latitude: number | null
  longitude: number | null
  phoneNumber: string | null
  openingTime: string | null
  closingTime: string | null
  isOpen: boolean
  acceptsPickup: boolean
  acceptsDelivery: boolean
  deliveryRadiusKm: number | null
}

export default function Settings() {
  const [settings, setSettings] = useState<Record<string, string>>({})
  const [branch, setBranch] = useState<Branch | null>(null)
  const [loading, setLoading] = useState(true)
  const [savingSettings, setSavingSettings] = useState(false)
  const [savingBranch, setSavingBranch] = useState(false)
  const [togglingOpen, setTogglingOpen] = useState(false)

  useEffect(() => {
    fetchAll()
  }, [])

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [settingsRes, branchRes] = await Promise.all([
        api.get('/api/admin/settings'),
        api.get('/api/admin/settings/branch/info'),
      ])

      const settingsMap: Record<string, string> = {}
      settingsRes.data.settings.forEach((s: AppSetting) => {
        settingsMap[s.key] = s.value
      })
      setSettings(settingsMap)
      setBranch(branchRes.data.branch)
    } finally {
      setLoading(false)
    }
  }

  const handleSettingChange = (key: string, value: string) => {
    setSettings({ ...settings, [key]: value })
  }

  const handleSaveSettings = async () => {
    setSavingSettings(true)
    try {
      const settingsArray = Object.entries(settings).map(([key, value]) => ({ key, value }))
      await api.patch('/api/admin/settings', { settings: settingsArray })
      alert('Settings saved')
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to save settings')
    } finally {
      setSavingSettings(false)
    }
  }

  const handleBranchChange = (field: keyof Branch, value: string | boolean) => {
    if (!branch) return
    setBranch({ ...branch, [field]: value })
  }

  const handleSaveBranch = async () => {
    if (!branch) return
    setSavingBranch(true)
    try {
      await api.patch('/api/admin/settings/branch/info', {
        name: branch.name,
        address: branch.address,
        landmark: branch.landmark,
        area: branch.area,
        latitude: branch.latitude,
        longitude: branch.longitude,
        phoneNumber: branch.phoneNumber,
        openingTime: branch.openingTime,
        closingTime: branch.closingTime,
        acceptsPickup: branch.acceptsPickup,
        acceptsDelivery: branch.acceptsDelivery,
        deliveryRadiusKm: branch.deliveryRadiusKm,
      })
      alert('Branch info saved')
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to save branch info')
    } finally {
      setSavingBranch(false)
    }
  }

  const handleToggleOpen = async () => {
    setTogglingOpen(true)
    try {
      const res = await api.patch('/api/admin/settings/branch/toggle-open')
      setBranch((prev) => prev ? { ...prev, isOpen: res.data.isOpen } : prev)
    } finally {
      setTogglingOpen(false)
    }
  }

  if (loading) {
    return (
      <Layout>
        <p className="text-gray-400">Loading settings...</p>
      </Layout>
    )
  }

  return (
    <Layout>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Settings</h2>

      {/* Restaurant Open/Closed Toggle */}
      {branch && (
        <div className={`rounded-xl border p-4 mb-6 flex items-center justify-between flex-wrap gap-3 ${
          branch.isOpen ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'
        }`}>
          <div className="flex items-center gap-3">
            <Power size={20} className={branch.isOpen ? 'text-green-600' : 'text-red-500'} />
            <div>
              <p className="font-medium">
                Restaurant is currently {branch.isOpen ? 'open' : 'closed'}
              </p>
              <p className="text-sm text-gray-500">
                {branch.isOpen ? 'Customers can place orders' : 'Customers cannot place new orders'}
              </p>
            </div>
          </div>
          <button
            onClick={handleToggleOpen}
            disabled={togglingOpen}
            className={`px-4 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-50 ${
              branch.isOpen ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
            }`}
          >
            {branch.isOpen ? 'Close Restaurant' : 'Open Restaurant'}
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Branch Info Card */}
        {branch && (
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="flex items-center gap-2 mb-4">
              <Store size={18} className="text-brand-600" />
              <h3 className="font-semibold">Branch Information</h3>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Branch Name</label>
                <input
                  value={branch.name}
                  onChange={(e) => handleBranchChange('name', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Address</label>
                <input
                  value={branch.address}
                  onChange={(e) => handleBranchChange('address', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Landmark</label>
                  <input
                    value={branch.landmark || ''}
                    onChange={(e) => handleBranchChange('landmark', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Area</label>
                  <input
                    value={branch.area || ''}
                    onChange={(e) => handleBranchChange('area', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Latitude</label>
                  <input
                    type="number"
                    step="0.000001"
                    value={branch.latitude ?? ''}
                    onChange={(e) => handleBranchChange('latitude', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Longitude</label>
                  <input
                    type="number"
                    step="0.000001"
                    value={branch.longitude ?? ''}
                    onChange={(e) => handleBranchChange('longitude', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Phone Number</label>
                <input
                  value={branch.phoneNumber || ''}
                  onChange={(e) => handleBranchChange('phoneNumber', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Opening Time</label>
                  <input
                    type="time"
                    value={branch.openingTime || ''}
                    onChange={(e) => handleBranchChange('openingTime', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Closing Time</label>
                  <input
                    type="time"
                    value={branch.closingTime || ''}
                    onChange={(e) => handleBranchChange('closingTime', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Delivery Radius (km)</label>
                <input
                  type="number"
                  value={branch.deliveryRadiusKm ?? ''}
                  onChange={(e) => handleBranchChange('deliveryRadiusKm', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>

              <div className="flex gap-4 pt-1">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={branch.acceptsPickup}
                    onChange={(e) => handleBranchChange('acceptsPickup', e.target.checked)}
                  />
                  Accepts Pickup
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={branch.acceptsDelivery}
                    onChange={(e) => handleBranchChange('acceptsDelivery', e.target.checked)}
                  />
                  Accepts Delivery
                </label>
              </div>

              <button
                onClick={handleSaveBranch}
                disabled={savingBranch}
                className="w-full flex items-center justify-center gap-2 bg-brand-600 text-white py-2.5 rounded-lg font-medium mt-2 disabled:opacity-50"
              >
                <Save size={16} />
                {savingBranch ? 'Saving...' : 'Save Branch Info'}
              </button>
            </div>
          </div>
        )}

        {/* App Settings Card */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Banknote size={18} className="text-brand-600" />
            <h3 className="font-semibold">Order & Pricing Settings</h3>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">Restaurant Name</label>
              <input
                value={settings['restaurant_name'] || ''}
                onChange={(e) => handleSettingChange('restaurant_name', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Support Phone</label>
              <input
                value={settings['support_phone'] || ''}
                onChange={(e) => handleSettingChange('support_phone', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Minimum Order Amount (₦)</label>
              <input
                type="number"
                value={settings['min_order_amount'] || ''}
                onChange={(e) => handleSettingChange('min_order_amount', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Delivery Fee per Km (₦)</label>
              <input
                type="number"
                value={settings['delivery_fee_per_km'] || ''}
                onChange={(e) => handleSettingChange('delivery_fee_per_km', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">Opening Time</label>
                <input
                  type="time"
                  value={settings['opening_time'] || ''}
                  onChange={(e) => handleSettingChange('opening_time', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Closing Time</label>
                <input
                  type="time"
                  value={settings['closing_time'] || ''}
                  onChange={(e) => handleSettingChange('closing_time', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
            </div>

            <button
              onClick={handleSaveSettings}
              disabled={savingSettings}
              className="w-full flex items-center justify-center gap-2 bg-brand-600 text-white py-2.5 rounded-lg font-medium mt-2 disabled:opacity-50"
            >
              <Save size={16} />
              {savingSettings ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>
      </div>
    </Layout>
  )
}