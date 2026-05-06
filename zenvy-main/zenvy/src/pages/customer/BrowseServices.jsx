import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../supabaseClient'
import Sidebar, { PageLayout, StatGrid, useIsMobile, T, s } from '../../components/Sidebar'

const NAV = [
  { label:'Dashboard',      icon:'◉', path:'/customer/dashboard' },
  { label:'Browse Services',icon:'◈', path:'/customer/browse', active:true },
  { label:'My Bookings',    icon:'◇', path:'/customer/bookings' },
  { label:'Bundle Offers',  icon:'◎', path:'/customer/bundles' },
  { label:'Payments',       icon:'◷', path:'/customer/payments' },
  { label:'My Reviews',     icon:'♡', path:'/customer/reviews' },
]

// Map service/category keywords to Unsplash search terms
const getImageUrl = (serviceName, categoryName) => {
  const name = (serviceName || '').toLowerCase()
  const cat  = (categoryName || '').toLowerCase()

  const keywords =
    name.includes('house clean') || name.includes('home clean') ? 'house+cleaning+home' :
    name.includes('office clean')                               ? 'office+cleaning+professional' :
    name.includes('carpet')                                     ? 'carpet+cleaning' :
    name.includes('window')                                     ? 'window+cleaning' :
    name.includes('deep clean')                                 ? 'deep+cleaning+mop' :
    name.includes('plumb')                                      ? 'plumber+pipes' :
    name.includes('electr')                                     ? 'electrician+wiring' :
    name.includes('paint')                                      ? 'house+painting+wall' :
    name.includes('carpent') || name.includes('wood')          ? 'carpenter+woodwork' :
    name.includes('handyman')                                   ? 'handyman+tools' :
    name.includes('ac') || name.includes('air condition')       ? 'air+conditioner+repair' :
    name.includes('pest')                                       ? 'pest+control+spray' :
    name.includes('massage')                                    ? 'massage+therapy+spa' :
    name.includes('skin') || name.includes('facial')           ? 'skincare+facial+beauty' :
    name.includes('chef') || name.includes('cook')             ? 'chef+cooking+kitchen' :
    name.includes('meal prep')                                  ? 'meal+prep+healthy+food' :
    name.includes('car wash')                                   ? 'car+wash+clean' :
    name.includes('car detail')                                 ? 'car+detailing+polish' :
    name.includes('garden') || name.includes('lawn')           ? 'garden+lawn+mowing' :
    name.includes('move') || name.includes('shifting')         ? 'moving+boxes+house' :
    name.includes('laundry') || name.includes('wash cloth')    ? 'laundry+washing' :
    name.includes('iron') || name.includes('press')            ? 'ironing+clothes' :
    name.includes('babysit') || name.includes('nanny')         ? 'babysitting+child+care' :
    name.includes('tutor')                                      ? 'tutoring+study+books' :
    name.includes('security') || name.includes('cctv')         ? 'security+camera+cctv' :
    cat.includes('clean')                                       ? 'cleaning+service+home' :
    cat.includes('repair') || cat.includes('fix')              ? 'repair+tools+maintenance' :
    cat.includes('well') || cat.includes('beauty')             ? 'wellness+spa+relax' :
    cat.includes('cook') || cat.includes('food')               ? 'cooking+kitchen+food' :
    cat.includes('car')                                         ? 'car+service+auto' :
    cat.includes('garden')                                      ? 'garden+outdoor+plants' :
    'home+service+professional'

  // Use picsum with a seed for deterministic images (no API key needed)
  const seed = (serviceName || 'service').split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  return `https://source.unsplash.com/400x200/?${keywords}&sig=${seed}`
}

