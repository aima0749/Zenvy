import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../supabaseClient'

export default function BrowseServices() {
  const [services, setServices] = useState([])
  const [categories, setCategories] = useState([])
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedPrice, setSelectedPrice] = useState('')
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    fetchCategories()
    fetchServices()
  }, [])

  const fetchCategories = async () => {
    const { data } = await supabase.from('category').select('*')
    setCategories(data || [])
  }

  const fetchServices = async () => {
    const { data, error } = await supabase
      .from('service')
      .select(`
        service_id, service_name, description, price,
        category(category_name),
        provider_service(
          provider_id,
          service_provider(
            user_id, experience_years, average_rating, availability_status,
            users(first_name, last_name)
          )
        )
      `)
    console.log('services data:', data)
    console.log('services error:', error)
    setServices(data || [])
    setLoading(false)
  }

  const filtered = services.filter(s => {
    const matchSearch = s.service_name.toLowerCase().includes(search.toLowerCase())
    const matchCategory = selectedCategory
      ? s.category?.category_name === selectedCategory
      : true
    const matchPrice =
      selectedPrice === 'under2000' ? s.price < 2000 :
      selectedPrice === '2000to5000' ? s.price >= 2000 && s.price <= 5000 :
      selectedPrice === 'over5000' ? s.price > 5000 : true
    return matchSearch && matchCategory && matchPrice
  })

  const sidebarItems = [
    { label: 'Dashboard', icon: '🏠', path: '/customer/dashboard' },
    { label: 'Browse Services', icon: '🔍', path: '/customer/browse', active: true },
    { label: 'My Bookings', icon: '📅', path: '/customer/bookings' },
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
            <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Browse Services</h1>
            <p style={{ color: '#6b6860', marginTop: 4, fontSize: 13 }}>Find and book the right service for your needs</p>
          </div>
          <button onClick={() => navigate('/customer/bundles')}
            style={{ padding: '9px 18px', background: '#3d5afe', color: '#fff', border: 'none', borderRadius: 7, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
            📦 Create Bundle
          </button>
        </div>

        {/* Filter Bar */}
        <div style={{ display: 'flex', gap: 12, background: '#fff', border: '1px solid #d4d2cc', borderRadius: 10, padding: '14px 18px', marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="🔍  Search services..."
            style={{ flex: 1, minWidth: 200, border: '1.5px solid #d4d2cc', borderRadius: 7, padding: '7px 12px', fontSize: 13, outline: 'none', background: '#f4f3f0' }} />
          <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)}
            style={{ border: '1.5px solid #d4d2cc', borderRadius: 7, padding: '7px 12px', fontSize: 13, background: '#f4f3f0', outline: 'none' }}>
            <option value="">All Categories</option>
            {categories.map(c => (
              <option key={c.category_id} value={c.category_name}>{c.category_name}</option>
            ))}
          </select>
          <select value={selectedPrice} onChange={e => setSelectedPrice(e.target.value)}
            style={{ border: '1.5px solid #d4d2cc', borderRadius: 7, padding: '7px 12px', fontSize: 13, background: '#f4f3f0', outline: 'none' }}>
            <option value="">Any Price</option>
            <option value="under2000">Under Rs. 2,000</option>
            <option value="2000to5000">Rs. 2,000 – 5,000</option>
            <option value="over5000">Over Rs. 5,000</option>
          </select>
          <button onClick={() => { setSearch(''); setSelectedCategory(''); setSelectedPrice('') }}
            style={{ padding: '7px 14px', background: 'transparent', border: '1.5px solid #a8a49c', borderRadius: 7, cursor: 'pointer', fontSize: 13 }}>
            Clear
          </button>
        </div>

        {/* Results count */}
        <div style={{ fontSize: 12, color: '#9b978f', marginBottom: 16, fontFamily: 'monospace' }}>
          {filtered.length} service{filtered.length !== 1 ? 's' : ''} found
        </div>

        {/* Services Grid */}
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#9b978f' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
            <p>No services found. Try a different search or category.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            {filtered.map(service => {
              const providers = service.provider_service || []
              const availableProviders = providers.filter(p => p.service_provider?.availability_status)
              const avgRating = providers.length > 0
                ? (providers.reduce((sum, p) => sum + (parseFloat(p.service_provider?.average_rating) || 0), 0) / providers.length).toFixed(1)
                : null

              return (
                <div key={service.service_id}
                  style={{ background: '#fff', border: '1px solid #d4d2cc', borderRadius: 10, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>

                  {/* Image placeholder */}
                  <div style={{ height: 100, background: '#eeecea', borderBottom: '1px dashed #d4d2cc', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#b0acaa', fontFamily: 'monospace' }}>
                    SERVICE IMAGE
                  </div>

                  <div style={{ padding: 14 }}>
                    {/* Category badge */}
                    <span style={{ background: '#e8ecff', color: '#3d5afe', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 500 }}>
                      {service.category?.category_name || 'General'}
                    </span>

                    <div style={{ fontWeight: 600, fontSize: 14, marginTop: 8 }}>
                      {service.service_name}
                    </div>

                    <div style={{ fontSize: 12, color: '#6b6860', margin: '4px 0 8px', lineHeight: 1.5 }}>
                      {service.description?.substring(0, 80) || 'Professional service available for booking.'}
                      {service.description?.length > 80 ? '...' : ''}
                    </div>

                    {/* Providers info */}
                    {providers.length > 0 ? (
                      <div style={{ fontSize: 11, color: '#6b6860', marginBottom: 6 }}>
                        {providers.slice(0, 2).map((p, i) => (
                          <span key={i} style={{ marginRight: 6 }}>
                            👤 {p.service_provider?.users?.first_name} {p.service_provider?.users?.last_name}
                            {p.service_provider?.availability_status
                              ? <span style={{ color: '#2e7d32', marginLeft: 4 }}>●</span>
                              : <span style={{ color: '#b71c1c', marginLeft: 4 }}>●</span>}
                          </span>
                        ))}
                        {providers.length > 2 && <span style={{ color: '#9b978f' }}>+{providers.length - 2} more</span>}
                      </div>
                    ) : (
                      <div style={{ fontSize: 11, color: '#9b978f', marginBottom: 6 }}>
                        No providers assigned yet
                      </div>
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
                      <div style={{ fontWeight: 700, fontSize: 15 }}>
                        Rs. {Number(service.price).toLocaleString()}
                      </div>
                      <div style={{ color: '#f9a825', fontSize: 12 }}>
                        {avgRating ? `★ ${avgRating}` : '★ New'}
                      </div>
                    </div>

                    <button
                      onClick={() => navigate(`/customer/service/${service.service_id}`)}
                      style={{ width: '100%', marginTop: 10, padding: '9px', background: '#3d5afe', color: '#fff', border: 'none', borderRadius: 7, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                      Book Now
                    </button>
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