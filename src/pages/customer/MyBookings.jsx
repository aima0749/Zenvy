import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../supabaseClient'

export default function MyBookings() {
  const [bookings, setBookings] = useState([])
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    fetchBookings()
  }, [])

  const fetchBookings = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { navigate('/auth'); return }

    const { data, error } = await supabase
      .from('booking')
      .select(`
        booking_id, status, booking_date, service_date, location, booking_time,
        service(service_name, price),
        service_provider(user_id, users(first_name, last_name))
      `)
      .eq('customer_id', user.id)
      .order('booking_date', { ascending: false })

    console.log('bookings:', data, error)
    setBookings(data || [])
    setLoading(false)
  }

  const cancelBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return
    const { error } = await supabase
      .from('booking')
      .update({ status: 'cancelled' })
      .eq('booking_id', bookingId)
    if (error) { alert('Error: ' + error.message); return }
    fetchBookings()
  }

  const filtered = filter === 'all'
    ? bookings
    : bookings.filter(b => b.status === filter)

  const counts = {
    all: bookings.length,
    pending: bookings.filter(b => b.status === 'pending').length,
    accepted: bookings.filter(b => b.status === 'accepted').length,
    in_progress: bookings.filter(b => b.status === 'in_progress').length,
    completed: bookings.filter(b => b.status === 'completed').length,
    cancelled: bookings.filter(b => b.status === 'cancelled').length,
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
    { label: 'Dashboard', icon: '🏠', path: '/customer/dashboard' },
    { label: 'Browse Services', icon: '🔍', path: '/customer/browse' },
    { label: 'My Bookings', icon: '📅', path: '/customer/bookings', active: true },
    { label: 'Bundle Offers', icon: '📦', path: '/customer/bundles' },
    { label: 'Payments', icon: '💳', path: '/customer/payments' },
    { label: 'My Reviews', icon: '⭐', path: '/customer/reviews' },
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
            <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>My Bookings</h1>
            <p style={{ color: '#6b6860', marginTop: 4, fontSize: 13 }}>Track and manage all your service bookings</p>
          </div>
          <button onClick={() => navigate('/customer/browse')}
            style={{ padding: '9px 18px', background: '#3d5afe', color: '#fff', border: 'none', borderRadius: 7, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
            + New Booking
          </button>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
          {[
            { label: 'Total', value: counts.all, color: '#1a1a2e' },
            { label: 'Pending', value: counts.pending, color: '#e65100' },
            { label: 'Active', value: counts.accepted + counts.in_progress, color: '#3d5afe' },
            { label: 'Completed', value: counts.completed, color: '#2e7d32' },
          ].map(s => (
            <div key={s.label} style={{ background: '#fff', border: '1px solid #d4d2cc', borderRadius: 10, padding: '18px 20px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
              <div style={{ fontSize: 11, color: '#9b978f', textTransform: 'uppercase', letterSpacing: 0.8, fontFamily: 'monospace' }}>{s.label}</div>
              <div style={{ fontSize: 28, fontWeight: 700, marginTop: 6, color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Filter Tabs */}
        <div style={{ display: 'flex', borderBottom: '2px solid #d4d2cc', marginBottom: 20 }}>
          {['all', 'pending', 'accepted', 'in_progress', 'completed', 'cancelled'].map(tab => (
            <div key={tab} onClick={() => setFilter(tab)}
              style={{ padding: '10px 18px', fontSize: 13, cursor: 'pointer', color: filter === tab ? '#3d5afe' : '#6b6860', borderBottom: filter === tab ? '2px solid #3d5afe' : '2px solid transparent', marginBottom: -2, fontWeight: filter === tab ? 600 : 400, whiteSpace: 'nowrap' }}>
              {tab === 'all' ? 'All' : tab === 'in_progress' ? 'In Progress' : tab.charAt(0).toUpperCase() + tab.slice(1)}
              <span style={{ marginLeft: 6, fontSize: 11, color: '#9b978f' }}>({counts[tab]})</span>
            </div>
          ))}
        </div>

        {/* Bookings Table */}
        <div style={{ background: '#fff', border: '1px solid #d4d2cc', borderRadius: 10, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#9b978f' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📅</div>
              <p style={{ fontSize: 13 }}>No bookings found.</p>
              <button onClick={() => navigate('/customer/browse')}
                style={{ marginTop: 12, padding: '8px 20px', background: '#3d5afe', color: '#fff', border: 'none', borderRadius: 7, cursor: 'pointer', fontSize: 13 }}>
                Browse Services
              </button>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f4f3f0' }}>
                  {['#', 'Service', 'Provider', 'Booked On', 'Service Date', 'Location', 'Price', 'Status', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, color: '#9b978f', fontFamily: 'monospace', borderBottom: '1px solid #d4d2cc', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((b, i) => {
                  const badge = getBadge(b.status)
                  const providerName = b.service_provider?.users
                    ? `${b.service_provider.users.first_name} ${b.service_provider.users.last_name}`
                    : '—'
                  return (
                    <tr key={b.booking_id} style={{ borderBottom: '1px solid #f0ede8' }}>
                      <td style={{ padding: '12px 14px', fontSize: 11, fontFamily: 'monospace', color: '#9b978f' }}>
                        #{String(i + 1).padStart(3, '0')}
                      </td>
                      <td style={{ padding: '12px 14px', fontSize: 13, fontWeight: 500 }}>
                        {b.service?.service_name || '—'}
                      </td>
                      <td style={{ padding: '12px 14px', fontSize: 13 }}>{providerName}</td>
                      <td style={{ padding: '12px 14px', fontSize: 13 }}>{b.booking_date}</td>
                      <td style={{ padding: '12px 14px', fontSize: 13 }}>{b.service_date}</td>
                      <td style={{ padding: '12px 14px', fontSize: 13 }}>{b.location || '—'}</td>
                      <td style={{ padding: '12px 14px', fontSize: 13, fontWeight: 600 }}>
                        Rs. {Number(b.service?.price || 0).toLocaleString()}
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{ ...badge, padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 500, fontFamily: 'monospace' }}>
                          {b.status === 'in_progress' ? 'In Progress' : b.status.charAt(0).toUpperCase() + b.status.slice(1)}
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          {b.status === 'completed' && (
                            <button onClick={() => navigate('/customer/reviews')}
                              style={{ padding: '5px 10px', background: '#e8f5e9', color: '#2e7d32', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 11, fontWeight: 500 }}>
                              Review
                            </button>
                          )}
                          {['pending', 'accepted'].includes(b.status) && (
                            <button onClick={() => cancelBooking(b.booking_id)}
                              style={{ padding: '5px 10px', background: '#fce4ec', color: '#b71c1c', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 11, fontWeight: 500 }}>
                              Cancel
                            </button>
                          )}
                          {b.status === 'cancelled' && (
                            <button onClick={() => navigate('/customer/browse')}
                              style={{ padding: '5px 10px', background: 'transparent', border: '1.5px solid #a8a49c', borderRadius: 6, cursor: 'pointer', fontSize: 11 }}>
                              Rebook
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
      </main>
    </div>
  )
}