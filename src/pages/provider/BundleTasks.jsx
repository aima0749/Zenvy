import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../supabaseClient'

export default function BundleTasks() {
  const [bundles, setBundles] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const navigate = useNavigate()

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { navigate('/auth'); return }

    // Get all bundle_service rows where this provider is assigned
    const { data, error } = await supabase
      .from('bundle_service')
      .select(`
        bundle_id, service_id,
        service(service_name, price),
        bundle_offer(
          bundle_id, status, total_price, booking_date, service_date, location,
          customer(user_id, users(first_name, last_name, email))
        )
      `)
      .eq('provider_id', user.id)

    console.log('bundle tasks:', data, error)
    setBundles(data || [])
    setLoading(false)
  }

  const updateBundleStatus = async (bundleId, newStatus) => {
    const confirmMsg = {
      accepted:    'Accept this bundle offer?',
      cancelled:   'Reject this bundle?',
      in_progress: 'Mark bundle as In Progress?',
      completed:   'Mark entire bundle as Completed?'
    }
    if (!window.confirm(confirmMsg[newStatus])) return

    const { error } = await supabase
      .from('bundle_offer')
      .update({ status: newStatus })
      .eq('bundle_id', bundleId)

    if (error) { alert('Error: ' + error.message); return }
    fetchData()
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

  // Group bundle_service rows by bundle_id so each bundle shows once
  const groupedBundles = bundles.reduce((acc, item) => {
    const bid = item.bundle_id
    if (!acc[bid]) {
      acc[bid] = {
        bundle: item.bundle_offer,
        services: []
      }
    }
    acc[bid].services.push(item.service)
    return acc
  }, {})

  const bundleList = Object.values(groupedBundles)

  const filtered = filter === 'all'
    ? bundleList
    : bundleList.filter(b => b.bundle?.status === filter)

  const counts = {
    all:         bundleList.length,
    pending:     bundleList.filter(b => b.bundle?.status === 'pending').length,
    accepted:    bundleList.filter(b => b.bundle?.status === 'accepted').length,
    in_progress: bundleList.filter(b => b.bundle?.status === 'in_progress').length,
    completed:   bundleList.filter(b => b.bundle?.status === 'completed').length,
    cancelled:   bundleList.filter(b => b.bundle?.status === 'cancelled').length,
  }

  const sidebarItems = [
    { label: 'Dashboard',         icon: '🏠', path: '/provider/dashboard' },
    { label: 'My Services',       icon: '🔧', path: '/provider/services' },
    { label: 'Availability',      icon: '📆', path: '/provider/availability' },
    { label: 'Assigned Bookings', icon: '📋', path: '/provider/bookings' },
    { label: 'Bundle Tasks',      icon: '📦', path: '/provider/bundles', active: true },
    { label: 'My Reviews',        icon: '⭐', path: '/provider/reviews' },
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
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Bundle Tasks</h1>
          <p style={{ color: '#6b6860', marginTop: 4, fontSize: 13 }}>Bundle offers assigned to you by customers</p>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14, marginBottom: 24 }}>
          {[
            { label: 'Total',       value: counts.all,         color: '#1a1a2e' },
            { label: 'Pending',     value: counts.pending,     color: '#e65100' },
            { label: 'Accepted',    value: counts.accepted,    color: '#1565c0' },
            { label: 'In Progress', value: counts.in_progress, color: '#6a1b9a' },
            { label: 'Completed',   value: counts.completed,   color: '#2e7d32' },
          ].map(s => (
            <div key={s.label} style={{ background: '#fff', border: '1px solid #d4d2cc', borderRadius: 10, padding: '16px 18px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
              <div style={{ fontSize: 10, color: '#9b978f', textTransform: 'uppercase', letterSpacing: 0.8, fontFamily: 'monospace' }}>{s.label}</div>
              <div style={{ fontSize: 26, fontWeight: 700, marginTop: 6, color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Filter Tabs */}
        <div style={{ display: 'flex', borderBottom: '2px solid #d4d2cc', marginBottom: 20 }}>
          {['all', 'pending', 'accepted', 'in_progress', 'completed', 'cancelled'].map(tab => (
            <div key={tab} onClick={() => setFilter(tab)}
              style={{ padding: '10px 16px', fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap', color: filter === tab ? '#3d5afe' : '#6b6860', borderBottom: filter === tab ? '2px solid #3d5afe' : '2px solid transparent', marginBottom: -2, fontWeight: filter === tab ? 600 : 400 }}>
              {tab === 'all' ? 'All' : tab === 'in_progress' ? 'In Progress' : tab.charAt(0).toUpperCase() + tab.slice(1)}
              <span style={{ marginLeft: 5, fontSize: 11, color: '#9b978f' }}>({counts[tab] ?? 0})</span>
            </div>
          ))}
        </div>

        {/* Bundle Cards */}
        {filtered.length === 0 ? (
          <div style={{ background: '#fff', border: '1px solid #d4d2cc', borderRadius: 10, padding: '60px 20px', textAlign: 'center', color: '#9b978f', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📦</div>
            <p style={{ fontSize: 13 }}>No bundle tasks assigned to you yet.</p>
            <p style={{ fontSize: 12, marginTop: 4 }}>Bundles appear when customers book multiple services together.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {filtered.map(({ bundle, services }, i) => {
              if (!bundle) return null
              const badge = getBadge(bundle.status)
              const customer = bundle.customer?.users
              return (
                <div key={bundle.bundle_id} style={{ background: '#fff', border: '1px solid #d4d2cc', borderRadius: 10, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>

                    {/* Left */}
                    <div style={{ flex: 1, minWidth: 260 }}>
                      {/* Header row */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                        <span style={{ fontSize: 11, fontFamily: 'monospace', color: '#9b978f' }}>
                          BUNDLE #{String(i + 1).padStart(3, '0')}
                        </span>
                        <span style={{ background: badge.bg, color: badge.color, padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, fontFamily: 'monospace' }}>
                          {bundle.status === 'in_progress' ? 'In Progress' : bundle.status?.charAt(0).toUpperCase() + bundle.status?.slice(1)}
                        </span>
                        <span style={{ background: '#e8ecff', color: '#3d5afe', padding: '3px 10px', borderRadius: 20, fontSize: 11 }}>
                          {services.length} service{services.length !== 1 ? 's' : ''}
                        </span>
                      </div>

                      {/* Services list */}
                      <div style={{ marginBottom: 14 }}>
                        <div style={{ fontSize: 11, color: '#9b978f', textTransform: 'uppercase', letterSpacing: 0.8, fontFamily: 'monospace', marginBottom: 8 }}>
                          Services in this bundle
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                          {services.map((svc, si) => (
                            <span key={si} style={{ background: '#f4f3f0', border: '1px solid #d4d2cc', borderRadius: 6, padding: '5px 12px', fontSize: 12 }}>
                              🔧 {svc?.service_name || '—'}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Details grid */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 20px', fontSize: 13, color: '#6b6860' }}>
                        <div>
                          <span style={{ color: '#9b978f', fontSize: 11 }}>CUSTOMER</span><br />
                          {customer ? `${customer.first_name} ${customer.last_name}` : '—'}
                        </div>
                        <div>
                          <span style={{ color: '#9b978f', fontSize: 11 }}>EMAIL</span><br />
                          {customer?.email || '—'}
                        </div>
                        <div>
                          <span style={{ color: '#9b978f', fontSize: 11 }}>SERVICE DATE</span><br />
                          {bundle.service_date}
                        </div>
                        <div>
                          <span style={{ color: '#9b978f', fontSize: 11 }}>BOOKED ON</span><br />
                          {bundle.booking_date}
                        </div>
                        <div style={{ gridColumn: '1 / -1' }}>
                          <span style={{ color: '#9b978f', fontSize: 11 }}>LOCATION</span><br />
                          {bundle.location || '—'}
                        </div>
                      </div>
                    </div>

                    {/* Right — price + actions */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10, minWidth: 180 }}>
                      <div>
                        <div style={{ fontSize: 11, color: '#9b978f', textAlign: 'right', marginBottom: 4, fontFamily: 'monospace' }}>TOTAL VALUE</div>
                        <div style={{ fontSize: 22, fontWeight: 700, color: '#3d5afe' }}>
                          Rs. {Number(bundle.total_price || 0).toLocaleString()}
                        </div>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%' }}>
                        {bundle.status === 'pending' && (
                          <>
                            <button onClick={() => updateBundleStatus(bundle.bundle_id, 'accepted')}
                              style={{ padding: '8px 16px', background: '#3d5afe', color: '#fff', border: 'none', borderRadius: 7, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                              ✅ Accept Bundle
                            </button>
                            <button onClick={() => updateBundleStatus(bundle.bundle_id, 'cancelled')}
                              style={{ padding: '8px 16px', background: '#fce4ec', color: '#b71c1c', border: 'none', borderRadius: 7, cursor: 'pointer', fontSize: 13, fontWeight: 500 }}>
                              ✕ Reject
                            </button>
                          </>
                        )}
                        {bundle.status === 'accepted' && (
                          <button onClick={() => updateBundleStatus(bundle.bundle_id, 'in_progress')}
                            style={{ padding: '8px 16px', background: '#f3e5f5', color: '#6a1b9a', border: 'none', borderRadius: 7, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                            🚀 Start Bundle
                          </button>
                        )}
                        {bundle.status === 'in_progress' && (
                          <button onClick={() => updateBundleStatus(bundle.bundle_id, 'completed')}
                            style={{ padding: '8px 16px', background: '#e8f5e9', color: '#2e7d32', border: 'none', borderRadius: 7, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                            🏁 Mark Completed
                          </button>
                        )}
                        {['completed', 'cancelled'].includes(bundle.status) && (
                          <span style={{ fontSize: 12, color: '#9b978f', textAlign: 'right' }}>
                            {bundle.status === 'completed' ? '✅ All done' : '✕ Rejected'}
                          </span>
                        )}
                      </div>
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