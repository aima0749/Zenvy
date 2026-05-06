import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'

// ── Shared colour tokens ─────────────────────────────────────────
export const T = {
  sidebar:       '#1a2038',
  sidebarBorder: '#2e3a60',
  sidebarHover:  '#222e50',
  sidebarText:   '#5068a0',
  sidebarMuted:  '#3e5080',
  sidebarHead:   '#c8d4f0',
  blue:          '#6aaad0',
  blueMid:       '#8dc0dc',
  blueLight:     '#b5d8ec',
  bluePale:      '#daeef8',
  blueUltra:     '#edf6fb',
  purple:        '#9b8ec4',
  purpleMid:     '#b8aed8',
  purpleLight:   '#d4cef0',
  purplePale:    '#ece8f8',
  mixBg:         '#eef0f9',
  mixCard:       '#f4f5fc',
  mixBorder:     '#c2cae8',
  mixPale:       '#e8eaf8',
  ink:           '#1a2035',
  muted:         '#6878a8',
  terra:         '#c4725a',
  grad:          'linear-gradient(90deg,#6aaad0,#9b8ec4)',
  gradPale:      'linear-gradient(90deg,#daeef8,#ece8f8)',
}

// ── Badge helpers ────────────────────────────────────────────────
export const bookingBadge = (status) => ({
  pending:     { bg: '#fff7ed', color: '#c2410c', border: '#fdba74' },
  accepted:    { bg: '#eff6ff', color: '#1d4ed8', border: '#93c5fd' },
  in_progress: { bg: '#faf5ff', color: '#7c3aed', border: '#c4b5fd' },
  completed:   { bg: '#f0fdf4', color: '#15803d', border: '#86efac' },
  cancelled:   { bg: '#fff1f2', color: '#be123c', border: '#fda4af' },
}[status] || { bg: '#fff7ed', color: '#c2410c', border: '#fdba74' })

export const paymentBadge = (status) => ({
  completed: { bg: '#f0fdf4', color: '#15803d', border: '#86efac' },
  pending:   { bg: '#fff7ed', color: '#c2410c', border: '#fdba74' },
  failed:    { bg: '#fff1f2', color: '#be123c', border: '#fda4af' },
  refunded:  { bg: '#eff6ff', color: '#1d4ed8', border: '#93c5fd' },
}[status] || { bg: '#fff7ed', color: '#c2410c', border: '#fdba74' })

export const roleBadge = (role) => ({
  customer:         { bg: T.bluePale,   color: '#1a4870', border: T.blueMid },
  service_provider: { bg: '#f0fdf4',    color: '#15803d', border: '#86efac' },
  admin:            { bg: '#fff1f2',    color: '#be123c', border: '#fda4af' },
}[role] || { bg: T.bluePale, color: '#1a4870', border: T.blueMid })

