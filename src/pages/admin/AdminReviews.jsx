import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../supabaseClient'

export default function AdminReviews() {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [stats, setStats] = useState({ total: 0, avgRating: 0, fiveStar: 0, oneStar: 0 })
  const navigate = useNavigate()

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    const { data, error } = await supabase
      .from('review')
      .select(`
        review_id, rating, comment, review_date,
        customer(user_id, users(first_name, last_name, email)),
        service_provider(user_id, users(first_name, last_name)),
        booking(booking_id, service(service_name), service_date),
        bundle_offer(bundle_id, service_date)
      `)
      .order('review_date', { ascending: false })

    console.log('reviews:', data, error)
    setReviews(data || [])

    const avg = (data || []).length > 0
      ? (data.reduce((sum, r) => sum + r.rating, 0) / data.length).toFixed(1)
      : 0

    setStats({
      total:     (data || []).length,
      avgRating: avg,
      fiveStar:  (data || []).filter(r => r.rating === 5).length,
      oneStar:   (data || []).filter(r => r.rating === 1).length,
    })

    setLoading(false)
  }

  const deleteReview = async (reviewId) => {
    if (!window.confirm('Delete this review permanently?')) return
    const { error } = await supabase.from('review').delete().eq('review_id', reviewId)
    if (error) { alert('Error: ' + error.message); return }
    fetchData()
  }

  const filtered = reviews
    .filter(r => {
      if (filter === 'all') return true
      if (filter === '5') return r.rating === 5
      if (filter === '4') return r.rating === 4
      if (filter === '3') return r.rating === 3
      if (filter === 'low') return r.rating <= 2
      return true
    })
    .filter(r => {
      if (!search) return true
      const customer = r.customer?.users
      const provider = r.service_provider?.users
      const service = r.booking?.service?.service_name || ''
      const comment = r.comment || ''
      const customerName = customer ? `${customer.first_name} ${customer.last_name}` : ''
      const providerName = provider ? `${provider.first_name} ${provider.last_name}` : ''
      const q = search.toLowerCase()
      return customerName.toLowerCase().includes(q) ||
             providerName.toLowerCase().includes(q) ||
             service.toLowerCase().includes(q) ||
             comment.toLowerCase().includes(q)
    })

  const counts = {
    all:  reviews.length,
    5:    reviews.filter(r => r.rating === 5).length,
    4:    reviews.filter(r => r.rating === 4).length,
    3:    reviews.filter(r => r.rating === 3).length,
    low:  reviews.filter(r => r.rating <= 2).length,
  }

  const ratingDist = [5, 4, 3, 2, 1].map(star => ({
    star,
    count: reviews.filter(r => r.rating === star).length,
    pct: reviews.length > 0
      ? Math.round((reviews.filter(r => r.rating === star).length / reviews.length) * 100)
      : 0
  }))

  const sidebarItems = [
    { label: 'Dashboard', icon: '🏠', path: '/admin/dashboard' },
    { label: 'Users',     icon: '👥', path: '/admin/users' },
    { label: 'Bookings',  icon: '📋', path: '/admin/bookings' },
    { label: 'Services',  icon: '🔧', path: '/admin/services' },
    { label: 'Payments',  icon: '💳', path: '/admin/payments' },
    { label: 'Reviews',   icon: '⭐', path: '/admin/reviews', active: true },
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
      <aside style={{ width: 240, background: '#1a1a2e', display: 'flex', flexDirection: 'column', position: 'fixed', top: 0, left: 0, bottom: 0 }}>
        <div style={{ padding: '24px 20px 16px', fontSize: 22, fontWeight: 700, color: '#fff', borderBottom: '1px solid #2e2e42' }}>
          <span style={{ color: '#e53935' }}>Z</span>envy <span style={{ fontSize: 11, color: '#e53935', fontFamily: 'monospace' }}>ADMIN</span>
        </div>
        <nav style={{ flex: 1, paddingTop: 12 }}>
          {sidebarItems.map(item => (
            <div key={item.path} onClick={() => navigate(item.path)}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 20px', cursor: 'pointer', fontSize: 13, color: item.active ? '#fff' : '#c8c4bc', background: item.active ? '#2e2e42' : 'transparent', borderLeft: item.active ? '3px solid #e53935' : '3px solid transparent' }}>
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
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Review Moderation</h1>
          <p style={{ color: '#6b6860', marginTop: 4, fontSize: 13 }}>Monitor and moderate all platform reviews</p>
        </div>

        {/* Top Summary */}
        <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 20, marginBottom: 24 }}>

          {/* Overall Rating */}
          <div style={{ background: '#fff', border: '1px solid #d4d2cc', borderRadius: 10, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: '#9b978f', textTransform: 'uppercase', letterSpacing: 0.8, fontFamily: 'monospace', marginBottom: 8 }}>
              Platform Avg
            </div>
            <div style={{ fontSize: 48, fontWeight: 700, color: '#1a1a2e', lineHeight: 1 }}>
              {stats.avgRating}
            </div>
            <div style={{ color: '#f9a825', fontSize: 20, margin: '8px 0' }}>
              {'★'.repeat(Math.round(stats.avgRating))}
              {'☆'.repeat(5 - Math.round(stats.avgRating))}
            </div>
            <div style={{ fontSize: 12, color: '#9b978f' }}>
              {stats.total} total review{stats.total !== 1 ? 's' : ''}
            </div>
          </div>

          {/* Rating Distribution */}
          <div style={{ background: '#fff', border: '1px solid #d4d2cc', borderRadius: 10, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
            <div style={{ fontSize: 11, color: '#9b978f', textTransform: 'uppercase', letterSpacing: 0.8, fontFamily: 'monospace', marginBottom: 14 }}>
              Rating Breakdown
            </div>
            {ratingDist.map(({ star, count, pct }) => (
              <div key={star} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <div style={{ width: 36, fontSize: 12, color: '#6b6860', textAlign: 'right', flexShrink: 0 }}>
                  {star} ★
                </div>
                <div style={{ flex: 1, background: '#f4f3f0', borderRadius: 4, height: 10, overflow: 'hidden' }}>
                  <div style={{
                    width: `${pct}%`, height: '100%', borderRadius: 4,
                    background: star >= 4 ? '#f9a825' : star === 3 ? '#ff9800' : '#e53935',
                    transition: 'width .3s'
                  }} />
                </div>
                <div style={{ width: 50, fontSize: 12, color: '#9b978f', flexShrink: 0 }}>
                  {count} ({pct}%)
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Stats Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
          {[
            { label: 'Total Reviews', value: stats.total,     color: '#1a1a2e' },
            { label: 'Avg Rating',    value: `★ ${stats.avgRating}`, color: '#f9a825' },
            { label: '5 Star',        value: stats.fiveStar,  color: '#2e7d32' },
            { label: '1-2 Star',      value: stats.oneStar,   color: '#e53935' },
          ].map(s => (
            <div key={s.label} style={{ background: '#fff', border: '1px solid #d4d2cc', borderRadius: 10, padding: '16px 20px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
              <div style={{ fontSize: 11, color: '#9b978f', textTransform: 'uppercase', letterSpacing: 0.8, fontFamily: 'monospace' }}>{s.label}</div>
              <div style={{ fontSize: 26, fontWeight: 700, marginTop: 6, color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Search */}
        <div style={{ background: '#fff', border: '1px solid #d4d2cc', borderRadius: 10, padding: '14px 18px', marginBottom: 16, display: 'flex', gap: 12, alignItems: 'center' }}>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="🔍  Search by customer, provider, service or comment..."
            style={{ flex: 1, border: '1.5px solid #d4d2cc', borderRadius: 7, padding: '8px 12px', fontSize: 13, outline: 'none', background: '#f4f3f0' }} />
          <button onClick={() => setSearch('')}
            style={{ padding: '8px 14px', background: 'transparent', border: '1.5px solid #a8a49c', borderRadius: 7, cursor: 'pointer', fontSize: 13 }}>
            Clear
          </button>
        </div>

        {/* Filter Tabs */}
        <div style={{ display: 'flex', borderBottom: '2px solid #d4d2cc', marginBottom: 20 }}>
          {[
            { key: 'all', label: 'All Reviews' },
            { key: '5',   label: '5 ★' },
            { key: '4',   label: '4 ★' },
            { key: '3',   label: '3 ★' },
            { key: 'low', label: '1-2 ★ (Low)' },
          ].map(tab => (
            <div key={tab.key} onClick={() => setFilter(tab.key)}
              style={{ padding: '10px 16px', fontSize: 13, cursor: 'pointer', color: filter === tab.key ? '#e53935' : '#6b6860', borderBottom: filter === tab.key ? '2px solid #e53935' : '2px solid transparent', marginBottom: -2, fontWeight: filter === tab.key ? 600 : 400, whiteSpace: 'nowrap' }}>
              {tab.label}
              <span style={{ marginLeft: 5, fontSize: 11, color: '#9b978f' }}>({counts[tab.key]})</span>
            </div>
          ))}
        </div>

        {/* Reviews List */}
        {filtered.length === 0 ? (
          <div style={{ background: '#fff', border: '1px solid #d4d2cc', borderRadius: 10, padding: '60px 20px', textAlign: 'center', color: '#9b978f', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>⭐</div>
            <p style={{ fontSize: 13 }}>No reviews found.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {filtered.map(r => {
              const customer = r.customer?.users
              const provider = r.service_provider?.users
              const isBundle = !!r.bundle_offer?.bundle_id
              const forLabel = isBundle
                ? `Bundle · ${r.bundle_offer?.service_date}`
                : `${r.booking?.service?.service_name || '—'} · ${r.booking?.service_date || '—'}`

              return (
                <div key={r.review_id} style={{ background: '#fff', border: '1px solid #d4d2cc', borderRadius: 10, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>

                    {/* Left */}
                    <div style={{ flex: 1 }}>

                      {/* Top row */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
                        <span style={{ background: isBundle ? '#e8ecff' : '#e8f5e9', color: isBundle ? '#3d5afe' : '#2e7d32', padding: '3px 8px', borderRadius: 20, fontSize: 11, fontFamily: 'monospace' }}>
                          {isBundle ? '📦 Bundle' : '📅 Booking'}
                        </span>
                        <span style={{
                          padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, fontFamily: 'monospace',
                          background: r.rating >= 4 ? '#e8f5e9' : r.rating === 3 ? '#fff3e0' : '#fce4ec',
                          color: r.rating >= 4 ? '#2e7d32' : r.rating === 3 ? '#e65100' : '#b71c1c'
                        }}>
                          {r.rating >= 4 ? '😊 Positive' : r.rating === 3 ? '😐 Neutral' : '😞 Negative'}
                        </span>
                        <span style={{ fontSize: 11, color: '#9b978f', fontFamily: 'monospace' }}>
                          {new Date(r.review_date).toLocaleDateString()}
                        </span>
                      </div>

                      {/* People row */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px 20px', fontSize: 13, color: '#6b6860', marginBottom: 12 }}>
                        <div>
                          <span style={{ color: '#9b978f', fontSize: 11, display: 'block', marginBottom: 2 }}>CUSTOMER</span>
                          <div style={{ fontWeight: 500 }}>
                            {customer ? `${customer.first_name} ${customer.last_name}` : '—'}
                          </div>
                          <div style={{ fontSize: 11, color: '#9b978f' }}>{customer?.email || ''}</div>
                        </div>
                        <div>
                          <span style={{ color: '#9b978f', fontSize: 11, display: 'block', marginBottom: 2 }}>PROVIDER</span>
                          <div style={{ fontWeight: 500 }}>
                            {provider ? `${provider.first_name} ${provider.last_name}` : '—'}
                          </div>
                        </div>
                        <div>
                          <span style={{ color: '#9b978f', fontSize: 11, display: 'block', marginBottom: 2 }}>FOR</span>
                          <div>{forLabel}</div>
                        </div>
                      </div>

                      {/* Comment */}
                      <div style={{ fontSize: 13, color: '#3d3a34', lineHeight: 1.7, padding: '12px 14px', background: '#f4f3f0', borderRadius: 8, borderLeft: '3px solid #d4d2cc' }}>
                        "{r.comment}"
                      </div>
                    </div>

                    {/* Right - Rating + Delete */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 12, flexShrink: 0 }}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 28, fontWeight: 700, color: r.rating >= 4 ? '#f9a825' : r.rating === 3 ? '#ff9800' : '#e53935' }}>
                          {r.rating}
                        </div>
                        <div style={{ color: '#f9a825', fontSize: 14 }}>
                          {'★'.repeat(r.rating)}
                          <span style={{ color: '#d4d2cc' }}>{'★'.repeat(5 - r.rating)}</span>
                        </div>
                      </div>
                      <button onClick={() => deleteReview(r.review_id)}
                        style={{ padding: '7px 14px', background: '#fce4ec', color: '#b71c1c', border: 'none', borderRadius: 7, cursor: 'pointer', fontSize: 12, fontWeight: 500 }}>
                        🗑 Remove
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}