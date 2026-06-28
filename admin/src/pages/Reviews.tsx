import { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import Pagination from '../components/Pagination'
import api from '../lib/api'
import { Star, Eye, EyeOff, Trash2, Bike } from 'lucide-react'

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

export default function Reviews() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [averages, setAverages] = useState<{ foodRating: number; deliveryRating: number; totalReviews: number } | null>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [ratingFilter, setRatingFilter] = useState('')
  const [visibilityFilter, setVisibilityFilter] = useState('')

  useEffect(() => {
    fetchReviews()
  }, [page, ratingFilter, visibilityFilter])

  const fetchReviews = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.append('page', String(page))
      params.append('limit', '15')
      if (ratingFilter) params.append('rating', ratingFilter)
      if (visibilityFilter) params.append('visible', visibilityFilter)

      const res = await api.get(`/api/admin/reviews?${params.toString()}`)
      setReviews(res.data.reviews)
      setAverages(res.data.averages)
      setTotalPages(res.data.meta.totalPages)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleVisibility = async (review: Review) => {
    await api.patch(`/api/admin/reviews/${review.id}/visibility`)
    fetchReviews()
  }

  const handleDelete = async (review: Review) => {
    if (!confirm(`Delete this review from ${review.customer.fullName}?`)) return
    await api.delete(`/api/admin/reviews/${review.id}`)
    fetchReviews()
  }

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('en-NG', { dateStyle: 'medium' })

  const renderStars = (rating: number) => (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={14}
          className={i <= Math.round(rating) ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}
        />
      ))}
      <span className="text-xs text-gray-500 ml-1">{rating.toFixed(1)}</span>
    </div>
  )

  return (
    <Layout>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Reviews</h2>

      {/* Summary Cards */}
      {averages && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <p className="text-xs text-gray-500 mb-1">Average Food Rating</p>
            {renderStars(averages.foodRating)}
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <p className="text-xs text-gray-500 mb-1">Average Delivery Rating</p>
            {renderStars(averages.deliveryRating)}
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <p className="text-xs text-gray-500 mb-1">Total Reviews</p>
            <p className="text-xl font-bold">{averages.totalReviews}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-3 mb-4 flex-wrap">
        <select
          value={ratingFilter}
          onChange={(e) => { setRatingFilter(e.target.value); setPage(1) }}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
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
          onChange={(e) => { setVisibilityFilter(e.target.value); setPage(1) }}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
        >
          <option value="">All reviews</option>
          <option value="true">Visible only</option>
          <option value="false">Hidden only</option>
        </select>
      </div>

      {/* Reviews List */}
      {loading ? (
        <p className="text-gray-400">Loading reviews...</p>
      ) : reviews.length === 0 ? (
        <p className="text-gray-400">No reviews found</p>
      ) : (
        <div className="space-y-3">
          {reviews.map((review) => (
            <div
              key={review.id}
              className={`bg-white rounded-xl border p-4 ${
                review.isVisible ? 'border-gray-100' : 'border-red-100 bg-red-50/30'
              }`}
            >
              <div className="flex items-start justify-between flex-wrap gap-2 mb-2">
                <div>
                  <p className="font-medium">{review.customer.fullName}</p>
                  <p className="text-xs text-gray-400">
                    {review.order.orderNumber} · {formatDate(review.createdAt)}
                  </p>
                </div>
                {!review.isVisible && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-600">
                    Hidden
                  </span>
                )}
              </div>

              <div className="flex flex-wrap gap-4 mb-2">
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Food</p>
                  {renderStars(review.foodRating)}
                </div>
                {review.deliveryRating !== null && (
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5 flex items-center gap-1">
                      <Bike size={11} /> Delivery
                    </p>
                    {renderStars(review.deliveryRating)}
                  </div>
                )}
              </div>

              {review.comment && (
                <p className="text-sm text-gray-700 mb-3">{review.comment}</p>
              )}

              {review.rider && (
                <p className="text-xs text-gray-400 mb-3">Rider: {review.rider.fullName}</p>
              )}

              <div className="flex gap-3 text-sm pt-2 border-t border-gray-100">
                <button
                  onClick={() => handleToggleVisibility(review)}
                  className="flex items-center gap-1.5 text-gray-500 hover:text-gray-700 font-medium"
                >
                  {review.isVisible ? <EyeOff size={14} /> : <Eye size={14} />}
                  {review.isVisible ? 'Hide' : 'Show'}
                </button>
                <button
                  onClick={() => handleDelete(review)}
                  className="flex items-center gap-1.5 text-red-500 hover:text-red-700 font-medium"
                >
                  <Trash2 size={14} /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </Layout>
  )
}