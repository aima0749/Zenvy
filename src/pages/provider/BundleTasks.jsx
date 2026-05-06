import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../supabaseClient'
import Sidebar, { PageLayout, StatGrid, useIsMobile, T, s, bookingBadge } from '../../components/Sidebar'

const NAV = [
  { label:'Dashboard',        icon:'◉', path:'/provider/dashboard' },
  { label:'My Services',      icon:'◈', path:'/provider/services' },
  { label:'Availability',     icon:'◷', path:'/provider/availability' },
  { label:'Assigned Bookings',icon:'◇', path:'/provider/bookings' },
  { label:'Bundle Tasks',     icon:'◎', path:'/provider/bundles', active:true },
  { label:'My Reviews',       icon:'♡', path:'/provider/reviews' },
]

export default function BundleTasks() {
  const [bundles, setBundles] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter]   = useState('all')
  const [user, setUser] = useState(null)
  const navigate = useNavigate()

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    const { data:{ user } } = await supabase.auth.getUser()
    if (!user) { navigate('/auth'); return }
    const { data: userData } = await supabase.from('users').select('first_name,last_name').eq('user_id', user.id).single()
    setUser(userData)
    const { data, error } = await supabase.from('bundle_service')
      .select('bundle_id,service_id,service(service_name,price),bundle_offer(bundle_id,status,total_price,booking_date,service_date,location,customer(user_id,users(first_name,last_name,email)))')
      .eq('provider_id', user.id)
    console.log('bundle tasks:', data, error)
    setBundles(data||[]); setLoading(false)
  }

  const updateBundleStatus = async (bundleId, newStatus) => {
    const msgs = { accepted:'Accept this bundle?', cancelled:'Reject this bundle?', in_progress:'Mark as In Progress?', completed:'Mark as Completed?' }
    if (!window.confirm(msgs[newStatus])) return
    const { error } = await supabase.from('bundle_offer').update({ status:newStatus }).eq('bundle_id', bundleId)
    if (error) { alert('Error: '+error.message); return }
    fetchData()
  }

  const grouped = bundles.reduce((acc, item) => {
    const bid = item.bundle_id
    if (!acc[bid]) acc[bid] = { bundle:item.bundle_offer, services:[] }
    acc[bid].services.push(item.service)
    return acc
  }, {})
  const bundleList = Object.values(grouped)
  const filtered   = filter==='all' ? bundleList : bundleList.filter(b=>b.bundle?.status===filter)
  const counts     = { all:bundleList.length, pending:bundleList.filter(b=>b.bundle?.status==='pending').length, accepted:bundleList.filter(b=>b.bundle?.status==='accepted').length, in_progress:bundleList.filter(b=>b.bundle?.status==='in_progress').length, completed:bundleList.filter(b=>b.bundle?.status==='completed').length, cancelled:bundleList.filter(b=>b.bundle?.status==='cancelled').length }

  if (loading) return <div style={s.loading}>Loading…</div>

  return (
    <div style={s.page}>
      <Sidebar items={NAV} userName={`${user?.first_name||""} ${user?.last_name||""}`} userRole="Service Provider" />
      <PageLayout>
        <div style={{ marginBottom:22, paddingBottom:16, borderBottom:`2px solid ${T.mixBorder}` }}>
          <h1 style={s.h1}>Bundle Tasks</h1><p style={s.sub}>Bundle offers assigned to you by customers</p>
        </div>

        <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:12,marginBottom:22}}>
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

        {filtered.length===0 ? (
          <div style={{...s.card,textAlign:'center',padding:'50px 20px',color:T.muted}}>
            <div style={{fontSize:36,opacity:0.3,marginBottom:12}}>◎</div>
            <p style={{fontWeight:600}}>No bundle tasks assigned yet.</p>
          </div>
        ) : (
          <div style={{display:'flex',flexDirection:'column',gap:14}}>
            {filtered.map(({bundle,services},i) => {
              if (!bundle) return null
              const badge    = bookingBadge(bundle.status)
              const customer = bundle.customer?.users
              return (
                <div key={bundle.bundle_id} style={s.card}>
                  <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',flexWrap:'wrap',gap:12}}>
                    <div style={{flex:1,minWidth:260}}>
                      <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:12}}>
                        <span style={{fontSize:10,color:T.muted,fontFamily:'monospace'}}>BUNDLE #{String(i+1).padStart(3,'0')}</span>
                        <span style={s.badge(badge)}>{bundle.status==='in_progress'?'In Progress':bundle.status?.charAt(0).toUpperCase()+bundle.status?.slice(1)}</span>
                        <span style={s.badge({bg:T.bluePale,color:'#1a4870',border:T.blueLight})}>{services.length} service{services.length!==1?'s':''}</span>
                      </div>
                      <div style={{marginBottom:14}}>
                        <div style={{fontSize:9,color:T.muted,textTransform:'uppercase',letterSpacing:2,fontWeight:800,marginBottom:8}}>Services in this bundle</div>
                        <div style={{display:'flex',flexWrap:'wrap',gap:8}}>
                          {services.map((svc,si)=>(
                            <span key={si} style={{background:T.mixPale,border:`1.5px solid ${T.mixBorder}`,borderRadius:6,padding:'5px 12px',fontSize:12,color:T.ink,fontWeight:700}}>◈ {svc?.service_name||'—'}</span>
                          ))}
                        </div>
                      </div>
                      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'6px 20px',fontSize:13,color:T.muted,fontWeight:600}}>
                        <div><span style={{color:T.muted,fontSize:9,textTransform:'uppercase',letterSpacing:1,fontWeight:800}}>CUSTOMER</span><br/>{customer?`${customer.first_name} ${customer.last_name}`:'—'}</div>
                        <div><span style={{color:T.muted,fontSize:9,textTransform:'uppercase',letterSpacing:1,fontWeight:800}}>EMAIL</span><br/>{customer?.email||'—'}</div>
                        <div><span style={{color:T.muted,fontSize:9,textTransform:'uppercase',letterSpacing:1,fontWeight:800}}>SERVICE DATE</span><br/>{bundle.service_date}</div>
                        <div><span style={{color:T.muted,fontSize:9,textTransform:'uppercase',letterSpacing:1,fontWeight:800}}>BOOKED ON</span><br/>{bundle.booking_date}</div>
                        <div style={{gridColumn:'1/-1'}}><span style={{color:T.muted,fontSize:9,textTransform:'uppercase',letterSpacing:1,fontWeight:800}}>LOCATION</span><br/>{bundle.location||'—'}</div>
                      </div>
                    </div>
                    <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:10,minWidth:180}}>
                      <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:22,fontWeight:600,background:'linear-gradient(90deg,#6aaad0,#9b8ec4)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>Rs. {Number(bundle.total_price||0).toLocaleString()}</div>
                      <div style={{display:'flex',flexDirection:'column',gap:8,width:'100%'}}>
                        {bundle.status==='pending'     && <><button onClick={()=>updateBundleStatus(bundle.bundle_id,'accepted')}   style={{...s.btn,padding:'8px 14px',fontSize:13}}>✅ Accept Bundle</button><button onClick={()=>updateBundleStatus(bundle.bundle_id,'cancelled')} style={s.btnSm('#fff1f2','#be123c','#fda4af')}>✕ Reject</button></>}
                        {bundle.status==='accepted'    && <button onClick={()=>updateBundleStatus(bundle.bundle_id,'in_progress')} style={{...s.btn,padding:'8px 14px',fontSize:13}}>🚀 Start Bundle</button>}
                        {bundle.status==='in_progress' && <button onClick={()=>updateBundleStatus(bundle.bundle_id,'completed')}   style={{...s.btn,padding:'8px 14px',fontSize:13}}>🏁 Mark Completed</button>}
                        {['completed','cancelled'].includes(bundle.status) && <span style={{fontSize:12,color:T.muted,fontWeight:600}}>{bundle.status==='completed'?'✅ All done':'✕ Rejected'}</span>}
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
