import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../supabaseClient'
import Sidebar, { PageLayout, StatGrid, useIsMobile, T, s, bookingBadge } from '../../components/Sidebar'

const NAV = [
  { label:'Dashboard',        icon:'◉', path:'/provider/dashboard', active:true },
  { label:'My Services',      icon:'◈', path:'/provider/services' },
  { label:'Availability',     icon:'◷', path:'/provider/availability' },
  { label:'Assigned Bookings',icon:'◇', path:'/provider/bookings' },
  { label:'Bundle Tasks',     icon:'◎', path:'/provider/bundles' },
  { label:'My Reviews',       icon:'♡', path:'/provider/reviews' },
]

export default function ProviderDashboard() {
  const [user, setUser]       = useState(null)
  const [provider, setProvider] = useState(null)
  const [bookings, setBookings] = useState([])
  const [reviews, setReviews]   = useState([])
  const [stats, setStats]       = useState({ services:0, upcoming:0, rating:0, totalReviews:0 })
  const [loading, setLoading]   = useState(true)
  const navigate = useNavigate()

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    const { data:{ user: authUser } } = await supabase.auth.getUser()
    if (!authUser) { navigate('/auth'); return }
    const { data: userData }    = await supabase.from('users').select('*').eq('user_id', authUser.id).single()
    setUser(userData)
    const { data: providerData } = await supabase.from('service_provider').select('*').eq('user_id', authUser.id).single()
    setProvider(providerData)
    const { data: bookingData }  = await supabase.from('booking')
      .select('booking_id,status,service_date,location,booking_date,service(service_name,price),customer(user_id,users(first_name,last_name))')
      .eq('provider_id', authUser.id).order('booking_date',{ascending:false}).limit(5)
    setBookings(bookingData || [])
    const { data: reviewData } = await supabase.from('review')
      .select('review_id,rating,comment,review_date,customer(user_id,users(first_name,last_name)),booking(service(service_name))')
      .eq('provider_id', authUser.id).order('review_date',{ascending:false}).limit(3)
    setReviews(reviewData || [])
    const { data: allBookings }  = await supabase.from('booking').select('status').eq('provider_id', authUser.id)
    const { data: servicesData } = await supabase.from('provider_service').select('service_id').eq('provider_id', authUser.id)
    const { data: allReviews }   = await supabase.from('review').select('rating').eq('provider_id', authUser.id)
    const avgRating = allReviews?.length > 0 ? (allReviews.reduce((sum,r) => sum+r.rating,0)/allReviews.length).toFixed(1) : 0
    setStats({ services:servicesData?.length||0, upcoming:allBookings?.filter(b=>['pending','accepted'].includes(b.status)).length||0, rating:avgRating, totalReviews:allReviews?.length||0 })
    setLoading(false)
  }

  const handleBookingAction = async (bookingId, action) => {
    const { error } = await supabase.from('booking').update({ status:action }).eq('booking_id', bookingId)
    if (error) { alert('Error: '+error.message); return }
    fetchData()
  }

  if (loading) return <div style={s.loading}>Loading…</div>

  const availBadge = provider?.availability_status
    ? { bg:'#f0fdf4', color:'#15803d', border:'#86efac' }
    : { bg:'#fff1f2', color:'#be123c', border:'#fda4af' }

  return (
    <div style={s.page}>
      <Sidebar items={NAV} userName={`${user?.first_name} ${user?.last_name}`} userRole="Service Provider"
        extra={<div style={{ marginTop:5 }}><span style={s.badge(availBadge)}>{provider?.availability_status ? '● Available' : '● Busy'}</span></div>} />
      <PageLayout>

        <div style={{ marginBottom:22, paddingBottom:16, borderBottom:`2px solid ${T.mixBorder}` }}>
          <h1 style={s.h1}>Dashboard</h1>
          <p style={s.sub}>Welcome back, {user?.first_name}!</p>
        </div>

        {/* Banner */}
        <div style={{ background:`linear-gradient(135deg,${T.bluePale},${T.purplePale})`, border:`2px solid ${T.mixBorder}`, borderRadius:16, padding:'24px 28px', marginBottom:22, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div>
            <div style={{ fontSize:9, color:T.purple, textTransform:'uppercase', letterSpacing:2, fontWeight:800, marginBottom:6 }}>PROVIDER DASHBOARD</div>
            <div style={{ fontSize:18, fontWeight:800, color:T.ink }}>Welcome back, {user?.first_name}!</div>
            <p style={{ color:T.muted, marginTop:4, fontSize:13, fontWeight:600 }}>You have {stats.upcoming} pending/upcoming jobs.</p>
            <button onClick={() => navigate('/provider/availability')} style={{ ...s.btn, marginTop:12 }}>Manage Availability →</button>
          </div>
          <div style={{ fontSize:48, opacity:0.3 }}>◈</div>
        </div>

        {/* Stats */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:12, marginBottom:22 }}>
          {[
            { label:'Services Offered', value:stats.services,     color:T.ink },
            { label:'Upcoming Jobs',    value:stats.upcoming,     color:T.blue },
            { label:'Avg. Rating',      value:`★ ${stats.rating}`, color:'#d97706' },
            { label:'Total Reviews',    value:stats.totalReviews, color:T.purple },
          ].map(st => (
            <div key={st.label} style={s.statCard}>
              <div style={s.statLabel}>{st.label}</div>
              <div style={{ ...s.statNum, color:st.color }}>{st.value}</div>
            </div>
          ))}
        </div>

        {/* Incoming Bookings */}
        <div style={{ ...s.tableWrap, marginBottom:20 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 18px', borderBottom:`2px solid ${T.mixBorder}`, background:T.mixPale }}>
            <span style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:18, fontWeight:600, color:T.ink }}>Incoming Booking Requests</span>
            <span onClick={() => navigate('/provider/bookings')} style={{ fontSize:12, color:T.blue, cursor:'pointer', fontWeight:800 }}>View All →</span>
          </div>
          {bookings.length === 0 ? (
            <div style={{ textAlign:'center', padding:'40px 20px', color:T.muted }}>
              <div style={{ fontSize:36, marginBottom:8, opacity:0.4 }}>◇</div>
              <p style={{ fontSize:13, fontWeight:600 }}>No booking requests yet.</p>
            </div>
          ) : (
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead><tr style={s.tableHead}>{['Customer','Service','Service Date','Location','Status','Action'].map(h=><th key={h} style={s.th}>{h}</th>)}</tr></thead>
              <tbody>
                {bookings.map(b => {
                  const badge = bookingBadge(b.status)
                  const cName = b.customer?.users ? `${b.customer.users.first_name} ${b.customer.users.last_name}` : '—'
                  return (
                    <tr key={b.booking_id} style={s.tr}>
                      <td style={{ ...s.td, fontWeight:700 }}>{cName}</td>
                      <td style={s.td}>{b.service?.service_name}</td>
                      <td style={s.td}>{b.service_date}</td>
                      <td style={s.td}>{b.location || '—'}</td>
                      <td style={s.td}><span style={s.badge(badge)}>{b.status}</span></td>
                      <td style={s.td}>
                        <div style={{ display:'flex', gap:6 }}>
                          {b.status==='pending'     && <><button onClick={()=>handleBookingAction(b.booking_id,'accepted')}   style={s.btnSm('#f0fdf4','#15803d','#86efac')}>Accept</button><button onClick={()=>handleBookingAction(b.booking_id,'cancelled')} style={s.btnSm('#fff1f2','#be123c','#fda4af')}>Reject</button></>}
                          {b.status==='accepted'    && <button onClick={()=>handleBookingAction(b.booking_id,'in_progress')} style={s.btnSm(T.purplePale,'#7c3aed',T.purpleMid)}>Start</button>}
                          {b.status==='in_progress' && <button onClick={()=>handleBookingAction(b.booking_id,'completed')}  style={s.btnSm('#f0fdf4','#15803d','#86efac')}>Complete</button>}
                          {['completed','cancelled'].includes(b.status) && <button style={s.btnGhost}>View</button>}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Recent Reviews */}
        <div style={s.tableWrap}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 18px', borderBottom:`2px solid ${T.mixBorder}`, background:T.mixPale }}>
            <span style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:18, fontWeight:600, color:T.ink }}>Recent Reviews</span>
            <span onClick={() => navigate('/provider/reviews')} style={{ fontSize:12, color:T.blue, cursor:'pointer', fontWeight:800 }}>View All →</span>
          </div>
          {reviews.length === 0 ? (
            <div style={{ textAlign:'center', padding:'30px 20px', color:T.muted }}>
              <div style={{ fontSize:32, marginBottom:8, opacity:0.4 }}>♡</div>
              <p style={{ fontSize:13, fontWeight:600 }}>No reviews yet.</p>
            </div>
          ) : reviews.map(r => (
            <div key={r.review_id} style={{ border:`1px solid ${T.mixPale}`, borderRadius:10, padding:16, margin:'12px 16px' }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
                <div style={{ fontWeight:700, fontSize:13, color:T.ink }}>{r.customer?.users?.first_name} {r.customer?.users?.last_name}</div>
                <div style={{ color:'#d97706' }}>{'★'.repeat(r.rating)}{'☆'.repeat(5-r.rating)}</div>
              </div>
              <p style={{ fontSize:13, color:T.muted, margin:0, fontWeight:600 }}>{r.comment}</p>
            </div>
          ))}
        </div>
      </PageLayout>
    </div>
  )
}
