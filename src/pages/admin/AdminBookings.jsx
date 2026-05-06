import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../supabaseClient'
import Sidebar, { PageLayout, StatGrid, useIsMobile, T, s, bookingBadge } from '../../components/Sidebar'

const NAV = [
  { label:'Dashboard', icon:'◉', path:'/admin/dashboard' },
  { label:'Users',     icon:'◈', path:'/admin/users' },
  { label:'Bookings',  icon:'◇', path:'/admin/bookings', active:true },
  { label:'Services',  icon:'◎', path:'/admin/services' },
  { label:'Payments',  icon:'◷', path:'/admin/payments' },
  { label:'Reviews',   icon:'♡', path:'/admin/reviews' },
]

export default function AdminBookings() {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading]   = useState(true)
  const [filter, setFilter]     = useState('all')
  const [search, setSearch]     = useState('')
  const [stats, setStats]       = useState({ total:0, pending:0, completed:0, cancelled:0 })
  const [adminUser, setAdminUser] = useState(null)
  const navigate = useNavigate()

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    const { data, error } = await supabase.from('booking')
      .select('booking_id,status,booking_date,service_date,location,booking_time,service(service_name,price),customer(user_id,users(first_name,last_name,email)),service_provider(user_id,users(first_name,last_name))')
      .order('booking_date',{ascending:false})
    console.log('admin bookings:', data, error)
    setBookings(data||[])
    setStats({ total:(data||[]).length, pending:(data||[]).filter(b=>b.status==='pending').length, completed:(data||[]).filter(b=>b.status==='completed').length, cancelled:(data||[]).filter(b=>b.status==='cancelled').length })
    setLoading(false)
  }

  const updateStatus = async (bookingId, newStatus) => {
    const { error } = await supabase.from('booking').update({ status:newStatus }).eq('booking_id', bookingId)
    if (error) { alert('Error: '+error.message); return }
    fetchData()
  }

  const counts = { all:bookings.length, pending:bookings.filter(b=>b.status==='pending').length, accepted:bookings.filter(b=>b.status==='accepted').length, in_progress:bookings.filter(b=>b.status==='in_progress').length, completed:bookings.filter(b=>b.status==='completed').length, cancelled:bookings.filter(b=>b.status==='cancelled').length }

  const filtered = bookings
    .filter(b => filter==='all' ? true : b.status===filter)
    .filter(b => {
      if (!search) return true
      const cName = b.customer?.users ? `${b.customer.users.first_name} ${b.customer.users.last_name}`.toLowerCase() : ''
      const sName = b.service?.service_name?.toLowerCase() || ''
      return cName.includes(search.toLowerCase()) || sName.includes(search.toLowerCase())
    })

  if (loading) return <div style={s.loading}>Loading…</div>

  return (
    <div style={s.page}>
      <Sidebar items={NAV} userName={`${adminUser?.first_name||""} ${adminUser?.last_name||""}`} userRole="Super Admin" />
      <PageLayout>
        <div style={{ marginBottom:22, paddingBottom:16, borderBottom:`2px solid ${T.mixBorder}` }}>
          <h1 style={s.h1}>Booking Management</h1><p style={s.sub}>Monitor and manage all platform bookings</p>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:12, marginBottom:22 }}>
          {[{label:'Total',value:stats.total,color:T.ink},{label:'Pending',value:stats.pending,color:T.terra},{label:'Completed',value:stats.completed,color:'#15803d'},{label:'Cancelled',value:stats.cancelled,color:'#be123c'}].map(st=>(
            <div key={st.label} style={s.statCard}><div style={s.statLabel}>{st.label}</div><div style={{...s.statNum,color:st.color}}>{st.value}</div></div>
          ))}
        </div>

        <div style={{...s.card,marginBottom:16,display:'flex',gap:10,alignItems:'center'}}>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍  Search by customer or service..." style={{...s.input,flex:1}} />
          <button onClick={()=>setSearch('')} style={s.btnGhost}>Clear</button>
        </div>

        <div style={s.filterBar}>
          {['all','pending','accepted','in_progress','completed','cancelled'].map(tab=>(
            <div key={tab} onClick={()=>setFilter(tab)} style={s.filterTab(filter===tab)}>
              {tab==='all'?'All':tab==='in_progress'?'In Progress':tab.charAt(0).toUpperCase()+tab.slice(1)}
              <span style={{marginLeft:6,fontSize:10,color:T.muted}}>({counts[tab]})</span>
            </div>
          ))}
        </div>

        <div style={{ ...s.tableWrap }}>
          {filtered.length===0 ? (
            <div style={{textAlign:'center',padding:'50px 20px',color:T.muted}}>
              <div style={{fontSize:36,opacity:0.3,marginBottom:12}}>◇</div>
              <p style={{fontWeight:600}}>No bookings found.</p>
            </div>
          ) : (
            <table style={{width:'100%',borderCollapse:'collapse',minWidth:600}}>
              <thead><tr style={s.tableHead}>{['#','Customer','Service','Provider','Service Date','Location','Price','Status','Actions'].map(h=><th key={h} style={s.th}>{h}</th>)}</tr></thead>
              <tbody>
                {filtered.map((b,i) => {
                  const badge = bookingBadge(b.status)
                  const cName = b.customer?.users ? `${b.customer.users.first_name} ${b.customer.users.last_name}` : '—'
                  const pName = b.service_provider?.users ? `${b.service_provider.users.first_name} ${b.service_provider.users.last_name}` : '—'
                  return (
                    <tr key={b.booking_id} style={s.tr}>
                      <td style={{...s.td,fontSize:10,color:T.muted}}>#{String(i+1).padStart(3,'0')}</td>
                      <td style={s.td}>
                        <div style={{fontWeight:700,color:T.ink}}>{cName}</div>
                        <div style={{fontSize:11,color:T.muted}}>{b.customer?.users?.email||''}</div>
                      </td>
                      <td style={{...s.td,fontWeight:700}}>{b.service?.service_name||'—'}</td>
                      <td style={s.td}>{pName}</td>
                      <td style={s.td}>{b.service_date}</td>
                      <td style={s.td}>{b.location||'—'}</td>
                      <td style={{...s.td,fontWeight:800,color:T.ink}}>Rs. {Number(b.service?.price||0).toLocaleString()}</td>
                      <td style={s.td}><span style={s.badge(badge)}>{b.status==='in_progress'?'In Progress':b.status.charAt(0).toUpperCase()+b.status.slice(1)}</span></td>
                      <td style={s.td}>
                        <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                          {b.status==='pending'     && <button onClick={()=>updateStatus(b.booking_id,'accepted')}   style={s.btnSm('#f0fdf4','#15803d','#86efac')}>Accept</button>}
                          {b.status==='accepted'    && <button onClick={()=>updateStatus(b.booking_id,'in_progress')} style={s.btnSm(T.purplePale,'#7c3aed',T.purpleMid)}>Start</button>}
                          {b.status==='in_progress' && <button onClick={()=>updateStatus(b.booking_id,'completed')}  style={s.btnSm('#f0fdf4','#15803d','#86efac')}>Complete</button>}
                          {!['cancelled','completed'].includes(b.status) && <button onClick={()=>updateStatus(b.booking_id,'cancelled')} style={s.btnSm('#fff1f2','#be123c','#fda4af')}>Cancel</button>}
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
