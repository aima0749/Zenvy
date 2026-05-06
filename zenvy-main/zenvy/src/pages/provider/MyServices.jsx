import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../supabaseClient'
import Sidebar, { PageLayout, StatGrid, useIsMobile, T, s } from '../../components/Sidebar'

const NAV = [
  { label:'Dashboard',        icon:'◉', path:'/provider/dashboard' },
  { label:'My Services',      icon:'◈', path:'/provider/services', active:true },
  { label:'Availability',     icon:'◷', path:'/provider/availability' },
  { label:'Assigned Bookings',icon:'◇', path:'/provider/bookings' },
  { label:'Bundle Tasks',     icon:'◎', path:'/provider/bundles' },
  { label:'My Reviews',       icon:'♡', path:'/provider/reviews' },
]

export default function MyServices() {
  const [myServices, setMyServices]   = useState([])
  const [allServices, setAllServices] = useState([])
  const [loading, setLoading]         = useState(true)
  const [currentUser, setCurrentUser] = useState(null)
  const [showAdd, setShowAdd]         = useState(false)
  const [user, setUser] = useState(null)
  const navigate = useNavigate()

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    const { data:{ user } } = await supabase.auth.getUser()
    if (!user) { navigate('/auth'); return }
    const { data: userData } = await supabase.from('users').select('first_name,last_name').eq('user_id', user.id).single()
    setUser(userData)
    setCurrentUser(user)
    const { data: linked } = await supabase.from('provider_service').select('service_id,service(service_id,service_name,description,price,category(category_name))').eq('provider_id',user.id)
    setMyServices(linked||[])
    const { data: all } = await supabase.from('service').select('service_id,service_name,price,category(category_name)')
    setAllServices(all||[])
    setLoading(false)
  }

  const addService = async (serviceId) => {
    if (myServices.find(sv=>sv.service_id===serviceId)) { alert('You already offer this service'); return }
    const { error } = await supabase.from('provider_service').insert({ provider_id:currentUser.id, service_id:serviceId })
    if (error) { alert('Error: '+error.message); return }
    fetchData(); setShowAdd(false)
  }

  const removeService = async (serviceId) => {
    if (!window.confirm('Remove this service?')) return
    await supabase.from('provider_service').delete().eq('provider_id',currentUser.id).eq('service_id',serviceId)
    fetchData()
  }

  const myServiceIds    = myServices.map(sv=>sv.service_id)
  const availableToAdd  = allServices.filter(sv=>!myServiceIds.includes(sv.service_id))

  if (loading) return <div style={s.loading}>Loading…</div>

  return (
    <div style={s.page}>
      <Sidebar items={NAV} userName={`${user?.first_name||""} ${user?.last_name||""}`} userRole="Service Provider" />
      <PageLayout>
        <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', marginBottom:22, paddingBottom:16, borderBottom:`2px solid ${T.mixBorder}` }}>
          <div><h1 style={s.h1}>My Services</h1><p style={s.sub}>Services you currently offer to customers</p></div>
          <button onClick={()=>setShowAdd(true)} style={s.btn}>+ Add Service</button>
        </div>

        <div style={{...s.statGrid,gridTemplateColumns:'repeat(3,1fr)'}}>
          {[{label:'Services Offered',value:myServices.length,color:T.ink},{label:'Available to Add',value:availableToAdd.length,color:T.blue},{label:'Categories',value:new Set(myServices.map(sv=>sv.service?.category?.category_name)).size,color:T.purple}].map(st=>(
            <div key={st.label} style={s.statCard}><div style={s.statLabel}>{st.label}</div><div style={{...s.statNum,color:st.color}}>{st.value}</div></div>
          ))}
        </div>

        {myServices.length===0 ? (
          <div style={{...s.card,textAlign:'center',padding:'50px 20px',color:T.muted}}>
            <div style={{fontSize:36,opacity:0.3,marginBottom:12}}>◈</div>
            <p style={{fontWeight:600}}>You haven't added any services yet.</p>
            <button onClick={()=>setShowAdd(true)} style={{...s.btn,marginTop:14}}>Add Your First Service</button>
          </div>
        ) : (
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:16}}>
            {myServices.map(item => {
              const svc = item.service
              return (
                <div key={item.service_id} style={{background:T.mixCard,border:`2px solid ${T.mixBorder}`,borderRadius:14,overflow:'hidden',boxShadow:'0 2px 8px rgba(80,100,180,0.08)'}}>
                  <div style={{height:80,background:`linear-gradient(135deg,${T.bluePale},${T.purplePale})`,borderBottom:`2px solid ${T.mixBorder}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:28,opacity:0.4}}>◎</div>
                  <div style={{padding:16}}>
                    <span style={s.badge({bg:T.bluePale,color:'#1a4870',border:T.blueMid})}>{svc?.category?.category_name||'General'}</span>
                    <div style={{fontWeight:800,fontSize:14,marginTop:8,color:T.ink}}>{svc?.service_name}</div>
                    <div style={{fontSize:12,color:T.muted,marginTop:4,lineHeight:1.5,fontWeight:600}}>{svc?.description?.substring(0,70)||'No description'}…</div>
                    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginTop:12}}>
                      <div style={{fontWeight:800,fontSize:15,color:T.ink}}>Rs. {Number(svc?.price||0).toLocaleString()}</div>
                      <span style={s.badge({bg:'#f0fdf4',color:'#15803d',border:'#86efac'})}>● Active</span>
                    </div>
                    <button onClick={()=>removeService(item.service_id)} style={{...s.btnSm('#fff1f2','#be123c','#fda4af'),width:'100%',marginTop:10,padding:'8px'}}>Remove Service</button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </PageLayout>

      {showAdd && (
        <div style={s.modal} onClick={e=>{if(e.target===e.currentTarget)setShowAdd(false)}}>
          <div style={{...s.modalCard,width:520,maxWidth:'95vw',maxHeight:'80vh',overflow:'auto'}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20}}>
              <h3 style={{fontSize:18,fontWeight:800,margin:0,color:T.ink,fontFamily:"'Cormorant Garamond',serif"}}>Add a Service</h3>
              <button onClick={()=>setShowAdd(false)} style={{background:'none',border:'none',fontSize:20,cursor:'pointer',color:T.muted}}>✕</button>
            </div>
            {availableToAdd.length===0 ? (
              <p style={{color:T.muted,textAlign:'center',padding:'20px 0',fontWeight:600}}>You're already offering all available services!</p>
            ) : availableToAdd.map(sv=>(
              <div key={sv.service_id} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 0',borderBottom:`1.5px solid ${T.mixPale}`}}>
                <div>
                  <div style={{fontWeight:700,fontSize:13,color:T.ink}}>{sv.service_name}</div>
                  <div style={{fontSize:12,color:T.muted,fontWeight:600}}>{sv.category?.category_name} · Rs. {Number(sv.price).toLocaleString()}</div>
                </div>
                <button onClick={()=>addService(sv.service_id)} style={s.btn}>Add</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
