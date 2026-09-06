import { useEffect, useState, useCallback } from 'react'
import Layout from '../components/Layout'
import Pagination from '../components/Pagination'
import api from '../lib/api'
import useLivePolling from '../hooks/useLivePolling'
import {
  PlusCircle, Pencil, Trash2, ToggleLeft, LogIn,
  UserCog, Bike, History,
} from 'lucide-react'

interface LogEntry {
  id: string
  adminId: string
  adminName: string
  action: string
  targetType: string
  targetId: string | null
  description: string
  createdAt: string
}

const actionIcons: Record<string, any> = {
  create: PlusCircle,
  update: Pencil,
  delete: Trash2,
  toggle: ToggleLeft,
  login: LogIn,
  update_status: Pencil,
  assign_rider: Bike,
}

const actionColors: Record<string, string> = {
  create: 'text-green-600 bg-green-50',
  update: 'text-blue-600 bg-blue-50',
  delete: 'text-red-600 bg-red-50',
  toggle: 'text-amber-600 bg-amber-50',
  login: 'text-gray-600 bg-gray-50',
  update_status: 'text-blue-600 bg-blue-50',
  assign_rider: 'text-purple-600 bg-purple-50',
}

export default function ActivityLog() {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [admins, setAdmins] = useState<{ adminId: string; adminName: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const [adminFilter, setAdminFilter] = useState('')
  const [targetTypeFilter, setTargetTypeFilter] = useState('')
  const [actionFilter, setActionFilter] = useState('')

  useEffect(() => {
    fetchAdmins()
  }, [])

  const fetchAdmins = async () => {
    const res = await api.get('/api/admin/activity-logs/admins')
    setAdmins(res.data.admins)
  }

  // Wrapped in useCallback to stabilize it for the polling hook
  const fetchLogs = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true)
    try {
      const params = new URLSearchParams()
      params.append('page', String(page))
      params.append('limit', '25')
      if (adminFilter) params.append('adminId', adminFilter)
      if (targetTypeFilter) params.append('targetType', targetTypeFilter)
      if (actionFilter) params.append('action', actionFilter)

      const res = await api.get(`/api/admin/activity-logs?${params.toString()}`)
      setLogs(res.data.logs)
      setTotalPages(res.data.meta.totalPages)
    } finally {
      if (!isSilent) setLoading(false)
    }
  }, [page, adminFilter, targetTypeFilter, actionFilter])

  // Initial load
  useEffect(() => {
    fetchLogs(false)
  }, [fetchLogs])

  // Silent background poll every 15 seconds
  useLivePolling(fetchLogs, 15000)

  const formatDateTime = (date: string) =>
    new Date(date).toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short' })

  return (
    <Layout>
      <div className="flex items-center gap-2 mb-6">
        <History size={22} className="text-brand-600" />
        <h2 className="text-2xl font-bold text-gray-900">Activity Log</h2>
      </div>

      <div className="flex gap-3 mb-4 flex-wrap">
        <select
          value={adminFilter}
          onChange={(e) => { setAdminFilter(e.target.value); setPage(1) }}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
        >
          <option value="">All admins</option>
          {admins.map((a) => (
            <option key={a.adminId} value={a.adminId}>{a.adminName}</option>
          ))}
        </select>

        <select
          value={targetTypeFilter}
          onChange={(e) => { setTargetTypeFilter(e.target.value); setPage(1) }}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
        >
          <option value="">All types</option>
          <option value="MenuItem">Menu Item</option>
          <option value="Category">Category</option>
          <option value="Package">Package</option>
          <option value="Order">Order</option>
          <option value="Promotion">Promotion</option>
          <option value="Rider">Rider</option>
          <option value="Customer">Customer</option>
          <option value="Settings">Settings</option>
          <option value="Branch">Branch</option>
          <option value="Review">Review</option>
          <option value="AdminUser">Admin User</option>
        </select>

        <select
          value={actionFilter}
          onChange={(e) => { setActionFilter(e.target.value); setPage(1) }}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
        >
          <option value="">All actions</option>
          <option value="create">Create</option>
          <option value="update">Update</option>
          <option value="delete">Delete</option>
          <option value="toggle">Toggle</option>
          <option value="login">Login</option>
          <option value="update_status">Status Update</option>
          <option value="assign_rider">Rider Assignment</option>
        </select>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {loading ? (
          <p className="text-center py-8 text-gray-400">Loading activity...</p>
        ) : logs.length === 0 ? (
          <p className="text-center py-8 text-gray-400">No activity recorded yet</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {logs.map((log) => {
              const Icon = actionIcons[log.action] || UserCog
              const colorClass = actionColors[log.action] || 'text-gray-600 bg-gray-50'
              return (
                <div key={log.id} className="flex items-start gap-3 px-4 py-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${colorClass}`}>
                    <Icon size={15} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">{log.description}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {log.adminName} · {formatDateTime(log.createdAt)}
                    </p>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 flex-shrink-0">
                    {log.targetType}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </Layout>
  )
}