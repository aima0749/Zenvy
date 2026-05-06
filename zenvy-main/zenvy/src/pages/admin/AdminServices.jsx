import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../supabaseClient'
import Sidebar, { PageLayout, StatGrid, useIsMobile, T, s } from '../../components/Sidebar'

const NAV = [
  { label:'Dashboard', icon:'◉', path:'/admin/dashboard' },
  { label:'Users',     icon:'◈', path:'/admin/users' },
  { label:'Bookings',  icon:'◇', path:'/admin/bookings' },
  { label:'Services',  icon:'◎', path:'/admin/services', active:true },
  { label:'Payments',  icon:'◷', path:'/admin/payments' },
  { label:'Reviews',   icon:'♡', path:'/admin/reviews' },
]

export default function AdminServices() {
  const [services, setServices]     = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading]       = useState(true)
  const [search, setSearch]         = useState('')
  const [selectedCat, setSelectedCat] = useState('')
  const [showAdd, setShowAdd]       = useState(false)
  const [form, setForm]             = useState({ service_name:'', description:'', price:'', category_id:'' })
  const [saving, setSaving]         = useState(false)
  const [adminUser, setAdminUser] = useState(null)
  const navigate = useNavigate()

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    const { data, error } = await supabase.from('service')
      .select('service_id,service_name,description,price,category(category_id,category_name),provider_service(provider_id)')
      .order('service_name',{ascending:true})
    console.log('services:', data, error)
    setServices(data||[])
    const { data: cats } = await supabase.from('category').select('*')
    setCategories(cats||[])
    setLoading(false)
  }

  const addService = async () => {
    if (!form.service_name||!form.price||!form.category_id) { alert('Please fill all required fields'); return }
    setSaving(true)
    const { error } = await supabase.from('service').insert({ service_name:form.service_name, description:form.description, price:parseFloat(form.price), category_id:form.category_id })
    if (error) { alert('Error: '+error.message); setSaving(false); return }
    setForm({ service_name:'', description:'', price:'', category_id:'' })
    setShowAdd(false); fetchData(); setSaving(false)
  }

  const deleteService = async (serviceId) => {
    if (!window.confirm('Delete this service?')) return
    const { error } = await supabase.from('service').delete().eq('service_id', serviceId)
    if (error) { alert('Error: '+error.message); return }
    fetchData()
  }

  const filtered = services.filter(sv => {
    const matchSearch = sv.service_name.toLowerCase().includes(search.toLowerCase())
    const matchCat    = selectedCat ? sv.category?.category_id === selectedCat : true
    return matchSearch && matchCat
  })

  if (loading) return <div style={s.loading}>Loading…</div>

  return (
    <div style={s.page}>
      <Sidebar items={NAV} userName={`${adminUser?.first_name||""} ${adminUser?.last_name||""}`} userRole="Super Admin" />
      <PageLayout>
        <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', marginBottom:22, paddingBottom:16, borderBottom:`2px solid ${T.mixBorder}` }}>
          <div><h1 style={s.h1}>Service Management</h1><p style={s.sub}>Manage all services available on the platform</p></div>
          <button onClick={()=>setShowAdd(true)} style={s.btn}>+ Add Service</button>
        </div>

        <div style={{...s.statGrid,gridTemplateColumns:'repeat(2,1fr)'}}>
          {[{label:'Total Services',value:services.length,color:T.ink},{label:'Categories',value:categories.length,color:T.blue},{label:'With Providers',value:services.filter(sv=>sv.provider_service?.length>0).length,color:T.purple}].map(st=>(
            <div key={st.label} style={s.statCard}><div style={s.statLabel}>{st.label}</div><div style={{...s.statNum,color:st.color}}>{st.value}</div></div>
          ))}
        </div>

        <div style={{...s.card,marginBottom:16,display:'flex',gap:10,alignItems:'center',flexWrap:'wrap'}}>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍  Search services..." style={{...s.input,flex:1,minWidth:200}} />
          <select value={selectedCat} onChange={e=>setSelectedCat(e.target.value)} style={s.select}>
            <option value="">All Categories</option>
            {categories.map(c=><option key={c.category_id} value={c.category_id}>{c.category_name}</option>)}
          </select>
          <button onClick={()=>{setSearch('');setSelectedCat('')}} style={s.btnGhost}>Clear</button>
        </div>

        <div style={{fontSize:11,color:T.muted,marginBottom:14,fontWeight:700,letterSpacing:1}}>{filtered.length} service{filtered.length!==1?'s':''} found</div>

        {filtered.length===0 ? (
          <div style={{...s.card,textAlign:'center',padding:'50px 20px',color:T.muted}}>
            <div style={{fontSize:36,opacity:0.3,marginBottom:12}}>◎</div>
            <p style={{fontWeight:600}}>No services found.</p>
          </div>
        ) : (
          <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:16}}>
            {filtered.map(sv => (
              <div key={sv.service_id} style={{background:T.mixCard,border:`2px solid ${T.mixBorder}`,borderRadius:14,overflow:'hidden',boxShadow:'0 2px 8px rgba(80,100,180,0.08)'}}>
                <div style={{height:80,background:`linear-gradient(135deg,${T.bluePale},${T.purplePale})`,borderBottom:`2px solid ${T.mixBorder}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:28,opacity:0.4}}>◎</div>
                <div style={{padding:16}}>
                  <span style={s.badge({bg:T.bluePale,color:'#1a4870',border:T.blueMid})}>{sv.category?.category_name||'General'}</span>
                  <div style={{fontWeight:800,fontSize:14,marginTop:8,color:T.ink}}>{sv.service_name}</div>
                  <div style={{fontSize:12,color:T.muted,margin:'4px 0 10px',lineHeight:1.5,fontWeight:600}}>{sv.description?.substring(0,80)||'No description'}{sv.description?.length>80?'...':''}</div>
                  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12}}>
                    <div style={{fontWeight:800,fontSize:15,color:T.ink}}>Rs. {Number(sv.price).toLocaleString()}</div>
                    <span style={s.badge({bg:T.purplePale,color:'#3a1e90',border:T.purpleMid})}>{sv.provider_service?.length||0} providers</span>
                  </div>
                  <button onClick={()=>deleteService(sv.service_id)} style={{...s.btnSm('#fff1f2','#be123c','#fda4af'),width:'100%',padding:'8px'}}>Delete Service</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </PageLayout>

      {showAdd && (
        <div style={s.modal} onClick={e=>{if(e.target===e.currentTarget)setShowAdd(false)}}>
          <div style={{...s.modalCard,width:480,maxWidth:'95vw'}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20}}>
              <h3 style={{fontSize:18,fontWeight:800,margin:0,color:T.ink,fontFamily:"'Cormorant Garamond',serif"}}>Add New Service</h3>
              <button onClick={()=>setShowAdd(false)} style={{background:'none',border:'none',fontSize:20,cursor:'pointer',color:T.muted}}>✕</button>
            </div>
            {[{key:'service_name',label:'Service Name',placeholder:'e.g. Deep Cleaning',type:'text'},{key:'price',label:'Price (Rs.)',placeholder:'e.g. 2500',type:'number'}].map(f=>(
              <div key={f.key} style={{marginBottom:14}}>
                <label style={{fontSize:9,fontWeight:800,color:T.muted,textTransform:'uppercase',letterSpacing:2,display:'block',marginBottom:6}}>{f.label}</label>
                <input type={f.type} placeholder={f.placeholder} value={form[f.key]} onChange={e=>setForm({...form,[f.key]:e.target.value})} style={{...s.input,width:'100%'}} />
              </div>
            ))}
            <div style={{marginBottom:14}}>
              <label style={{fontSize:9,fontWeight:800,color:T.muted,textTransform:'uppercase',letterSpacing:2,display:'block',marginBottom:6}}>Category</label>
              <select value={form.category_id} onChange={e=>setForm({...form,category_id:e.target.value})} style={{...s.select,width:'100%'}}>
                <option value="">Select a category</option>
                {categories.map(c=><option key={c.category_id} value={c.category_id}>{c.category_name}</option>)}
              </select>
            </div>
            <div style={{marginBottom:20}}>
              <label style={{fontSize:9,fontWeight:800,color:T.muted,textTransform:'uppercase',letterSpacing:2,display:'block',marginBottom:6}}>Description</label>
              <textarea placeholder="Service description..." value={form.description} onChange={e=>setForm({...form,description:e.target.value})} rows={3} style={{...s.input,width:'100%',resize:'vertical'}} />
            </div>
            <div style={{display:'flex',gap:10,justifyContent:'flex-end'}}>
              <button onClick={()=>setShowAdd(false)} style={s.btnGhost}>Cancel</button>
              <button onClick={addService} disabled={saving} style={s.btn}>{saving?'Saving…':'Add Service'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
