import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../supabaseClient'
import Sidebar, { PageLayout, StatGrid, useIsMobile, T, s } from '../../components/Sidebar'

const NAV = [
  { label:'Dashboard',        icon:'◉', path:'/provider/dashboard' },
  { label:'My Services',      icon:'◈', path:'/provider/services' },
  { label:'Availability',     icon:'◷', path:'/provider/availability' },
  { label:'Assigned Bookings',icon:'◇', path:'/provider/bookings' },
  { label:'Bundle Tasks',     icon:'◎', path:'/provider/bundles' },
  { label:'My Reviews',       icon:'♡', path:'/provider/reviews', active:true },
]

export default function ProviderReviews() {
  const [reviews, setReviews] = useState([])
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
    const { data, error } = await supabase.from('review')
      .select('review_id,rating,comment,review_date,customer(user_id,users(first_name,last_name)),booking(booking_id,service(service_name),service_date)')
      .eq('provider_id', user.id).order('review_date',{ascending:false})
    console.log('reviews:', data, error)
    setReviews(data||[]); setLoading(false)
  }

  const filtered = filter==='all' ? reviews : reviews.filter(r=>r.rating===parseInt(filter))
  const counts   = { all:reviews.length, 5:reviews.filter(r=>r.rating===5).length, 4:reviews.filter(r=>r.rating===4).length, 3:reviews.filter(r=>r.rating===3).length, 2:reviews.filter(r=>r.rating===2).length, 1:reviews.filter(r=>r.rating===1).length }
  const avgRating = reviews.length>0 ? (reviews.reduce((sum,r)=>sum+r.rating,0)/reviews.length).toFixed(1) : 0
  const ratingDist = [5,4,3,2,1].map(star => ({ star, count:counts[star], pct:reviews.length>0?Math.round((counts[star]/reviews.length)*100):0 }))

  if (loading) return <div style={s.loading}>Loading…</div>

  return (
    <div style={s.page}>
      <Sidebar items={NAV} userName={`${user?.first_name||""} ${user?.last_name||""}`} userRole="Service Provider" />
      <PageLayout>
        <div style={{ marginBottom:22, paddingBottom:16, borderBottom:`2px solid ${T.mixBorder}` }}>
          <h1 style={s.h1}>My Reviews</h1><p style={s.sub}>Feedback from customers about your services</p>
        </div>

        {/* Summary */}
        <div style={{display:'grid',gridTemplateColumns:'240px 1fr',gap:20,marginBottom:22}}>
          <div style={{...s.card,textAlign:'center'}}>
            <div style={s.statLabel}>Overall Rating</div>
            <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:52,fontWeight:600,color:T.ink,lineHeight:1}}>{avgRating}</div>
            <div style={{color:'#d97706',fontSize:22,margin:'8px 0'}}>{'★'.repeat(Math.round(avgRating))}{'☆'.repeat(5-Math.round(avgRating))}</div>
            <div style={{fontSize:12,color:T.muted,fontWeight:600}}>Based on {reviews.length} review{reviews.length!==1?'s':''}</div>
          </div>
          <div style={s.card}>
            <div style={{...s.statLabel,marginBottom:14}}>Rating Breakdown</div>
            {ratingDist.map(({star,count,pct})=>(
              <div key={star} style={{display:'flex',alignItems:'center',gap:10,marginBottom:10}}>
                <div style={{width:36,fontSize:12,color:T.muted,textAlign:'right',flexShrink:0,fontWeight:700}}>{star} ★</div>
                <div style={{flex:1,background:T.mixPale,borderRadius:4,height:10,overflow:'hidden',border:`1px solid ${T.mixBorder}`}}>
                  <div style={{width:`${pct}%`,height:'100%',background:star>=4?'#d97706':star===3?T.terra:'#be123c',borderRadius:4,transition:'width .3s'}} />
                </div>
                <div style={{width:30,fontSize:12,color:T.muted,flexShrink:0,fontWeight:700}}>{count}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:12, marginBottom:22 }}>
          {[{label:'Total Reviews',value:counts.all,color:T.ink},{label:'5 Star',value:counts[5],color:'#d97706'},{label:'4 Star',value:counts[4],color:'#f59e0b'},{label:'1–3 Star',value:counts[3]+counts[2]+counts[1],color:T.terra}].map(st=>(
            <div key={st.label} style={s.statCard}><div style={s.statLabel}>{st.label}</div><div style={{...s.statNum,color:st.color}}>{st.value}</div></div>
          ))}
        </div>

        <div style={s.filterBar}>
          {['all','5','4','3','2','1'].map(tab=>(
            <div key={tab} onClick={()=>setFilter(tab)} style={s.filterTab(filter===tab)}>
              {tab==='all'?'All Reviews':`${tab} ★`}
              <span style={{marginLeft:5,fontSize:10,color:T.muted}}>({counts[tab]})</span>
            </div>
          ))}
        </div>

        {filtered.length===0 ? (
          <div style={{...s.card,textAlign:'center',padding:'50px 20px',color:T.muted}}>
            <div style={{fontSize:36,opacity:0.3,marginBottom:12}}>♡</div>
            <p style={{fontWeight:600}}>No reviews yet. Complete bookings to receive feedback!</p>
          </div>
        ) : (
          <div style={{display:'flex',flexDirection:'column',gap:14}}>
            {filtered.map(r => {
              const sentBadge = r.rating>=4?{bg:'#f0fdf4',color:'#15803d',border:'#86efac'}:r.rating===3?{bg:'#fff7ed',color:'#c2410c',border:'#fdba74'}:{bg:'#fff1f2',color:'#be123c',border:'#fda4af'}
              return (
                <div key={r.review_id} style={s.card}>
                  <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:12}}>
                    <div style={{display:'flex',alignItems:'center',gap:12}}>
                      <div style={s.avatar(44)}>{r.customer?.users?.first_name?.charAt(0)||'?'}</div>
                      <div>
                        <div style={{fontWeight:800,fontSize:14,color:T.ink}}>{r.customer?.users?.first_name} {r.customer?.users?.last_name}</div>
                        <div style={{fontSize:12,color:T.muted,marginTop:2,fontWeight:600}}>{r.booking?.service?.service_name||'—'} · {r.booking?.service_date||'—'}</div>
                      </div>
                    </div>
                    <div style={{textAlign:'right'}}>
                      <div style={{color:'#d97706',fontSize:18}}>{'★'.repeat(r.rating)}<span style={{color:T.mixBorder}}>{'★'.repeat(5-r.rating)}</span></div>
                      <div style={{fontSize:11,color:T.muted,marginTop:4,fontWeight:600}}>{new Date(r.review_date).toLocaleDateString('en-PK',{year:'numeric',month:'short',day:'numeric'})}</div>
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
