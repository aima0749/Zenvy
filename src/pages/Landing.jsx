import { useNavigate } from 'react-router-dom'

export default function Landing() {
  const navigate = useNavigate()
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', fontFamily:'Arial', background:'#f4f3f0' }}>
      <div style={{ textAlign:'center' }}>
        <h1 style={{ fontSize:36, marginBottom:8 }}><span style={{ color:'#3d5afe' }}>Z</span>envy</h1>
        <p style={{ color:'#6b6860', marginBottom:24 }}>Service Marketplace — Pakistan</p>
        <button onClick={() => navigate('/auth')}
          style={{ padding:'12px 32px', background:'#3d5afe', color:'#fff', border:'none', borderRadius:8, fontSize:15, cursor:'pointer', fontWeight:600 }}>
          Get Started →
        </button>
      </div>
    </div>
  )
}