export default function BrowseServices() {
  const [user, setUser]                         = useState(null)
  const [services, setServices]                 = useState([])
  const [categories, setCategories]             = useState([])
  const [search, setSearch]                     = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedPrice, setSelectedPrice]       = useState('')
  const [loading, setLoading]                   = useState(true)
  const [imgErrors, setImgErrors]               = useState({})
  const navigate = useNavigate()

  const isMobile = useIsMobile()

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    const { data:{ user: authUser } } = await supabase.auth.getUser()
    if (!authUser) { navigate('/auth'); return }
    const { data: userData } = await supabase.from('users').select('first_name,last_name').eq('user_id', authUser.id).single()
    setUser(userData)
    const { data: cats } = await supabase.from('category').select('*')
    setCategories(cats||[])
    const { data, error } = await supabase.from('service')
      .select('service_id,service_name,description,price,category(category_name),provider_service(provider_id,service_provider(user_id,experience_years,average_rating,availability_status,users(first_name,last_name)))')
    console.log('services:', data, error)
    setServices(data||[])
    setLoading(false)
  }

  const filtered = services.filter(sv => {
    const matchSearch   = sv.service_name.toLowerCase().includes(search.toLowerCase())
    const matchCategory = selectedCategory ? sv.category?.category_name === selectedCategory : true
    const matchPrice    =
      selectedPrice === 'under2000'   ? sv.price < 2000 :
      selectedPrice === '2000to5000'  ? sv.price >= 2000 && sv.price <= 5000 :
      selectedPrice === 'over5000'    ? sv.price > 5000 : true
    return matchSearch && matchCategory && matchPrice
  })

  if (loading) return <div style={s.loading}>Loading…</div>

  return (
    <div style={{ ...s.page, paddingTop: isMobile ? 52 : 0 }}>
      <Sidebar items={NAV} userName={`${user?.first_name||''} ${user?.last_name||''}`} userRole="Customer" />
      <PageLayout>

        {/* Header */}
        <div style={{ display:'flex', alignItems: isMobile ? 'flex-start' : 'flex-end', flexDirection: isMobile ? 'column' : 'row', justifyContent:'space-between', gap: isMobile ? 12 : 0, marginBottom:22, paddingBottom:16, borderBottom:`2px solid ${T.mixBorder}` }}>
          <div><h1 style={s.h1}>Browse Services</h1><p style={s.sub}>Find and book the right service for your needs</p></div>
          <button onClick={() => navigate('/customer/bundles')} style={{ ...s.btn, width: isMobile ? '100%' : 'auto' }}>📦 Create Bundle</button>
        </div>

        {/* Filters */}
        <div style={{ display:'flex', gap:10, background:T.mixCard, border:`2px solid ${T.mixBorder}`, borderRadius:12, padding:'12px 16px', marginBottom:18, flexDirection: isMobile ? 'column' : 'row', flexWrap:'wrap', alignItems: isMobile ? 'stretch' : 'center' }}>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍  Search services..." style={{ ...s.input, flex:1, minWidth: isMobile ? 'unset' : 200, width: isMobile ? '100%' : 'auto' }} />
          <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
            <select value={selectedCategory} onChange={e=>setSelectedCategory(e.target.value)} style={{ ...s.select, flex:1, minWidth:130 }}>
              <option value="">All Categories</option>
              {categories.map(c=><option key={c.category_id} value={c.category_name}>{c.category_name}</option>)}
            </select>
            <select value={selectedPrice} onChange={e=>setSelectedPrice(e.target.value)} style={{ ...s.select, flex:1, minWidth:130 }}>
              <option value="">Any Price</option>
              <option value="under2000">Under Rs. 2,000</option>
              <option value="2000to5000">Rs. 2,000 – 5,000</option>
              <option value="over5000">Over Rs. 5,000</option>
            </select>
            <button onClick={()=>{setSearch('');setSelectedCategory('');setSelectedPrice('')}} style={s.btnGhost}>Clear</button>
          </div>
        </div>

        <div style={{ fontSize:11, color:T.muted, marginBottom:16, fontWeight:700, letterSpacing:1 }}>
          {filtered.length} service{filtered.length!==1?'s':''} found
        </div>

        {/* Grid */}
        {filtered.length === 0 ? (
          <div style={{ textAlign:'center', padding:'60px 20px', color:T.muted }}>
            <div style={{ fontSize:40, marginBottom:12, opacity:0.3 }}>◈</div>
            <p style={{ fontWeight:600 }}>No services found. Try a different search.</p>
          </div>
        ) : (
          <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3,1fr)', gap:16 }}>
            {filtered.map(service => {
              const providers  = service.provider_service || []
              const avgRating  = providers.length > 0
                ? (providers.reduce((sum,p) => sum + (parseFloat(p.service_provider?.average_rating)||0), 0) / providers.length).toFixed(1)
                : null
              const imgUrl     = getImageUrl(service.service_name, service.category?.category_name)
              const imgFailed  = imgErrors[service.service_id]

              return (
                <div key={service.service_id} style={{ background:T.mixCard, border:`2px solid ${T.mixBorder}`, borderRadius:14, overflow:'hidden', boxShadow:'0 2px 8px rgba(80,100,180,0.08)', transition:'transform 0.2s,box-shadow 0.2s' }}
                  onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-3px)';e.currentTarget.style.boxShadow='0 8px 24px rgba(80,100,180,0.14)'}}
                  onMouseLeave={e=>{e.currentTarget.style.transform='';e.currentTarget.style.boxShadow='0 2px 8px rgba(80,100,180,0.08)'}}>

                  {/* Image */}
                  {!imgFailed ? (
                    <img
                      src={imgUrl}
                      alt={service.service_name}
                      onError={() => setImgErrors(prev => ({...prev, [service.service_id]: true}))}
                      style={{ width:'100%', height:130, objectFit:'cover', borderBottom:`2px solid ${T.mixBorder}`, display:'block' }}
                    />
                  ) : (
                    <div style={{ height:130, background:`linear-gradient(135deg,${T.bluePale},${T.purplePale})`, borderBottom:`2px solid ${T.mixBorder}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:36, opacity:0.5 }}>◎</div>
                  )}

                  <div style={{ padding:14 }}>
                    <span style={s.badge({bg:T.bluePale,color:'#1a4870',border:T.blueMid})}>{service.category?.category_name||'General'}</span>
                    <div style={{ fontWeight:800, fontSize:14, marginTop:8, color:T.ink }}>{service.service_name}</div>
                    <div style={{ fontSize:12, color:T.muted, margin:'4px 0 8px', lineHeight:1.5, fontWeight:600 }}>
                      {service.description?.substring(0,80)||'Professional service available for booking.'}
                      {service.description?.length > 80 ? '...' : ''}
                    </div>

                    {providers.length > 0 ? (
                      <div style={{ fontSize:11, color:T.muted, marginBottom:6, fontWeight:600 }}>
                        {providers.slice(0,2).map((p,i) => (
                          <span key={i} style={{ marginRight:6 }}>
                            👤 {p.service_provider?.users?.first_name} {p.service_provider?.users?.last_name}
                            <span style={{ color:p.service_provider?.availability_status?'#15803d':'#be123c', marginLeft:4 }}>●</span>
                          </span>
                        ))}
                        {providers.length > 2 && <span style={{color:T.muted}}>+{providers.length-2} more</span>}
                      </div>
                    ) : (
                      <div style={{ fontSize:11, color:T.muted, marginBottom:6, fontWeight:600 }}>No providers assigned yet</div>
                    )}

                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:10 }}>
                      <div style={{ fontWeight:800, fontSize:15, color:T.ink }}>Rs. {Number(service.price).toLocaleString()}</div>
                      <div style={{ color:'#d97706', fontSize:12, fontWeight:700 }}>{avgRating ? `★ ${avgRating}` : '★ New'}</div>
                    </div>

                    <button onClick={() => navigate(`/customer/service/${service.service_id}`)}
                      style={{ ...s.btn, width:'100%', marginTop:10, padding:'9px', justifyContent:'center' }}>
                      Book Now
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </PageLayout>
    </div>
  )
}
