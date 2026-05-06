import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../supabaseClient'
import Sidebar, { PageLayout, StatGrid, useIsMobile, T, s, bookingBadge } from '../../components/Sidebar'

const NAV = [
  { label:'Dashboard',      icon:'◉', path:'/customer/dashboard' },
  { label:'Browse Services',icon:'◈', path:'/customer/browse' },
  { label:'My Bookings',    icon:'◇', path:'/customer/bookings' },
  { label:'Bundle Offers',  icon:'◎', path:'/customer/bundles', active:true },
  { label:'Payments',       icon:'◷', path:'/customer/payments' },
  { label:'My Reviews',     icon:'♡', path:'/customer/reviews' },
]

export default function BundleOffers() {
  const [bundles, setBundles]       = useState([])
  const [services, setServices]     = useState([])
  const [providers, setProviders]   = useState([])
  const [loading, setLoading]       = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm]             = useState({ service_date:'', location:'', items:[] })
  const [saving, setSaving]         = useState(false)
  const [currentUser, setCurrentUser] = useState(null)
  const [user, setUser] = useState(null)
  const navigate = useNavigate()

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    const { data:{ user } } = await supabase.auth.getUser()
    if (!user) { navigate('/auth'); return }
    setCurrentUser(user)

    const { data: bundleData, error } = await supabase.from('bundle_offer')
      .select('bundle_id,status,total_price,booking_date,service_date,location,bundle_service(service_id,provider_id,service(service_name,price),service_provider(user_id,users(first_name,last_name)))')
      .eq('customer_id', user.id).order('booking_date',{ascending:false})
    console.log('bundles:', bundleData, error)
    setBundles(bundleData||[])

    const { data: svcData } = await supabase.from('service').select('service_id,service_name,price,category(category_name)')
    setServices(svcData||[])

    const { data: provData } = await supabase.from('service_provider')
      .select('user_id,experience_years,average_rating,availability_status,users(first_name,last_name)')
      .eq('availability_status', true)
    setProviders(provData||[])

    setLoading(false)
  }

  const addItem = () => setForm({...form, items:[...form.items,{service_id:'',provider_id:''}]})
  const removeItem = (idx) => setForm({...form, items:form.items.filter((_,i)=>i!==idx)})
  const updateItem = (idx, field, val) => {
    const items = [...form.items]
    items[idx] = {...items[idx],[field]:val}
    setForm({...form,items})
  }

  const createBundle = async () => {
    if (!form.service_date||form.items.length===0) { alert('Please fill all fields and add at least one service'); return }
    if (form.items.some(it=>!it.service_id||!it.provider_id)) { alert('Please select a service and provider for each item'); return }
    setSaving(true)
    const total_price = form.items.reduce((sum,it)=>{
      const svc = services.find(sv=>sv.service_id===it.service_id)
      return sum + Number(svc?.price||0)
    },0)

    const { data: bundleData, error: bundleErr } = await supabase.from('bundle_offer').insert({
      customer_id: currentUser.id, status:'pending', total_price, booking_date:new Date().toISOString().split('T')[0], service_date:form.service_date, location:form.location
    }).select().single()
    if (bundleErr) { alert('Error: '+bundleErr.message); setSaving(false); return }

    const bundleServices = form.items.map(it=>({ bundle_id:bundleData.bundle_id, service_id:it.service_id, provider_id:it.provider_id }))
    const { error: itemsErr } = await supabase.from('bundle_service').insert(bundleServices)
    if (itemsErr) { alert('Error adding services: '+itemsErr.message); setSaving(false); return }

    setForm({ service_date:'', location:'', items:[] })
    setShowCreate(false); fetchData(); setSaving(false)
    alert('Bundle created successfully! ✅')
  }

  const cancelBundle = async (bundleId) => {
    if (!window.confirm('Cancel this bundle?')) return
    await supabase.from('bundle_offer').update({ status:'cancelled' }).eq('bundle_id', bundleId)
    fetchData()
  }

  if (loading) return <div style={s.loading}>Loading…</div>

  return (
    <div style={s.page}>
      <Sidebar items={NAV} userName={`${user?.first_name||''} ${user?.last_name||''}`} userRole="Customer" />
      <PageLayout>
        <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', marginBottom:22, paddingBottom:16, borderBottom:`2px solid ${T.mixBorder}` }}>
          <div><h1 style={s.h1}>Bundle Offers</h1><p style={s.sub}>Book multiple services together at once</p></div>
          <button onClick={()=>setShowCreate(true)} style={s.btn}>+ Create Bundle</button>
        </div>

        <div style={{...s.statGrid,gridTemplateColumns:'repeat(3,1fr)'}}>
          {[{label:'Total Bundles',value:bundles.length,color:T.ink},{label:'Active',value:bundles.filter(b=>['pending','accepted','in_progress'].includes(b.status)).length,color:T.blue},{label:'Completed',value:bundles.filter(b=>b.status==='completed').length,color:'#15803d'}].map(st=>(
            <div key={st.label} style={s.statCard}><div style={s.statLabel}>{st.label}</div><div style={{...s.statNum,color:st.color}}>{st.value}</div></div>
          ))}
        </div>

        {bundles.length===0 ? (
          <div style={{...s.card,textAlign:'center',padding:'50px 20px',color:T.muted}}>
            <div style={{fontSize:36,opacity:0.3,marginBottom:12}}>◎</div>
            <p style={{fontWeight:600}}>No bundle offers yet. Create one to book multiple services!</p>
            <button onClick={()=>setShowCreate(true)} style={{...s.btn,marginTop:14}}>Create Bundle</button>
          </div>
        ) : (
          <div style={{display:'flex',flexDirection:'column',gap:14}}>
            {bundles.map((bundle,i) => {
              const badge = bookingBadge(bundle.status)
              return (
                <div key={bundle.bundle_id} style={s.card}>
                  <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',flexWrap:'wrap',gap:12}}>
                    <div style={{flex:1,minWidth:260}}>
                      <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:10}}>
                        <span style={{fontSize:10,color:T.muted,fontFamily:'monospace'}}>BUNDLE #{String(i+1).padStart(3,'0')}</span>
                        <span style={s.badge(badge)}>{bundle.status==='in_progress'?'In Progress':bundle.status?.charAt(0).toUpperCase()+bundle.status?.slice(1)}</span>
                      </div>
                      <div style={{display:'flex',flexWrap:'wrap',gap:8,marginBottom:12}}>
                        {(bundle.bundle_service||[]).map((item,si)=>(
                          <span key={si} style={{background:T.mixPale,border:`1.5px solid ${T.mixBorder}`,borderRadius:6,padding:'5px 12px',fontSize:12,color:T.ink,fontWeight:700}}>
                            ◎ {item.service?.service_name||'—'}
                            <span style={{color:T.muted,fontWeight:600}}> · {item.service_provider?.users?.first_name} {item.service_provider?.users?.last_name}</span>
                          </span>
                        ))}
                      </div>
                      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'6px 20px',fontSize:13,color:T.muted,fontWeight:600}}>
                        <div><span style={{color:T.muted,fontSize:9,textTransform:'uppercase',letterSpacing:1,fontWeight:800}}>SERVICE DATE</span><br/>{bundle.service_date}</div>
                        <div><span style={{color:T.muted,fontSize:9,textTransform:'uppercase',letterSpacing:1,fontWeight:800}}>BOOKED ON</span><br/>{bundle.booking_date}</div>
                        <div style={{gridColumn:'1/-1'}}><span style={{color:T.muted,fontSize:9,textTransform:'uppercase',letterSpacing:1,fontWeight:800}}>LOCATION</span><br/>{bundle.location||'—'}</div>
                      </div>
                    </div>
                    <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:10}}>
                      <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:22,fontWeight:600,background:'linear-gradient(90deg,#6aaad0,#9b8ec4)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>Rs. {Number(bundle.total_price||0).toLocaleString()}</div>
                      {['pending','accepted'].includes(bundle.status) && (
                        <button onClick={()=>cancelBundle(bundle.bundle_id)} style={s.btnSm('#fff1f2','#be123c','#fda4af')}>Cancel Bundle</button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </PageLayout>

      {showCreate && (
        <div style={s.modal} onClick={e=>{if(e.target===e.currentTarget)setShowCreate(false)}}>
          <div style={{...s.modalCard,width:560,maxWidth:'95vw',maxHeight:'85vh',overflow:'auto'}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20}}>
              <h3 style={{fontSize:18,fontWeight:800,margin:0,color:T.ink,fontFamily:"'Cormorant Garamond',serif"}}>Create Bundle</h3>
              <button onClick={()=>setShowCreate(false)} style={{background:'none',border:'none',fontSize:20,cursor:'pointer',color:T.muted}}>✕</button>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:14}}>
              <div>
                <label style={{fontSize:9,fontWeight:800,color:T.muted,textTransform:'uppercase',letterSpacing:2,display:'block',marginBottom:6}}>Service Date</label>
                <input type="date" value={form.service_date} onChange={e=>setForm({...form,service_date:e.target.value})} style={{...s.input,width:'100%'}} />
              </div>
              <div>
                <label style={{fontSize:9,fontWeight:800,color:T.muted,textTransform:'uppercase',letterSpacing:2,display:'block',marginBottom:6}}>Location</label>
                <input placeholder="e.g. Rawalpindi" value={form.location} onChange={e=>setForm({...form,location:e.target.value})} style={{...s.input,width:'100%'}} />
              </div>
            </div>
            <div style={{marginBottom:14}}>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10}}>
                <label style={{fontSize:9,fontWeight:800,color:T.muted,textTransform:'uppercase',letterSpacing:2}}>Services</label>
                <button onClick={addItem} style={s.btnSm(T.bluePale,'#1a4870',T.blueLight)}>+ Add Service</button>
              </div>
              {form.items.length===0 && <div style={{textAlign:'center',padding:'20px',color:T.muted,background:T.mixPale,borderRadius:8,fontSize:13,fontWeight:600}}>Add at least one service to your bundle</div>}
              {form.items.map((item,idx)=>(
                <div key={idx} style={{display:'grid',gridTemplateColumns:'1fr 1fr auto',gap:8,marginBottom:10,alignItems:'end'}}>
                  <div>
                    <label style={{fontSize:8,fontWeight:800,color:T.muted,textTransform:'uppercase',letterSpacing:1,display:'block',marginBottom:4}}>Service</label>
                    <select value={item.service_id} onChange={e=>updateItem(idx,'service_id',e.target.value)} style={{...s.select,width:'100%'}}>
                      <option value="">Select service</option>
                      {services.map(sv=><option key={sv.service_id} value={sv.service_id}>{sv.service_name} — Rs. {Number(sv.price).toLocaleString()}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{fontSize:8,fontWeight:800,color:T.muted,textTransform:'uppercase',letterSpacing:1,display:'block',marginBottom:4}}>Provider</label>
                    <select value={item.provider_id} onChange={e=>updateItem(idx,'provider_id',e.target.value)} style={{...s.select,width:'100%'}}>
                      <option value="">Select provider</option>
                      {providers.map(p=><option key={p.user_id} value={p.user_id}>{p.users?.first_name} {p.users?.last_name}</option>)}
                    </select>
                  </div>
                  <button onClick={()=>removeItem(idx)} style={{...s.btnSm('#fff1f2','#be123c','#fda4af'),padding:'9px 12px'}}>✕</button>
                </div>
              ))}
            </div>
            {form.items.length>0 && (
              <div style={{background:T.mixPale,border:`2px solid ${T.mixBorder}`,borderRadius:8,padding:'10px 14px',marginBottom:16,fontSize:14,fontWeight:800,color:T.ink,display:'flex',justifyContent:'space-between'}}>
                <span>Total</span>
                <span style={{background:'linear-gradient(90deg,#6aaad0,#9b8ec4)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>
                  Rs. {form.items.reduce((sum,it)=>{const sv=services.find(s=>s.service_id===it.service_id);return sum+Number(sv?.price||0)},0).toLocaleString()}
                </span>
              </div>
            )}
            <div style={{display:'flex',gap:10,justifyContent:'flex-end'}}>
              <button onClick={()=>setShowCreate(false)} style={s.btnGhost}>Cancel</button>
              <button onClick={createBundle} disabled={saving} style={s.btn}>{saving?'Creating…':'Create Bundle'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
