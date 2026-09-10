import { useEffect, useState, useCallback, useMemo } from 'react'
import LoadingButton from '../components/LoadingButton'
import { showSuccess, showError, getErrorMessage } from '../lib/toast'
import Layout from '../components/Layout'
import api from '../lib/api'
import useLivePolling from '../hooks/useLivePolling'
import { Store, Banknote, Power, Save, Share2, Mail } from 'lucide-react'

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
  supportPhone: string | null
  supportEmail: string | null
  whatsappNumber: string | null
  instagramUrl: string | null
  facebookUrl: string | null
  twitterUrl: string | null
  tiktokUrl: string | null
  threadsUrl: string | null
  youtubeUrl: string | null
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

  const [currentTime, setCurrentTime] = useState(new Date())

  // Keep track of real time so the UI switches instantly at closing time
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 10000)
    return () => clearInterval(timer)
  }, [])

  const fetchAll = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true)
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
      if (!isSilent) setLoading(false)
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchAll(false)
  }, [fetchAll])

  // Live poll settings and branch info every 15 seconds
  useLivePolling(fetchAll, 15000)

  const handleSettingChange = (key: string, value: string) => {
    setSettings({ ...settings, [key]: value })
  }

  const handleSaveSettings = async () => {
    setSavingSettings(true)
    try {
      const settingsArray = Object.entries(settings).map(([key, value]) => ({ key, value }))
      await api.patch('/api/admin/settings', { settings: settingsArray })
      showSuccess('Settings saved')
      fetchAll(true)
    } catch (err) {
      showError(getErrorMessage(err as Error))
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
        supportPhone: branch.supportPhone,
        supportEmail: branch.supportEmail,
        whatsappNumber: branch.whatsappNumber,
        instagramUrl: branch.instagramUrl,
        facebookUrl: branch.facebookUrl,
        twitterUrl: branch.twitterUrl,
        tiktokUrl: branch.tiktokUrl,
        threadsUrl: branch.threadsUrl,
        youtubeUrl: branch.youtubeUrl,
        openingTime: branch.openingTime,
        closingTime: branch.closingTime,
        acceptsPickup: branch.acceptsPickup,
        acceptsDelivery: branch.acceptsDelivery,
        deliveryRadiusKm: branch.deliveryRadiusKm,
      })
      showSuccess('Branch info saved')
      fetchAll(true)
    } catch (err) {
      showError(getErrorMessage(err as Error))
    } finally {
      setSavingBranch(false)
    }
  }

  // Calculate if the current time is within working hours (ESLint memoization fixed)
  const isTimeValid = useMemo(() => {
    if (!branch?.openingTime || !branch?.closingTime) return true;
    const currentMins = currentTime.getHours() * 60 + currentTime.getMinutes();
    const [oH, oM] = branch.openingTime.split(':').map(Number);
    const [cH, cM] = branch.closingTime.split(':').map(Number);
    const openMins = oH * 60 + oM;
    const closeMins = cH * 60 + cM;

    if (closeMins < openMins) {
      return currentMins >= openMins || currentMins <= closeMins;
    }
    return currentMins >= openMins && currentMins <= closeMins;
  }, [branch, currentTime]);

  const effectiveOpen = branch ? (branch.isOpen && isTimeValid) : false;

  const handleToggleOpen = async () => {
    setTogglingOpen(true)
    try {
      // THE FIX: If the store is auto-closed by time, clicking "Open" bypasses it by extending the time
      if (!effectiveOpen && branch && !isTimeValid) {
        await api.patch('/api/admin/settings/branch/info', {
          ...branch,
          closingTime: '23:59',
          isOpen: true
        })
        showSuccess('Automation Bypassed: Store forced open! (Closing time extended to 23:59)')
        fetchAll(true)
        return
      }

      // Normal manual toggle behavior
      const res = await api.patch('/api/admin/settings/branch/toggle-open')
      setBranch((prev) => prev ? { ...prev, isOpen: res.data.isOpen } : prev)
      showSuccess(res.data.message)
    } catch (err) {
      showError(getErrorMessage(err as Error))
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

      {/* Restaurant Open/Closed Toggle - Uses effectiveOpen for the display */}
      {branch && (
        <div className={`rounded-xl border p-4 mb-6 flex items-center justify-between flex-wrap gap-3 ${
          effectiveOpen ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'
        }`}>
          <div className="flex items-center gap-3">
            <Power size={20} className={effectiveOpen ? 'text-green-600' : 'text-red-500'} />
            <div>
              <p className="font-medium">
                Restaurant is currently {effectiveOpen ? 'open' : 'closed'}
              </p>
              <p className="text-sm text-gray-500">
                {effectiveOpen ? 'Customers can place orders' : 'Customers cannot place new orders'}
              </p>
            </div>
          </div>
          <LoadingButton
            loading={togglingOpen}
            onClick={handleToggleOpen}
            variant="ghost"
            className={`px-4 py-2 rounded-lg text-white ${
              effectiveOpen ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
            }`}
          >
            {effectiveOpen ? 'Close Restaurant' : 'Open Restaurant'}
          </LoadingButton>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Branch Info & Contact Settings Card */}
        {branch && (
          <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-5">
            <div>
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
              </div>
            </div>

            {/* Support & Contact Channels */}
            <div className="border-t pt-4">
              <div className="flex items-center gap-2 mb-4">
                <Mail size={18} className="text-brand-600" />
                <h3 className="font-semibold">Support & Contact Channels</h3>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Support Phone</label>
                  <input
                    value={branch.supportPhone || ''}
                    onChange={(e) => handleBranchChange('supportPhone', e.target.value)}
                    placeholder="e.g. +234..."
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Support Email</label>
                  <input
                    type="email"
                    value={branch.supportEmail || ''}
                    onChange={(e) => handleBranchChange('supportEmail', e.target.value)}
                    placeholder="support@bwarikitchen.com"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">WhatsApp Number</label>
                  <input
                    value={branch.whatsappNumber || ''}
                    onChange={(e) => handleBranchChange('whatsappNumber', e.target.value)}
                    placeholder="e.g. +234..."
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Social Media Links */}
            <div className="border-t pt-4">
              <div className="flex items-center gap-2 mb-4">
                <Share2 size={18} className="text-brand-600" />
                <h3 className="font-semibold">Social Media Links</h3>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Instagram URL</label>
                  <input
                    value={branch.instagramUrl || ''}
                    onChange={(e) => handleBranchChange('instagramUrl', e.target.value)}
                    placeholder="https://instagram.com/..."
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">X (Twitter) URL</label>
                  <input
                    value={branch.twitterUrl || ''}
                    onChange={(e) => handleBranchChange('twitterUrl', e.target.value)}
                    placeholder="https://x.com/..."
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Facebook URL</label>
                  <input
                    value={branch.facebookUrl || ''}
                    onChange={(e) => handleBranchChange('facebookUrl', e.target.value)}
                    placeholder="https://facebook.com/..."
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">TikTok URL</label>
                  <input
                    value={branch.tiktokUrl || ''}
                    onChange={(e) => handleBranchChange('tiktokUrl', e.target.value)}
                    placeholder="https://tiktok.com/@..."
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Threads URL</label>
                  <input
                    value={branch.threadsUrl || ''}
                    onChange={(e) => handleBranchChange('threadsUrl', e.target.value)}
                    placeholder="https://threads.net/@..."
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">YouTube URL</label>
                  <input
                    value={branch.youtubeUrl || ''}
                    onChange={(e) => handleBranchChange('youtubeUrl', e.target.value)}
                    placeholder="https://youtube.com/..."
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
              </div>
            </div>

            <LoadingButton loading={savingBranch} onClick={handleSaveBranch} className="w-full py-2.5 mt-4">
              <Save size={16} />
              Save Branch Info & Settings
            </LoadingButton>
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

            <LoadingButton loading={savingSettings} onClick={handleSaveSettings} className="w-full py-2.5 mt-2">
              <Save size={16} />
              Save Settings
            </LoadingButton>
          </div>
        </div>
      </div>
    </Layout>
  )
}