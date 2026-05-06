import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../supabaseClient'

export default function CustomerDashboard() {
  const [user, setUser] = useState(null)
  const [bookings, setBookings] = useState([])
  const [stats, setStats] = useState({ total: 0, active: 0, pending_payments: 0, reviews: 0 })
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    fetchData()
  }, [])

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

    // Get recent bookings
    const { data: bookingData, error } = await supabase
  .from('booking')
  .select(`
    booking_id, status, booking_date, service_date, location,
    service(service_name),
    service_provider(user_id)
  `)
  .eq('customer_id', authUser.id)
  .order('booking_date', { ascending: false })
  .limit(5)

console.log(bookingData, error)
    // Get stats
    const { data: allBookings } = await supabase
      .from('booking')
      .select('status')
      .eq('customer_id', authUser.id)

    const { data: reviewData } = await supabase
      .from('review')
      .select('review_id')
      .eq('customer_id', authUser.id)

    const { data: paymentData } = await supabase
      .from('payment')
      .select('booking_id, payment_status, booking!inner(customer_id)')
      .eq('booking.customer_id', authUser.id)
      .eq('payment_status', 'pending')

    setStats({
      total: allBookings?.length || 0,
      active: allBookings?.filter(b => ['accepted', 'in_progress'].includes(b.status)).length || 0,
      pending_payments: paymentData?.length || 0,
      reviews: reviewData?.length || 0
    })

    setLoading(false)
  }

  const logout = async () => {
    await supabase.auth.signOut()
    navigate('/auth')
  }

  const getBadgeStyle = (status) => {
    const styles = {
      pending: { background: '#fff3e0', color: '#e65100' },
      accepted: { background: '#e3f2fd', color: '#1565c0' },
      in_progress: { background: '#f3e5f5', color: '#6a1b9a' },
      completed: { background: '#e8f5e9', color: '#2e7d32' },
      cancelled: { background: '#fce4ec', color: '#b71c1c' },
    }
    return styles[status] || styles.pending
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'Arial' }}>
      <p>Loading...</p>
    </div>
  )

  return (
    <div style={{ display: 'flex', fontFamily: 'Arial', minHeight: '100vh', background: '#f4f3f0' }}>

      {/* ── SIDEBAR ── */}
      <aside style={{ width: 240, background: '#1e1e2e', display: 'flex', flexDirection: 'column', position: 'fixed', top: 0, left: 0, bottom: 0 }}>
        <div style={{ padding: '24px 20px 16px', fontSize: 22, fontWeight: 700, color: '#fff', borderBottom: '1px solid #2e2e42' }}>
          <span style={{ color: '#3d5afe' }}>Z</span>envy
        </div>

        <div style={{ padding: '16px 20px', borderBottom: '1px solid #2e2e42' }}>
          <div style={{ color: '#fff', fontWeight: 600, fontSize: 13 }}>{user?.first_name} {user?.last_name}</div>
          <div style={{ color: '#888', fontSize: 11, marginTop: 2 }}>Customer</div>
        </div>

        <nav style={{ flex: 1, paddingTop: 12 }}>
          {[
            { label: 'Dashboard', icon: '🏠', path: '/customer/dashboard', active: true },
            { label: 'Browse Services', icon: '🔍', path: '/customer/browse' },
            { label: 'My Bookings', icon: '📅', path: '/customer/bookings' },
            { label: 'Bundle Offers', icon: '📦', path: '/customer/bundles' },
            { label: 'Payments', icon: '💳', path: '/customer/payments' },
            { label: 'My Reviews', icon: '⭐', path: '/customer/reviews' },
          ].map(item => (
            <div key={item.path}
              onClick={() => navigate(item.path)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 20px', cursor: 'pointer', fontSize: 13,
                color: item.active ? '#fff' : '#c8c4bc',
                background: item.active ? '#3a3a52' : 'transparent',
                borderLeft: item.active ? '3px solid #3d5afe' : '3px solid transparent',
                transition: 'all .15s'
              }}>
              <span>{item.icon}</span> {item.label}
            </div>
          ))}
        </nav>

        <div style={{ padding: '16px 0', borderTop: '1px solid #2e2e42' }}>
          <div onClick={logout}
            style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 20px', cursor: 'pointer', color: '#e57373', fontSize: 13 }}>
            <span>⬅️</span> Logout
          </div>
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <main style={{ marginLeft: 240, flex: 1, padding: '28px 32px' }}>

        {/* Welcome Banner */}
        <div style={{ background: '#fff', border: '2px dashed #d4d2cc', borderRadius: 12, padding: '24px 28px', marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 9, color: '#b0acaa', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6, fontFamily: 'monospace' }}>WELCOME BACK</div>
            <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Hello {user?.first_name}, what do you need today?</h2>
            <p style={{ color: '#6b6860', marginTop: 4, fontSize: 13 }}>Manage your bookings, browse services, or track payments.</p>
            <button onClick={() => navigate('/customer/browse')}
              style={{ marginTop: 12, padding: '9px 20px', background: '#3d5afe', color: '#fff', border: 'none', borderRadius: 7, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
              Browse Services →
            </button>
          </div>
          <div style={{ width: 100, height: 70, border: '2px dashed #d4d2cc', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#b0acaa', fontFamily: 'monospace', flexShrink: 0 }}>
            ILLUSTRATION
          </div>
        </div>

        {/* Stats Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
          {[
            { label: 'Total Bookings', value: stats.total, color: '#1a1a2e' },
            { label: 'Active Bookings', value: stats.active, color: '#3d5afe' },
            { label: 'Pending Payments', value: stats.pending_payments, color: '#e53935' },
            { label: 'Reviews Written', value: stats.reviews, color: '#1a1a2e' },
          ].map(stat => (
            <div key={stat.label} style={{ background: '#fff', border: '1px solid #d4d2cc', borderRadius: 10, padding: '18px 20px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
              <div style={{ fontSize: 11, color: '#9b978f', textTransform: 'uppercase', letterSpacing: 0.8, fontFamily: 'monospace' }}>{stat.label}</div>
              <div style={{ fontSize: 28, fontWeight: 700, marginTop: 6, color: stat.color }}>{stat.value}</div>
            </div>
          ))}
        </div>

        {/* Recent Bookings */}
        <div style={{ background: '#fff', border: '1px solid #d4d2cc', borderRadius: 10, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <span style={{ fontSize: 15, fontWeight: 600 }}>Recent Bookings</span>
            <span onClick={() => navigate('/customer/bookings')}
              style={{ fontSize: 12, color: '#3d5afe', cursor: 'pointer' }}>View All →</span>
          </div>

          {bookings.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#9b978f' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📅</div>
              <p style={{ fontSize: 13 }}>No bookings yet. Browse services to get started!</p>
              <button onClick={() => navigate('/customer/browse')}
                style={{ marginTop: 12, padding: '8px 20px', background: '#3d5afe', color: '#fff', border: 'none', borderRadius: 7, cursor: 'pointer', fontSize: 13 }}>
                Browse Services
              </button>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f4f3f0' }}>
                  {['Service', 'Provider', 'Service Date', 'Location', 'Status', 'Action'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, color: '#9b978f', fontFamily: 'monospace', borderBottom: '1px solid #d4d2cc' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {bookings.map(b => (
                  <tr key={b.booking_id} style={{ borderBottom: '1px solid #f0ede8' }}>
                    <td style={{ padding: '12px 14px', fontSize: 13 }}>{b.service?.service_name || '—'}</td>
                    <td style={{ padding: '12px 14px', fontSize: 13 }}>
                      {b.service_provider?.users ? `${b.service_provider.users.first_name} ${b.service_provider.users.last_name}` : '—'}
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: 13 }}>{b.service_date}</td>
                    <td style={{ padding: '12px 14px', fontSize: 13 }}>{b.location || '—'}</td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{ ...getBadgeStyle(b.status), padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 500, fontFamily: 'monospace' }}>
                        {b.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <button onClick={() => navigate('/customer/bookings')}
                        style={{ padding: '5px 11px', background: 'transparent', border: '1.5px solid #a8a49c', borderRadius: 7, cursor: 'pointer', fontSize: 12 }}>
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

      </main>
    </div>
  )
}