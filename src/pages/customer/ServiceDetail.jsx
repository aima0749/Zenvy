import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
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

export default function ServiceDetail() {
  const { id }   = useParams()
  const [user, setUser] = useState(null)
  const navigate = useNavigate()
  const [service, setService]         = useState(null)
  const [providers, setProviders]     = useState([])
  const [reviews, setReviews]         = useState([])
  const [slots, setSlots]             = useState([])
  const [loading, setLoading]         = useState(true)
  const [selectedProvider, setSelectedProvider] = useState('')
  const [selectedSlot, setSelectedSlot]         = useState('')
  const [form, setForm]               = useState({ service_date:'', location:'' })
  const [booking, setBooking]         = useState(false)
  const [currentUser, setCurrentUser] = useState(null)

  useEffect(() => { fetchData() }, [id])

  const fetchData = async () => {
    const { data:{ user } } = await supabase.auth.getUser()
    if (!user) { navigate('/auth'); return }
    setCurrentUser(user)

    const { data: svcData, error } = await supabase.from('service')
      .select('service_id,service_name,description,price,category(category_name),provider_service(provider_id,service_provider(user_id,experience_years,average_rating,availability_status,users(first_name,last_name)))')
      .eq('service_id', id).single()
    console.log('service detail:', svcData, error)
    setService(svcData)

    const provList = (svcData?.provider_service||[]).map(p=>p.service_provider).filter(Boolean)
    setProviders(provList)

    const { data: reviewData } = await supabase.from('review')
      .select('review_id,rating,comment,review_date,customer(user_id,users(first_name,last_name))')
      .eq('provider_id', provList[0]?.user_id||'').order('review_date',{ascending:false}).limit(5)
    setReviews(reviewData||[])

    setLoading(false)
  }

  const fetchSlots = async (providerId) => {
    const today = new Date().toISOString().split('T')[0]
    const { data } = await supabase.from('availability')
      .select('*').eq('provider_id', providerId).eq('is_booked', false).gte('available_date', today).order('available_date',{ascending:true})
    setSlots(data||[])
  }

  const handleProviderSelect = (providerId) => {
    setSelectedProvider(providerId)
    setSelectedSlot('')
    if (providerId) fetchSlots(providerId)
    else setSlots([])
  }

  const handleBook = async () => {
    if (!selectedProvider||!form.service_date||!form.location) { alert('Please select a provider, date, and location'); return }
    setBooking(true)
    const { error } = await supabase.from('booking').insert({
      customer_id:  currentUser.id,
      provider_id:  selectedProvider,
      service_id:   id,
      status:       'pending',
      booking_date: new Date().toISOString().split('T')[0],
      service_date: form.service_date,
      location:     form.location,
    })
    if (error) { alert('Booking error: '+error.message); setBooking(false); return }
    if (selectedSlot) {
      await supabase.from('availability').update({ is_booked:true }).eq('schedule_id', selectedSlot)
    }
    alert('Booking created! ✅ The provider will confirm shortly.')
    navigate('/customer/bookings')
    setBooking(false)
  }

  if (loading) return <div style={s.loading}>Loading…</div>
  if (!service) return <div style={s.loading}>Service not found.</div>

  const avgRating = reviews.length>0 ? (reviews.reduce((sum,r)=>sum+r.rating,0)/reviews.length).toFixed(1) : null

  return (
    <div style={s.page}>
      <Sidebar items={NAV} userName={`${user?.first_name||''} ${user?.last_name||''}`} userRole="Customer" />
      <PageLayout>
        <div style={{ marginBottom:22, paddingBottom:16, borderBottom:`2px solid ${T.mixBorder}` }}>
          <button onClick={()=>navigate('/customer/browse')} style={{...s.btnGhost,marginBottom:14,fontSize:12}}>← Back to Services</button>
          <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',flexWrap:'wrap',gap:12}}>
            <div>
              <span style={s.badge({bg:T.bluePale,color:'#1a4870',border:T.blueMid})}>{service.category?.category_name||'General'}</span>
              <h1 style={{...s.h1,marginTop:8}}>{service.service_name}</h1>
              {avgRating && <div style={{color:'#d97706',fontSize:14,marginTop:4,fontWeight:700}}>★ {avgRating} ({reviews.length} reviews)</div>}
            </div>
            <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:32,fontWeight:600,background:'linear-gradient(90deg,#6aaad0,#9b8ec4)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>
              Rs. {Number(service.price).toLocaleString()}
            </div>
          </div>
        </div>

        <div style={{display:'grid',gridTemplateColumns:'1fr 360px',gap:24,alignItems:'start'}}>
          {/* Left */}
          <div>
            <div style={s.card}>
              <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:18,fontWeight:600,color:T.ink,marginBottom:12}}>About this Service</div>
              <p style={{fontSize:14,color:T.muted,lineHeight:1.8,fontWeight:600}}>{service.description||'Professional service available for booking.'}</p>
            </div>

            {providers.length>0 && (
              <div style={{...s.card,marginTop:16}}>
                <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:18,fontWeight:600,color:T.ink,marginBottom:14}}>Available Providers</div>
                {providers.map(p=>(
                  <div key={p.user_id} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 0',borderBottom:`1.5px solid ${T.mixPale}`}}>
                    <div style={{display:'flex',alignItems:'center',gap:12}}>
                      <div style={s.avatar(40)}>{p.users?.first_name?.charAt(0)}</div>
                      <div>
                        <div style={{fontWeight:800,fontSize:14,color:T.ink}}>{p.users?.first_name} {p.users?.last_name}</div>
                        <div style={{fontSize:12,color:T.muted,fontWeight:600}}>{p.experience_years} yrs experience · ★ {p.average_rating||'New'}</div>
                      </div>
                    </div>
                    <span style={s.badge(p.availability_status?{bg:'#f0fdf4',color:'#15803d',border:'#86efac'}:{bg:'#fff1f2',color:'#be123c',border:'#fda4af'})}>
                      {p.availability_status?'● Available':'● Busy'}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {reviews.length>0 && (
              <div style={{...s.card,marginTop:16}}>
                <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:18,fontWeight:600,color:T.ink,marginBottom:14}}>Customer Reviews</div>
                {reviews.map(r=>(
                  <div key={r.review_id} style={{marginBottom:14,paddingBottom:14,borderBottom:`1.5px solid ${T.mixPale}`}}>
                    <div style={{display:'flex',justifyContent:'space-between',marginBottom:6}}>
                      <div style={{fontWeight:700,fontSize:13,color:T.ink}}>{r.customer?.users?.first_name} {r.customer?.users?.last_name}</div>
                      <div style={{color:'#d97706'}}>{'★'.repeat(r.rating)}<span style={{color:T.mixBorder}}>{'★'.repeat(5-r.rating)}</span></div>
                    </div>
                    <p style={{fontSize:13,color:T.muted,margin:0,fontWeight:600}}>{r.comment}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right — Booking Panel */}
          <div style={{...s.card,position:'sticky',top:20}}>
            <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:18,fontWeight:600,color:T.ink,marginBottom:16}}>Book this Service</div>

            <div style={{marginBottom:14}}>
              <label style={{fontSize:9,fontWeight:800,color:T.muted,textTransform:'uppercase',letterSpacing:2,display:'block',marginBottom:6}}>Select Provider</label>
              <select value={selectedProvider} onChange={e=>handleProviderSelect(e.target.value)} style={{...s.select,width:'100%'}}>
                <option value="">— Choose a provider —</option>
                {providers.filter(p=>p.availability_status).map(p=>(
                  <option key={p.user_id} value={p.user_id}>{p.users?.first_name} {p.users?.last_name}</option>
                ))}
              </select>
            </div>

            {slots.length>0 && (
              <div style={{marginBottom:14}}>
                <label style={{fontSize:9,fontWeight:800,color:T.muted,textTransform:'uppercase',letterSpacing:2,display:'block',marginBottom:6}}>Available Slots (optional)</label>
                <select value={selectedSlot} onChange={e=>{
                  setSelectedSlot(e.target.value)
                  const slot = slots.find(sl=>sl.schedule_id===e.target.value)
                  if (slot) setForm({...form,service_date:slot.available_date})
                }} style={{...s.select,width:'100%'}}>
                  <option value="">— Pick a slot or choose date below —</option>
                  {slots.map(sl=>(
                    <option key={sl.schedule_id} value={sl.schedule_id}>{sl.available_date} · {sl.start_time?.slice(0,5)}–{sl.end_time?.slice(0,5)}</option>
                  ))}
                </select>
              </div>
            )}

            <div style={{marginBottom:14}}>
              <label style={{fontSize:9,fontWeight:800,color:T.muted,textTransform:'uppercase',letterSpacing:2,display:'block',marginBottom:6}}>Service Date</label>
              <input type="date" value={form.service_date} onChange={e=>setForm({...form,service_date:e.target.value})} style={{...s.input,width:'100%'}} />
            </div>

            <div style={{marginBottom:20}}>
              <label style={{fontSize:9,fontWeight:800,color:T.muted,textTransform:'uppercase',letterSpacing:2,display:'block',marginBottom:6}}>Location</label>
              <input placeholder="Your address" value={form.location} onChange={e=>setForm({...form,location:e.target.value})} style={{...s.input,width:'100%'}} />
            </div>

            <div style={{borderTop:`2px solid ${T.mixBorder}`,paddingTop:14,marginBottom:16}}>
              <div style={{display:'flex',justifyContent:'space-between',fontWeight:800,fontSize:15,color:T.ink}}>
                <span>Total</span>
                <span style={{background:'linear-gradient(90deg,#6aaad0,#9b8ec4)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>Rs. {Number(service.price).toLocaleString()}</span>
              </div>
            </div>

            <button onClick={handleBook} disabled={booking} style={{...s.btn,width:'100%',justifyContent:'center',opacity:booking?0.6:1}}>
              {booking?'Booking…':'Confirm Booking →'}
            </button>
          </div>
        </div>
      </PageLayout>
    </div>
  )
}