// ── Shared inline styles ─────────────────────────────────────────
export const s = {
  page:    { display:'flex', fontFamily:"'Nunito',sans-serif", minHeight:'100vh', background: T.mixBg },
  main:    { marginLeft:220, flex:1, padding:'28px 32px' },
  card:    { background: T.mixCard, border:`2px solid ${T.mixBorder}`, borderRadius:14, padding:20, boxShadow:'0 2px 8px rgba(80,100,180,0.10)' },
  cardHov: { transition:'box-shadow 0.2s' },

  h1:      { fontSize:24, fontWeight:800, margin:0, color: T.ink, fontFamily:"'Cormorant Garamond',serif", letterSpacing:0.5 },
  sub:     { color: T.muted, marginTop:4, fontSize:13, fontWeight:600 },

  statGrid: { display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:22 },
  statCard: { background: T.mixCard, border:`2px solid ${T.mixBorder}`, borderRadius:12, padding:'16px 18px', boxShadow:'0 2px 8px rgba(80,100,180,0.08)' },
  statLabel:{ fontSize:9, color: T.muted, textTransform:'uppercase', letterSpacing:2, fontWeight:800, marginBottom:6 },
  statNum:  { fontSize:28, fontWeight:800, color: T.ink, fontFamily:"'Cormorant Garamond',serif", letterSpacing:-1 },

  tableWrap:{ background: T.mixCard, border:`2px solid ${T.mixBorder}`, borderRadius:14, overflow:'hidden', boxShadow:'0 2px 8px rgba(80,100,180,0.08)' },
  tableHead:{ background:`linear-gradient(90deg,${T.blueUltra},${T.purplePale})` },
  th:       { padding:'10px 14px', textAlign:'left', fontSize:8.5, textTransform:'uppercase', letterSpacing:2, color: T.muted, fontWeight:800, borderBottom:`2px solid ${T.mixPale}`, whiteSpace:'nowrap' },
  td:       { padding:'11px 14px', fontSize:13, color: T.ink, verticalAlign:'middle', fontWeight:600 },
  tr:       { borderBottom:`1.5px solid ${T.mixPale}` },

  badge: (b) => ({ background:b.bg, color:b.color, border:`1.5px solid ${b.border}`, padding:'3px 10px', borderRadius:5, fontSize:9, fontWeight:700, textTransform:'uppercase', letterSpacing:0.8, display:'inline-block' }),

  btn:      { padding:'9px 20px', background: T.grad, color:'#fff', border:`2px solid rgba(80,100,180,0.25)`, borderRadius:7, cursor:'pointer', fontSize:13, fontWeight:800, fontFamily:"'Nunito',sans-serif", boxShadow:'0 2px 10px rgba(100,120,200,0.22)', transition:'all 0.2s' },
  btnGhost: { padding:'7px 14px', background:'transparent', border:`2px solid ${T.mixBorder}`, borderRadius:7, cursor:'pointer', fontSize:12, color: T.muted, fontWeight:700, fontFamily:"'Nunito',sans-serif" },
  btnSm:    (bg,col,bor) => ({ padding:'5px 11px', background:bg, color:col, border:`1.5px solid ${bor}`, borderRadius:6, cursor:'pointer', fontSize:11, fontWeight:700, fontFamily:"'Nunito',sans-serif" }),

  input:    { border:`2px solid ${T.mixBorder}`, borderRadius:7, padding:'9px 13px', fontSize:13, fontFamily:"'Nunito',sans-serif", outline:'none', background: T.mixBg, boxSizing:'border-box', color: T.ink, fontWeight:600 },
  select:   { border:`2px solid ${T.mixBorder}`, borderRadius:7, padding:'9px 13px', fontSize:13, fontFamily:"'Nunito',sans-serif", outline:'none', background: T.mixBg, color: T.ink, fontWeight:600 },

  filterBar:{ display:'flex', borderBottom:`2px solid ${T.mixBorder}`, marginBottom:20 },
  filterTab:(active) => ({ padding:'10px 16px', fontSize:12, cursor:'pointer', whiteSpace:'nowrap', fontFamily:"'Nunito',sans-serif", fontWeight: active ? 800 : 600, color: active ? T.blue : T.muted, borderBottom: active ? `2.5px solid ${T.blue}` : '2.5px solid transparent', marginBottom:-2 }),

  loading:  { display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', fontFamily:"'Nunito',sans-serif", background: T.mixBg, color: T.muted, fontSize:13, fontWeight:700, letterSpacing:2, textTransform:'uppercase' },

  modal:    { position:'fixed', inset:0, background:'rgba(20,28,60,0.50)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:2000, backdropFilter:'blur(4px)' },
  modalCard:{ background:'#fff', borderRadius:20, padding:28, boxShadow:'0 8px 40px rgba(80,100,180,0.18)', border:`2px solid ${T.mixBorder}` },

  avatar: (size=32) => ({ width:size, height:size, borderRadius:'50%', background:`linear-gradient(135deg,${T.blueLight},${T.purpleLight})`, border:`2px solid ${T.mixBorder}`, display:'flex', alignItems:'center', justifyContent:'center', color:'#2a3870', fontSize: size*0.3, fontWeight:800, flexShrink:0 }),
}

// ── useIsMobile hook ─────────────────────────────────────────────
export function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < breakpoint)
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < breakpoint)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [breakpoint])
  return isMobile
}

// ── PageLayout ───────────────────────────────────────────────────
export function PageLayout({ children }) {
  const isMobile = useIsMobile()
  return (
    <main style={{ ...s.main, marginLeft: isMobile ? 0 : 220, padding: isMobile ? '16px' : '28px 32px' }}>
      {children}
    </main>
  )
}

