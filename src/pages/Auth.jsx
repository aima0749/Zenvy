import { useState } from 'react'
import { supabase } from '../supabaseClient'
import { useNavigate } from 'react-router-dom'

export default function Auth() {
  const [tab, setTab] = useState('login')
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    first_name: '', last_name: '', email: '',
    password: '', role: 'customer',
    street: '', city: '', zip_code: '',
    experience_years: '', availability_status: true
  })
  const navigate = useNavigate()
  const update = (field, value) => setForm({ ...form, [field]: value })

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    const { data, error } = await supabase.auth.signInWithPassword({ email: form.email, password: form.password })
    if (error) { alert(error.message); setLoading(false); return }
    const { data: userData } = await supabase.from('users').select('role').eq('user_id', data.user.id).single()
    if (!userData) { alert('Could not fetch role'); setLoading(false); return }
    if (userData.role === 'customer') navigate('/customer/dashboard')
    else if (userData.role === 'service_provider') navigate('/provider/dashboard')
    else if (userData.role === 'admin') navigate('/admin/dashboard')
    setLoading(false)
  }

  const handleSignup = async (e) => {
    e.preventDefault()
    setLoading(true)
    const { data, error } = await supabase.auth.signUp({ email: form.email, password: form.password })
    if (error) { alert(error.message); setLoading(false); return }
    if (!data.user) { alert('Check your email!'); setLoading(false); return }
    const userId = data.user.id
    const { error: userError } = await supabase.from('users').insert({
      user_id: userId, first_name: form.first_name, last_name: form.last_name, email: form.email, role: form.role
    })

    if (userError) { alert('User insert error: ' + JSON.stringify(userError)); setLoading(false); return }
    if (form.role === 'customer') {
      await supabase.from('customer').insert({ user_id: userId, street: form.street, city: form.city, zip_code: form.zip_code })
      navigate('/customer/dashboard')
    } else if (form.role === 'service_provider') {
      await supabase.from('service_provider').insert({ user_id: userId, experience_years: parseInt(form.experience_years) || 0, availability_status: form.availability_status })
      navigate('/provider/dashboard')
    }
    setLoading(false)
  }

  const s = {
    page: { minHeight:'100vh', background:'#f4f3f0', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Arial' },
    card: { background:'#fff', borderRadius:14, padding:32, width:460, boxShadow:'0 4px 16px rgba(0,0,0,0.10)', border:'1px solid #d4d2cc' },
    logo: { textAlign:'center', fontSize:26, fontWeight:700, marginBottom:4 },
    sub: { textAlign:'center', color:'#6b6860', fontSize:13, marginBottom:24 },
    tabBar: { display:'flex', borderBottom:'2px solid #d4d2cc', marginBottom:20 },
    tab: (active) => ({ padding:'10px 18px', fontSize:13, cursor:'pointer', color: active ? '#3d5afe':'#6b6860', borderBottom: active ? '2px solid #3d5afe':'2px solid transparent', marginBottom:-2, fontWeight: active ? 600:400 }),
    label: { fontSize:12, fontWeight:500, color:'#6b6860', textTransform:'uppercase', letterSpacing:0.5, marginBottom:6, display:'block' },
    input: { width:'100%', border:'1.5px dashed #d4d2cc', borderRadius:7, padding:'10px 13px', fontSize:13, fontFamily:'Arial', outline:'none', background:'#f4f3f0', boxSizing:'border-box', marginBottom:14 },
    grid: { display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 },
    btn: { width:'100%', padding:11, background:'#3d5afe', color:'#fff', border:'none', borderRadius:7, fontSize:14, fontWeight:600, cursor:'pointer', marginTop:6 },
    link: { textAlign:'center', marginTop:12, fontSize:12, color:'#9b978f' },
    linkA: { color:'#3d5afe', cursor:'pointer' },
    sectionLabel: { fontSize:11, fontWeight:700, color:'#3d5afe', textTransform:'uppercase', letterSpacing:1, margin:'16px 0 10px', borderTop:'1px solid #eee', paddingTop:14 }
  }

  return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={s.logo}><span style={{color:'#3d5afe'}}>Z</span>envy</div>
        <div style={s.sub}>Service Marketplace — Pakistan</div>
        <div style={s.tabBar}>
          <div style={s.tab(tab==='login')} onClick={() => setTab('login')}>Log In</div>
          <div style={s.tab(tab==='signup')} onClick={() => setTab('signup')}>Sign Up</div>
        </div>

        {tab === 'login' && (
          <form onSubmit={handleLogin}>
            <label style={s.label}>Email Address</label>
            <input style={s.input} type="email" placeholder="john@example.com" required onChange={e => update('email', e.target.value)} />
            <label style={s.label}>Password</label>
            <input style={s.input} type="password" placeholder="••••••••" required onChange={e => update('password', e.target.value)} />
            <button style={s.btn} disabled={loading}>{loading ? 'Logging in...' : 'Log In →'}</button>
            <div style={s.link}>Don't have an account? <span style={s.linkA} onClick={() => setTab('signup')}>Sign Up</span></div>
          </form>
        )}

        {tab === 'signup' && (
          <form onSubmit={handleSignup}>
            <div style={s.grid}>
              <div><label style={s.label}>First Name</label><input style={s.input} placeholder="John" required onChange={e => update('first_name', e.target.value)} /></div>
              <div><label style={s.label}>Last Name</label><input style={s.input} placeholder="Doe" required onChange={e => update('last_name', e.target.value)} /></div>
            </div>
            <label style={s.label}>Email</label>
            <input style={s.input} type="email" placeholder="john@example.com" required onChange={e => update('email', e.target.value)} />
            <label style={s.label}>Password</label>
            <input style={s.input} type="password" placeholder="Min 6 characters" required onChange={e => update('password', e.target.value)} />
            <label style={s.label}>I am a...</label>
            <select style={s.input} onChange={e => update('role', e.target.value)}>
              <option value="customer">Customer</option>
              <option value="service_provider">Service Provider</option>
            </select>
            {form.role === 'customer' && (
              <>
                <div style={s.sectionLabel}>Address Details</div>
                <div style={s.grid}>
                  <div><label style={s.label}>Street</label><input style={s.input} placeholder="123 Main St" onChange={e => update('street', e.target.value)} /></div>
                  <div><label style={s.label}>City</label><input style={s.input} placeholder="Rawalpindi" onChange={e => update('city', e.target.value)} /></div>
                </div>
                <label style={s.label}>Zip Code</label>
                <input style={s.input} placeholder="46000" onChange={e => update('zip_code', e.target.value)} />
              </>
            )}
            {form.role === 'service_provider' && (
              <>
                <div style={s.sectionLabel}>Provider Details</div>
                <label style={s.label}>Years of Experience</label>
                <input style={s.input} type="number" placeholder="e.g. 5" onChange={e => update('experience_years', e.target.value)} />
                <label style={s.label}>Availability Status</label>
                <select style={s.input} onChange={e => update('availability_status', e.target.value === 'true')}>
                  <option value="true">Available</option>
                  <option value="false">Busy</option>
                </select>
              </>
            )}
            <button style={s.btn} disabled={loading}>{loading ? 'Creating account...' : 'Create Account →'}</button>
            <div style={s.link}>Already have an account? <span style={s.linkA} onClick={() => setTab('login')}>Log In</span></div>
          </form>
        )}
      </div>
    </div>
  )
}