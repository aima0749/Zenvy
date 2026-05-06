import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../supabaseClient'

export default function BundleOffers() {
  const [bundles, setBundles] = useState([])
  const [services, setServices] = useState([])
  const [providers, setProviders] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [currentUser, setCurrentUser] = useState(null)
  const [filter, setFilter] = useState('all')
  const [creating, setCreating] = useState(false)

  // Form state
  const [selectedServices, setSelectedServices] = useState([]) // [{service_id, provider_id}]
  const [serviceDate, setServiceDate] = useState('')
  const [location, setLocation] = useState('')

  const navigate = useNavigate()

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { navigate('/auth'); return }
    setCurrentUser(user)

    // Get customer's bundles
    const { data: bundleData } = await supabase
      .from('bundle_offer')
      .select(`
        bundle_id, status, total_price, booking_date, service_date, location,
        bundle_service(
          service_id,
          service(service_name, price),
          service_provider(user_id, users(first_name, last_name))
        )
      `)
      .eq('customer_id', user.id)
      .order('booking_date', { ascending: false })
    setBundles(bundleData || [])

    // Get all services with providers
    const { data: svcData } = await supabase
      .from('service')
      .select(`
        service_id, service_name, price,
        category(category_name),
        provider_service(
          provider_id,
          service_provider(user_id, availability_status, users(first_name, last_name))
        )
      `)
    setServices(svcData || [])

    setLoading(false)
  }

  const toggleServiceSelection = (serviceId, providerId) => {
    const exists = selectedServices.find(s => s.service_id === serviceId)
    if (exists) {
      setSelectedServices(selectedServices.filter(s => s.service_id !== serviceId))
    } else {
      setSelectedServices([...selectedServices, { service_id: serviceId, provider_id: providerId }])
    }
  }

  const isSelected = (serviceId) => selectedServices.some(s => s.service_id === serviceId)

  const totalPrice = selectedServices.reduce((sum, sel) => {
    const svc = services.find(s => s.service_id === sel.service_id)
    return sum + Number(svc?.price || 0)
  }, 0)

  const createBundle = async () => {
    if (selectedServices.length < 2) { alert('Please select at least 2 services for a bundle'); return }
    if (!serviceDate) { alert('Please select a service date'); return }
    if (!location) { alert('Please enter your location'); return }

    setCreating(true)

    // 1. Create bundle_offer
    const { data: bundleData, error: bundleError } = await supabase
      .from('bundle_offer')
      .insert({
        customer_id: currentUser.id,
        total_price: totalPrice,
        booking_date: new Date().toISOString().split('T')[0],
        service_date: serviceDate,
        location: location,
        status: 'pending'
      })
      .select()
      .single()

    if (bundleError) { alert('Error creating bundle: ' + bundleError.message); setCreating(false); return }

    // 2. Insert into bundle_service for each selected service
    const bundleServices = selectedServices.map(sel => ({
      bundle_id: bundleData.bundle_id,
      service_id: sel.service_id,
      provider_id: sel.provider_id || null
    }))

    const { error: bsError } = await supabase.from('bundle_service').insert(bundleServices)
    if (bsError) { alert('Error linking services: ' + bsError.message); setCreating(false); return }

    alert('Bundle created successfully! ✅')
    setShowCreate(false)
    setSelectedServices([])
    setServiceDate('')
    setLocation('')
    fetchData()
    setCreating(false)
  }

  const cancelBundle = async (bundleId) => {
    if (!window.confirm('Cancel this bundle?')) return
    await supabase.from('bundle_offer').update({ status: 'cancelled' }).eq('bundle_id', bundleId)
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

  const counts = {
    all:         bundles.length,
    pending:     bundles.filter(b => b.status === 'pending').length,
    accepted:    bundles.filter(b => b.status === 'accepted').length,
    in_progress: bundles.filter(b => b.status === 'in_progress').length,
    completed:   bundles.filter(b => b.status === 'completed').length,
    cancelled:   bundles.filter(b => b.status === 'cancelled').length,
  }

  const filtered = filter === 'all' ? bundles : bundles.filter(b => b.status === filter)

  const sidebarItems = [
    { label: 'Dashboard',     icon: '🏠', path: '/customer/dashboard' },
    { label: 'Browse Services', icon: '🔍', path: '/customer/browse' },
    { label: 'My Bookings',   icon: '📅', path: '/customer/bookings' },
    { label: 'Bundle Offers', icon: '📦', path: '/customer/bundles', active: true },
    { label: 'Payments',      icon: '💳', path: '/customer/payments' },
    { label: 'My Reviews',    icon: '⭐', path: '/customer/reviews' },
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
            <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Bundle Offers</h1>
            <p style={{ color: '#6b6860', marginTop: 4, fontSize: 13 }}>Book multiple services together and save time</p>
          </div>
          <button onClick={() => setShowCreate(true)}
            style={{ padding: '9px 18px', background: '#3d5afe', color: '#fff', border: 'none', borderRadius: 7, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
            📦 Create Bundle
          </button>
        </div>

        {/* Info Banner */}
        <div style={{ background: '#e8ecff', border: '1px solid #c5cfff', borderRadius: 10, padding: '14px 18px', marginBottom: 24, fontSize: 13, color: '#2a3fd4' }}>
          💡 A bundle lets you book <strong>multiple services</strong> in one go — all delivered on the same date at the same location.
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
          {[
            { label: 'Total Bundles', value: counts.all,       color: '#1a1a2e' },
            { label: 'Pending',       value: counts.pending,   color: '#e65100' },
            { label: 'Active',        value: counts.accepted + counts.in_progress, color: '#3d5afe' },
            { label: 'Completed',     value: counts.completed, color: '#2e7d32' },
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
            <p style={{ fontSize: 13 }}>No bundle offers yet. Create one to get started!</p>
            <button onClick={() => setShowCreate(true)}
              style={{ marginTop: 12, padding: '8px 20px', background: '#3d5afe', color: '#fff', border: 'none', borderRadius: 7, cursor: 'pointer', fontSize: 13 }}>
              Create Bundle
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {filtered.map((bundle, i) => {
              const badge = getBadge(bundle.status)
              const bundleServices = bundle.bundle_service || []
              return (
                <div key={bundle.bundle_id} style={{ background: '#fff', border: '1px solid #d4d2cc', borderRadius: 10, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>

                    {/* Left */}
                    <div style={{ flex: 1, minWidth: 260 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                        <span style={{ fontSize: 11, fontFamily: 'monospace', color: '#9b978f' }}>
                          BUNDLE #{String(i + 1).padStart(3, '0')}
                        </span>
                        <span style={{ background: badge.bg, color: badge.color, padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, fontFamily: 'monospace' }}>
                          {bundle.status === 'in_progress' ? 'In Progress' : bundle.status?.charAt(0).toUpperCase() + bundle.status?.slice(1)}
                        </span>
                        <span style={{ background: '#e8ecff', color: '#3d5afe', padding: '3px 10px', borderRadius: 20, fontSize: 11 }}>
                          {bundleServices.length} service{bundleServices.length !== 1 ? 's' : ''}
                        </span>
                      </div>

                      {/* Services list */}
                      <div style={{ marginBottom: 14 }}>
                        <div style={{ fontSize: 11, color: '#9b978f', textTransform: 'uppercase', letterSpacing: 0.8, fontFamily: 'monospace', marginBottom: 8 }}>
                          Services Included
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                          {bundleServices.map((bs, si) => (
                            <div key={si} style={{ background: '#f4f3f0', border: '1px solid #d4d2cc', borderRadius: 8, padding: '6px 12px', fontSize: 12 }}>
                              <div style={{ fontWeight: 500 }}>🔧 {bs.service?.service_name}</div>
                              <div style={{ color: '#9b978f', fontSize: 11, marginTop: 2 }}>
                                by {bs.service_provider?.users?.first_name} {bs.service_provider?.users?.last_name || 'TBD'}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Details */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 20px', fontSize: 13, color: '#6b6860' }}>
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

                    {/* Right */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10, minWidth: 160 }}>
                      <div>
                        <div style={{ fontSize: 11, color: '#9b978f', textAlign: 'right', marginBottom: 4, fontFamily: 'monospace' }}>TOTAL</div>
                        <div style={{ fontSize: 22, fontWeight: 700, color: '#3d5afe' }}>
                          Rs. {Number(bundle.total_price || 0).toLocaleString()}
                        </div>
                      </div>

                      {['pending', 'accepted'].includes(bundle.status) && (
                        <button onClick={() => cancelBundle(bundle.bundle_id)}
                          style={{ padding: '8px 16px', background: '#fce4ec', color: '#b71c1c', border: 'none', borderRadius: 7, cursor: 'pointer', fontSize: 12, fontWeight: 500 }}>
                          Cancel Bundle
                        </button>
                      )}
                      {bundle.status === 'completed' && (
                        <button onClick={() => navigate('/customer/reviews')}
                          style={{ padding: '8px 16px', background: '#e8f5e9', color: '#2e7d32', border: 'none', borderRadius: 7, cursor: 'pointer', fontSize: 12, fontWeight: 500 }}>
                          ⭐ Leave Review
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>

      {/* CREATE BUNDLE MODAL */}
      {showCreate && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}
          onClick={e => { if (e.target === e.currentTarget) setShowCreate(false) }}>
          <div style={{ background: '#fff', borderRadius: 14, padding: 28, width: 600, maxWidth: '95vw', maxHeight: '90vh', overflow: 'auto', boxShadow: '0 4px 24px rgba(0,0,0,0.15)' }}>

            {/* Modal Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Create Bundle Offer</h3>
              <button onClick={() => setShowCreate(false)}
                style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#9b978f' }}>✕</button>
            </div>

            {/* Step 1 - Select Services */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                Step 1 — Select Services
                <span style={{ marginLeft: 8, fontSize: 11, color: '#9b978f', fontWeight: 400 }}>
                  (select at least 2)
                </span>
              </div>
              <div style={{ fontSize: 12, color: '#9b978f', marginBottom: 12 }}>
                {selectedServices.length} selected · Total: Rs. {totalPrice.toLocaleString()}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 300, overflowY: 'auto' }}>
                {services.map(svc => {
                  const selected = isSelected(svc.service_id)
                  const firstProvider = svc.provider_service?.[0]
                  const providerId = firstProvider?.provider_id
                  const providerName = firstProvider?.service_provider?.users
                    ? `${firstProvider.service_provider.users.first_name} ${firstProvider.service_provider.users.last_name}`
                    : 'No provider'

                  return (
                    <div key={svc.service_id}
                      onClick={() => toggleServiceSelection(svc.service_id, providerId)}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', border: selected ? '2px solid #3d5afe' : '1.5px solid #d4d2cc', borderRadius: 8, cursor: 'pointer', background: selected ? '#f0f3ff' : '#f4f3f0', transition: 'all .15s' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 20, height: 20, borderRadius: 4, border: selected ? 'none' : '2px solid #d4d2cc', background: selected ? '#3d5afe' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          {selected && <span style={{ color: '#fff', fontSize: 12 }}>✓</span>}
                        </div>
                        <div>
                          <div style={{ fontWeight: 500, fontSize: 13 }}>{svc.service_name}</div>
                          <div style={{ fontSize: 11, color: '#9b978f' }}>
                            {svc.category?.category_name} · by {providerName}
                          </div>
                        </div>
                      </div>
                      <div style={{ fontWeight: 700, fontSize: 14, color: selected ? '#3d5afe' : '#1a1a2e' }}>
                        Rs. {Number(svc.price).toLocaleString()}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Divider */}
            <div style={{ borderTop: '1px solid #d4d2cc', marginBottom: 20 }} />

            {/* Step 2 - Date & Location */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Step 2 — Date & Location</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 500, color: '#6b6860', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 6 }}>
                    Service Date
                  </label>
                  <input type="date" value={serviceDate}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={e => setServiceDate(e.target.value)}
                    style={{ width: '100%', border: '1.5px dashed #d4d2cc', borderRadius: 7, padding: '10px 13px', fontSize: 13, background: '#f4f3f0', outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 500, color: '#6b6860', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 6 }}>
                    Location
                  </label>
                  <input placeholder="Your full address" value={location}
                    onChange={e => setLocation(e.target.value)}
                    style={{ width: '100%', border: '1.5px dashed #d4d2cc', borderRadius: 7, padding: '10px 13px', fontSize: 13, background: '#f4f3f0', outline: 'none', boxSizing: 'border-box' }} />
                </div>
              </div>
            </div>

            {/* Price Summary */}
            {selectedServices.length > 0 && (
              <div style={{ background: '#f4f3f0', border: '1px solid #d4d2cc', borderRadius: 8, padding: '14px 16px', marginBottom: 20 }}>
                <div style={{ fontSize: 12, color: '#9b978f', marginBottom: 8, fontFamily: 'monospace', textTransform: 'uppercase' }}>Summary</div>
                {selectedServices.map(sel => {
                  const svc = services.find(s => s.service_id === sel.service_id)
                  return (
                    <div key={sel.service_id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                      <span>{svc?.service_name}</span>
                      <span>Rs. {Number(svc?.price || 0).toLocaleString()}</span>
                    </div>
                  )
                })}
                <div style={{ borderTop: '1px solid #d4d2cc', paddingTop: 8, marginTop: 8, display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 15 }}>
                  <span>Total</span>
                  <span style={{ color: '#3d5afe' }}>Rs. {totalPrice.toLocaleString()}</span>
                </div>
              </div>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowCreate(false)}
                style={{ padding: '10px 20px', background: 'transparent', border: '1.5px solid #a8a49c', borderRadius: 7, cursor: 'pointer', fontSize: 13 }}>
                Cancel
              </button>
              <button onClick={createBundle} disabled={creating || selectedServices.length < 2}
                style={{ padding: '10px 20px', background: selectedServices.length < 2 ? '#c8c4bc' : '#3d5afe', color: '#fff', border: 'none', borderRadius: 7, cursor: selectedServices.length < 2 ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 600 }}>
                {creating ? 'Creating...' : `Create Bundle (${selectedServices.length} services)`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}