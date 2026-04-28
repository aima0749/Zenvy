import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../supabaseClient'

export default function AdminServices() {
  const [services, setServices] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const [selectedService, setSelectedService] = useState(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ service_name: '', description: '', price: '', category_id: '' })
  const [showAddCategory, setShowAddCategory] = useState(false)
  const [newCategory, setNewCategory] = useState('')
  const navigate = useNavigate()

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    const { data: svcData } = await supabase
      .from('service')
      .select(`
        service_id, service_name, description, price,
        category(category_id, category_name),
        provider_service(provider_id)
      `)
      .order('service_name', { ascending: true })
    setServices(svcData || [])

    const { data: catData } = await supabase
      .from('category')
      .select('*')
      .order('category_name', { ascending: true })
    setCategories(catData || [])

    setLoading(false)
  }

  const addService = async () => {
    if (!form.service_name || !form.price || !form.category_id) {
      alert('Please fill all required fields')
      return
    }
    setSaving(true)
    const { error } = await supabase.from('service').insert({
      service_name: form.service_name,
      description: form.description,
      price: parseFloat(form.price),
      category_id: form.category_id
    })
    if (error) { alert('Error: ' + error.message); setSaving(false); return }
    setForm({ service_name: '', description: '', price: '', category_id: '' })
    setShowAdd(false)
    fetchData()
    setSaving(false)
  }

  const editService = async () => {
    if (!form.service_name || !form.price || !form.category_id) {
      alert('Please fill all required fields')
      return
    }
    setSaving(true)
    const { error } = await supabase
      .from('service')
      .update({
        service_name: form.service_name,
        description: form.description,
        price: parseFloat(form.price),
        category_id: form.category_id
      })
      .eq('service_id', selectedService.service_id)
    if (error) { alert('Error: ' + error.message); setSaving(false); return }
    setShowEdit(false)
    fetchData()
    setSaving(false)
  }

  const deleteService = async (serviceId) => {
    if (!window.confirm('Delete this service? This will also remove all provider links.')) return
    const { error } = await supabase.from('service').delete().eq('service_id', serviceId)
    if (error) { alert('Error: ' + error.message); return }
    fetchData()
  }

  const addCategory = async () => {
    if (!newCategory.trim()) { alert('Enter a category name'); return }
    const { error } = await supabase.from('category').insert({ category_name: newCategory.trim() })
    if (error) { alert('Error: ' + error.message); return }
    setNewCategory('')
    setShowAddCategory(false)
    fetchData()
  }

  const deleteCategory = async (categoryId) => {
    if (!window.confirm('Delete this category? Services in it will become uncategorized.')) return
    await supabase.from('category').delete().eq('category_id', categoryId)
    fetchData()
  }

  const openEdit = (svc) => {
    setSelectedService(svc)
    setForm({
      service_name: svc.service_name,
      description: svc.description || '',
      price: svc.price,
      category_id: svc.category?.category_id || ''
    })
    setShowEdit(true)
  }

  const filtered = services
    .filter(s => selectedCategory ? s.category?.category_id === selectedCategory : true)
    .filter(s => s.service_name.toLowerCase().includes(search.toLowerCase()))

  const sidebarItems = [
    { label: 'Dashboard', icon: '🏠', path: '/admin/dashboard' },
    { label: 'Users',     icon: '👥', path: '/admin/users' },
    { label: 'Bookings',  icon: '📋', path: '/admin/bookings' },
    { label: 'Services',  icon: '🔧', path: '/admin/services', active: true },
    { label: 'Payments',  icon: '💳', path: '/admin/payments' },
    { label: 'Reviews',   icon: '⭐', path: '/admin/reviews' },
  ]

  const logout = async () => {
    await supabase.auth.signOut()
    navigate('/auth')
  }

  const inputStyle = { width: '100%', border: '1.5px dashed #d4d2cc', borderRadius: 7, padding: '10px 13px', fontSize: 13, background: '#f4f3f0', outline: 'none', boxSizing: 'border-box', marginBottom: 14, fontFamily: 'Arial' }
  const labelStyle = { fontSize: 12, fontWeight: 500, color: '#6b6860', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 6 }

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
            <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Service Management</h1>
            <p style={{ color: '#6b6860', marginTop: 4, fontSize: 13 }}>Add, edit and manage all platform services and categories</p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => setShowAddCategory(true)}
              style={{ padding: '9px 16px', background: '#fff', color: '#1a1a2e', border: '1.5px solid #d4d2cc', borderRadius: 7, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
              + Category
            </button>
            <button onClick={() => { setForm({ service_name: '', description: '', price: '', category_id: '' }); setShowAdd(true) }}
              style={{ padding: '9px 18px', background: '#e53935', color: '#fff', border: 'none', borderRadius: 7, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
              + Add Service
            </button>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
          {[
            { label: 'Total Services',  value: services.length,    color: '#1a1a2e' },
            { label: 'Categories',      value: categories.length,  color: '#e53935' },
            { label: 'Avg Price',       value: services.length > 0 ? `Rs. ${Math.round(services.reduce((s, v) => s + Number(v.price), 0) / services.length).toLocaleString()}` : '—', color: '#2e7d32' },
          ].map(s => (
            <div key={s.label} style={{ background: '#fff', border: '1px solid #d4d2cc', borderRadius: 10, padding: '18px 20px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
              <div style={{ fontSize: 11, color: '#9b978f', textTransform: 'uppercase', letterSpacing: 0.8, fontFamily: 'monospace' }}>{s.label}</div>
              <div style={{ fontSize: 28, fontWeight: 700, marginTop: 6, color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Categories Row */}
        <div style={{ background: '#fff', border: '1px solid #d4d2cc', borderRadius: 10, padding: 16, marginBottom: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Categories</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {categories.map(cat => (
              <div key={cat.category_id} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#f4f3f0', border: '1px solid #d4d2cc', borderRadius: 20, padding: '5px 12px' }}>
                <span style={{ fontSize: 12 }}>{cat.category_name}</span>
                <span style={{ fontSize: 11, color: '#9b978f' }}>
                  ({services.filter(s => s.category?.category_id === cat.category_id).length})
                </span>
                <button onClick={() => deleteCategory(cat.category_id)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#b71c1c', fontSize: 12, padding: 0, marginLeft: 2 }}>✕</button>
              </div>
            ))}
          </div>
        </div>

        {/* Search + Filter */}
        <div style={{ background: '#fff', border: '1px solid #d4d2cc', borderRadius: 10, padding: '14px 18px', marginBottom: 16, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="🔍  Search services..."
            style={{ flex: 1, minWidth: 200, border: '1.5px solid #d4d2cc', borderRadius: 7, padding: '8px 12px', fontSize: 13, outline: 'none', background: '#f4f3f0' }} />
          <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)}
            style={{ border: '1.5px solid #d4d2cc', borderRadius: 7, padding: '8px 12px', fontSize: 13, background: '#f4f3f0', outline: 'none' }}>
            <option value="">All Categories</option>
            {categories.map(c => (
              <option key={c.category_id} value={c.category_id}>{c.category_name}</option>
            ))}
          </select>
          <button onClick={() => { setSearch(''); setSelectedCategory('') }}
            style={{ padding: '8px 14px', background: 'transparent', border: '1.5px solid #a8a49c', borderRadius: 7, cursor: 'pointer', fontSize: 13 }}>
            Clear
          </button>
        </div>

        {/* Results */}
        <div style={{ fontSize: 12, color: '#9b978f', marginBottom: 12, fontFamily: 'monospace' }}>
          Showing {filtered.length} of {services.length} services
        </div>

        {/* Services Grid */}
        {filtered.length === 0 ? (
          <div style={{ background: '#fff', border: '1px solid #d4d2cc', borderRadius: 10, padding: '60px 20px', textAlign: 'center', color: '#9b978f' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🔧</div>
            <p style={{ fontSize: 13 }}>No services found.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            {filtered.map(svc => (
              <div key={svc.service_id} style={{ background: '#fff', border: '1px solid #d4d2cc', borderRadius: 10, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
                <div style={{ height: 70, background: '#eeecea', borderBottom: '1px dashed #d4d2cc', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#b0acaa', fontFamily: 'monospace' }}>
                  SERVICE IMAGE
                </div>
                <div style={{ padding: 14 }}>
                  <span style={{ background: '#e8ecff', color: '#3d5afe', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 500 }}>
                    {svc.category?.category_name || 'Uncategorized'}
                  </span>
                  <div style={{ fontWeight: 600, fontSize: 14, marginTop: 8 }}>{svc.service_name}</div>
                  <div style={{ fontSize: 12, color: '#6b6860', marginTop: 4, lineHeight: 1.5 }}>
                    {svc.description?.substring(0, 70) || 'No description'}
                    {svc.description?.length > 70 ? '...' : ''}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>Rs. {Number(svc.price).toLocaleString()}</div>
                    <span style={{ fontSize: 11, color: '#9b978f' }}>
                      {svc.provider_service?.length || 0} provider{svc.provider_service?.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                    <button onClick={() => openEdit(svc)}
                      style={{ flex: 1, padding: '7px', background: '#e8ecff', color: '#3d5afe', border: 'none', borderRadius: 7, cursor: 'pointer', fontSize: 12, fontWeight: 500 }}>
                      ✏️ Edit
                    </button>
                    <button onClick={() => deleteService(svc.service_id)}
                      style={{ flex: 1, padding: '7px', background: '#fce4ec', color: '#b71c1c', border: 'none', borderRadius: 7, cursor: 'pointer', fontSize: 12, fontWeight: 500 }}>
                      🗑 Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* ADD SERVICE MODAL */}
      {showAdd && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}
          onClick={e => { if (e.target === e.currentTarget) setShowAdd(false) }}>
          <div style={{ background: '#fff', borderRadius: 14, padding: 28, width: 460, maxWidth: '95vw', boxShadow: '0 4px 24px rgba(0,0,0,0.15)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h3 style={{ fontSize: 17, fontWeight: 700, margin: 0 }}>Add New Service</h3>
              <button onClick={() => setShowAdd(false)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#9b978f' }}>✕</button>
            </div>
            <label style={labelStyle}>Service Name *</label>
            <input value={form.service_name} onChange={e => setForm({ ...form, service_name: e.target.value })}
              placeholder="e.g. House Cleaning" style={inputStyle} />
            <label style={labelStyle}>Category *</label>
            <select value={form.category_id} onChange={e => setForm({ ...form, category_id: e.target.value })} style={inputStyle}>
              <option value="">— Select Category —</option>
              {categories.map(c => <option key={c.category_id} value={c.category_id}>{c.category_name}</option>)}
            </select>
            <label style={labelStyle}>Price (Rs.) *</label>
            <input type="number" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })}
              placeholder="e.g. 2500" style={inputStyle} />
            <label style={labelStyle}>Description</label>
            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
              rows={3} placeholder="Describe the service..."
              style={{ ...inputStyle, resize: 'vertical' }} />
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowAdd(false)}
                style={{ padding: '9px 18px', background: 'transparent', border: '1.5px solid #a8a49c', borderRadius: 7, cursor: 'pointer', fontSize: 13 }}>
                Cancel
              </button>
              <button onClick={addService} disabled={saving}
                style={{ padding: '9px 18px', background: '#e53935', color: '#fff', border: 'none', borderRadius: 7, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                {saving ? 'Saving...' : 'Add Service'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT SERVICE MODAL */}
      {showEdit && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}
          onClick={e => { if (e.target === e.currentTarget) setShowEdit(false) }}>
          <div style={{ background: '#fff', borderRadius: 14, padding: 28, width: 460, maxWidth: '95vw', boxShadow: '0 4px 24px rgba(0,0,0,0.15)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h3 style={{ fontSize: 17, fontWeight: 700, margin: 0 }}>Edit Service</h3>
              <button onClick={() => setShowEdit(false)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#9b978f' }}>✕</button>
            </div>
            <label style={labelStyle}>Service Name *</label>
            <input value={form.service_name} onChange={e => setForm({ ...form, service_name: e.target.value })}
              style={inputStyle} />
            <label style={labelStyle}>Category *</label>
            <select value={form.category_id} onChange={e => setForm({ ...form, category_id: e.target.value })} style={inputStyle}>
              <option value="">— Select Category —</option>
              {categories.map(c => <option key={c.category_id} value={c.category_id}>{c.category_name}</option>)}
            </select>
            <label style={labelStyle}>Price (Rs.) *</label>
            <input type="number" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })}
              style={inputStyle} />
            <label style={labelStyle}>Description</label>
            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
              rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowEdit(false)}
                style={{ padding: '9px 18px', background: 'transparent', border: '1.5px solid #a8a49c', borderRadius: 7, cursor: 'pointer', fontSize: 13 }}>
                Cancel
              </button>
              <button onClick={editService} disabled={saving}
                style={{ padding: '9px 18px', background: '#3d5afe', color: '#fff', border: 'none', borderRadius: 7, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD CATEGORY MODAL */}
      {showAddCategory && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}
          onClick={e => { if (e.target === e.currentTarget) setShowAddCategory(false) }}>
          <div style={{ background: '#fff', borderRadius: 14, padding: 28, width: 380, maxWidth: '95vw', boxShadow: '0 4px 24px rgba(0,0,0,0.15)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h3 style={{ fontSize: 17, fontWeight: 700, margin: 0 }}>Add Category</h3>
              <button onClick={() => setShowAddCategory(false)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#9b978f' }}>✕</button>
            </div>
            <label style={labelStyle}>Category Name</label>
            <input value={newCategory} onChange={e => setNewCategory(e.target.value)}
              placeholder="e.g. Electrician" style={inputStyle} />
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowAddCategory(false)}
                style={{ padding: '9px 18px', background: 'transparent', border: '1.5px solid #a8a49c', borderRadius: 7, cursor: 'pointer', fontSize: 13 }}>
                Cancel
              </button>
              <button onClick={addCategory}
                style={{ padding: '9px 18px', background: '#e53935', color: '#fff', border: 'none', borderRadius: 7, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                Add Category
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}