// ── StatGrid ─────────────────────────────────────────────────────
export function StatGrid({ stats = [], cols = 4 }) {
  return (
    <div style={{ ...s.statGrid, gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
      {stats.map((stat, i) => (
        <div key={i} style={s.statCard}>
          <div style={s.statLabel}>{stat.label}</div>
          <div style={{ ...s.statNum, color: stat.color || s.statNum.color }}>{stat.value}</div>
        </div>
      ))}
    </div>
  )
}

// ── Animated Logo Mark ───────────────────────────────────────────
export function LogoMark({ size = 36 }) {
  const r1 = useRef(), r2 = useRef()
  useEffect(() => {
    let a1 = 0, a2 = 0, id
    const tick = () => {
      a1 += 0.4; a2 -= 0.25
      if (r1.current) r1.current.style.transform = `rotate(${a1}deg)`
      if (r2.current) r2.current.style.transform = `rotate(${a2}deg)`
      id = requestAnimationFrame(tick)
    }
    id = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(id)
  }, [])
  return (
    <div style={{ position:'relative', width:size, height:size, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
      <div ref={r1} style={{ position:'absolute', width:size, height:size, borderRadius:'50%', border:`2.5px solid ${T.blueMid}` }} />
      <div ref={r2} style={{ position:'absolute', width:size*0.7, height:size*0.7, borderRadius:'50%', border:`2px dashed ${T.purpleMid}` }} />
      <div style={{ width:size*0.22, height:size*0.22, borderRadius:'50%', background:T.grad, position:'relative', zIndex:1 }} />
    </div>
  )
}

// ── Sidebar Component ────────────────────────────────────────────
export default function Sidebar({ items, userName, userRole, extra }) {
  const navigate = useNavigate()
  const isMobile = useIsMobile()
  const [open, setOpen] = useState(false)
  const logout = async () => { await supabase.auth.signOut(); navigate('/auth') }

  // Mobile hamburger button
  const hamburger = isMobile ? (
    <button onClick={() => setOpen(o => !o)} style={{
      position: 'fixed', top: 12, left: 12, zIndex: 200,
      background: T.sidebar, border: `2px solid ${T.sidebarBorder}`,
      borderRadius: 8, width: 38, height: 38, cursor: 'pointer',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', gap: 5, padding: 0,
    }}>
      {[0,1,2].map(i => (
        <span key={i} style={{ width: 18, height: 2, background: T.sidebarHead, borderRadius: 2, display: 'block' }} />
      ))}
    </button>
  ) : null

  // Overlay for mobile
  const overlay = isMobile && open ? (
    <div onClick={() => setOpen(false)} style={{
      position: 'fixed', inset: 0, background: 'rgba(20,28,60,0.5)',
      zIndex: 99, backdropFilter: 'blur(2px)',
    }} />
  ) : null

  const sidebarVisible = !isMobile || open

  return (
    <>
      {hamburger}
      {overlay}
      {sidebarVisible && (
        <aside style={{
          width: 220, background: T.sidebar, display: 'flex', flexDirection: 'column',
          position: 'fixed', top: 0, left: 0, bottom: 0,
          borderRight: `2.5px solid ${T.sidebarBorder}`, zIndex: 100,
          transform: (isMobile && !open) ? 'translateX(-100%)' : 'translateX(0)',
          transition: 'transform 0.25s ease',
        }}>

          {/* Logo */}
          <div style={{ padding:'20px 16px 14px', borderBottom:`2px solid ${T.sidebarBorder}`, display:'flex', alignItems:'center', gap:10 }}>
            <LogoMark size={36} />
            <div>
              <div style={{ fontFamily:"'Righteous',cursive", fontSize:20, color: T.sidebarHead, letterSpacing:3, lineHeight:1 }}>Zenvy</div>
              <div style={{ fontSize:7.5, color: T.sidebarMuted, letterSpacing:3, textTransform:'uppercase', marginTop:2 }}>Milano, MCMLXXIV</div>
            </div>
            {isMobile && (
              <button onClick={() => setOpen(false)} style={{ marginLeft:'auto', background:'none', border:'none', color: T.sidebarMuted, fontSize:20, cursor:'pointer', padding:4 }}>✕</button>
            )}
          </div>

          {/* User */}
          <div style={{ padding:'12px 16px', borderBottom:`2px solid ${T.sidebarBorder}`, display:'flex', alignItems:'center', gap:9 }}>
            <div style={{ ...s.avatar(30), fontSize:11 }}>{userName?.charAt(0) || '?'}</div>
            <div>
              <div style={{ color: T.sidebarHead, fontSize:12, fontWeight:700 }}>{userName}</div>
              <div style={{ color: T.sidebarMuted, fontSize:9, letterSpacing:2, textTransform:'uppercase' }}>{userRole}</div>
              {extra}
            </div>
          </div>

          {/* Nav */}
          <nav style={{ flex:1, padding:'10px 0' }}>
            {items.map(item => (
              <div key={item.path} onClick={() => { navigate(item.path); if (isMobile) setOpen(false) }}
                style={{ padding:'9px 16px', display:'flex', alignItems:'center', gap:10, fontSize:12, fontWeight:700, cursor:'pointer', borderRadius:'0 99px 99px 0', marginRight:12, marginBottom:2, letterSpacing:0.3, transition:'all 0.2s',
                  color:      item.active ? '#fff'          : T.sidebarText,
                  background: item.active ? T.grad          : 'transparent',
                  border:     item.active ? `1.5px solid rgba(255,255,255,0.15)` : '1.5px solid transparent',
                }}>
                <span style={{ fontSize:14, width:18, textAlign:'center' }}>{item.icon}</span>
                {item.label}
              </div>
            ))}
          </nav>

          {/* Logout */}
          <div style={{ padding:'12px 16px', borderTop:`2px solid ${T.sidebarBorder}` }}>
            <div onClick={logout} style={{ fontSize:11, color: T.terra, cursor:'pointer', fontWeight:700, letterSpacing:1, textTransform:'uppercase', transition:'letter-spacing 0.2s' }}>
              ↪ Sign Out
            </div>
          </div>
        </aside>
      )}
    </>
  )
}
