import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../supabaseClient'
import Sidebar, { PageLayout, StatGrid, useIsMobile, T, s, bookingBadge } from '../../components/Sidebar'

const NAV = [
  { label:'Dashboard',        icon:'◉', path:'/provider/dashboard' },
  { label:'My Services',      icon:'◈', path:'/provider/services' },
  { label:'Availability',     icon:'◷', path:'/provider/availability' },
  { label:'Assigned Bookings',icon:'◇', path:'/provider/bookings', active:true },
  { label:'Bundle Tasks',     icon:'◎', path:'/provider/bundles' },
  { label:'My Reviews',       icon:'♡', path:'/provider/reviews' },
]

export default function AssignedBookings() {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading]   = useState(true)
  const [filter, setFilter]     = useState('all')
  const [user, setUser] = useState(null)
  const navigate = useNavigate()

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    const { data:{ user } } = await supabase.auth.getUser()
    if (!user) { navigate('/auth'); return }
    const { data: userData } = await supabase.from('users').select('first_name,last_name').eq('user_id', user.id).single()
    setUser(userData)
    const { data, error } = await supabase.from('booking')
      .select('booking_id,status,booking_date,service_date,location,booking_time,service(service_name,price),customer(user_id,street,city,users(first_name,last_name,email))')
      .eq('provider_id', user.id).order('booking_date',{ascending:false})
    console.log('bookings:', data, error)
    setBookings(data||[]); setLoading(false)
  }

  const handleAction = async (bookingId, newStatus) => {
    const msgs = { accepted:'Accept this booking?', cancelled:'Reject this booking?', in_progress:'Mark as In Progress?', completed:'Mark as Completed?' }
    if (!window.confirm(msgs[newStatus])) return
    const { error } = await supabase.from('booking').update({ status:newStatus }).eq('booking_id', bookingId)
    if (error) { alert('Error: '+error.message); return }
    fetchData()
  }

  const counts = { all:bookings.length, pending:bookings.filter(b=>b.status==='pending').length, accepted:bookings.filter(b=>b.status==='accepted').length, in_progress:bookings.filter(b=>b.status==='in_progress').length, completed:bookings.filter(b=>b.status==='completed').length, cancelled:bookings.filter(b=>b.status==='cancelled').length }
  const filtered = filter==='all' ? bookings : bookings.filter(b=>b.status===filter)

  if (loading) return <div style={s.loading}>Loading…</div>

  return (
    <div style={s.page}>
      <Sidebar items={NAV} userName={`${user?.first_name||""} ${user?.last_name||""}`} userRole="Service Provider" />
      <PageLayout>
        <div style={{ marginBottom:22, paddingBottom:16, borderBottom:`2px solid ${T.mixBorder}` }}>
          <h1 style={s.h1}>Assigned Bookings</h1><p style={s.sub}>Manage all your booking requests and update their status</p>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:12, marginBottom:22 }}>
          {[{label:'Total',value:counts.all,color:T.ink},{label:'Pending',value:counts.pending,color:T.terra},{label:'Accepted',value:counts.accepted,color:T.blue},{label:'In Progress',value:counts.in_progress,color:T.purple},{label:'Completed',value:counts.completed,color:'#15803d'}].map(st=>(
            <div key={st.label} style={s.statCard}><div style={s.statLabel}>{st.label}</div><div style={{...s.statNum,color:st.color,fontSize:24}}>{st.value}</div></div>
          ))}
        </div>

        <div style={s.filterBar}>
          {['all','pending','accepted','in_progress','completed','cancelled'].map(tab=>(
            <div key={tab} onClick={()=>setFilter(tab)} style={s.filterTab(filter===tab)}>
              {tab==='all'?'All':tab==='in_progress'?'In Progress':tab.charAt(0).toUpperCase()+tab.slice(1)}
              <span style={{marginLeft:5,fontSize:10,color:T.muted}}>({counts[tab]??0})</span>
            </div>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div style={{ ...s.card, textAlign:'center', padding:'50px 20px', color:T.muted }}>
            <div style={{ fontSize:36, opacity:0.3, marginBottom:12 }}>◇</div>
            <p style={{ fontWeight:600 }}>No bookings in this category.</p>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            {filtered.map((b,i) => {
              const badge    = bookingBadge(b.status)
              const customer = b.customer?.users
              return (
                <div key={b.booking_id} style={{ ...s.card }}>
                  <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
                    <div style={{ flex:1, minWidth:240 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
                        <span style={{ fontSize:10, color:T.muted, fontFamily:'monospace' }}>#{String(i+1).padStart(3,'0')}</span>
                        <span style={s.badge(badge)}>{b.status==='in_progress'?'In Progress':b.status.charAt(0).toUpperCase()+b.status.slice(1)}</span>
                      </div>
                      <div style={{ fontSize:16, fontWeight:800, marginBottom:8, color:T.ink }}>{b.service?.service_name||'—'}</div>
                      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'6px 20px', fontSize:13, color:T.muted, fontWeight:600 }}>
                        <div><span style={{ color:T.muted, fontSize:9, textTransform:'uppercase', letterSpacing:1, fontWeight:800 }}>CUSTOMER</span><br/>{customer?`${customer.first_name} ${customer.last_name}`:'—'}</div>
                        <div><span style={{ color:T.muted, fontSize:9, textTransform:'uppercase', letterSpacing:1, fontWeight:800 }}>EMAIL</span><br/>{customer?.email||'—'}</div>
                        <div><span style={{ color:T.muted, fontSize:9, textTransform:'uppercase', letterSpacing:1, fontWeight:800 }}>SERVICE DATE</span><br/>{b.service_date}</div>
                        <div><span style={{ color:T.muted, fontSize:9, textTransform:'uppercase', letterSpacing:1, fontWeight:800 }}>BOOKED ON</span><br/>{b.booking_date}</div>
                        <div style={{ gridColumn:'1/-1' }}><span style={{ color:T.muted, fontSize:9, textTransform:'uppercase', letterSpacing:1, fontWeight:800 }}>LOCATION</span><br/>{b.location||'—'}</div>
                      </div>
                    </div>
                    <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:10, minWidth:160 }}>
                      <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:22, fontWeight:600, background:'linear-gradient(90deg,#6aaad0,#9b8ec4)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>Rs. {Number(b.service?.price||0).toLocaleString()}</div>
                      <div style={{ display:'flex', flexDirection:'column', gap:8, width:'100%' }}>
                        {b.status==='pending'     && <><button onClick={()=>handleAction(b.booking_id,'accepted')}   style={{...s.btn,padding:'8px 14px',fontSize:13}}>✅ Accept</button><button onClick={()=>handleAction(b.booking_id,'cancelled')} style={s.btnSm('#fff1f2','#be123c','#fda4af')}>✕ Reject</button></>}
                        {b.status==='accepted'    && <button onClick={()=>handleAction(b.booking_id,'in_progress')} style={{...s.btn,padding:'8px 14px',fontSize:13}}>🚀 Start Job</button>}
                        {b.status==='in_progress' && <button onClick={()=>handleAction(b.booking_id,'completed')}   style={{...s.btn,padding:'8px 14px',fontSize:13}}>🏁 Mark Completed</button>}
                        {['completed','cancelled'].includes(b.status) && <span style={{ fontSize:12, color:T.muted, fontWeight:600 }}>{b.status==='completed'?'✅ Job done':'✕ Rejected'}</span>}
                      </div>
                    </div>
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
