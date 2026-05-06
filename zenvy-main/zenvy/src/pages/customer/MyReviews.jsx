import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../supabaseClient'
import Sidebar, { PageLayout, StatGrid, useIsMobile, T, s } from '../../components/Sidebar'

const NAV = [
  { label:'Dashboard',      icon:'◉', path:'/customer/dashboard' },
  { label:'Browse Services',icon:'◈', path:'/customer/browse' },
  { label:'My Bookings',    icon:'◇', path:'/customer/bookings' },
  { label:'Bundle Offers',  icon:'◎', path:'/customer/bundles' },
  { label:'Payments',       icon:'◷', path:'/customer/payments' },
  { label:'My Reviews',     icon:'♡', path:'/customer/reviews', active:true },
]

export default function MyReviews() {
  const [reviews, setReviews]           = useState([])
  const [completedBookings, setCompletedBookings] = useState([])
  const [loading, setLoading]           = useState(true)
  const [showAdd, setShowAdd]           = useState(false)
  const [form, setForm]                 = useState({ booking_id:'', rating:5, comment:'' })
  const [saving, setSaving]             = useState(false)
  const [user, setUser] = useState(null)
  const navigate = useNavigate()

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    const { data:{ user } } = await supabase.auth.getUser()
    if (!user) { navigate('/auth'); return }

    const { data: reviewData, error } = await supabase.from('review')
      .select('review_id,rating,comment,review_date,service_provider(user_id,users(first_name,last_name)),booking(booking_id,service(service_name),service_date)')
      .eq('customer_id', user.id).order('review_date',{ascending:false})
    console.log('reviews:', reviewData, error)
    setReviews(reviewData||[])

    const { data: bookingData } = await supabase.from('booking')
      .select('booking_id,service(service_name),service_date,provider_id,service_provider(user_id,users(first_name,last_name))')
      .eq('customer_id', user.id).eq('status','completed')
    const reviewedBookingIds = (reviewData||[]).map(r=>r.booking?.booking_id).filter(Boolean)
    setCompletedBookings((bookingData||[]).filter(b=>!reviewedBookingIds.includes(b.booking_id)))

    setLoading(false)
  }

  const submitReview = async () => {
    if (!form.booking_id) { alert('Please select a booking'); return }
    if (!form.comment.trim()) { alert('Please write a comment'); return }
    setSaving(true)
    const { data:{ user } } = await supabase.auth.getUser()
    const booking = completedBookings.find(b=>b.booking_id===form.booking_id)
    const { error } = await supabase.from('review').insert({
      customer_id: user.id,
      provider_id: booking?.provider_id || booking?.service_provider?.user_id,
      booking_id: form.booking_id,
      rating: form.rating,
      comment: form.comment,
      review_date: new Date().toISOString()
    })
    if (error) { alert('Error: '+error.message); setSaving(false); return }
    setForm({ booking_id:'', rating:5, comment:'' })
    setShowAdd(false); fetchData(); setSaving(false)
  }

  const deleteReview = async (reviewId) => {
    if (!window.confirm('Delete this review?')) return
    await supabase.from('review').delete().eq('review_id', reviewId)
    fetchData()
  }

  const avgRating = reviews.length>0 ? (reviews.reduce((sum,r)=>sum+r.rating,0)/reviews.length).toFixed(1) : 0

  if (loading) return <div style={s.loading}>Loading…</div>

  return (
    <div style={s.page}>
      <Sidebar items={NAV} userName={`${user?.first_name||''} ${user?.last_name||''}`} userRole="Customer" />
      <PageLayout>
        <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', marginBottom:22, paddingBottom:16, borderBottom:`2px solid ${T.mixBorder}` }}>
          <div><h1 style={s.h1}>My Reviews</h1><p style={s.sub}>Share your feedback on completed services</p></div>
          {completedBookings.length>0 && <button onClick={()=>setShowAdd(true)} style={s.btn}>+ Write Review</button>}
        </div>

        <div style={{...s.statGrid,gridTemplateColumns:'repeat(3,1fr)'}}>
          {[{label:'Reviews Written',value:reviews.length,color:T.ink},{label:'Avg Rating',value:reviews.length>0?`★ ${avgRating}`:'—',color:'#d97706'},{label:'Pending Reviews',value:completedBookings.length,color:T.blue}].map(st=>(
            <div key={st.label} style={s.statCard}><div style={s.statLabel}>{st.label}</div><div style={{...s.statNum,color:st.color}}>{st.value}</div></div>
          ))}
        </div>

        {completedBookings.length>0 && (
          <div style={{background:`linear-gradient(135deg,${T.bluePale},${T.purplePale})`,border:`2px solid ${T.mixBorder}`,borderRadius:12,padding:'14px 18px',marginBottom:20,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
            <div style={{fontSize:13,fontWeight:700,color:T.ink}}>💬 You have {completedBookings.length} completed booking{completedBookings.length!==1?'s':''} awaiting review</div>
            <button onClick={()=>setShowAdd(true)} style={s.btn}>Write Now →</button>
          </div>
        )}

        {reviews.length===0 ? (
          <div style={{...s.card,textAlign:'center',padding:'50px 20px',color:T.muted}}>
            <div style={{fontSize:36,opacity:0.3,marginBottom:12}}>♡</div>
            <p style={{fontWeight:600}}>No reviews yet. Complete a booking to leave feedback!</p>
          </div>
        ) : (
          <div style={{display:'flex',flexDirection:'column',gap:14}}>
            {reviews.map(r => {
              const sentBadge = r.rating>=4?{bg:'#f0fdf4',color:'#15803d',border:'#86efac'}:r.rating===3?{bg:'#fff7ed',color:'#c2410c',border:'#fdba74'}:{bg:'#fff1f2',color:'#be123c',border:'#fda4af'}
              return (
                <div key={r.review_id} style={s.card}>
                  <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:12,flexWrap:'wrap',gap:10}}>
                    <div>
                      <div style={{fontWeight:800,fontSize:14,color:T.ink}}>{r.booking?.service?.service_name||'—'}</div>
                      <div style={{fontSize:12,color:T.muted,marginTop:2,fontWeight:600}}>
                        Provider: {r.service_provider?.users?.first_name} {r.service_provider?.users?.last_name} · {r.booking?.service_date||'—'}
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

      {showAdd && (
        <div style={s.modal} onClick={e=>{if(e.target===e.currentTarget)setShowAdd(false)}}>
          <div style={{...s.modalCard,width:480,maxWidth:'95vw'}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20}}>
              <h3 style={{fontSize:18,fontWeight:800,margin:0,color:T.ink,fontFamily:"'Cormorant Garamond',serif"}}>Write a Review</h3>
              <button onClick={()=>setShowAdd(false)} style={{background:'none',border:'none',fontSize:20,cursor:'pointer',color:T.muted}}>✕</button>
            </div>
            <div style={{marginBottom:14}}>
              <label style={{fontSize:9,fontWeight:800,color:T.muted,textTransform:'uppercase',letterSpacing:2,display:'block',marginBottom:6}}>Select Booking</label>
              <select value={form.booking_id} onChange={e=>setForm({...form,booking_id:e.target.value})} style={{...s.select,width:'100%'}}>
                <option value="">— Choose a completed booking —</option>
                {completedBookings.map(b=>(
                  <option key={b.booking_id} value={b.booking_id}>{b.service?.service_name} — {b.service_date}</option>
                ))}
              </select>
            </div>
            <div style={{marginBottom:14}}>
              <label style={{fontSize:9,fontWeight:800,color:T.muted,textTransform:'uppercase',letterSpacing:2,display:'block',marginBottom:10}}>Rating</label>
              <div style={{display:'flex',gap:8}}>
                {[1,2,3,4,5].map(star=>(
                  <div key={star} onClick={()=>setForm({...form,rating:star})}
                    style={{width:40,height:40,borderRadius:8,border:`2px solid ${form.rating>=star?'#d97706':T.mixBorder}`,background:form.rating>=star?'#fff7ed':T.mixCard,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',fontSize:20,transition:'all 0.15s'}}>
                    {form.rating>=star?'★':'☆'}
                  </div>
                ))}
                <span style={{fontSize:13,color:T.muted,marginLeft:8,alignSelf:'center',fontWeight:700}}>{form.rating}/5</span>
              </div>
            </div>
            <div style={{marginBottom:20}}>
              <label style={{fontSize:9,fontWeight:800,color:T.muted,textTransform:'uppercase',letterSpacing:2,display:'block',marginBottom:6}}>Comment</label>
              <textarea placeholder="Share your experience..." value={form.comment} onChange={e=>setForm({...form,comment:e.target.value})} rows={4} style={{...s.input,width:'100%',resize:'vertical'}} />
            </div>
            <div style={{display:'flex',gap:10,justifyContent:'flex-end'}}>
              <button onClick={()=>setShowAdd(false)} style={s.btnGhost}>Cancel</button>
              <button onClick={submitReview} disabled={saving} style={s.btn}>{saving?'Submitting…':'Submit Review'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
