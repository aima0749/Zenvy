import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../supabaseClient'

export default function AdminPayments() {
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [stats, setStats] = useState({ total: 0, completed: 0, pending: 0, revenue: 0 })
  const navigate = useNavigate()

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    const { data, error } = await supabase
      .from('payment')
      .select(`
        payment_id, amount, payment_method, payment_status,
        payment_date, transaction_id,
        booking(
          booking_id, service_date,
          service(service_name),
          customer(user_id, users(first_name, last_name, email))
        ),
        bundle_offer(bundle_id, service_date, customer(user_id, users(first_name, last_name, email)))
      `)
      .order('payment_date', { ascending: false })

    console.log('payments:', data, error)
    setPayments(data || [])

    const totalRevenue = (data || [])
      .filter(p => p.payment_status === 'completed')
      .reduce((sum, p) => sum + Number(p.amount), 0)

    setStats({
      total: (data || []).length,
      completed: (data || []).filter(p => p.payment_status === 'completed').length,
      pending: (data || []).filter(p => p.payment_status === 'pending').length,
      revenue: totalRevenue
    })

    setLoading(false)
  }

  const updateStatus = async (paymentId, newStatus) => {
    const { error } = await supabase
      .from('payment')
      .update({ payment_status: newStatus })
      .eq('payment_id', paymentId)
    if (error) { alert('Error: ' + error.message); return }
    fetchData()
  }

  const filtered = payments
    .filter(p => filter === 'all' ? true : p.payment_status === filter)
    .filter(p => {
      if (!search) return true
      const customer = p.booking?.customer?.users || p.bundle_offer?.customer?.users
      const name = customer ? `${customer.first_name} ${customer.last_name}`.toLowerCase() : ''
      const service = p.booking?.service?.service_name?.toLowerCase() || ''
      const txn = p.transaction_id?.toLowerCase() || ''
      return name.includes(search.toLowerCase()) ||
             service.includes(search.toLowerCase()) ||
             txn.includes(search.toLowerCase())
    })

  const counts = {
    all:       payments.length,
    completed: payments.filter(p => p.payment_status === 'completed').length,
    pending:   payments.filter(p => p.payment_status === 'pending').length,
    failed:    payments.filter(p => p.payment_status === 'failed').length,
    refunded:  payments.filter(p => p.payment_status === 'refunded').length,
  }

  const getBadge = (status) => {
    const map = {
      completed: { bg: '#e8f5e9', color: '#2e7d32' },
      pending:   { bg: '#fff3e0', color: '#e65100' },
      failed:    { bg: '#fce4ec', color: '#b71c1c' },
      refunded:  { bg: '#e3f2fd', color: '#1565c0' },
    }
    return map[status] || map.pending
  }

  const sidebarItems = [
    { label: 'Dashboard', icon: '🏠', path: '/admin/dashboard' },
    { label: 'Users',     icon: '👥', path: '/admin/users' },
    { label: 'Bookings',  icon: '📋', path: '/admin/bookings' },
    { label: 'Services',  icon: '🔧', path: '/admin/services' },
    { label: 'Payments',  icon: '💳', path: '/admin/payments', active: true },
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
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Payment Management</h1>
          <p style={{ color: '#6b6860', marginTop: 4, fontSize: 13 }}>Monitor all platform transactions</p>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
          {[
            { label: 'Total Revenue',   value: `Rs. ${stats.revenue.toLocaleString()}`, color: '#2e7d32' },
            { label: 'Transactions',    value: stats.total,     color: '#1a1a2e' },
            { label: 'Completed',       value: stats.completed, color: '#2e7d32' },
            { label: 'Pending',         value: stats.pending,   color: '#e65100' },
          ].map(s => (
            <div key={s.label} style={{ background: '#fff', border: '1px solid #d4d2cc', borderRadius: 10, padding: '18px 20px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
              <div style={{ fontSize: 11, color: '#9b978f', textTransform: 'uppercase', letterSpacing: 0.8, fontFamily: 'monospace' }}>{s.label}</div>
              <div style={{ fontSize: 26, fontWeight: 700, marginTop: 6, color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Search */}
        <div style={{ background: '#fff', border: '1px solid #d4d2cc', borderRadius: 10, padding: '14px 18px', marginBottom: 16, display: 'flex', gap: 12, alignItems: 'center' }}>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="🔍  Search by customer, service or transaction ID..."
            style={{ flex: 1, border: '1.5px solid #d4d2cc', borderRadius: 7, padding: '8px 12px', fontSize: 13, outline: 'none', background: '#f4f3f0' }} />
          <button onClick={() => setSearch('')}
            style={{ padding: '8px 14px', background: 'transparent', border: '1.5px solid #a8a49c', borderRadius: 7, cursor: 'pointer', fontSize: 13 }}>
            Clear
          </button>
        </div>

        {/* Filter Tabs */}
        <div style={{ display: 'flex', borderBottom: '2px solid #d4d2cc', marginBottom: 20 }}>
          {['all', 'completed', 'pending', 'failed', 'refunded'].map(tab => (
            <div key={tab} onClick={() => setFilter(tab)}
              style={{ padding: '10px 18px', fontSize: 13, cursor: 'pointer', color: filter === tab ? '#e53935' : '#6b6860', borderBottom: filter === tab ? '2px solid #e53935' : '2px solid transparent', marginBottom: -2, fontWeight: filter === tab ? 600 : 400, whiteSpace: 'nowrap' }}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
              <span style={{ marginLeft: 6, fontSize: 11, color: '#9b978f' }}>({counts[tab]})</span>
            </div>
          ))}
        </div>

        {/* Payments Table */}
        <div style={{ background: '#fff', border: '1px solid #d4d2cc', borderRadius: 10, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#9b978f' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>💳</div>
              <p style={{ fontSize: 13 }}>No payments found.</p>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f4f3f0' }}>
                  {['Transaction ID', 'Customer', 'For', 'Type', 'Amount', 'Method', 'Date', 'Status', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, color: '#9b978f', fontFamily: 'monospace', borderBottom: '1px solid #d4d2cc', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => {
                  const badge = getBadge(p.payment_status)
                  const isBundle = !p.booking_id && !!p.bundle_offer
                  const customer = isBundle
                    ? p.bundle_offer?.customer?.users
                    : p.booking?.customer?.users
                  const forLabel = isBundle
                    ? 'Bundle'
                    : p.booking?.service?.service_name || '—'

                  return (
                    <tr key={p.payment_id} style={{ borderBottom: '1px solid #f0ede8' }}>
                      <td style={{ padding: '12px 14px', fontSize: 11, fontFamily: 'monospace', color: '#9b978f' }}>
                        {p.transaction_id || '—'}
                      </td>
                      <td style={{ padding: '12px 14px', fontSize: 13 }}>
                        <div style={{ fontWeight: 500 }}>
                          {customer ? `${customer.first_name} ${customer.last_name}` : '—'}
                        </div>
                        <div style={{ fontSize: 11, color: '#9b978f' }}>{customer?.email || ''}</div>
                      </td>
                      <td style={{ padding: '12px 14px', fontSize: 13 }}>{forLabel}</td>
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{ background: isBundle ? '#e8ecff' : '#e8f5e9', color: isBundle ? '#3d5afe' : '#2e7d32', padding: '3px 8px', borderRadius: 20, fontSize: 11, fontFamily: 'monospace' }}>
                          {isBundle ? '📦 Bundle' : '📅 Booking'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px', fontSize: 13, fontWeight: 700, color: '#2e7d32' }}>
                        Rs. {Number(p.amount).toLocaleString()}
                      </td>
                      <td style={{ padding: '12px 14px', fontSize: 13, textTransform: 'capitalize' }}>
                        {p.payment_method || '—'}
                      </td>
                      <td style={{ padding: '12px 14px', fontSize: 13 }}>
                        {new Date(p.payment_date).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{ background: badge.bg, color: badge.color, padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 500, fontFamily: 'monospace' }}>
                          {p.payment_status}
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          {p.payment_status === 'pending' && (
                            <button onClick={() => updateStatus(p.payment_id, 'completed')}
                              style={{ padding: '4px 10px', background: '#e8f5e9', color: '#2e7d32', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 11, fontWeight: 500 }}>
                              ✅ Complete
                            </button>
                          )}
                          {p.payment_status === 'completed' && (
                            <button onClick={() => updateStatus(p.payment_id, 'refunded')}
                              style={{ padding: '4px 10px', background: '#e3f2fd', color: '#1565c0', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 11, fontWeight: 500 }}>
                              ↩ Refund
                            </button>
                          )}
                          {p.payment_status === 'failed' && (
                            <button onClick={() => updateStatus(p.payment_id, 'pending')}
                              style={{ padding: '4px 10px', background: '#fff3e0', color: '#e65100', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 11, fontWeight: 500 }}>
                              🔄 Retry
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