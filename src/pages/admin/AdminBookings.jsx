import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../supabaseClient'

export default function AdminBookings() {
  const [bookings, setBookings] = useState([])
  const [bundles, setBundles] = useState([])
  const [loading, setLoading] = useState(true)
  const [mainTab, setMainTab] = useState('bookings') // 'bookings' | 'bundles'
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [selectedBooking, setSelectedBooking] = useState(null)
  const [selectedBundle, setSelectedBundle] = useState(null)
  const [showDetail, setShowDetail] = useState(false)
  const navigate = useNavigate()

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    // Fetch bookings
    const { data: bookingData } = await supabase
      .from('booking')
      .select(`
        booking_id, status, booking_date, service_date, location,
        service(service_name, price),
        customer(user_id, users(first_name, last_name, email)),
        service_provider(user_id, users(first_name, last_name))
      `)
      .order('booking_date', { ascending: false })
    setBookings(bookingData || [])

    // Fetch bundles
    const { data: bundleData } = await supabase
      .from('bundle_offer')
      .select(`
        bundle_id, status, total_price, booking_date, service_date, location,
        customer(user_id, users(first_name, last_name, email)),
        bundle_service(
          service_id,
          service(service_name),
          service_provider(user_id, users(first_name, last_name))
        )
      `)
      .order('booking_date', { ascending: false })
    setBundles(bundleData || [])

    setLoading(false)
  }

  // ── BOOKING ACTIONS ──
  const updateBookingStatus = async (bookingId, newStatus) => {
    if (!window.confirm(`Change status to "${newStatus}"?`)) return
    const { error } = await supabase
      .from('booking').update({ status: newStatus }).eq('booking_id', bookingId)
    if (error) { alert('Error: ' + error.message); return }
    fetchData()
    setShowDetail(false)
  }

  const deleteBooking = async (bookingId) => {
    if (!window.confirm('Delete this booking permanently?')) return
    await supabase.from('booking').delete().eq('booking_id', bookingId)
    fetchData()
    setShowDetail(false)
  }

  // ── BUNDLE ACTIONS ──
  const updateBundleStatus = async (bundleId, newStatus) => {
    if (!window.confirm(`Change bundle status to "${newStatus}"?`)) return
    const { error } = await supabase
      .from('bundle_offer').update({ status: newStatus }).eq('bundle_id', bundleId)
    if (error) { alert('Error: ' + error.message); return }
    fetchData()
    setShowDetail(false)
  }

  const deleteBundle = async (bundleId) => {
    if (!window.confirm('Delete this bundle permanently?')) return
    await supabase.from('bundle_offer').delete().eq('bundle_id', bundleId)
    fetchData()
    setShowDetail(false)
  }

  const getBadge = (status) => {
    const map = {
      pending:     { bg: '#fff3e0', color: '#e65100' },
      accepted:    { bg: '#e3f2fd', color: '#1565c0' },
      in_progress: { bg: '#f3e5f5', color: '#6a1b9a' },
      completed:   { bg: '#e8f5e9', color: '#2e7d32' },
      cancelled:   { bg: '#fce4ec', color: '#b71c1c' },
    }
    return map[status] || map.pending
  }

  // Booking counts
  const bCounts = {
    all:         bookings.length,
    pending:     bookings.filter(b => b.status === 'pending').length,
    accepted:    bookings.filter(b => b.status === 'accepted').length,
    in_progress: bookings.filter(b => b.status === 'in_progress').length,
    completed:   bookings.filter(b => b.status === 'completed').length,
    cancelled:   bookings.filter(b => b.status === 'cancelled').length,
  }

  // Bundle counts
  const buCounts = {
    all:         bundles.length,
    pending:     bundles.filter(b => b.status === 'pending').length,
    accepted:    bundles.filter(b => b.status === 'accepted').length,
    in_progress: bundles.filter(b => b.status === 'in_progress').length,
    completed:   bundles.filter(b => b.status === 'completed').length,
    cancelled:   bundles.filter(b => b.status === 'cancelled').length,
  }

  const filteredBookings = bookings
    .filter(b => filter === 'all' ? true : b.status === filter)
    .filter(b => {
      const q = search.toLowerCase()
      return (
        b.service?.service_name?.toLowerCase().includes(q) ||
        b.customer?.users?.first_name?.toLowerCase().includes(q) ||
        b.customer?.users?.last_name?.toLowerCase().includes(q) ||
        b.location?.toLowerCase().includes(q)
      )
    })

  const filteredBundles = bundles
    .filter(b => filter === 'all' ? true : b.status === filter)
    .filter(b => {
      const q = search.toLowerCase()
      return (
        b.customer?.users?.first_name?.toLowerCase().includes(q) ||
        b.customer?.users?.last_name?.toLowerCase().includes(q) ||
        b.location?.toLowerCase().includes(q)
      )
    })

  const counts = mainTab === 'bookings' ? bCounts : buCounts

  const sidebarItems = [
    { label: 'Dashboard', icon: '🏠', path: '/admin/dashboard' },
    { label: 'Users',     icon: '👥', path: '/admin/users' },
    { label: 'Bookings',  icon: '📋', path: '/admin/bookings', active: true },
    { label: 'Services',  icon: '🔧', path: '/admin/services' },
    { label: 'Payments',  icon: '💳', path: '/admin/payments' },
    { label: 'Reviews',   icon: '⭐', path: '/admin/reviews' },
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
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Booking Management</h1>
          <p style={{ color: '#6b6860', marginTop: 4, fontSize: 13 }}>Monitor all bookings and bundle offers across the platform</p>
        </div>

        {/* MAIN TAB SWITCHER — Bookings vs Bundles */}
        <div style={{ display: 'flex', background: '#fff', border: '1px solid #d4d2cc', borderRadius: 10, padding: 6, marginBottom: 24, width: 'fit-content', gap: 4 }}>
          {[
            { key: 'bookings', label: '📋 Bookings', count: bookings.length },
            { key: 'bundles',  label: '📦 Bundle Offers', count: bundles.length },
          ].map(tab => (
            <button key={tab.key} onClick={() => { setMainTab(tab.key); setFilter('all'); setSearch('') }}
              style={{ padding: '8px 20px', borderRadius: 7, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, background: mainTab === tab.key ? '#1a1a2e' : 'transparent', color: mainTab === tab.key ? '#fff' : '#6b6860', transition: 'all .15s' }}>
              {tab.label}
              <span style={{ marginLeft: 6, fontSize: 11, opacity: 0.7 }}>({tab.count})</span>
            </button>
          ))}
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12, marginBottom: 20 }}>
          {[
            { label: 'Total',       value: counts.all,         color: '#1a1a2e' },
            { label: 'Pending',     value: counts.pending,     color: '#e65100' },
            { label: 'Accepted',    value: counts.accepted,    color: '#1565c0' },
            { label: 'In Progress', value: counts.in_progress, color: '#6a1b9a' },
            { label: 'Completed',   value: counts.completed,   color: '#2e7d32' },
            { label: 'Cancelled',   value: counts.cancelled,   color: '#b71c1c' },
          ].map(s => (
            <div key={s.label} style={{ background: '#fff', border: '1px solid #d4d2cc', borderRadius: 10, padding: '14px 16px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
              <div style={{ fontSize: 10, color: '#9b978f', textTransform: 'uppercase', letterSpacing: 0.8, fontFamily: 'monospace' }}>{s.label}</div>
              <div style={{ fontSize: 24, fontWeight: 700, marginTop: 4, color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Search + Filter */}
        <div style={{ background: '#fff', border: '1px solid #d4d2cc', borderRadius: 10, padding: '14px 18px', marginBottom: 16, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder={`🔍  Search ${mainTab}...`}
            style={{ flex: 1, minWidth: 220, border: '1.5px solid #d4d2cc', borderRadius: 7, padding: '8px 12px', fontSize: 13, outline: 'none', background: '#f4f3f0' }} />
          <select value={filter} onChange={e => setFilter(e.target.value)}
            style={{ border: '1.5px solid #d4d2cc', borderRadius: 7, padding: '8px 12px', fontSize: 13, background: '#f4f3f0', outline: 'none' }}>
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="accepted">Accepted</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <button onClick={() => { setSearch(''); setFilter('all') }}
            style={{ padding: '8px 14px', background: 'transparent', border: '1.5px solid #a8a49c', borderRadius: 7, cursor: 'pointer', fontSize: 13 }}>
            Clear
          </button>
        </div>

        {/* ── BOOKINGS TABLE ── */}
        {mainTab === 'bookings' && (
          <div style={{ background: '#fff', border: '1px solid #d4d2cc', borderRadius: 10, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
            {filteredBookings.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: '#9b978f' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
                <p>No bookings found.</p>
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f4f3f0' }}>
                    {['#', 'Service', 'Customer', 'Provider', 'Service Date', 'Price', 'Status', 'Actions'].map(h => (
                      <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, color: '#9b978f', fontFamily: 'monospace', borderBottom: '1px solid #d4d2cc', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredBookings.map((b, i) => {
                    const badge = getBadge(b.status)
                    return (
                      <tr key={b.booking_id} style={{ borderBottom: '1px solid #f0ede8' }}>
                        <td style={{ padding: '12px 14px', fontSize: 11, fontFamily: 'monospace', color: '#9b978f' }}>#{String(i + 1).padStart(3, '0')}</td>
                        <td style={{ padding: '12px 14px', fontSize: 13, fontWeight: 500 }}>{b.service?.service_name || '—'}</td>
                        <td style={{ padding: '12px 14px', fontSize: 13 }}>{b.customer?.users?.first_name} {b.customer?.users?.last_name}</td>
                        <td style={{ padding: '12px 14px', fontSize: 13 }}>{b.service_provider?.users?.first_name} {b.service_provider?.users?.last_name || '—'}</td>
                        <td style={{ padding: '12px 14px', fontSize: 13 }}>{b.service_date}</td>
                        <td style={{ padding: '12px 14px', fontSize: 13, fontWeight: 600 }}>Rs. {Number(b.service?.price || 0).toLocaleString()}</td>
                        <td style={{ padding: '12px 14px' }}>
                          <span style={{ background: badge.bg, color: badge.color, padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 500, fontFamily: 'monospace' }}>
                            {b.status === 'in_progress' ? 'in progress' : b.status}
                          </span>
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <button onClick={() => { setSelectedBooking(b); setSelectedBundle(null); setShowDetail(true) }}
                            style={{ padding: '5px 12px', background: 'transparent', border: '1.5px solid #a8a49c', borderRadius: 6, cursor: 'pointer', fontSize: 11 }}>
                            Manage
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* ── BUNDLES TABLE ── */}
        {mainTab === 'bundles' && (
          <div style={{ background: '#fff', border: '1px solid #d4d2cc', borderRadius: 10, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
            {filteredBundles.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: '#9b978f' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>📦</div>
                <p>No bundle offers found.</p>
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f4f3f0' }}>
                    {['#', 'Customer', 'Services', 'Service Date', 'Location', 'Total', 'Status', 'Actions'].map(h => (
                      <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, color: '#9b978f', fontFamily: 'monospace', borderBottom: '1px solid #d4d2cc', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredBundles.map((b, i) => {
                    const badge = getBadge(b.status)
                    const services = b.bundle_service || []
                    return (
                      <tr key={b.bundle_id} style={{ borderBottom: '1px solid #f0ede8' }}>
                        <td style={{ padding: '12px 14px', fontSize: 11, fontFamily: 'monospace', color: '#9b978f' }}>#{String(i + 1).padStart(3, '0')}</td>
                        <td style={{ padding: '12px 14px', fontSize: 13, fontWeight: 500 }}>
                          {b.customer?.users?.first_name} {b.customer?.users?.last_name}
                          <div style={{ fontSize: 11, color: '#9b978f' }}>{b.customer?.users?.email}</div>
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                            {services.map((s, si) => (
                              <span key={si} style={{ background: '#e8ecff', color: '#3d5afe', padding: '2px 8px', borderRadius: 10, fontSize: 11 }}>
                                {s.service?.service_name}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td style={{ padding: '12px 14px', fontSize: 13 }}>{b.service_date}</td>
                        <td style={{ padding: '12px 14px', fontSize: 13, maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.location || '—'}</td>
                        <td style={{ padding: '12px 14px', fontSize: 13, fontWeight: 600 }}>Rs. {Number(b.total_price || 0).toLocaleString()}</td>
                        <td style={{ padding: '12px 14px' }}>
                          <span style={{ background: badge.bg, color: badge.color, padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 500, fontFamily: 'monospace' }}>
                            {b.status === 'in_progress' ? 'in progress' : b.status}
                          </span>
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <button onClick={() => { setSelectedBundle(b); setSelectedBooking(null); setShowDetail(true) }}
                            style={{ padding: '5px 12px', background: 'transparent', border: '1.5px solid #a8a49c', borderRadius: 6, cursor: 'pointer', fontSize: 11 }}>
                            Manage
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}
      </main>

      {/* ── BOOKING DETAIL MODAL ── */}
      {showDetail && selectedBooking && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}
          onClick={e => { if (e.target === e.currentTarget) setShowDetail(false) }}>
          <div style={{ background: '#fff', borderRadius: 14, padding: 28, width: 500, maxWidth: '95vw', boxShadow: '0 4px 24px rgba(0,0,0,0.15)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h3 style={{ fontSize: 17, fontWeight: 700, margin: 0 }}>Booking Details</h3>
              <button onClick={() => setShowDetail(false)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#9b978f' }}>✕</button>
            </div>

            <div style={{ background: '#f4f3f0', borderRadius: 10, padding: 16, marginBottom: 16 }}>
              <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 6 }}>{selectedBooking.service?.service_name}</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <span style={{ ...getBadge(selectedBooking.status), padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, fontFamily: 'monospace' }}>{selectedBooking.status}</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#3d5afe' }}>Rs. {Number(selectedBooking.service?.price || 0).toLocaleString()}</span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 20px', fontSize: 13, marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 11, color: '#9b978f', fontFamily: 'monospace', textTransform: 'uppercase', marginBottom: 3 }}>Customer</div>
                <div>{selectedBooking.customer?.users?.first_name} {selectedBooking.customer?.users?.last_name}</div>
                <div style={{ fontSize: 11, color: '#9b978f' }}>{selectedBooking.customer?.users?.email}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: '#9b978f', fontFamily: 'monospace', textTransform: 'uppercase', marginBottom: 3 }}>Provider</div>
                <div>{selectedBooking.service_provider?.users?.first_name} {selectedBooking.service_provider?.users?.last_name || '—'}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: '#9b978f', fontFamily: 'monospace', textTransform: 'uppercase', marginBottom: 3 }}>Service Date</div>
                <div>{selectedBooking.service_date}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: '#9b978f', fontFamily: 'monospace', textTransform: 'uppercase', marginBottom: 3 }}>Location</div>
                <div>{selectedBooking.location || '—'}</div>
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 500, color: '#6b6860', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>Force Change Status</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {['pending', 'accepted', 'in_progress', 'completed', 'cancelled']
                  .filter(s => s !== selectedBooking.status)
                  .map(s => {
                    const badge = getBadge(s)
                    return (
                      <button key={s} onClick={() => updateBookingStatus(selectedBooking.booking_id, s)}
                        style={{ padding: '6px 14px', background: badge.bg, color: badge.color, border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 500 }}>
                        → {s === 'in_progress' ? 'In Progress' : s.charAt(0).toUpperCase() + s.slice(1)}
                      </button>
                    )
                  })}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', borderTop: '1px solid #d4d2cc', paddingTop: 16 }}>
              <button onClick={() => setShowDetail(false)}
                style={{ padding: '9px 18px', background: 'transparent', border: '1.5px solid #a8a49c', borderRadius: 7, cursor: 'pointer', fontSize: 13 }}>
                Close
              </button>
              <button onClick={() => deleteBooking(selectedBooking.booking_id)}
                style={{ padding: '9px 18px', background: '#e53935', color: '#fff', border: 'none', borderRadius: 7, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                🗑 Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── BUNDLE DETAIL MODAL ── */}
      {showDetail && selectedBundle && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}
          onClick={e => { if (e.target === e.currentTarget) setShowDetail(false) }}>
          <div style={{ background: '#fff', borderRadius: 14, padding: 28, width: 520, maxWidth: '95vw', maxHeight: '90vh', overflow: 'auto', boxShadow: '0 4px 24px rgba(0,0,0,0.15)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h3 style={{ fontSize: 17, fontWeight: 700, margin: 0 }}>Bundle Details</h3>
              <button onClick={() => setShowDetail(false)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#9b978f' }}>✕</button>
            </div>

            <div style={{ background: '#f4f3f0', borderRadius: 10, padding: 16, marginBottom: 16 }}>
              <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <span style={{ ...getBadge(selectedBundle.status), padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, fontFamily: 'monospace' }}>{selectedBundle.status}</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#3d5afe' }}>Rs. {Number(selectedBundle.total_price || 0).toLocaleString()}</span>
              </div>
              <div style={{ fontSize: 12, color: '#6b6860' }}>{(selectedBundle.bundle_service || []).length} services in this bundle</div>
            </div>

            {/* Services in bundle */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, color: '#9b978f', fontFamily: 'monospace', textTransform: 'uppercase', marginBottom: 8 }}>Services Included</div>
              {(selectedBundle.bundle_service || []).map((bs, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: '#f4f3f0', borderRadius: 7, marginBottom: 6, fontSize: 13 }}>
                  <span>🔧 {bs.service?.service_name}</span>
                  <span style={{ color: '#9b978f' }}>
                    by {bs.service_provider?.users?.first_name} {bs.service_provider?.users?.last_name || 'TBD'}
                  </span>
                </div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 20px', fontSize: 13, marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 11, color: '#9b978f', fontFamily: 'monospace', textTransform: 'uppercase', marginBottom: 3 }}>Customer</div>
                <div>{selectedBundle.customer?.users?.first_name} {selectedBundle.customer?.users?.last_name}</div>
                <div style={{ fontSize: 11, color: '#9b978f' }}>{selectedBundle.customer?.users?.email}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: '#9b978f', fontFamily: 'monospace', textTransform: 'uppercase', marginBottom: 3 }}>Service Date</div>
                <div>{selectedBundle.service_date}</div>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <div style={{ fontSize: 11, color: '#9b978f', fontFamily: 'monospace', textTransform: 'uppercase', marginBottom: 3 }}>Location</div>
                <div>{selectedBundle.location || '—'}</div>
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 500, color: '#6b6860', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>Force Change Status</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {['pending', 'accepted', 'in_progress', 'completed', 'cancelled']
                  .filter(s => s !== selectedBundle.status)
                  .map(s => {
                    const badge = getBadge(s)
                    return (
                      <button key={s} onClick={() => updateBundleStatus(selectedBundle.bundle_id, s)}
                        style={{ padding: '6px 14px', background: badge.bg, color: badge.color, border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 500 }}>
                        → {s === 'in_progress' ? 'In Progress' : s.charAt(0).toUpperCase() + s.slice(1)}
                      </button>
                    )
                  })}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', borderTop: '1px solid #d4d2cc', paddingTop: 16 }}>
              <button onClick={() => setShowDetail(false)}
                style={{ padding: '9px 18px', background: 'transparent', border: '1.5px solid #a8a49c', borderRadius: 7, cursor: 'pointer', fontSize: 13 }}>
                Close
              </button>
              <button onClick={() => deleteBundle(selectedBundle.bundle_id)}
                style={{ padding: '9px 18px', background: '#e53935', color: '#fff', border: 'none', borderRadius: 7, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                🗑 Delete Bundle
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}