import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../supabaseClient'
import Sidebar, { PageLayout, StatGrid, useIsMobile, T, s } from '../../components/Sidebar'

const NAV = [
  { label:'Dashboard', icon:'◉', path:'/admin/dashboard' },
  { label:'Users',     icon:'◈', path:'/admin/users' },
  { label:'Bookings',  icon:'◇', path:'/admin/bookings' },
  { label:'Services',  icon:'◎', path:'/admin/services' },
  { label:'Payments',  icon:'◷', path:'/admin/payments' },
  { label:'Reviews',   icon:'♡', path:'/admin/reviews', active:true },
]

export default function AdminReviews() {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter]   = useState('all')
  const [search, setSearch]   = useState('')
  const [adminUser, setAdminUser] = useState(null)
  const navigate = useNavigate()

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    const { data, error } = await supabase.from('review')
      .select('review_id,rating,comment,review_date,customer(user_id,users(first_name,last_name)),service_provider(user_id,users(first_name,last_name)),booking(booking_id,service(service_name),service_date)')
      .order('review_date',{ascending:false})
    console.log('admin reviews:', data, error)
    setReviews(data||[])
    setLoading(false)
  }

  const deleteReview = async (reviewId) => {
    if (!window.confirm('Delete this review?')) return
    const { error } = await supabase.from('review').delete().eq('review_id', reviewId)
    if (error) { alert('Error: '+error.message); return }
    fetchData()
  }

  const counts = { all:reviews.length, 5:reviews.filter(r=>r.rating===5).length, 4:reviews.filter(r=>r.rating===4).length, 3:reviews.filter(r=>r.rating===3).length, low:reviews.filter(r=>r.rating<=2).length }
  const avgRating = reviews.length>0 ? (reviews.reduce((sum,r)=>sum+r.rating,0)/reviews.length).toFixed(1) : 0

  const filtered = reviews
    .filter(r => filter==='all' ? true : filter==='low' ? r.rating<=2 : r.rating===parseInt(filter))
    .filter(r => {
      if (!search) return true
      const cName = r.customer?.users ? `${r.customer.users.first_name} ${r.customer.users.last_name}`.toLowerCase() : ''
      const pName = r.service_provider?.users ? `${r.service_provider.users.first_name} ${r.service_provider.users.last_name}`.toLowerCase() : ''
      const sName = r.booking?.service?.service_name?.toLowerCase() || ''
      return cName.includes(search.toLowerCase()) || pName.includes(search.toLowerCase()) || sName.includes(search.toLowerCase())
    })

  if (loading) return <div style={s.loading}>Loading…</div>

  return (
    <div style={s.page}>
      <Sidebar items={NAV} userName={`${adminUser?.first_name||""} ${adminUser?.last_name||""}`} userRole="Super Admin" />
      <PageLayout>
        <div style={{ marginBottom:22, paddingBottom:16, borderBottom:`2px solid ${T.mixBorder}` }}>
          <h1 style={s.h1}>Review Management</h1><p style={s.sub}>Monitor all platform reviews and ratings</p>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:12, marginBottom:22 }}>
          {[{label:'Total Reviews',value:counts.all,color:T.ink},{label:'Avg Rating',value:`★ ${avgRating}`,color:'#d97706'},{label:'5 Star',value:counts[5],color:'#15803d'},{label:'Low (1-2★)',value:counts.low,color:T.terra}].map(st=>(
            <div key={st.label} style={s.statCard}><div style={s.statLabel}>{st.label}</div><div style={{...s.statNum,color:st.color}}>{st.value}</div></div>
          ))}
        </div>

        <div style={{...s.card,marginBottom:16,display:'flex',gap:10,alignItems:'center'}}>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍  Search by customer, provider or service..." style={{...s.input,flex:1}} />
          <button onClick={()=>setSearch('')} style={s.btnGhost}>Clear</button>
        </div>

        <div style={s.filterBar}>
          {[{key:'all',label:'All'},{key:'5',label:'5 ★'},{key:'4',label:'4 ★'},{key:'3',label:'3 ★'},{key:'low',label:'1–2 ★'}].map(tab=>(
            <div key={tab.key} onClick={()=>setFilter(tab.key)} style={s.filterTab(filter===tab.key)}>
              {tab.label}
              <span style={{marginLeft:6,fontSize:10,color:T.muted}}>({tab.key==='all'?counts.all:tab.key==='low'?counts.low:counts[tab.key]||0})</span>
            </div>
          ))}
        </div>

        {filtered.length===0 ? (
          <div style={{...s.card,textAlign:'center',padding:'50px 20px',color:T.muted}}>
            <div style={{fontSize:36,opacity:0.3,marginBottom:12}}>♡</div>
            <p style={{fontWeight:600}}>No reviews found.</p>
          </div>
        ) : (
          <div style={{display:'flex',flexDirection:'column',gap:14}}>
            {filtered.map(r => {
              const sentBadge = r.rating>=4?{bg:'#f0fdf4',color:'#15803d',border:'#86efac'}:r.rating===3?{bg:'#fff7ed',color:'#c2410c',border:'#fdba74'}:{bg:'#fff1f2',color:'#be123c',border:'#fda4af'}
              return (
                <div key={r.review_id} style={s.card}>
                  <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:12,flexWrap:'wrap',gap:10}}>
                    <div style={{display:'flex',alignItems:'center',gap:12}}>
                      <div style={s.avatar(40)}>{r.customer?.users?.first_name?.charAt(0)||'?'}</div>
                      <div>
                        <div style={{fontWeight:800,fontSize:14,color:T.ink}}>{r.customer?.users?.first_name} {r.customer?.users?.last_name}</div>
                        <div style={{fontSize:12,color:T.muted,marginTop:2,fontWeight:600}}>
                          For: {r.service_provider?.users?.first_name} {r.service_provider?.users?.last_name} · {r.booking?.service?.service_name||'—'}
                        </div>
                      </div>
                    </div>
                    <div style={{display:'flex',alignItems:'center',gap:10}}>
                      <div style={{textAlign:'right'}}>
                        <div style={{color:'#d97706',fontSize:18}}>{'★'.repeat(r.rating)}<span style={{color:T.mixBorder}}>{'★'.repeat(5-r.rating)}</span></div>
                        <div style={{fontSize:11,color:T.muted,fontWeight:600}}>{new Date(r.review_date).toLocaleDateString()}</div>
                      </div>
                      <button onClick={()=>deleteReview(r.review_id)} style={s.btnSm('#fff1f2','#be123c','#fda4af')}>Delete</button>
                    </div>
                  </div>
                  <p style={{fontSize:13,color:T.ink,lineHeight:1.7,margin:0,padding:'12px 14px',background:T.mixPale,borderRadius:8,borderLeft:`3px solid ${T.blueLight}`,fontWeight:600}}>"{r.comment}"</p>
                  <div style={{marginTop:10}}><span style={s.badge(sentBadge)}>{r.rating>=4?'😊 Positive':r.rating===3?'😐 Neutral':'😞 Negative'}</span></div>
                </div>
              )
            })}
          </div>
        )}
      </PageLayout>
    </div>
  )
}
