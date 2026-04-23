import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'

export default function ProtectedRoute({ children, role }) {
  const [status, setStatus] = useState('loading')

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) { setStatus('denied'); return }

      const { data, error } = await supabase
        .from('users')
        .select('role')
        .eq('user_id', user.id)
        .single()

      if (error || !data) { setStatus('denied'); return }

      data.role === role ? setStatus('allowed') : setStatus('denied')
    }
    checkAuth()
  }, [role])

  if (status === 'loading') return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', fontFamily:'Arial' }}>
      <p>Loading...</p>
    </div>
  )

  if (status === 'denied') return <Navigate to="/auth" replace />

  return children
}