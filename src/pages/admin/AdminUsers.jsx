import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../supabaseClient'

export default function AdminUsers() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [selectedUser, setSelectedUser] = useState(null)
  const [showDetail, setShowDetail] = useState(false)
  const navigate = useNavigate()

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    const { data, error } = await supabase
      .from('users')
      .select(`
        user_id, first_name, last_name, email, role, created_at,
        customer(street, city, zip_code),
        service_provider(experience_years, average_rating, availability_status),
        admin(admin_level, role_description)
      `)
      .order('created_at', { ascending: false })

    console.log('users:', data, error)
    setUsers(data || [])
    setLoading(false)
  }

  const deleteUser = async (userId, role) => {
    if (!window.confirm('Are you sure you want to delete this user? This cannot be undone.')) return

    // Delete from public.users (cascades to customer/provider/admin)
    const { error } = await supabase.from('users').delete().eq('user_id', userId)
    if (error) { alert('Error: ' + error.message); return }

    // Also delete from auth.users
    alert('User deleted from database. Remove from Supabase Auth manually if needed.')
    fetchData()
    setShowDetail(false)
  }

  const changeRole = async (userId, newRole) => {
    if (!window.confirm(`Change this user's role to "${newRole}"?`)) return
    const { error } = await supabase
      .from('users')
      .update({ role: newRole })
      .eq('user_id', userId)
    if (error) { alert('Error: ' + error.message); return }
    fetchData()
    setShowDetail(false)
  }

  const counts = {
    all:              users.length,
    customer:         users.filter(u => u.role === 'customer').length,
    service_provider: users.filter(u => u.role === 'service_provider').length,
    admin:            users.filter(u => u.role === 'admin').length,
  }

  const filtered = users
    .filter(u => filter === 'all' ? true : u.role === filter)
    .filter(u => {
      const q = search.toLowerCase()
      return (
        u.first_name?.toLowerCase().includes(q) ||
        u.last_name?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q)
      )
    })

  const getRoleBadge = (role) => {
    const map = {
      customer:         { bg: '#e8ecff', color: '#3d5afe' },
      service_provider: { bg: '#e8f5e9', color: '#2e7d32' },
      admin:            { bg: '#fce4ec', color: '#b71c1c' },
    }
    return map[role] || map.customer
  }

  const sidebarItems = [
    { label: 'Dashboard', icon: '🏠', path: '/admin/dashboard' },
    { label: 'Users',     icon: '👥', path: '/admin/users',     active: true },
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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>User Management</h1>
            <p style={{ color: '#6b6860', marginTop: 4, fontSize: 13 }}>View, manage and monitor all platform users</p>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
          {[
            { label: 'Total Users', value: counts.all,              color: '#1a1a2e' },
            { label: 'Customers',   value: counts.customer,         color: '#3d5afe' },
            { label: 'Providers',   value: counts.service_provider, color: '#2e7d32' },
            { label: 'Admins',      value: counts.admin,            color: '#e53935' },
          ].map(s => (
            <div key={s.label} style={{ background: '#fff', border: '1px solid #d4d2cc', borderRadius: 10, padding: '18px 20px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
              <div style={{ fontSize: 11, color: '#9b978f', textTransform: 'uppercase', letterSpacing: 0.8, fontFamily: 'monospace' }}>{s.label}</div>
              <div style={{ fontSize: 28, fontWeight: 700, marginTop: 6, color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Search + Filter */}
        <div style={{ background: '#fff', border: '1px solid #d4d2cc', borderRadius: 10, padding: '14px 18px', marginBottom: 16, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="🔍  Search by name or email..."
            style={{ flex: 1, minWidth: 200, border: '1.5px solid #d4d2cc', borderRadius: 7, padding: '8px 12px', fontSize: 13, outline: 'none', background: '#f4f3f0' }}
          />
          <select value={filter} onChange={e => setFilter(e.target.value)}
            style={{ border: '1.5px solid #d4d2cc', borderRadius: 7, padding: '8px 12px', fontSize: 13, background: '#f4f3f0', outline: 'none' }}>
            <option value="all">All Roles ({counts.all})</option>
            <option value="customer">Customers ({counts.customer})</option>
            <option value="service_provider">Providers ({counts.service_provider})</option>
            <option value="admin">Admins ({counts.admin})</option>
          </select>
          <button onClick={() => { setSearch(''); setFilter('all') }}
            style={{ padding: '8px 14px', background: 'transparent', border: '1.5px solid #a8a49c', borderRadius: 7, cursor: 'pointer', fontSize: 13 }}>
            Clear
          </button>
        </div>

        {/* Results count */}
        <div style={{ fontSize: 12, color: '#9b978f', marginBottom: 12, fontFamily: 'monospace' }}>
          Showing {filtered.length} of {users.length} users
        </div>

        {/* Users Table */}
        <div style={{ background: '#fff', border: '1px solid #d4d2cc', borderRadius: 10, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#9b978f' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>👥</div>
              <p style={{ fontSize: 13 }}>No users found.</p>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f4f3f0' }}>
                  {['#', 'User', 'Email', 'Role', 'Extra Info', 'Joined', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, color: '#9b978f', fontFamily: 'monospace', borderBottom: '1px solid #d4d2cc', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((u, i) => {
                  const badge = getRoleBadge(u.role)
                  return (
                    <tr key={u.user_id} style={{ borderBottom: '1px solid #f0ede8' }}>
                      <td style={{ padding: '12px 14px', fontSize: 11, fontFamily: 'monospace', color: '#9b978f' }}>
                        #{String(i + 1).padStart(3, '0')}
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 36, height: 36, borderRadius: 8, background: '#e8ecff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: '#3d5afe', flexShrink: 0 }}>
                            {u.first_name?.charAt(0)}
                          </div>
                          <div style={{ fontSize: 13, fontWeight: 500 }}>
                            {u.first_name} {u.last_name}
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '12px 14px', fontSize: 13, color: '#6b6860' }}>{u.email}</td>
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{ background: badge.bg, color: badge.color, padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 500, fontFamily: 'monospace' }}>
                          {u.role === 'service_provider' ? 'provider' : u.role}
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px', fontSize: 12, color: '#6b6860' }}>
                        {u.role === 'customer' && u.customer &&
                          `${u.customer.city || '—'}`}
                        {u.role === 'service_provider' && u.service_provider &&
                          `★ ${u.service_provider.average_rating || 0} · ${u.service_provider.experience_years}yr exp`}
                        {u.role === 'admin' && u.admin &&
                          `Level ${u.admin.admin_level}`}
                      </td>
                      <td style={{ padding: '12px 14px', fontSize: 12, color: '#9b978f' }}>
                        {new Date(u.created_at).toLocaleDateString('en-PK', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <button
                          onClick={() => { setSelectedUser(u); setShowDetail(true) }}
                          style={{ padding: '5px 12px', background: 'transparent', border: '1.5px solid #a8a49c', borderRadius: 6, cursor: 'pointer', fontSize: 11 }}>
                          View
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </main>

      {/* USER DETAIL MODAL */}
      {showDetail && selectedUser && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}
          onClick={e => { if (e.target === e.currentTarget) setShowDetail(false) }}>
          <div style={{ background: '#fff', borderRadius: 14, padding: 28, width: 480, maxWidth: '95vw', boxShadow: '0 4px 24px rgba(0,0,0,0.15)' }}>

            {/* Modal Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h3 style={{ fontSize: 17, fontWeight: 700, margin: 0 }}>User Details</h3>
              <button onClick={() => setShowDetail(false)}
                style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#9b978f' }}>✕</button>
            </div>

            {/* Avatar + Name */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20, padding: '16px', background: '#f4f3f0', borderRadius: 10 }}>
              <div style={{ width: 56, height: 56, borderRadius: 12, background: '#e8ecff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 700, color: '#3d5afe' }}>
                {selectedUser.first_name?.charAt(0)}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 16 }}>{selectedUser.first_name} {selectedUser.last_name}</div>
                <div style={{ fontSize: 13, color: '#6b6860' }}>{selectedUser.email}</div>
                <span style={{ ...getRoleBadge(selectedUser.role), padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 500, fontFamily: 'monospace', display: 'inline-block', marginTop: 4 }}>
                  {selectedUser.role === 'service_provider' ? 'provider' : selectedUser.role}
                </span>
              </div>
            </div>

            {/* Details */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 20px', fontSize: 13, marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 11, color: '#9b978f', fontFamily: 'monospace', textTransform: 'uppercase', marginBottom: 3 }}>User ID</div>
                <div style={{ fontFamily: 'monospace', fontSize: 11, color: '#6b6860', wordBreak: 'break-all' }}>{selectedUser.user_id}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: '#9b978f', fontFamily: 'monospace', textTransform: 'uppercase', marginBottom: 3 }}>Joined</div>
                <div>{new Date(selectedUser.created_at).toLocaleDateString()}</div>
              </div>

              {selectedUser.role === 'customer' && selectedUser.customer && (
                <>
                  <div>
                    <div style={{ fontSize: 11, color: '#9b978f', fontFamily: 'monospace', textTransform: 'uppercase', marginBottom: 3 }}>City</div>
                    <div>{selectedUser.customer.city || '—'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: '#9b978f', fontFamily: 'monospace', textTransform: 'uppercase', marginBottom: 3 }}>Zip Code</div>
                    <div>{selectedUser.customer.zip_code || '—'}</div>
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <div style={{ fontSize: 11, color: '#9b978f', fontFamily: 'monospace', textTransform: 'uppercase', marginBottom: 3 }}>Street</div>
                    <div>{selectedUser.customer.street || '—'}</div>
                  </div>
                </>
              )}

              {selectedUser.role === 'service_provider' && selectedUser.service_provider && (
                <>
                  <div>
                    <div style={{ fontSize: 11, color: '#9b978f', fontFamily: 'monospace', textTransform: 'uppercase', marginBottom: 3 }}>Experience</div>
                    <div>{selectedUser.service_provider.experience_years} years</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: '#9b978f', fontFamily: 'monospace', textTransform: 'uppercase', marginBottom: 3 }}>Avg Rating</div>
                    <div>★ {selectedUser.service_provider.average_rating || 0}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: '#9b978f', fontFamily: 'monospace', textTransform: 'uppercase', marginBottom: 3 }}>Status</div>
                    <span style={{ background: selectedUser.service_provider.availability_status ? '#e8f5e9' : '#fce4ec', color: selectedUser.service_provider.availability_status ? '#2e7d32' : '#b71c1c', padding: '3px 10px', borderRadius: 20, fontSize: 11 }}>
                      {selectedUser.service_provider.availability_status ? 'Available' : 'Busy'}
                    </span>
                  </div>
                </>
              )}

              {selectedUser.role === 'admin' && selectedUser.admin && (
                <div style={{ gridColumn: '1 / -1' }}>
                  <div style={{ fontSize: 11, color: '#9b978f', fontFamily: 'monospace', textTransform: 'uppercase', marginBottom: 3 }}>Admin Level</div>
                  <div>Level {selectedUser.admin.admin_level} — {selectedUser.admin.role_description}</div>
                </div>
              )}
            </div>

            {/* Change Role */}
            {selectedUser.role !== 'admin' && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 500, color: '#6b6860', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>Change Role</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {['customer', 'service_provider'].filter(r => r !== selectedUser.role).map(r => (
                    <button key={r} onClick={() => changeRole(selectedUser.user_id, r)}
                      style={{ padding: '6px 14px', background: '#e8ecff', color: '#3d5afe', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 500 }}>
                      → {r === 'service_provider' ? 'Provider' : 'Customer'}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', borderTop: '1px solid #d4d2cc', paddingTop: 16 }}>
              <button onClick={() => setShowDetail(false)}
                style={{ padding: '9px 18px', background: 'transparent', border: '1.5px solid #a8a49c', borderRadius: 7, cursor: 'pointer', fontSize: 13 }}>
                Close
              </button>
              {selectedUser.role !== 'admin' && (
                <button onClick={() => deleteUser(selectedUser.user_id, selectedUser.role)}
                  style={{ padding: '9px 18px', background: '#e53935', color: '#fff', border: 'none', borderRadius: 7, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                  🗑 Delete User
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}