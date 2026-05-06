import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../supabaseClient'
import Sidebar, { PageLayout, StatGrid, useIsMobile, T, s, paymentBadge } from '../../components/Sidebar'

const NAV = [
  { label:'Dashboard', icon:'◉', path:'/admin/dashboard' },
  { label:'Users',     icon:'◈', path:'/admin/users' },
  { label:'Bookings',  icon:'◇', path:'/admin/bookings' },
  { label:'Services',  icon:'◎', path:'/admin/services' },
  { label:'Payments',  icon:'◷', path:'/admin/payments', active:true },
  { label:'Reviews',   icon:'♡', path:'/admin/reviews' },
]

export default function AdminPayments() {
  const [payments, setPayments] = useState([])
  const [loading, setLoading]   = useState(true)
  const [filter, setFilter]     = useState('all')
  const [search, setSearch]     = useState('')
  const [stats, setStats]       = useState({ total:0, completed:0, pending:0, revenue:0 })
  const [adminUser, setAdminUser] = useState(null)
  const navigate = useNavigate()

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    const { data, error } = await supabase.from('payment')
      .select('payment_id,amount,payment_method,payment_status,payment_date,transaction_id,booking(booking_id,service_date,service(service_name),customer(user_id,users(first_name,last_name,email))),bundle_offer(bundle_id,service_date,customer(user_id,users(first_name,last_name,email)))')
      .order('payment_date',{ascending:false})
    console.log('payments:', data, error)
    setPayments(data||[])
    const revenue = (data||[]).filter(p=>p.payment_status==='completed').reduce((sum,p)=>sum+Number(p.amount),0)
    setStats({ total:(data||[]).length, completed:(data||[]).filter(p=>p.payment_status==='completed').length, pending:(data||[]).filter(p=>p.payment_status==='pending').length, revenue })
    setLoading(false)
  }

  const updateStatus = async (paymentId, newStatus) => {
    const { error } = await supabase.from('payment').update({ payment_status:newStatus }).eq('payment_id', paymentId)
    if (error) { alert('Error: '+error.message); return }
    fetchData()
  }

  const counts = { all:payments.length, completed:payments.filter(p=>p.payment_status==='completed').length, pending:payments.filter(p=>p.payment_status==='pending').length, failed:payments.filter(p=>p.payment_status==='failed').length, refunded:payments.filter(p=>p.payment_status==='refunded').length }

  const filtered = payments
    .filter(p => filter==='all' ? true : p.payment_status===filter)
    .filter(p => {
      if (!search) return true
      const customer = p.booking?.customer?.users || p.bundle_offer?.customer?.users
      const name = customer ? `${customer.first_name} ${customer.last_name}`.toLowerCase() : ''
      const service = p.booking?.service?.service_name?.toLowerCase() || ''
      const txn = p.transaction_id?.toLowerCase() || ''
      return name.includes(search.toLowerCase()) || service.includes(search.toLowerCase()) || txn.includes(search.toLowerCase())
    })

  if (loading) return <div style={s.loading}>Loading…</div>

  return (
    <div style={s.page}>
      <Sidebar items={NAV} userName={`${adminUser?.first_name||""} ${adminUser?.last_name||""}`} userRole="Super Admin" />
      <PageLayout>
        <div style={{ marginBottom:22, paddingBottom:16, borderBottom:`2px solid ${T.mixBorder}` }}>
          <h1 style={s.h1}>Payment Management</h1><p style={s.sub}>Monitor all platform transactions</p>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:12, marginBottom:22 }}>
          {[{label:'Total Revenue',value:`Rs. ${stats.revenue.toLocaleString()}`,color:'#15803d'},{label:'Transactions',value:stats.total,color:T.ink},{label:'Completed',value:stats.completed,color:T.blue},{label:'Pending',value:stats.pending,color:T.terra}].map(st=>(
            <div key={st.label} style={s.statCard}><div style={s.statLabel}>{st.label}</div><div style={{...s.statNum,color:st.color}}>{st.value}</div></div>
          ))}
        </div>

        <div style={{...s.card,marginBottom:16,display:'flex',gap:10,alignItems:'center'}}>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍  Search by customer, service or transaction ID..." style={{...s.input,flex:1}} />
          <button onClick={()=>setSearch('')} style={s.btnGhost}>Clear</button>
        </div>

        <div style={s.filterBar}>
          {['all','completed','pending','failed','refunded'].map(tab=>(
            <div key={tab} onClick={()=>setFilter(tab)} style={s.filterTab(filter===tab)}>
              {tab.charAt(0).toUpperCase()+tab.slice(1)}
              <span style={{marginLeft:6,fontSize:10,color:T.muted}}>({counts[tab]})</span>
            </div>
          ))}
        </div>

        <div style={{ ...s.tableWrap }}>
          {filtered.length===0 ? (
            <div style={{textAlign:'center',padding:'50px 20px',color:T.muted}}>
              <div style={{fontSize:36,opacity:0.3,marginBottom:12}}>◷</div>
              <p style={{fontWeight:600}}>No payments found.</p>
            </div>
          ) : (
            <table style={{width:'100%',borderCollapse:'collapse',minWidth:600}}>
              <thead><tr style={s.tableHead}>{['Transaction ID','Customer','For','Type','Amount','Method','Date','Status','Actions'].map(h=><th key={h} style={s.th}>{h}</th>)}</tr></thead>
              <tbody>
                {filtered.map(p => {
                  const badge    = paymentBadge(p.payment_status)
                  const isBundle = !p.booking_id && !!p.bundle_offer
                  const customer = isBundle ? p.bundle_offer?.customer?.users : p.booking?.customer?.users
                  const forLabel = isBundle ? 'Bundle' : p.booking?.service?.service_name||'—'
                  return (
                    <tr key={p.payment_id} style={s.tr}>
                      <td style={{...s.td,fontSize:10,color:T.muted,fontFamily:'monospace'}}>{p.transaction_id||'—'}</td>
                      <td style={s.td}>
                        <div style={{fontWeight:700,color:T.ink}}>{customer?`${customer.first_name} ${customer.last_name}`:'—'}</div>
                        <div style={{fontSize:11,color:T.muted}}>{customer?.email||''}</div>
                      </td>
                      <td style={s.td}>{forLabel}</td>
                      <td style={s.td}><span style={s.badge(isBundle?{bg:T.purplePale,color:'#3a1e90',border:T.purpleMid}:{bg:T.bluePale,color:'#1a4870',border:T.blueLight})}>{isBundle?'Bundle':'Booking'}</span></td>
                      <td style={{...s.td,fontWeight:800,color:'#15803d'}}>Rs. {Number(p.amount).toLocaleString()}</td>
                      <td style={{...s.td,textTransform:'capitalize'}}>{p.payment_method||'—'}</td>
                      <td style={s.td}>{new Date(p.payment_date).toLocaleDateString()}</td>
                      <td style={s.td}><span style={s.badge(badge)}>{p.payment_status}</span></td>
                      <td style={s.td}>
                        <div style={{display:'flex',gap:6}}>
                          {p.payment_status==='pending'   && <button onClick={()=>updateStatus(p.payment_id,'completed')} style={s.btnSm('#f0fdf4','#15803d','#86efac')}>✅ Complete</button>}
                          {p.payment_status==='completed' && <button onClick={()=>updateStatus(p.payment_id,'refunded')}  style={s.btnSm(T.bluePale,'#1a4870',T.blueLight)}>↩ Refund</button>}
                          {p.payment_status==='failed'    && <button onClick={()=>updateStatus(p.payment_id,'pending')}   style={s.btnSm('#fff7ed','#c2410c','#fdba74')}>🔄 Retry</button>}
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
