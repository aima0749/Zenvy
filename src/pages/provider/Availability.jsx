import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../supabaseClient'
import Sidebar, { PageLayout, StatGrid, useIsMobile, T, s } from '../../components/Sidebar'

const NAV = [
  { label:'Dashboard',        icon:'◉', path:'/provider/dashboard' },
  { label:'My Services',      icon:'◈', path:'/provider/services' },
  { label:'Availability',     icon:'◷', path:'/provider/availability', active:true },
  { label:'Assigned Bookings',icon:'◇', path:'/provider/bookings' },
  { label:'Bundle Tasks',     icon:'◎', path:'/provider/bundles' },
  { label:'My Reviews',       icon:'♡', path:'/provider/reviews' },
]

export default function Availability() {
  const [slots, setSlots]           = useState([])
  const [loading, setLoading]       = useState(true)
  const [currentUser, setCurrentUser] = useState(null)
  const [showAdd, setShowAdd]       = useState(false)
  const [form, setForm]             = useState({ available_date:'', start_time:'', end_time:'' })
  const [saving, setSaving]         = useState(false)
  const [filter, setFilter]         = useState('all')
  const [user, setUser] = useState(null)
  const navigate = useNavigate()

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    const { data:{ user } } = await supabase.auth.getUser()
    if (!user) { navigate('/auth'); return }
    const { data: userData } = await supabase.from('users').select('first_name,last_name').eq('user_id', user.id).single()
    setUser(userData)
    setCurrentUser(user)
    const { data } = await supabase.from('availability').select('*').eq('provider_id',user.id).order('available_date',{ascending:true}).order('start_time',{ascending:true})
    setSlots(data||[]); setLoading(false)
  }

  const addSlot = async () => {
    if (!form.available_date||!form.start_time||!form.end_time) { alert('Please fill all fields'); return }
    if (form.start_time>=form.end_time) { alert('End time must be after start time'); return }
    setSaving(true)
    const { error } = await supabase.from('availability').insert({ provider_id:currentUser.id, available_date:form.available_date, start_time:form.start_time, end_time:form.end_time, is_booked:false })
    if (error) { alert('Error: '+error.message); setSaving(false); return }
    setForm({ available_date:'', start_time:'', end_time:'' }); setShowAdd(false); fetchData(); setSaving(false)
  }

  const deleteSlot = async (scheduleId, isBooked) => {
    if (isBooked) { alert('Cannot delete a booked slot'); return }
    if (!window.confirm('Delete this slot?')) return
    await supabase.from('availability').delete().eq('schedule_id', scheduleId); fetchData()
  }

  const today = new Date().toISOString().split('T')[0]
  const counts = { all:slots.length, available:slots.filter(s=>!s.is_booked&&s.available_date>=today).length, booked:slots.filter(s=>s.is_booked).length, past:slots.filter(s=>s.available_date<today).length }
  const filtered = filter==='all'?slots:filter==='available'?slots.filter(s=>!s.is_booked&&s.available_date>=today):filter==='booked'?slots.filter(s=>s.is_booked):slots.filter(s=>s.available_date<today)

  if (loading) return <div style={s.loading}>Loading…</div>

  return (
    <div style={s.page}>
      <Sidebar items={NAV} userName={`${user?.first_name||""} ${user?.last_name||""}`} userRole="Service Provider" />
      <PageLayout>
        <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', marginBottom:22, paddingBottom:16, borderBottom:`2px solid ${T.mixBorder}` }}>
          <div><h1 style={s.h1}>My Availability</h1><p style={s.sub}>Set your available time slots for customers to book</p></div>
          <button onClick={()=>setShowAdd(true)} style={s.btn}>+ Add Slot</button>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:12, marginBottom:22 }}>
          {[{label:'Total Slots',value:counts.all,color:T.ink},{label:'Open Slots',value:counts.available,color:'#15803d'},{label:'Booked Slots',value:counts.booked,color:T.blue},{label:'Past Slots',value:counts.past,color:T.muted}].map(st=>(
            <div key={st.label} style={s.statCard}><div style={s.statLabel}>{st.label}</div><div style={{...s.statNum,color:st.color}}>{st.value}</div></div>
          ))}
        </div>

        <div style={s.filterBar}>
          {['all','available','booked','past'].map(tab=>(
            <div key={tab} onClick={()=>setFilter(tab)} style={s.filterTab(filter===tab)}>
              {tab.charAt(0).toUpperCase()+tab.slice(1)}
              <span style={{marginLeft:6,fontSize:10,color:T.muted}}>({counts[tab]})</span>
            </div>
          ))}
        </div>

        <div style={s.tableWrap}>
          {filtered.length===0 ? (
            <div style={{textAlign:'center',padding:'50px 20px',color:T.muted}}>
              <div style={{fontSize:36,opacity:0.3,marginBottom:12}}>◷</div>
              <p style={{fontWeight:600}}>No slots found. Add your available time slots!</p>
              <button onClick={()=>setShowAdd(true)} style={{...s.btn,marginTop:14}}>Add Slot</button>
            </div>
          ) : (
            <table style={{width:'100%',borderCollapse:'collapse',minWidth:550}}>
              <thead><tr style={s.tableHead}>{['#','Date','Start','End','Duration','Status','Action'].map(h=><th key={h} style={s.th}>{h}</th>)}</tr></thead>
              <tbody>
                {filtered.map((slot,i) => {
                  const isPast = slot.available_date < today
                  const start  = slot.start_time?.slice(0,5)
                  const end    = slot.end_time?.slice(0,5)
                  const [sh,sm] = start.split(':').map(Number)
                  const [eh,em] = end.split(':').map(Number)
                  const mins = (eh*60+em)-(sh*60+sm)
                  const duration = mins>=60?`${Math.floor(mins/60)}h ${mins%60>0?mins%60+'m':''}`:`${mins}m`
                  const statusBadge = isPast ? {bg:T.mixPale,color:T.muted,border:T.mixBorder} : slot.is_booked ? {bg:T.bluePale,color:'#1a4870',border:T.blueLight} : {bg:'#f0fdf4',color:'#15803d',border:'#86efac'}
                  return (
                    <tr key={slot.schedule_id} style={{...s.tr,opacity:isPast?0.6:1}}>
                      <td style={{...s.td,fontSize:10,color:T.muted}}>#{String(i+1).padStart(2,'0')}</td>
                      <td style={{...s.td,fontWeight:700}}>{new Date(slot.available_date+'T00:00:00').toLocaleDateString('en-PK',{weekday:'short',month:'short',day:'numeric'})}</td>
                      <td style={{...s.td,fontFamily:'monospace'}}>{start}</td>
                      <td style={{...s.td,fontFamily:'monospace'}}>{end}</td>
                      <td style={{...s.td,color:T.muted}}>{duration}</td>
                      <td style={s.td}><span style={s.badge(statusBadge)}>{isPast?'past':slot.is_booked?'booked':'open'}</span></td>
                      <td style={s.td}>
                        {!slot.is_booked && <button onClick={()=>deleteSlot(slot.schedule_id,slot.is_booked)} style={s.btnSm('#fff1f2','#be123c','#fda4af')}>Delete</button>}
                        {slot.is_booked  && <span style={{fontSize:11,color:T.muted,fontWeight:600}}>Booked</span>}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </PageLayout>

      {showAdd && (
        <div style={s.modal} onClick={e=>{if(e.target===e.currentTarget)setShowAdd(false)}}>
          <div style={{...s.modalCard,width:420,maxWidth:'95vw'}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20}}>
              <h3 style={{fontSize:18,fontWeight:800,margin:0,color:T.ink,fontFamily:"'Cormorant Garamond',serif"}}>Add Availability Slot</h3>
              <button onClick={()=>setShowAdd(false)} style={{background:'none',border:'none',fontSize:20,cursor:'pointer',color:T.muted}}>✕</button>
            </div>
            <div style={{marginBottom:14}}>
              <label style={{fontSize:9,fontWeight:800,color:T.muted,textTransform:'uppercase',letterSpacing:2,display:'block',marginBottom:6}}>Date</label>
              <input type="date" value={form.available_date} min={today} onChange={e=>setForm({...form,available_date:e.target.value})} style={{...s.input,width:'100%'}} />
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:20}}>
              <div>
                <label style={{fontSize:9,fontWeight:800,color:T.muted,textTransform:'uppercase',letterSpacing:2,display:'block',marginBottom:6}}>Start Time</label>
                <input type="time" value={form.start_time} onChange={e=>setForm({...form,start_time:e.target.value})} style={{...s.input,width:'100%'}} />
              </div>
              <div>
                <label style={{fontSize:9,fontWeight:800,color:T.muted,textTransform:'uppercase',letterSpacing:2,display:'block',marginBottom:6}}>End Time</label>
                <input type="time" value={form.end_time} onChange={e=>setForm({...form,end_time:e.target.value})} style={{...s.input,width:'100%'}} />
              </div>
            </div>
            <div style={{display:'flex',gap:10,justifyContent:'flex-end'}}>
              <button onClick={()=>setShowAdd(false)} style={s.btnGhost}>Cancel</button>
              <button onClick={addSlot} disabled={saving} style={s.btn}>{saving?'Saving…':'Add Slot'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
