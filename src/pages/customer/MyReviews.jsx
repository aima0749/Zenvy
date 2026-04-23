import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../supabaseClient'

export default function MyReviews() {
  const [reviews, setReviews] = useState([])
  const [pendingReviews, setPendingReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [selectedBooking, setSelectedBooking] = useState(null)
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [currentUser, setCurrentUser] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { navigate('/auth'); return }
    setCurrentUser(user)

    // Get existing reviews
    const { data: reviewData } = await supabase
      .from('review')
      .select(`
        review_id, rating, comment, review_date,
        booking(booking_id, service(service_name), service_date),
        service_provider(user_id, users(first_name, last_name))
      `)
      .eq('customer_id', user.id)
      .order('review_date', { ascending: false })
    setReviews(reviewData || [])

    // Get completed bookings without reviews
    const { data: bookingData } = await supabase
      .from('booking')
      .select(`
        booking_id, service_date,
        service(service_name),
        service_provider(user_id, users(first_name, last_name))
      `)
      .eq('customer_id', user.id)
      .eq('status', 'completed')

    const reviewedBookingIds = (reviewData || [])
      .map(r => r.booking?.booking_id)
      .filter(Boolean)

    const pending = (bookingData || [])
      .filter(b => !reviewedBookingIds.includes(b.booking_id))
    setPendingReviews(pending)

    setLoading(false)
  }

  const submitReview = async () => {
    if (!comment.trim()) { alert('Please write a comment'); return }
    setSubmitting(true)

    const { error } = await supabase.from('review').insert({
      customer_id: currentUser.id,
      booking_id: selectedBooking.booking_id,
      provider_id: selectedBooking.service_provider?.user_id,
      rating,
      comment,
      review_date: new Date().toISOString()
    })

    if (error) { alert('Error: ' + error.message); setSubmitting(false); return }

    alert('Review submitted! ✅')
    setShowModal(false)
    setComment('')
    setRating(5)
    setSelectedBooking(null)
    fetchData()
    setSubmitting(false)
  }

  const deleteReview = async (reviewId) => {
    if (!window.confirm('Delete this review?')) return
    await supabase.from('review').delete().eq('review_id', reviewId)
    fetchData()
  }

  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : 0

  const sidebarItems = [
    { label: 'Dashboard', icon: '🏠', path: '/customer/dashboard' },
    { label: 'Browse Services', icon: '🔍', path: '/customer/browse' },
    { label: 'My Bookings', icon: '📅', path: '/customer/bookings' },
    { label: 'Bundle Offers', icon: '📦', path: '/customer/bundles' },
    { label: 'Payments', icon: '💳', path: '/customer/payments' },
    { label: 'My Reviews', icon: '⭐', path: '/customer/reviews', active: true },
  ]

  const logout = async () => {
    await supabase.auth.signOut()
    navigate('/auth')
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      <p>Loading...</p>
    </div>
  )

  return (
    <div style={{ display: 'flex', fontFamily: 'Arial', minHeight: '100vh', background: '#f4f3f0' }}>

      {/* SIDEBAR */}
      <aside style={{ width: 240, background: '#1e1e2e', display: 'flex', flexDirection: 'column', position: 'fixed', top: 0, left: 0, bottom: 0 }}>
        <div style={{ padding: '24px 20px 16px', fontSize: 22, fontWeight: 700, color: '#fff', borderBottom: '1px solid #2e2e42' }}>
          <span style={{ color: '#3d5afe' }}>Z</span>envy
        </div>
        <nav style={{ flex: 1, paddingTop: 12 }}>
          {sidebarItems.map(item => (
            <div key={item.path} onClick={() => navigate(item.path)}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 20px', cursor: 'pointer', fontSize: 13, color: item.active ? '#fff' : '#c8c4bc', background: item.active ? '#3a3a52' : 'transparent', borderLeft: item.active ? '3px solid #3d5afe' : '3px solid transparent' }}>
              <span>{item.icon}</span> {item.label}
            </div>
          ))}
        </nav>
        <div style={{ padding: '16px 0', borderTop: '1px solid #2e2e42' }}>
          <div onClick={logout} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 20px', cursor: 'pointer', color: '#e57373', fontSize: 13 }}>
            <span>⬅️</span> Logout
          </div>
        </div>
      </aside>

      {/* MAIN */}
      <main style={{ marginLeft: 240, flex: 1, padding: '28px 32px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>My Reviews</h1>
            <p style={{ color: '#6b6860', marginTop: 4, fontSize: 13 }}>Reviews you've written for service providers</p>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
          {[
            { label: 'Reviews Written', value: reviews.length, color: '#1a1a2e' },
            { label: 'Avg Rating Given', value: `★ ${avgRating}`, color: '#f9a825' },
            { label: 'Pending Reviews', value: pendingReviews.length, color: '#e65100' },
          ].map(s => (
            <div key={s.label} style={{ background: '#fff', border: '1px solid #d4d2cc', borderRadius: 10, padding: '18px 20px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
              <div style={{ fontSize: 11, color: '#9b978f', textTransform: 'uppercase', letterSpacing: 0.8, fontFamily: 'monospace' }}>{s.label}</div>
              <div style={{ fontSize: 28, fontWeight: 700, marginTop: 6, color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Pending Reviews */}
        {pendingReviews.length > 0 && (
          <div style={{ background: '#fff', border: '1px solid #d4d2cc', borderRadius: 10, padding: 20, marginBottom: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Pending Reviews</div>
            <div style={{ background: '#e8ecff', border: '1px solid #c5cfff', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#2a3fd4', marginBottom: 16 }}>
              You have {pendingReviews.length} completed booking(s) awaiting your review.
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f4f3f0' }}>
                  {['Service', 'Provider', 'Service Date', 'Action'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, color: '#9b978f', fontFamily: 'monospace', borderBottom: '1px solid #d4d2cc' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pendingReviews.map(b => (
                  <tr key={b.booking_id} style={{ borderBottom: '1px solid #f0ede8' }}>
                    <td style={{ padding: '12px 14px', fontSize: 13, fontWeight: 500 }}>{b.service?.service_name}</td>
                    <td style={{ padding: '12px 14px', fontSize: 13 }}>
                      {b.service_provider?.users?.first_name} {b.service_provider?.users?.last_name}
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: 13 }}>{b.service_date}</td>
                    <td style={{ padding: '12px 14px' }}>
                      <button onClick={() => { setSelectedBooking(b); setShowModal(true) }}
                        style={{ padding: '6px 14px', background: '#3d5afe', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 500 }}>
                        Write Review
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Reviews Written */}
        <div style={{ background: '#fff', border: '1px solid #d4d2cc', borderRadius: 10, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Reviews You've Written</div>
          {reviews.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#9b978f' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>⭐</div>
              <p style={{ fontSize: 13 }}>No reviews yet. Complete a booking to leave a review!</p>
            </div>
          ) : (
            reviews.map(r => (
              <div key={r.review_id} style={{ border: '1px solid #d4d2cc', borderRadius: 10, padding: 16, marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>
                      Review for: {r.service_provider?.users?.first_name} {r.service_provider?.users?.last_name}
                    </div>
                    <div style={{ fontSize: 11, color: '#9b978f', marginTop: 2 }}>
                      {r.booking?.service?.service_name} · {r.booking?.service_date}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ color: '#f9a825', fontSize: 16 }}>
                      {'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}
                    </div>
                    <div style={{ fontSize: 11, color: '#9b978f', marginTop: 2 }}>
                      {new Date(r.review_date).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <p style={{ fontSize: 13, color: '#6b6860', lineHeight: 1.6, margin: 0 }}>{r.comment}</p>
                <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
                  <button onClick={() => deleteReview(r.review_id)}
                    style={{ padding: '5px 12px', background: '#fce4ec', color: '#b71c1c', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      {/* REVIEW MODAL */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}
          onClick={e => { if (e.target === e.currentTarget) setShowModal(false) }}>
          <div style={{ background: '#fff', borderRadius: 14, padding: 28, width: 460, maxWidth: '95vw', boxShadow: '0 4px 16px rgba(0,0,0,0.10)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h3 style={{ fontSize: 17, fontWeight: 700, margin: 0 }}>Leave a Review</h3>
              <button onClick={() => setShowModal(false)}
                style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#9b978f' }}>✕</button>
            </div>

            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 4 }}>
                {selectedBooking?.service?.service_name}
              </div>
              <div style={{ fontSize: 12, color: '#9b978f' }}>
                by {selectedBooking?.service_provider?.users?.first_name} {selectedBooking?.service_provider?.users?.last_name}
              </div>
            </div>

            {/* Star Rating */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, fontWeight: 500, color: '#6b6860', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 8 }}>
                Rating
              </label>
              <div style={{ display: 'flex', gap: 6 }}>
                {[1, 2, 3, 4, 5].map(star => (
                  <span key={star} onClick={() => setRating(star)}
                    style={{ fontSize: 32, cursor: 'pointer', color: star <= rating ? '#f9a825' : '#d4d2cc', transition: 'color .15s' }}>
                    ★
                  </span>
                ))}
              </div>
            </div>

            {/* Comment */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 12, fontWeight: 500, color: '#6b6860', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 6 }}>
                Your Comment
              </label>
              <textarea value={comment} onChange={e => setComment(e.target.value)}
                rows={4} placeholder="Share your experience..."
                style={{ width: '100%', border: '1.5px dashed #d4d2cc', borderRadius: 7, padding: '10px 13px', fontSize: 13, fontFamily: 'Arial', outline: 'none', background: '#f4f3f0', resize: 'vertical', boxSizing: 'border-box' }} />
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowModal(false)}
                style={{ padding: '9px 18px', background: 'transparent', border: '1.5px solid #a8a49c', borderRadius: 7, cursor: 'pointer', fontSize: 13 }}>
                Cancel
              </button>
              <button onClick={submitReview} disabled={submitting}
                style={{ padding: '9px 18px', background: '#3d5afe', color: '#fff', border: 'none', borderRadius: 7, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                {submitting ? 'Submitting...' : 'Submit Review'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}