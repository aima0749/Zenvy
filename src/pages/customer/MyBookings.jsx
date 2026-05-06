import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../supabaseClient'
import Sidebar, { PageLayout, StatGrid, useIsMobile, T, s, bookingBadge } from '../../components/Sidebar'

const NAV = [
  { label:'Dashboard',      icon:'◉', path:'/customer/dashboard' },
  { label:'Browse Services',icon:'◈', path:'/customer/browse' },
  { label:'My Bookings',    icon:'◇', path:'/customer/bookings', active:true },
  { label:'Bundle Offers',  icon:'◎', path:'/customer/bundles' },
  { label:'Payments',       icon:'◷', path:'/customer/payments' },
  { label:'My Reviews',     icon:'♡', path:'/customer/reviews' },
]

export default function MyBookings() {
  const [user, setUser]         = useState(null)
  const [bookings, setBookings] = useState([])
  const [filter, setFilter]     = useState('all')
  const [loading, setLoading]   = useState(true)
  const navigate = useNavigate()

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    const { data:{ user: authUser } } = await supabase.auth.getUser()
    if (!authUser) { navigate('/auth'); return }
    const { data: userData } = await supabase.from('users').select('first_name,last_name').eq('user_id', authUser.id).single()
    setUser(userData)
    const { data, error } = await supabase.from('booking')
      .select('booking_id,status,booking_date,service_date,location,booking_time,service(service_name,price),service_provider(user_id,users(first_name,last_name))')
      .eq('customer_id', authUser.id).order('booking_date',{ascending:false})
    console.log('bookings:', data, error)
    setBookings(data||[]); setLoading(false)
  }

  const cancelBooking = async (bookingId) => {
    if (!window.confirm('Cancel this booking?')) return
    const { error } = await supabase.from('booking').update({ status:'cancelled' }).eq('booking_id', bookingId)
    if (error) { alert('Error: '+error.message); return }
    fetchData()
  }

  const counts = { all:bookings.length, pending:bookings.filter(b=>b.status==='pending').length, accepted:bookings.filter(b=>b.status==='accepted').length, in_progress:bookings.filter(b=>b.status==='in_progress').length, completed:bookings.filter(b=>b.status==='completed').length, cancelled:bookings.filter(b=>b.status==='cancelled').length }
  const filtered = filter === 'all' ? bookings : bookings.filter(b => b.status === filter)

  if (loading) return <div style={s.loading}>Loading…</div>

  return (
    <div style={s.page}>
      <Sidebar items={NAV} userName={`${user?.first_name||''} ${user?.last_name||''}`} userRole="Customer" />
      <PageLayout>
        <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', marginBottom:22, paddingBottom:16, borderBottom:`2px solid ${T.mixBorder}` }}>
          <div><h1 style={s.h1}>My Bookings</h1><p style={s.sub}>Track and manage all your service bookings</p></div>
          <button onClick={() => navigate('/customer/browse')} style={s.btn}>+ New Booking</button>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:12, marginBottom:22 }}>
          {[{label:'Total',value:counts.all,color:T.ink},{label:'Pending',value:counts.pending,color:T.terra},{label:'Active',value:counts.accepted+counts.in_progress,color:T.blue},{label:'Completed',value:counts.completed,color:'#15803d'}].map(st=>(
            <div key={st.label} style={s.statCard}><div style={s.statLabel}>{st.label}</div><div style={{...s.statNum,color:st.color}}>{st.value}</div></div>
          ))}
        </div>
        <div style={s.filterBar}>
          {['all','pending','accepted','in_progress','completed','cancelled'].map(tab=>(
            <div key={tab} onClick={()=>setFilter(tab)} style={s.filterTab(filter===tab)}>
              {tab==='all'?'All':tab==='in_progress'?'In Progress':tab.charAt(0).toUpperCase()+tab.slice(1)}
              <span style={{marginLeft:5,fontSize:10,color:T.muted}}>({counts[tab]})</span>
            </div>
          ))}
        </div>
        <div style={s.tableWrap}>
          {filtered.length === 0 ? (
            <div style={{textAlign:'center',padding:'50px 20px',color:T.muted}}>
              <div style={{fontSize:36,opacity:0.3,marginBottom:12}}>◇</div>
              <p style={{fontSize:13,fontWeight:600}}>No bookings found.</p>
              <button onClick={()=>navigate('/customer/browse')} style={{...s.btn,marginTop:14}}>Browse Services</button>
            </div>
          ) : (
            <table style={{width:'100%',borderCollapse:'collapse',minWidth:500}}>
              <thead><tr style={s.tableHead}>{['#','Service','Provider','Booked On','Service Date','Location','Price','Status','Actions'].map(h=><th key={h} style={s.th}>{h}</th>)}</tr></thead>
              <tbody>
                {filtered.map((b,i) => {
                  const badge = bookingBadge(b.status)
                  const pName = b.service_provider?.users ? `${b.service_provider.users.first_name} ${b.service_provider.users.last_name}` : '—'
                  return (
                    <tr key={b.booking_id} style={s.tr}>
                      <td style={{...s.td,fontSize:10,color:T.muted}}>#{String(i+1).padStart(3,'0')}</td>
                      <td style={{...s.td,fontWeight:700}}>{b.service?.service_name||'—'}</td>
                      <td style={s.td}>{pName}</td>
                      <td style={s.td}>{b.booking_date}</td>
                      <td style={s.td}>{b.service_date}</td>
                      <td style={s.td}>{b.location||'—'}</td>
                      <td style={{...s.td,fontWeight:700}}>Rs. {Number(b.service?.price||0).toLocaleString()}</td>
                      <td style={s.td}><span style={s.badge(badge)}>{b.status==='in_progress'?'In Progress':b.status.charAt(0).toUpperCase()+b.status.slice(1)}</span></td>
                      <td style={s.td}>
                        <div style={{display:'flex',gap:6}}>
                          {b.status==='completed' && <button onClick={()=>navigate('/customer/reviews')} style={s.btnSm('#f0fdf4','#15803d','#86efac')}>Review</button>}
                          {['pending','accepted'].includes(b.status) && <button onClick={()=>cancelBooking(b.booking_id)} style={s.btnSm('#fff1f2','#be123c','#fda4af')}>Cancel</button>}
                          {b.status==='cancelled' && <button onClick={()=>navigate('/customer/browse')} style={s.btnGhost}>Rebook</button>}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </PageLayout>
    </div>
  )
}
