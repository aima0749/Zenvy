import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../supabaseClient'

export default function ProviderDashboard() {
  const [user, setUser] = useState(null)
  const [provider, setProvider] = useState(null)
  const [bookings, setBookings] = useState([])
  const [reviews, setReviews] = useState([])
  const [stats, setStats] = useState({ services: 0, upcoming: 0, rating: 0, totalReviews: 0 })
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) { navigate('/auth'); return }

    // Get user info
    const { data: userData } = await supabase
      .from('users')
      .select('*')
      .eq('user_id', authUser.id)
      .single()
    setUser(userData)

    // Get provider info
    const { data: providerData } = await supabase
      .from('service_provider')
      .select('*')
      .eq('user_id', authUser.id)
      .single()
    setProvider(providerData)

    // Get incoming bookings
    const { data: bookingData } = await supabase
      .from('booking')
      .select(`
        booking_id, status, service_date, location, booking_date,
        service(service_name, price),
        customer(user_id, users(first_name, last_name))
      `)
      .eq('provider_id', authUser.id)
      .order('booking_date', { ascending: false })
      .limit(5)
    setBookings(bookingData || [])

    // Get recent reviews
    const { data: reviewData } = await supabase
      .from('review')
      .select(`
        review_id, rating, comment, review_date,
        customer(user_id, users(first_name, last_name)),
        booking(service(service_name))
      `)
      .eq('provider_id', authUser.id)
      .order('review_date', { ascending: false })
      .limit(3)
    setReviews(reviewData || [])

    // Get stats
    const { data: allBookings } = await supabase
      .from('booking')
      .select('status')
      .eq('provider_id', authUser.id)

    const { data: servicesData } = await supabase
      .from('provider_service')
      .select('service_id')
      .eq('provider_id', authUser.id)

    const { data: allReviews } = await supabase
      .from('review')
      .select('rating')
      .eq('provider_id', authUser.id)

    const avgRating = allReviews?.length > 0
      ? (allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length).toFixed(1)
      : 0

    setStats({
      services: servicesData?.length || 0,
      upcoming: allBookings?.filter(b => ['pending', 'accepted'].includes(b.status)).length || 0,
      rating: avgRating,
      totalReviews: allReviews?.length || 0
    })

    setLoading(false)
  }

  const handleBookingAction = async (bookingId, action) => {
    const { error } = await supabase
      .from('booking')
      .update({ status: action })
      .eq('booking_id', bookingId)
    if (error) { alert('Error: ' + error.message); return }
    fetchData()
  }

  const getBadge = (status) => {
    const map = {
      pending: { bg: '#fff3e0', color: '#e65100' },
      accepted: { bg: '#e3f2fd', color: '#1565c0' },
      in_progress: { bg: '#f3e5f5', color: '#6a1b9a' },
      completed: { bg: '#e8f5e9', color: '#2e7d32' },
      cancelled: { bg: '#fce4ec', color: '#b71c1c' },
    }
    return map[status] || map.pending
  }

  const sidebarItems = [
    { label: 'Dashboard', icon: '🏠', path: '/provider/dashboard', active: true },
    { label: 'My Services', icon: '🔧', path: '/provider/services' },
    { label: 'Availability', icon: '📆', path: '/provider/availability' },
    { label: 'Assigned Bookings', icon: '📋', path: '/provider/bookings' },
    { label: 'Bundle Tasks', icon: '📦', path: '/provider/bundles' },
    { label: 'My Reviews', icon: '⭐', path: '/provider/reviews' },
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
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #2e2e42' }}>
          <div style={{ color: '#fff', fontWeight: 600, fontSize: 13 }}>{user?.first_name} {user?.last_name}</div>
          <div style={{ color: '#888', fontSize: 11, marginTop: 2 }}>Service Provider</div>
          <div style={{ marginTop: 6 }}>
            <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 10, background: provider?.availability_status ? '#e8f5e9' : '#fce4ec', color: provider?.availability_status ? '#2e7d32' : '#b71c1c' }}>
              {provider?.availability_status ? '● Available' : '● Busy'}
            </span>
          </div>
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

        {/* Welcome Banner */}
        <div style={{ background: '#fff', border: '2px dashed #d4d2cc', borderRadius: 12, padding: '24px 28px', marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 9, color: '#b0acaa', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6, fontFamily: 'monospace' }}>PROVIDER DASHBOARD</div>
            <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Welcome back, {user?.first_name}!</h2>
            <p style={{ color: '#6b6860', marginTop: 4, fontSize: 13 }}>
              You have {stats.upcoming} pending/upcoming jobs this week.
            </p>
            <button onClick={() => navigate('/provider/availability')}
              style={{ marginTop: 12, padding: '9px 20px', background: '#3d5afe', color: '#fff', border: 'none', borderRadius: 7, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
              Manage Availability →
            </button>
          </div>
          <div style={{ width: 100, height: 70, border: '2px dashed #d4d2cc', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#b0acaa', fontFamily: 'monospace', flexShrink: 0 }}>
            ILLUSTRATION
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
          {[
            { label: 'Services Offered', value: stats.services, color: '#1a1a2e' },
            { label: 'Upcoming Jobs', value: stats.upcoming, color: '#3d5afe' },
            { label: 'Avg. Rating', value: `★ ${stats.rating}`, color: '#f9a825' },
            { label: 'Total Reviews', value: stats.totalReviews, color: '#1a1a2e' },
          ].map(s => (
            <div key={s.label} style={{ background: '#fff', border: '1px solid #d4d2cc', borderRadius: 10, padding: '18px 20px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
              <div style={{ fontSize: 11, color: '#9b978f', textTransform: 'uppercase', letterSpacing: 0.8, fontFamily: 'monospace' }}>{s.label}</div>
              <div style={{ fontSize: 28, fontWeight: 700, marginTop: 6, color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Incoming Booking Requests */}
        <div style={{ background: '#fff', border: '1px solid #d4d2cc', borderRadius: 10, padding: 20, marginBottom: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <span style={{ fontSize: 15, fontWeight: 600 }}>Incoming Booking Requests</span>
            <span onClick={() => navigate('/provider/bookings')} style={{ fontSize: 12, color: '#3d5afe', cursor: 'pointer' }}>View All →</span>
          </div>

          {bookings.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px 20px', color: '#9b978f' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>📋</div>
              <p style={{ fontSize: 13 }}>No booking requests yet.</p>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f4f3f0' }}>
                  {['Customer', 'Service', 'Service Date', 'Location', 'Status', 'Action'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, color: '#9b978f', fontFamily: 'monospace', borderBottom: '1px solid #d4d2cc' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {bookings.map(b => {
                  const badge = getBadge(b.status)
                  const customerName = b.customer?.users
                    ? `${b.customer.users.first_name} ${b.customer.users.last_name}`
                    : '—'
                  return (
                    <tr key={b.booking_id} style={{ borderBottom: '1px solid #f0ede8' }}>
                      <td style={{ padding: '12px 14px', fontSize: 13, fontWeight: 500 }}>{customerName}</td>
                      <td style={{ padding: '12px 14px', fontSize: 13 }}>{b.service?.service_name}</td>
                      <td style={{ padding: '12px 14px', fontSize: 13 }}>{b.service_date}</td>
                      <td style={{ padding: '12px 14px', fontSize: 13 }}>{b.location || '—'}</td>
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{ background: badge.bg, color: badge.color, padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 500, fontFamily: 'monospace' }}>
                          {b.status}
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          {b.status === 'pending' && (
                            <>
                              <button onClick={() => handleBookingAction(b.booking_id, 'accepted')}
                                style={{ padding: '5px 10px', background: '#e8f5e9', color: '#2e7d32', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 11, fontWeight: 500 }}>
                                Accept
                              </button>
                              <button onClick={() => handleBookingAction(b.booking_id, 'cancelled')}
                                style={{ padding: '5px 10px', background: '#fce4ec', color: '#b71c1c', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 11, fontWeight: 500 }}>
                                Reject
                              </button>
                            </>
                          )}
                          {b.status === 'accepted' && (
                            <button onClick={() => handleBookingAction(b.booking_id, 'in_progress')}
                              style={{ padding: '5px 10px', background: '#f3e5f5', color: '#6a1b9a', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 11, fontWeight: 500 }}>
                              Start
                            </button>
                          )}
                          {b.status === 'in_progress' && (
                            <button onClick={() => handleBookingAction(b.booking_id, 'completed')}
                              style={{ padding: '5px 10px', background: '#e8f5e9', color: '#2e7d32', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 11, fontWeight: 500 }}>
                              Complete
                            </button>
                          )}
                          {['completed', 'cancelled'].includes(b.status) && (
                            <button style={{ padding: '5px 10px', background: 'transparent', border: '1.5px solid #a8a49c', borderRadius: 6, cursor: 'pointer', fontSize: 11 }}>
                              View
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Recent Reviews */}
        <div style={{ background: '#fff', border: '1px solid #d4d2cc', borderRadius: 10, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <span style={{ fontSize: 15, fontWeight: 600 }}>Recent Reviews</span>
            <span onClick={() => navigate('/provider/reviews')} style={{ fontSize: 12, color: '#3d5afe', cursor: 'pointer' }}>View All →</span>
          </div>
          {reviews.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px 20px', color: '#9b978f' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>⭐</div>
              <p style={{ fontSize: 13 }}>No reviews yet.</p>
            </div>
          ) : (
            reviews.map(r => (
              <div key={r.review_id} style={{ border: '1px solid #d4d2cc', borderRadius: 10, padding: 16, marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>
                    {r.customer?.users?.first_name} {r.customer?.users?.last_name}
                  </div>
                  <div style={{ color: '#f9a825' }}>{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</div>
                </div>
                <p style={{ fontSize: 13, color: '#6b6860', margin: 0 }}>{r.comment}</p>
              </div>
            ))
          )}
        </div>

      </main>
    </div>
  )
}