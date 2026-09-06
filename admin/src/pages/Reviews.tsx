import { useEffect, useState, useCallback, UIEvent } from 'react'
import { motion } from 'framer-motion'
import LoadingButton from '../components/LoadingButton'
import ConfirmDialog from '../components/ConfirmDialog'
import { showSuccess, showError, getErrorMessage } from '../lib/toast'
import Layout from '../components/Layout'
import api from '../lib/api'
import useLivePolling from '../hooks/useLivePolling'
import { Star, Eye, EyeOff, Trash2, Bike, Loader2 } from 'lucide-react'

interface Review {
  id: string
  foodRating: number
  deliveryRating: number | null
  comment: string | null
  isVisible: boolean
  createdAt: string
  customer: { fullName: string; phoneNumber: string }
  rider: { fullName: string } | null
  order: { orderNumber: string; orderType: string }
}

const inputClass = "border border-surface-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 transition-shadow"

export default function Reviews() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [averages, setAverages] = useState<{ foodRating: number; deliveryRating: number; totalReviews: number } | null>(null)
  const [loading, setLoading] = useState(true)
  const [isFetchingMore, setIsFetchingMore] = useState(false)
  
  // Infinite Scroll States
  const [fetchLimit, setFetchLimit] = useState(50)
  const [hasMore, setHasMore] = useState(true)

  const [ratingFilter, setRatingFilter] = useState('')
  const [visibilityFilter, setVisibilityFilter] = useState('')
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [reviewToDelete, setReviewToDelete] = useState<Review | null>(null)

  const fetchReviews = useCallback(async (isSilent = false) => {
    if (!isSilent) {
      if (fetchLimit === 50) setLoading(true)
      else setIsFetchingMore(true)
    }
    try {
      const params = new URLSearchParams()
      params.append('limit', fetchLimit.toString())
      if (ratingFilter) params.append('rating', ratingFilter)
      if (visibilityFilter) params.append('visible', visibilityFilter)

      const res = await api.get(`/api/admin/reviews?${params.toString()}`)
      setReviews(res.data.reviews)
      setAverages(res.data.averages)
      
      if (res.data.reviews.length < fetchLimit) {
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
  }, [fetchLimit, ratingFilter, visibilityFilter])

  useEffect(() => {
    fetchReviews(false)
  }, [fetchReviews])

  useLivePolling(fetchReviews, 15000)

  const handleScroll = (e: UIEvent<HTMLDivElement>) => {
    const { scrollTop, clientHeight, scrollHeight } = e.currentTarget
    if (scrollHeight - scrollTop <= clientHeight + 50) {
      if (hasMore && !loading && !isFetchingMore) {
        setFetchLimit(prev => prev + 50)
      }
    }
  }

  const handleToggleVisibility = async (review: Review) => {
    const previousReviews = reviews
    const newVisible = !review.isVisible

    setReviews((prev) =>
      prev.map((r) => (r.id === review.id ? { ...r, isVisible: newVisible } : r))
    )

    setTogglingId(review.id)
    try {
      const res = await api.patch(`/api/admin/reviews/${review.id}/visibility`)
      showSuccess(res.data.message)
    } catch (err: any) {
      setReviews(previousReviews)
      showError(getErrorMessage(err))
    } finally {
      setTogglingId(null)
    }
  }

  const handleDelete = async () => {
    if (!reviewToDelete) return
    setDeleting(true)
    try {
      await api.delete(`/api/admin/reviews/${reviewToDelete.id}`)
      showSuccess('Review deleted')
      setReviewToDelete(null)
      fetchReviews(true)
    } catch (err: any) {
      showError(getErrorMessage(err))
    } finally {
      setDeleting(false)
    }
  }

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('en-NG', { dateStyle: 'medium' })

  const renderStars = (rating: number) => {
    const numericRating = Number(rating) || 0
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((i) => (
          <Star
            key={i}
            size={14}
            className={i <= Math.round(numericRating) ? 'fill-amber-400 text-amber-400' : 'text-surface-200'}
          />
        ))}
        <span className="text-xs text-surface-500 ml-1">{numericRating.toFixed(1)}</span>
      </div>
    )
  }

  return (
    <Layout>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-surface-900">Reviews</h2>
        <p className="text-sm text-surface-400 mt-0.5">What customers are saying about their orders</p>
      </div>

      {/* Summary Cards */}
      {averages && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6"
        >
          <div className="bg-white rounded-2xl border border-surface-100 p-4">
            <p className="text-xs text-surface-400 mb-1.5">Average Food Rating</p>
            {renderStars(averages.foodRating)}
          </div>
          <div className="bg-white rounded-2xl border border-surface-100 p-4">
            <p className="text-xs text-surface-400 mb-1.5">Average Delivery Rating</p>
            {renderStars(averages.deliveryRating)}
          </div>
          <div className="bg-white rounded-2xl border border-surface-100 p-4">
            <p className="text-xs text-surface-400 mb-1.5">Total Reviews</p>
            <p className="text-xl font-bold text-surface-900">{averages.totalReviews}</p>
          </div>
        </motion.div>
      )}

      {/* Filters */}
      <div className="flex gap-3 mb-4 flex-wrap">
        <select
          value={ratingFilter}
          onChange={(e) => { setRatingFilter(e.target.value); setFetchLimit(50) }}
          className={inputClass}
        >
          <option value="">All ratings</option>
          <option value="5">5 stars</option>
          <option value="4">4 stars</option>
          <option value="3">3 stars</option>
          <option value="2">2 stars</option>
          <option value="1">1 star</option>
        </select>

        <select
          value={visibilityFilter}
          onChange={(e) => { setVisibilityFilter(e.target.value); setFetchLimit(50) }}
          className={inputClass}
        >
          <option value="">All reviews</option>
          <option value="true">Visible only</option>
          <option value="false">Hidden only</option>
        </select>
      </div>

      {/* Reviews List */}
      <div 
        className="max-h-[70vh] overflow-y-auto pr-2 relative space-y-3"
        onScroll={handleScroll}
      >
        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-surface-100 p-4 h-32 animate-pulse">
                <div className="h-3.5 w-32 bg-surface-100 rounded mb-2" />
                <div className="h-3 w-24 bg-surface-50 rounded" />
              </div>
            ))}
          </div>
        ) : reviews.length === 0 ? (
          <p className="text-surface-400">No reviews found</p>
        ) : (
          reviews.map((review, i) => (
            <motion.div
              key={review.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: (i % 10) * 0.02 }}
              className={`bg-white rounded-2xl border p-4 ${
                review.isVisible ? 'border-surface-100' : 'border-danger/20 bg-danger/[0.02]'
              }`}
            >
              <div className="flex items-start justify-between flex-wrap gap-2 mb-2">
                <div>
                  <p className="font-medium text-surface-900">{review.customer.fullName}</p>
                  <p className="text-xs text-surface-400">
                    {review.order.orderNumber} · {formatDate(review.createdAt)}
                  </p>
                </div>
                {!review.isVisible && (
                  <span className="text-xs px-2.5 py-1 rounded-full bg-danger/10 text-danger font-medium">
                    Hidden
                  </span>
                )}
              </div>

              <div className="flex flex-wrap gap-4 mb-2">
                <div>
                  <p className="text-xs text-surface-400 mb-0.5">Food</p>
                  {renderStars(review.foodRating)}
                </div>
                {review.deliveryRating !== null && (
                  <div>
                    <p className="text-xs text-surface-400 mb-0.5 flex items-center gap-1">
                      <Bike size={11} /> Delivery
                    </p>
                    {renderStars(review.deliveryRating)}
                  </div>
                )}
              </div>

              {review.comment && (
                <p className="text-sm text-surface-700 mb-3">{review.comment}</p>
              )}

              {review.rider && (
                <p className="text-xs text-surface-400 mb-3">Rider: {review.rider.fullName}</p>
              )}

              <div className="flex gap-4 text-sm pt-2 border-t border-surface-50">
                <button
                  onClick={() => handleToggleVisibility(review)}
                  disabled={togglingId === review.id}
                  className="flex items-center gap-1.5 text-surface-500 hover:text-surface-800 font-medium transition-colors disabled:opacity-50"
                >
                  {review.isVisible ? <EyeOff size={14} /> : <Eye size={14} />}
                  {review.isVisible ? 'Hide' : 'Show'}
                </button>
                <button
                  onClick={() => setReviewToDelete(review)}
                  className="flex items-center gap-1.5 text-danger hover:text-red-700 font-medium transition-colors"
                >
                  <Trash2 size={14} /> Delete
                </button>
              </div>
            </motion.div>
          ))
        )}

        {isFetchingMore && (
          <div className="flex justify-center items-center p-4 text-surface-500 gap-2">
            <Loader2 size={18} className="animate-spin" />
            <span className="text-sm font-medium">Loading more reviews...</span>
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={!!reviewToDelete}
        title="Delete Review"
        message={`Delete this review from ${reviewToDelete?.customer.fullName}?`}
        onConfirm={handleDelete}
        onCancel={() => setReviewToDelete(null)}
        confirmLabel="Delete"
        danger
        loading={deleting}
      />
    </Layout>
  )
}