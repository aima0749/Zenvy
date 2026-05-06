import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../supabaseClient'

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0, customers: 0, providers: 0,
    totalBookings: 0, pendingBookings: 0, completedBookings: 0,
    totalRevenue: 0, totalServices: 0, totalReviews: 0
  })
  const [recentBookings, setRecentBookings] = useState([])
  const [recentUsers, setRecentUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [adminUser, setAdminUser] = useState(null)
  const navigate = useNavigate()

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { navigate('/auth'); return }

    const { data: userData } = await supabase
      .from('users').select('*').eq('user_id', user.id).single()
    setAdminUser(userData)

    const { data: allUsers }    = await supabase.from('users').select('role, created_at')
    const { data: allBookings } = await supabase.from('booking').select('status')
    const { data: allPayments } = await supabase.from('payment').select('amount').eq('payment_status', 'completed')
    const { data: allServices } = await supabase.from('service').select('service_id')
    const { data: allReviews }  = await supabase.from('review').select('review_id')

    setStats({
      totalUsers:        allUsers?.length || 0,
      customers:         allUsers?.filter(u => u.role === 'customer').length || 0,
      providers:         allUsers?.filter(u => u.role === 'service_provider').length || 0,
      totalBookings:     allBookings?.length || 0,
      pendingBookings:   allBookings?.filter(b => b.status === 'pending').length || 0,
      completedBookings: allBookings?.filter(b => b.status === 'completed').length || 0,
      totalRevenue:      allPayments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0,
      totalServices:     allServices?.length || 0,
      totalReviews:      allReviews?.length || 0,
    })

    const { data: recentB } = await supabase
      .from('booking')
      .select(`
        booking_id, status, booking_date, service_date,
        service(service_name),
        customer(user_id, users(first_name, last_name)),
        service_provider(user_id, users(first_name, last_name))
      `)
      .order('booking_date', { ascending: false })
      .limit(5)
    setRecentBookings(recentB || [])

    const { data: recentU } = await supabase
      .from('users')
      .select('user_id, first_name, last_name, email, role, created_at')
      .order('created_at', { ascending: false })
      .limit(5)
    setRecentUsers(recentU || [])

    setLoading(false)
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

  const getRoleBadge = (role) => {
    const map = {
      customer:         { bg: '#e8ecff', color: '#3d5afe' },
      service_provider: { bg: '#e8f5e9', color: '#2e7d32' },
      admin:            { bg: '#fce4ec', color: '#b71c1c' },
    }
    return map[role] || map.customer
  }

  const sidebarItems = [
    { label: 'Dashboard', icon: '🏠', path: '/admin/dashboard', active: true },
    { label: 'Users',     icon: '👥', path: '/admin/users' },
    { label: 'Bookings',  icon: '📋', path: '/admin/bookings' },
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
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #2e2e42' }}>
          <div style={{ color: '#fff', fontWeight: 600, fontSize: 13 }}>{adminUser?.first_name} {adminUser?.last_name}</div>
          <div style={{ color: '#e53935', fontSize: 11, marginTop: 2, fontFamily: 'monospace' }}>SUPER ADMIN</div>
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

        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 9, color: '#b0acaa', textTransform: 'uppercase', letterSpacing: 1, fontFamily: 'monospace', marginBottom: 6 }}>ADMIN PANEL</div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Overview Dashboard</h1>
          <p style={{ color: '#6b6860', marginTop: 4, fontSize: 13 }}>Full platform overview — users, bookings, revenue</p>
        </div>

        {/* Row 1 - Users */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 16 }}>
          {[
            { label: 'Total Users', value: stats.totalUsers,    color: '#1a1a2e', icon: '👥' },
            { label: 'Customers',   value: stats.customers,     color: '#3d5afe', icon: '🙋' },
            { label: 'Providers',   value: stats.providers,     color: '#2e7d32', icon: '🔧' },
          ].map(s => (
            <div key={s.label} style={{ background: '#fff', border: '1px solid #d4d2cc', borderRadius: 10, padding: '20px 22px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ fontSize: 32 }}>{s.icon}</div>
              <div>
                <div style={{ fontSize: 11, color: '#9b978f', textTransform: 'uppercase', letterSpacing: 0.8, fontFamily: 'monospace' }}>{s.label}</div>
                <div style={{ fontSize: 30, fontWeight: 700, marginTop: 4, color: s.color }}>{s.value}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Row 2 - Bookings */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 16 }}>
          {[
            { label: 'Total Bookings',   value: stats.totalBookings,    color: '#1a1a2e', icon: '📋' },
            { label: 'Pending Bookings', value: stats.pendingBookings,  color: '#e65100', icon: '⏳' },
            { label: 'Completed',        value: stats.completedBookings,color: '#2e7d32', icon: '✅' },
          ].map(s => (
            <div key={s.label} style={{ background: '#fff', border: '1px solid #d4d2cc', borderRadius: 10, padding: '20px 22px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ fontSize: 32 }}>{s.icon}</div>
              <div>
                <div style={{ fontSize: 11, color: '#9b978f', textTransform: 'uppercase', letterSpacing: 0.8, fontFamily: 'monospace' }}>{s.label}</div>
                <div style={{ fontSize: 30, fontWeight: 700, marginTop: 4, color: s.color }}>{s.value}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Row 3 - Revenue */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
          {[
            { label: 'Total Revenue',  value: `Rs. ${stats.totalRevenue.toLocaleString()}`, color: '#2e7d32', icon: '💰' },
            { label: 'Total Services', value: stats.totalServices, color: '#1a1a2e', icon: '🛠️' },
            { label: 'Total Reviews',  value: stats.totalReviews,  color: '#f9a825', icon: '⭐' },
          ].map(s => (
            <div key={s.label} style={{ background: '#fff', border: '1px solid #d4d2cc', borderRadius: 10, padding: '20px 22px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ fontSize: 32 }}>{s.icon}</div>
              <div>
                <div style={{ fontSize: 11, color: '#9b978f', textTransform: 'uppercase', letterSpacing: 0.8, fontFamily: 'monospace' }}>{s.label}</div>
                <div style={{ fontSize: 30, fontWeight: 700, marginTop: 4, color: s.color }}>{s.value}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

          {/* Recent Bookings */}
          <div style={{ background: '#fff', border: '1px solid #d4d2cc', borderRadius: 10, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <span style={{ fontSize: 15, fontWeight: 600 }}>Recent Bookings</span>
              <span onClick={() => navigate('/admin/bookings')} style={{ fontSize: 12, color: '#e53935', cursor: 'pointer' }}>View All →</span>
            </div>
            {recentBookings.length === 0 ? (
              <p style={{ color: '#9b978f', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>No bookings yet</p>
            ) : recentBookings.map(b => {
              const badge = getBadge(b.status)
              return (
                <div key={b.booking_id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f0ede8' }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{b.service?.service_name}</div>
                    <div style={{ fontSize: 11, color: '#9b978f' }}>
                      {b.customer?.users?.first_name} {b.customer?.users?.last_name} · {b.service_date}
                    </div>
                  </div>
                  <span style={{ background: badge.bg, color: badge.color, padding: '3px 8px', borderRadius: 20, fontSize: 10, fontFamily: 'monospace' }}>
                    {b.status}
                  </span>
                </div>
              )
            })}
          </div>

          {/* Recent Users */}
          <div style={{ background: '#fff', border: '1px solid #d4d2cc', borderRadius: 10, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <span style={{ fontSize: 15, fontWeight: 600 }}>Recent Users</span>
              <span onClick={() => navigate('/admin/users')} style={{ fontSize: 12, color: '#e53935', cursor: 'pointer' }}>View All →</span>
            </div>
            {recentUsers.length === 0 ? (
              <p style={{ color: '#9b978f', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>No users yet</p>
            ) : recentUsers.map(u => {
              const badge = getRoleBadge(u.role)
              return (
                <div key={u.user_id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f0ede8' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: '#e8ecff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#3d5afe' }}>
                      {u.first_name?.charAt(0)}
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{u.first_name} {u.last_name}</div>
                      <div style={{ fontSize: 11, color: '#9b978f' }}>{u.email}</div>
                    </div>
                  </div>
                  <span style={{ background: badge.bg, color: badge.color, padding: '3px 8px', borderRadius: 20, fontSize: 10, fontFamily: 'monospace' }}>
                    {u.role === 'service_provider' ? 'provider' : u.role}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </main>
    </div>
  )
}