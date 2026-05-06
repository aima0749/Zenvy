import { useState } from 'react'
import { supabase } from '../supabaseClient'
import { useNavigate } from 'react-router-dom'
import { useEffect, useRef } from 'react'

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
  const ring1Ref = useRef()
  const ring2Ref = useRef()

  const update = (field, value) => setForm({ ...form, [field]: value })

  useEffect(() => {
    let angle1 = 0, angle2 = 0
    const frame = () => {
      angle1 += 0.4
      angle2 -= 0.25
      if (ring1Ref.current) ring1Ref.current.style.transform = `rotate(${angle1}deg)`
      if (ring2Ref.current) ring2Ref.current.style.transform = `rotate(${angle2}deg)`
      requestAnimationFrame(frame)
    }
    const id = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(id)
  }, [])

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

  const c = {
    page: {
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #daeef8 0%, #eef0f9 40%, #ece8f8 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Nunito', sans-serif",
      position: 'relative', overflow: 'hidden',
    },
    blob1: {
      position: 'absolute', top: -80, left: -80,
      width: 340, height: 340, borderRadius: '50%',
      background: 'radial-gradient(circle, #b5d8ec44, transparent 70%)',
      pointerEvents: 'none',
    },
    blob2: {
      position: 'absolute', bottom: -100, right: -60,
      width: 400, height: 400, borderRadius: '50%',
      background: 'radial-gradient(circle, #d4cef044, transparent 70%)',
      pointerEvents: 'none',
    },
    card: {
      background: 'rgba(255,255,255,0.80)',
      backdropFilter: 'blur(16px)',
      borderRadius: 24,
      padding: '36px 40px',
      width: 480,
      maxWidth: '94vw',
      boxShadow: '0 8px 40px rgba(80,100,180,0.13)',
      border: '2px solid #c2cae8',
      animation: 'fadeInUp 0.5s ease both',
    },
    logoWrap: {
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      gap: 12, marginBottom: 6,
    },
    logoText: {
      fontFamily: "'Righteous', cursive",
      fontSize: 26,
      background: 'linear-gradient(90deg, #6aaad0, #9b8ec4)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      letterSpacing: 3, lineHeight: 1,
    },
    logoSub: {
      fontSize: 7.5, color: '#a0b0d0',
      letterSpacing: 3, textTransform: 'uppercase', marginTop: 2,
    },
    sub: {
      textAlign: 'center', color: '#6878a8',
      fontSize: 12, marginBottom: 22, fontWeight: 600,
      letterSpacing: 0.5,
    },
    tabBar: {
      display: 'flex', borderBottom: '2px solid #e8eaf8', marginBottom: 22,
    },
    tab: (active) => ({
      flex: 1, padding: '10px 0', fontSize: 13, cursor: 'pointer', textAlign: 'center',
      fontFamily: "'Nunito', sans-serif",
      fontWeight: active ? 800 : 600,
      color: active ? '#6aaad0' : '#a0b0d0',
      borderBottom: active ? '2.5px solid #6aaad0' : '2.5px solid transparent',
      marginBottom: -2,
      background: 'none', border: 'none',
      borderBottomWidth: 2.5,
      borderBottomStyle: 'solid',
      borderBottomColor: active ? '#6aaad0' : 'transparent',
      transition: 'all 0.18s',
    }),
    label: {
      fontSize: 10, fontWeight: 800, color: '#6878a8',
      textTransform: 'uppercase', letterSpacing: 1.5,
      marginBottom: 6, display: 'block',
    },
    input: {
      width: '100%', border: '2px solid #c2cae8',
      borderRadius: 8, padding: '10px 13px',
      fontSize: 13, fontFamily: "'Nunito', sans-serif",
      outline: 'none', background: '#eef0f9',
      boxSizing: 'border-box', marginBottom: 14,
      color: '#1a2035', fontWeight: 600,
      transition: 'border-color 0.18s, box-shadow 0.18s',
    },
    grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
    btn: {
      width: '100%', padding: 12,
      background: 'linear-gradient(90deg, #6aaad0, #9b8ec4)',
      color: '#fff', border: '2px solid rgba(80,100,180,0.20)',
      borderRadius: 8, fontSize: 14,
      fontWeight: 800, cursor: 'pointer', marginTop: 6,
      fontFamily: "'Nunito', sans-serif",
      boxShadow: '0 3px 12px rgba(100,120,200,0.25)',
      letterSpacing: 0.5, transition: 'all 0.2s',
    },
    link: { textAlign: 'center', marginTop: 14, fontSize: 12, color: '#a0b0d0' },
    linkA: { color: '#6aaad0', cursor: 'pointer', fontWeight: 800 },
    sectionLabel: {
      fontSize: 9, fontWeight: 800,
      background: 'linear-gradient(90deg, #6aaad0, #9b8ec4)',
      WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
      textTransform: 'uppercase', letterSpacing: 2,
      margin: '16px 0 12px', borderTop: '2px solid #e8eaf8',
      paddingTop: 14, display: 'block',
    },
  }

  const focusInput = (e) => {
    e.target.style.borderColor = '#6aaad0'
    e.target.style.boxShadow = '0 0 0 3px rgba(106,170,208,0.18)'
    e.target.style.background = '#fff'
  }
  const blurInput = (e) => {
    e.target.style.borderColor = '#c2cae8'
    e.target.style.boxShadow = 'none'
    e.target.style.background = '#eef0f9'
  }

  return (
    <div style={c.page}>
      <div style={c.blob1} />
      <div style={c.blob2} />

      <div style={c.card}>

        {/* Logo */}
        <div style={c.logoWrap}>
          <div style={{ position: 'relative', width: 38, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div ref={ring1Ref} style={{ position: 'absolute', width: 38, height: 38, borderRadius: '50%', border: '2.5px solid #8dc0dc' }} />
            <div ref={ring2Ref} style={{ position: 'absolute', width: 26, height: 26, borderRadius: '50%', border: '2px dashed #b8aed8' }} />
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'linear-gradient(135deg, #6aaad0, #9b8ec4)', position: 'relative', zIndex: 1 }} />
          </div>
          <div>
            <div style={c.logoText}>Zenvy</div>
            <div style={c.logoSub}>Milano, MCMLXXIV</div>
          </div>
        </div>

        <div style={c.sub}>Service Marketplace — Pakistan</div>

        {/* Tabs */}
        <div style={c.tabBar}>
          <button style={c.tab(tab === 'login')} onClick={() => setTab('login')}>Log In</button>
          <button style={c.tab(tab === 'signup')} onClick={() => setTab('signup')}>Sign Up</button>
        </div>

        {/* LOGIN */}
        {tab === 'login' && (
          <form onSubmit={handleLogin}>
            <label style={c.label}>Email Address</label>
            <input style={c.input} type="email" placeholder="john@example.com" required
              onFocus={focusInput} onBlur={blurInput}
              onChange={e => update('email', e.target.value)} />
            <label style={c.label}>Password</label>
            <input style={c.input} type="password" placeholder="••••••••" required
              onFocus={focusInput} onBlur={blurInput}
              onChange={e => update('password', e.target.value)} />
            <button style={c.btn} disabled={loading}
              onMouseEnter={e => { e.target.style.opacity = '0.88'; e.target.style.transform = 'translateY(-1px)' }}
              onMouseLeave={e => { e.target.style.opacity = '1'; e.target.style.transform = 'translateY(0)' }}>
              {loading ? 'Logging in...' : 'Log In →'}
            </button>
            <div style={c.link}>
              Don't have an account?{' '}
              <span style={c.linkA} onClick={() => setTab('signup')}>Sign Up</span>
            </div>
          </form>
        )}

        {/* SIGNUP */}
        {tab === 'signup' && (
          <form onSubmit={handleSignup}>
            <div style={c.grid}>
              <div>
                <label style={c.label}>First Name</label>
                <input style={c.input} placeholder="John" required
                  onFocus={focusInput} onBlur={blurInput}
                  onChange={e => update('first_name', e.target.value)} />
              </div>
              <div>
                <label style={c.label}>Last Name</label>
                <input style={c.input} placeholder="Doe" required
                  onFocus={focusInput} onBlur={blurInput}
                  onChange={e => update('last_name', e.target.value)} />
              </div>
            </div>

            <label style={c.label}>Email</label>
            <input style={c.input} type="email" placeholder="john@example.com" required
              onFocus={focusInput} onBlur={blurInput}
              onChange={e => update('email', e.target.value)} />

            <label style={c.label}>Password</label>
            <input style={c.input} type="password" placeholder="Min 6 characters" required
              onFocus={focusInput} onBlur={blurInput}
              onChange={e => update('password', e.target.value)} />

            <label style={c.label}>I am a...</label>
            <select style={c.input}
              onFocus={focusInput} onBlur={blurInput}
              onChange={e => update('role', e.target.value)}>
              <option value="customer">Customer</option>
              <option value="service_provider">Service Provider</option>
            </select>

            {form.role === 'customer' && (
              <>
                <span style={c.sectionLabel}>Address Details</span>
                <div style={c.grid}>
                  <div>
                    <label style={c.label}>Street</label>
                    <input style={c.input} placeholder="123 Main St"
                      onFocus={focusInput} onBlur={blurInput}
                      onChange={e => update('street', e.target.value)} />
                  </div>
                  <div>
                    <label style={c.label}>City</label>
                    <input style={c.input} placeholder="Rawalpindi"
                      onFocus={focusInput} onBlur={blurInput}
                      onChange={e => update('city', e.target.value)} />
                  </div>
                </div>
                <label style={c.label}>Zip Code</label>
                <input style={c.input} placeholder="46000"
                  onFocus={focusInput} onBlur={blurInput}
                  onChange={e => update('zip_code', e.target.value)} />
              </>
            )}

            {form.role === 'service_provider' && (
              <>
                <span style={c.sectionLabel}>Provider Details</span>
                <label style={c.label}>Years of Experience</label>
                <input style={c.input} type="number" placeholder="e.g. 5"
                  onFocus={focusInput} onBlur={blurInput}
                  onChange={e => update('experience_years', e.target.value)} />
                <label style={c.label}>Availability Status</label>
                <select style={c.input}
                  onFocus={focusInput} onBlur={blurInput}
                  onChange={e => update('availability_status', e.target.value === 'true')}>
                  <option value="true">Available</option>
                  <option value="false">Busy</option>
                </select>
              </>
            )}

            <button style={c.btn} disabled={loading}
              onMouseEnter={e => { e.target.style.opacity = '0.88'; e.target.style.transform = 'translateY(-1px)' }}
              onMouseLeave={e => { e.target.style.opacity = '1'; e.target.style.transform = 'translateY(0)' }}>
              {loading ? 'Creating account...' : 'Create Account →'}
            </button>
            <div style={c.link}>
              Already have an account?{' '}
              <span style={c.linkA} onClick={() => setTab('login')}>Log In</span>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
