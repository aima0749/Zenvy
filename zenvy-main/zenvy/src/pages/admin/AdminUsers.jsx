import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../supabaseClient'
import Sidebar, { PageLayout, StatGrid, useIsMobile, T, s, roleBadge } from '../../components/Sidebar'

const NAV = [
  { label:'Dashboard', icon:'◉', path:'/admin/dashboard' },
  { label:'Users',     icon:'◈', path:'/admin/users', active:true },
  { label:'Bookings',  icon:'◇', path:'/admin/bookings' },
  { label:'Services',  icon:'◎', path:'/admin/services' },
  { label:'Payments',  icon:'◷', path:'/admin/payments' },
  { label:'Reviews',   icon:'♡', path:'/admin/reviews' },
]

export default function AdminUsers() {
  const [users, setUsers]     = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter]   = useState('all')
  const [search, setSearch]   = useState('')
  const [stats, setStats]     = useState({ total:0, customers:0, providers:0, admins:0 })
  const [adminUser, setAdminUser] = useState(null)
  const navigate = useNavigate()

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    const { data, error } = await supabase.from('users')
      .select('user_id,first_name,last_name,email,role,created_at')
      .order('created_at',{ascending:false})
    console.log('admin users:', data, error)
    setUsers(data||[])
    setStats({ total:(data||[]).length, customers:(data||[]).filter(u=>u.role==='customer').length, providers:(data||[]).filter(u=>u.role==='service_provider').length, admins:(data||[]).filter(u=>u.role==='admin').length })
    setLoading(false)
  }

  const deleteUser = async (userId) => {
    if (!window.confirm('Delete this user? This cannot be undone.')) return
    const { error } = await supabase.from('users').delete().eq('user_id', userId)
    if (error) { alert('Error: '+error.message); return }
    fetchData()
  }

  const counts = { all:users.length, customer:users.filter(u=>u.role==='customer').length, service_provider:users.filter(u=>u.role==='service_provider').length, admin:users.filter(u=>u.role==='admin').length }

  const filtered = users
    .filter(u => filter==='all' ? true : u.role===filter)
    .filter(u => {
      if (!search) return true
      const name = `${u.first_name} ${u.last_name}`.toLowerCase()
      const email = u.email?.toLowerCase() || ''
      return name.includes(search.toLowerCase()) || email.includes(search.toLowerCase())
    })

  if (loading) return <div style={s.loading}>Loading…</div>

  return (
    <div style={s.page}>
      <Sidebar items={NAV} userName={`${adminUser?.first_name||""} ${adminUser?.last_name||""}`} userRole="Super Admin" />
      <PageLayout>
        <div style={{ marginBottom:22, paddingBottom:16, borderBottom:`2px solid ${T.mixBorder}` }}>
          <h1 style={s.h1}>User Management</h1><p style={s.sub}>Manage all platform users — customers, providers, and admins</p>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:12, marginBottom:22 }}>
          {[{label:'Total Users',value:stats.total,color:T.ink},{label:'Customers',value:stats.customers,color:T.blue},{label:'Providers',value:stats.providers,color:T.purple},{label:'Admins',value:stats.admins,color:T.terra}].map(st=>(
            <div key={st.label} style={s.statCard}><div style={s.statLabel}>{st.label}</div><div style={{...s.statNum,color:st.color}}>{st.value}</div></div>
          ))}
        </div>

        <div style={{...s.card,marginBottom:16,display:'flex',gap:10,alignItems:'center'}}>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍  Search by name or email..." style={{...s.input,flex:1}} />
          <button onClick={()=>setSearch('')} style={s.btnGhost}>Clear</button>
        </div>

        <div style={s.filterBar}>
          {[{key:'all',label:'All'},{key:'customer',label:'Customers'},{key:'service_provider',label:'Providers'},{key:'admin',label:'Admins'}].map(tab=>(
            <div key={tab.key} onClick={()=>setFilter(tab.key)} style={s.filterTab(filter===tab.key)}>
              {tab.label}
              <span style={{marginLeft:6,fontSize:10,color:T.muted}}>({counts[tab.key]??0})</span>
            </div>
          ))}
        </div>

        <div style={{ ...s.tableWrap }}>
          {filtered.length===0 ? (
            <div style={{textAlign:'center',padding:'50px 20px',color:T.muted}}>
              <div style={{fontSize:36,opacity:0.3,marginBottom:12}}>◈</div>
              <p style={{fontWeight:600}}>No users found.</p>
            </div>
          ) : (
            <table style={{width:'100%',borderCollapse:'collapse',minWidth:600}}>
              <thead><tr style={s.tableHead}>{['#','User','Email','Role','Joined','Actions'].map(h=><th key={h} style={s.th}>{h}</th>)}</tr></thead>
              <tbody>
                {filtered.map((u,i) => {
                  const badge = roleBadge(u.role)
                  return (
                    <tr key={u.user_id} style={s.tr}>
                      <td style={{...s.td,fontSize:10,color:T.muted}}>#{String(i+1).padStart(3,'0')}</td>
                      <td style={s.td}>
                        <div style={{display:'flex',alignItems:'center',gap:10}}>
                          <div style={s.avatar(32)}>{u.first_name?.charAt(0)}</div>
                          <div style={{fontWeight:700,color:T.ink}}>{u.first_name} {u.last_name}</div>
                        </div>
                      </td>
                      <td style={{...s.td,color:T.muted}}>{u.email}</td>
                      <td style={s.td}><span style={s.badge(badge)}>{u.role==='service_provider'?'Provider':u.role.charAt(0).toUpperCase()+u.role.slice(1)}</span></td>
                      <td style={{...s.td,color:T.muted}}>{new Date(u.created_at).toLocaleDateString()}</td>
                      <td style={s.td}>
                        <button onClick={()=>deleteUser(u.user_id)} style={s.btnSm('#fff1f2','#be123c','#fda4af')}>Delete</button>
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
