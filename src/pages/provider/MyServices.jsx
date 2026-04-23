import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../supabaseClient'

export default function MyServices() {
  const [myServices, setMyServices] = useState([])
  const [allServices, setAllServices] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState(null)
  const [showAdd, setShowAdd] = useState(false)
  const navigate = useNavigate()

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { navigate('/auth'); return }
    setCurrentUser(user)

    // Services this provider is linked to
    const { data: linked } = await supabase
      .from('provider_service')
      .select(`
        service_id,
        service(service_id, service_name, description, price, category(category_name))
      `)
      .eq('provider_id', user.id)
    setMyServices(linked || [])

    // All available services (to add new ones)
    const { data: all } = await supabase
      .from('service')
      .select('service_id, service_name, price, category(category_name)')
    setAllServices(all || [])

    const { data: cats } = await supabase.from('category').select('*')
    setCategories(cats || [])

    setLoading(false)
  }

  const addService = async (serviceId) => {
    const already = myServices.find(s => s.service_id === serviceId)
    if (already) { alert('You already offer this service'); return }

    const { error } = await supabase.from('provider_service').insert({
      provider_id: currentUser.id,
      service_id: serviceId
    })
    if (error) { alert('Error: ' + error.message); return }
    fetchData()
    setShowAdd(false)
  }

  const removeService = async (serviceId) => {
    if (!window.confirm('Remove this service from your profile?')) return
    await supabase
      .from('provider_service')
      .delete()
      .eq('provider_id', currentUser.id)
      .eq('service_id', serviceId)
    fetchData()
  }

  const myServiceIds = myServices.map(s => s.service_id)
  const availableToAdd = allServices.filter(s => !myServiceIds.includes(s.service_id))

  const sidebarItems = [
    { label: 'Dashboard', icon: '🏠', path: '/provider/dashboard' },
    { label: 'My Services', icon: '🔧', path: '/provider/services', active: true },
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

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>My Services</h1>
            <p style={{ color: '#6b6860', marginTop: 4, fontSize: 13 }}>Services you currently offer to customers</p>
          </div>
          <button onClick={() => setShowAdd(true)}
            style={{ padding: '9px 18px', background: '#3d5afe', color: '#fff', border: 'none', borderRadius: 7, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
            + Add Service
          </button>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
          {[
            { label: 'Services Offered', value: myServices.length, color: '#1a1a2e' },
            { label: 'Available to Add', value: availableToAdd.length, color: '#3d5afe' },
            { label: 'Categories', value: new Set(myServices.map(s => s.service?.category?.category_name)).size, color: '#2e7d32' },
          ].map(s => (
            <div key={s.label} style={{ background: '#fff', border: '1px solid #d4d2cc', borderRadius: 10, padding: '18px 20px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
              <div style={{ fontSize: 11, color: '#9b978f', textTransform: 'uppercase', letterSpacing: 0.8, fontFamily: 'monospace' }}>{s.label}</div>
              <div style={{ fontSize: 28, fontWeight: 700, marginTop: 6, color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* My Services Grid */}
        {myServices.length === 0 ? (
          <div style={{ background: '#fff', border: '1px solid #d4d2cc', borderRadius: 10, padding: '60px 20px', textAlign: 'center', color: '#9b978f', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🔧</div>
            <p style={{ fontSize: 13 }}>You haven't added any services yet.</p>
            <button onClick={() => setShowAdd(true)}
              style={{ marginTop: 12, padding: '8px 20px', background: '#3d5afe', color: '#fff', border: 'none', borderRadius: 7, cursor: 'pointer', fontSize: 13 }}>
              Add Your First Service
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            {myServices.map(item => {
              const svc = item.service
              return (
                <div key={item.service_id} style={{ background: '#fff', border: '1px solid #d4d2cc', borderRadius: 10, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
                  <div style={{ height: 80, background: '#eeecea', borderBottom: '1px dashed #d4d2cc', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#b0acaa', fontFamily: 'monospace' }}>
                    SERVICE IMAGE
                  </div>
                  <div style={{ padding: 16 }}>
                    <span style={{ background: '#e8ecff', color: '#3d5afe', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 500 }}>
                      {svc?.category?.category_name || 'General'}
                    </span>
                    <div style={{ fontWeight: 600, fontSize: 14, marginTop: 8 }}>{svc?.service_name}</div>
                    <div style={{ fontSize: 12, color: '#6b6860', marginTop: 4, lineHeight: 1.5 }}>
                      {svc?.description?.substring(0, 70) || 'No description'}...
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
                      <div style={{ fontWeight: 700, fontSize: 15 }}>Rs. {Number(svc?.price || 0).toLocaleString()}</div>
                      <span style={{ background: '#e8f5e9', color: '#2e7d32', padding: '3px 10px', borderRadius: 20, fontSize: 11 }}>● Active</span>
                    </div>
                    <button onClick={() => removeService(item.service_id)}
                      style={{ width: '100%', marginTop: 10, padding: '8px', background: '#fce4ec', color: '#b71c1c', border: 'none', borderRadius: 7, cursor: 'pointer', fontSize: 12, fontWeight: 500 }}>
                      Remove Service
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>

      {/* ADD SERVICE MODAL */}
      {showAdd && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}
          onClick={e => { if (e.target === e.currentTarget) setShowAdd(false) }}>
          <div style={{ background: '#fff', borderRadius: 14, padding: 28, width: 520, maxWidth: '95vw', maxHeight: '80vh', overflow: 'auto', boxShadow: '0 4px 16px rgba(0,0,0,0.10)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h3 style={{ fontSize: 17, fontWeight: 700, margin: 0 }}>Add a Service</h3>
              <button onClick={() => setShowAdd(false)}
                style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#9b978f' }}>✕</button>
            </div>

            {availableToAdd.length === 0 ? (
              <p style={{ color: '#9b978f', textAlign: 'center', padding: '20px 0' }}>
                You're already offering all available services!
              </p>
            ) : (
              availableToAdd.map(s => (
                <div key={s.service_id}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #f0ede8' }}>
                  <div>
                    <div style={{ fontWeight: 500, fontSize: 13 }}>{s.service_name}</div>
                    <div style={{ fontSize: 12, color: '#9b978f' }}>
                      {s.category?.category_name} · Rs. {Number(s.price).toLocaleString()}
                    </div>
                  </div>
                  <button onClick={() => addService(s.service_id)}
                    style={{ padding: '6px 14px', background: '#3d5afe', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 500 }}>
                    Add
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}