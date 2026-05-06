import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../supabaseClient'
import Sidebar, { PageLayout, StatGrid, useIsMobile, T, s, paymentBadge } from '../../components/Sidebar'

const NAV = [
  { label:'Dashboard',      icon:'◉', path:'/customer/dashboard' },
  { label:'Browse Services',icon:'◈', path:'/customer/browse' },
  { label:'My Bookings',    icon:'◇', path:'/customer/bookings' },
  { label:'Bundle Offers',  icon:'◎', path:'/customer/bundles' },
  { label:'Payments',       icon:'◷', path:'/customer/payments', active:true },
  { label:'My Reviews',     icon:'♡', path:'/customer/reviews' },
]

export default function Payments() {
  const [payments, setPayments]         = useState([])
  const [unpaidBookings, setUnpaidBookings] = useState([])
  const [unpaidBundles, setUnpaidBundles]   = useState([])
  const [selectedItem, setSelectedItem] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('card')
  const [loading, setLoading]           = useState(true)
  const [paying, setPaying]             = useState(false)
  const [stats, setStats]               = useState({ totalPaid:0, pending:0, transactions:0 })
  const [user, setUser] = useState(null)
  const navigate = useNavigate()

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    const { data:{ user } } = await supabase.auth.getUser()
    if (!user) { navigate('/auth'); return }
    const { data: paymentData } = await supabase.from('payment').select('payment_id,amount,payment_method,payment_status,payment_date,transaction_id,booking(booking_id,service(service_name),service_date),bundle_offer(bundle_id,service_date)').order('payment_date',{ascending:false})
    setPayments(paymentData||[])
    const { data: bookingData } = await supabase.from('booking').select('booking_id,service(service_name,price),service_date,status').eq('customer_id',user.id).in('status',['accepted','completed'])
    const { data: bundleData }  = await supabase.from('bundle_offer').select('bundle_id,total_price,service_date,status').eq('customer_id',user.id).in('status',['accepted','completed'])
    const paidBookingIds = (paymentData||[]).filter(p=>p.payment_status==='completed').map(p=>p.booking?.booking_id).filter(Boolean)
    const paidBundleIds  = (paymentData||[]).filter(p=>p.payment_status==='completed').map(p=>p.bundle_offer?.bundle_id).filter(Boolean)
    setUnpaidBookings((bookingData||[]).filter(b=>!paidBookingIds.includes(b.booking_id)))
    setUnpaidBundles((bundleData||[]).filter(b=>!paidBundleIds.includes(b.bundle_id)))
    const totalPaid = (paymentData||[]).filter(p=>p.payment_status==='completed').reduce((sum,p)=>sum+Number(p.amount),0)
    setStats({ totalPaid, pending:(paymentData||[]).filter(p=>p.payment_status==='pending').length, transactions:(paymentData||[]).length })
    setLoading(false)
  }

  const getSelectedAmount = () => {
    if (!selectedItem) return 0
    if (selectedItem.startsWith('booking_')) return unpaidBookings.find(b=>b.booking_id===selectedItem.replace('booking_',''))?.service?.price||0
    if (selectedItem.startsWith('bundle_'))  return unpaidBundles.find(b=>b.bundle_id===selectedItem.replace('bundle_',''))?.total_price||0
    return 0
  }

  const handlePayment = async () => {
    if (!selectedItem) { alert('Please select a booking or bundle'); return }
    setPaying(true)
    const isBundle = selectedItem.startsWith('bundle_')
    const actualId = selectedItem.replace('booking_','').replace('bundle_','')
    const { error } = await supabase.from('payment').insert({ amount:getSelectedAmount(), payment_method:paymentMethod, payment_status:'completed', transaction_id:'TXN-'+Date.now(), payment_date:new Date().toISOString(), booking_id:isBundle?null:actualId, bundle_id:isBundle?actualId:null })
    if (error) { alert('Payment error: '+error.message); setPaying(false); return }
    alert('Payment successful! ✅')
    setSelectedItem('')
    fetchData(); setPaying(false)
  }

  const totalUnpaid = unpaidBookings.length + unpaidBundles.length

  if (loading) return <div style={s.loading}>Loading…</div>

  return (
    <div style={s.page}>
      <Sidebar items={NAV} userName={`${user?.first_name||''} ${user?.last_name||''}`} userRole="Customer" />
      <PageLayout>
        <div style={{ marginBottom:22, paddingBottom:16, borderBottom:`2px solid ${T.mixBorder}` }}>
          <h1 style={s.h1}>Payments</h1><p style={s.sub}>View all transactions and make payments</p>
        </div>

        <div style={{ ...s.statGrid, gridTemplateColumns:'repeat(3,1fr)' }}>
          {[{label:'Total Paid',value:`Rs. ${stats.totalPaid.toLocaleString()}`,color:'#15803d'},{label:'Pending',value:stats.pending,color:T.terra},{label:'Transactions',value:stats.transactions,color:T.ink}].map(st=>(
            <div key={st.label} style={s.statCard}><div style={s.statLabel}>{st.label}</div><div style={{...s.statNum,color:st.color}}>{st.value}</div></div>
          ))}
        </div>

        {totalUnpaid > 0 && (
          <div style={{ ...s.card, marginBottom:22 }}>
            <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:18, fontWeight:600, color:T.ink, marginBottom:16 }}>Make a Payment</div>
            <div style={{ background:T.bluePale, border:`2px solid ${T.blueLight}`, borderRadius:8, padding:'10px 14px', fontSize:12, color:'#1a4870', marginBottom:16, fontWeight:700 }}>
              💳 {totalUnpaid} item(s) awaiting payment{unpaidBookings.length>0?` · ${unpaidBookings.length} booking(s)`:''}{unpaidBundles.length>0?` · ${unpaidBundles.length} bundle(s)`:''}
            </div>
            <div style={{ marginBottom:14 }}>
              <label style={{ fontSize:9, fontWeight:800, color:T.muted, textTransform:'uppercase', letterSpacing:2, display:'block', marginBottom:6 }}>Select Booking or Bundle</label>
              <select value={selectedItem} onChange={e=>setSelectedItem(e.target.value)} style={{ ...s.select, width:'100%', maxWidth:500 }}>
                <option value="">— Choose a booking or bundle —</option>
                {unpaidBookings.length>0 && <optgroup label="📅 Bookings">{unpaidBookings.map(b=><option key={b.booking_id} value={`booking_${b.booking_id}`}>{b.service?.service_name} — {b.service_date} — Rs. {Number(b.service?.price||0).toLocaleString()}</option>)}</optgroup>}
                {unpaidBundles.length>0  && <optgroup label="📦 Bundles">{unpaidBundles.map(b=><option key={b.bundle_id} value={`bundle_${b.bundle_id}`}>Bundle — {b.service_date} — Rs. {Number(b.total_price||0).toLocaleString()}</option>)}</optgroup>}
              </select>
            </div>
            <div style={{ marginBottom:18 }}>
              <label style={{ fontSize:9, fontWeight:800, color:T.muted, textTransform:'uppercase', letterSpacing:2, display:'block', marginBottom:10 }}>Payment Method</label>
              <div style={{ display:'flex', gap:10 }}>
                {[{value:'card',label:'💳 Card'},{value:'bank',label:'🏦 Bank Transfer'},{value:'cash',label:'💵 Cash on Service'}].map(m=>(
                  <div key={m.value} onClick={()=>setPaymentMethod(m.value)}
                    style={{ border:paymentMethod===m.value?`2px solid ${T.blue}`:`2px solid ${T.mixBorder}`, borderRadius:10, padding:'12px 18px', cursor:'pointer', background:paymentMethod===m.value?T.bluePale:T.mixCard, fontSize:13, fontWeight:700, color:T.ink, transition:'all 0.15s' }}>
                    {m.label}
                  </div>
                ))}
              </div>
            </div>
            {selectedItem && (
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:15, fontWeight:800, marginBottom:14, padding:'12px 0', borderTop:`2px solid ${T.mixBorder}`, color:T.ink }}>
                <span>Amount to Pay</span>
                <span style={{ background:'linear-gradient(90deg,#6aaad0,#9b8ec4)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>Rs. {Number(getSelectedAmount()).toLocaleString()}</span>
              </div>
            )}
            <button onClick={handlePayment} disabled={paying} style={{ ...s.btn, opacity:paying?0.6:1 }}>{paying?'Processing…':'Pay Now →'}</button>
          </div>
        )}

        <div style={s.tableWrap}>
          <div style={{ padding:'14px 18px', borderBottom:`2px solid ${T.mixBorder}`, fontFamily:"'Cormorant Garamond',serif", fontSize:18, fontWeight:600, color:T.ink, background:T.mixPale }}>Payment History</div>
          {payments.length === 0 ? (
            <div style={{ textAlign:'center', padding:'40px 20px', color:T.muted }}><div style={{ fontSize:36, opacity:0.3, marginBottom:12 }}>◷</div><p style={{ fontWeight:600 }}>No payment history yet.</p></div>
          ) : (
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead><tr style={s.tableHead}>{['Transaction ID','For','Amount','Method','Date','Status'].map(h=><th key={h} style={s.th}>{h}</th>)}</tr></thead>
              <tbody>
                {payments.map(p => {
                  const badge = paymentBadge(p.payment_status)
                  const forLabel = p.booking?.service?.service_name ? `📅 ${p.booking.service.service_name}` : p.bundle_offer?.bundle_id ? '📦 Bundle' : '—'
                  return (
                    <tr key={p.payment_id} style={s.tr}>
                      <td style={{...s.td,fontSize:10,color:T.muted,fontFamily:'monospace'}}>{p.transaction_id||'—'}</td>
                      <td style={s.td}>{forLabel}</td>
                      <td style={{...s.td,fontWeight:800,color:'#15803d'}}>Rs. {Number(p.amount).toLocaleString()}</td>
                      <td style={{...s.td,textTransform:'capitalize'}}>{p.payment_method||'—'}</td>
                      <td style={s.td}>{new Date(p.payment_date).toLocaleDateString()}</td>
                      <td style={s.td}><span style={s.badge(badge)}>{p.payment_status}</span></td>
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
