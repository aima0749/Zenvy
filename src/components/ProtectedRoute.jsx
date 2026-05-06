import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'

export default function ProtectedRoute({ children, role }) {
  const [status, setStatus] = useState('loading') // 'loading' | 'ok' | 'denied'

  useEffect(() => {
    const check = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { setStatus('denied'); return }

      const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('user_id', session.user.id)
        .single()

      if (!userData || userData.role !== role) {
        setStatus('denied')
      } else {
        setStatus('ok')
      }
    }
    check()
  }, [role])

  if (status === 'loading') {
    return (
      <div style={{
        height: '100vh',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'linear-gradient(135deg, #daeef8, #eef0f9, #ece8f8)',
        fontFamily: "'Nunito', sans-serif",
        color: '#6878a8', fontSize: 13, fontWeight: 700,
        letterSpacing: 2, textTransform: 'uppercase',
      }}>
        Loading...
      </div>
    )
  }

  if (status === 'denied') return <Navigate to="/auth" />

  return children
}