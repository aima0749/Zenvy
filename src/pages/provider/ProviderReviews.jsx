import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../supabaseClient'

export default function ProviderReviews() {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const navigate = useNavigate()

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { navigate('/auth'); return }

    const { data, error } = await supabase
      .from('review')
      .select(`
        review_id, rating, comment, review_date,
        customer(user_id, users(first_name, last_name)),
        booking(booking_id, service(service_name), service_date)
      `)
      .eq('provider_id', user.id)
      .order('review_date', { ascending: false })

    console.log('reviews:', data, error)
    setReviews(data || [])
    setLoading(false)
  }

  const filtered = filter === 'all'
    ? reviews
    : reviews.filter(r => r.rating === parseInt(filter))

  const counts = {
    all: reviews.length,
    5: reviews.filter(r => r.rating === 5).length,
    4: reviews.filter(r => r.rating === 4).length,
    3: reviews.filter(r => r.rating === 3).length,
    2: reviews.filter(r => r.rating === 2).length,
    1: reviews.filter(r => r.rating === 1).length,
  }

  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : 0

  // Rating distribution percentages
  const ratingDist = [5, 4, 3, 2, 1].map(star => ({
    star,
    count: counts[star],
    pct: reviews.length > 0 ? Math.round((counts[star] / reviews.length) * 100) : 0
  }))

  const sidebarItems = [
    { label: 'Dashboard',         icon: '🏠', path: '/provider/dashboard' },
    { label: 'My Services',       icon: '🔧', path: '/provider/services' },
    { label: 'Availability',      icon: '📆', path: '/provider/availability' },
    { label: 'Assigned Bookings', icon: '📋', path: '/provider/bookings' },
    { label: 'Bundle Tasks',      icon: '📦', path: '/provider/bundles' },
    { label: 'My Reviews',        icon: '⭐', path: '/provider/reviews', active: true },
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
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>My Reviews</h1>
          <p style={{ color: '#6b6860', marginTop: 4, fontSize: 13 }}>Feedback from customers about your services</p>
        </div>

        {/* Top Summary Row */}
        <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 20, marginBottom: 24 }}>

          {/* Rating Summary Card */}
          <div style={{ background: '#fff', border: '1px solid #d4d2cc', borderRadius: 10, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: '#9b978f', textTransform: 'uppercase', letterSpacing: 0.8, fontFamily: 'monospace', marginBottom: 8 }}>
              Overall Rating
            </div>
            <div style={{ fontSize: 52, fontWeight: 700, color: '#1a1a2e', lineHeight: 1 }}>{avgRating}</div>
            <div style={{ color: '#f9a825', fontSize: 22, margin: '8px 0' }}>
              {'★'.repeat(Math.round(avgRating))}{'☆'.repeat(5 - Math.round(avgRating))}
            </div>
            <div style={{ fontSize: 12, color: '#9b978f' }}>
              Based on {reviews.length} review{reviews.length !== 1 ? 's' : ''}
            </div>
          </div>

          {/* Rating Distribution */}
          <div style={{ background: '#fff', border: '1px solid #d4d2cc', borderRadius: 10, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
            <div style={{ fontSize: 11, color: '#9b978f', textTransform: 'uppercase', letterSpacing: 0.8, fontFamily: 'monospace', marginBottom: 14 }}>
              Rating Breakdown
            </div>
            {ratingDist.map(({ star, count, pct }) => (
              <div key={star} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <div style={{ width: 40, fontSize: 12, color: '#6b6860', textAlign: 'right', flexShrink: 0 }}>
                  {star} ★
                </div>
                <div style={{ flex: 1, background: '#f4f3f0', borderRadius: 4, height: 10, overflow: 'hidden' }}>
                  <div style={{ width: `${pct}%`, height: '100%', background: star >= 4 ? '#f9a825' : star === 3 ? '#ff9800' : '#e53935', borderRadius: 4, transition: 'width .3s' }} />
                </div>
                <div style={{ width: 40, fontSize: 12, color: '#9b978f', flexShrink: 0 }}>
                  {count}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Stats Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
          {[
            { label: 'Total Reviews', value: counts.all,  color: '#1a1a2e' },
            { label: '5 Star',        value: counts[5],   color: '#f9a825' },
            { label: '4 Star',        value: counts[4],   color: '#fb8c00' },
            { label: '1-3 Star',      value: counts[3] + counts[2] + counts[1], color: '#e53935' },
          ].map(s => (
            <div key={s.label} style={{ background: '#fff', border: '1px solid #d4d2cc', borderRadius: 10, padding: '16px 20px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
              <div style={{ fontSize: 11, color: '#9b978f', textTransform: 'uppercase', letterSpacing: 0.8, fontFamily: 'monospace' }}>{s.label}</div>
              <div style={{ fontSize: 26, fontWeight: 700, marginTop: 6, color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Filter Tabs */}
        <div style={{ display: 'flex', borderBottom: '2px solid #d4d2cc', marginBottom: 20 }}>
          {['all', '5', '4', '3', '2', '1'].map(tab => (
            <div key={tab} onClick={() => setFilter(tab)}
              style={{ padding: '10px 16px', fontSize: 13, cursor: 'pointer', color: filter === tab ? '#3d5afe' : '#6b6860', borderBottom: filter === tab ? '2px solid #3d5afe' : '2px solid transparent', marginBottom: -2, fontWeight: filter === tab ? 600 : 400 }}>
              {tab === 'all' ? 'All Reviews' : `${tab} ★`}
              <span style={{ marginLeft: 5, fontSize: 11, color: '#9b978f' }}>({counts[tab]})</span>
            </div>
          ))}
        </div>

        {/* Reviews List */}
        {filtered.length === 0 ? (
          <div style={{ background: '#fff', border: '1px solid #d4d2cc', borderRadius: 10, padding: '60px 20px', textAlign: 'center', color: '#9b978f', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>⭐</div>
            <p style={{ fontSize: 13 }}>No reviews yet. Complete bookings to receive feedback!</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {filtered.map(r => (
              <div key={r.review_id} style={{ background: '#fff', border: '1px solid #d4d2cc', borderRadius: 10, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>

                  {/* Left - customer info */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 10, background: '#e8ecff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, color: '#3d5afe', flexShrink: 0 }}>
                      {r.customer?.users?.first_name?.charAt(0) || '?'}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>
                        {r.customer?.users?.first_name} {r.customer?.users?.last_name}
                      </div>
                      <div style={{ fontSize: 12, color: '#9b978f', marginTop: 2 }}>
                        {r.booking?.service?.service_name || '—'} · {r.booking?.service_date || '—'}
                      </div>
                    </div>
                  </div>

                  {/* Right - rating + date */}
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ color: '#f9a825', fontSize: 18 }}>
                      {'★'.repeat(r.rating)}
                      <span style={{ color: '#d4d2cc' }}>{'★'.repeat(5 - r.rating)}</span>
                    </div>
                    <div style={{ fontSize: 11, color: '#9b978f', marginTop: 4 }}>
                      {new Date(r.review_date).toLocaleDateString('en-PK', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </div>
                  </div>
                </div>

                {/* Comment */}
                <p style={{ fontSize: 13, color: '#3d3a34', lineHeight: 1.7, margin: 0, padding: '12px 14px', background: '#f4f3f0', borderRadius: 8, borderLeft: '3px solid #d4d2cc' }}>
                  "{r.comment}"
                </p>

                {/* Rating badge */}
                <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
                  <span style={{
                    padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 500, fontFamily: 'monospace',
                    background: r.rating >= 4 ? '#e8f5e9' : r.rating === 3 ? '#fff3e0' : '#fce4ec',
                    color: r.rating >= 4 ? '#2e7d32' : r.rating === 3 ? '#e65100' : '#b71c1c'
                  }}>
                    {r.rating >= 4 ? '😊 Positive' : r.rating === 3 ? '😐 Neutral' : '😞 Negative'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}