import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../supabaseClient'

export default function Availability() {
  const [slots, setSlots] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState(null)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ available_date: '', start_time: '', end_time: '' })
  const [saving, setSaving] = useState(false)
  const [filter, setFilter] = useState('all')
  const navigate = useNavigate()

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { navigate('/auth'); return }
    setCurrentUser(user)

    const { data } = await supabase
      .from('availability')
      .select('*')
      .eq('provider_id', user.id)
      .order('available_date', { ascending: true })
      .order('start_time', { ascending: true })

    setSlots(data || [])
    setLoading(false)
  }

  const addSlot = async () => {
    if (!form.available_date || !form.start_time || !form.end_time) {
      alert('Please fill all fields')
      return
    }
    if (form.start_time >= form.end_time) {
      alert('End time must be after start time')
      return
    }

    setSaving(true)
    const { error } = await supabase.from('availability').insert({
      provider_id: currentUser.id,
      available_date: form.available_date,
      start_time: form.start_time,
      end_time: form.end_time,
      is_booked: false
    })

    if (error) { alert('Error: ' + error.message); setSaving(false); return }

    setForm({ available_date: '', start_time: '', end_time: '' })
    setShowAdd(false)
    fetchData()
    setSaving(false)
  }

  const deleteSlot = async (scheduleId, isBooked) => {
    if (isBooked) { alert('Cannot delete a booked slot'); return }
    if (!window.confirm('Delete this slot?')) return
    await supabase.from('availability').delete().eq('schedule_id', scheduleId)
    fetchData()
  }

  const today = new Date().toISOString().split('T')[0]

  const filtered = filter === 'all'
    ? slots
    : filter === 'available'
    ? slots.filter(s => !s.is_booked && s.available_date >= today)
    : filter === 'booked'
    ? slots.filter(s => s.is_booked)
    : slots.filter(s => s.available_date < today)

  const counts = {
    all: slots.length,
    available: slots.filter(s => !s.is_booked && s.available_date >= today).length,
    booked: slots.filter(s => s.is_booked).length,
    past: slots.filter(s => s.available_date < today).length,
  }

  const sidebarItems = [
    { label: 'Dashboard', icon: '🏠', path: '/provider/dashboard' },
    { label: 'My Services', icon: '🔧', path: '/provider/services' },
    { label: 'Availability', icon: '📆', path: '/provider/availability', active: true },
    { label: 'Assigned Bookings', icon: '📋', path: '/provider/bookings' },
    { label: 'Bundle Tasks', icon: '📦', path: '/provider/bundles' },
    { label: 'My Reviews', icon: '⭐', path: '/provider/reviews' },
  ]

  const logout = async () => {
    await supabase.auth.signOut()
    navigate('/auth')
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      <p>Loading...</p>
    </div>
  )

  return (
    <div style={{ display: 'flex', fontFamily: 'Arial', minHeight: '100vh', background: '#f4f3f0' }}>

      {/* SIDEBAR */}
      <aside style={{ width: 240, background: '#1e1e2e', display: 'flex', flexDirection: 'column', position: 'fixed', top: 0, left: 0, bottom: 0 }}>
        <div style={{ padding: '24px 20px 16px', fontSize: 22, fontWeight: 700, color: '#fff', borderBottom: '1px solid #2e2e42' }}>
          <span style={{ color: '#3d5afe' }}>Z</span>envy
        </div>
        <nav style={{ flex: 1, paddingTop: 12 }}>
          {sidebarItems.map(item => (
            <div key={item.path} onClick={() => navigate(item.path)}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 20px', cursor: 'pointer', fontSize: 13, color: item.active ? '#fff' : '#c8c4bc', background: item.active ? '#3a3a52' : 'transparent', borderLeft: item.active ? '3px solid #3d5afe' : '3px solid transparent' }}>
              <span>{item.icon}</span> {item.label}
            </div>
          ))}
        </nav>
        <div style={{ padding: '16px 0', borderTop: '1px solid #2e2e42' }}>
          <div onClick={logout} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 20px', cursor: 'pointer', color: '#e57373', fontSize: 13 }}>
            <span>⬅️</span> Logout
          </div>
        </div>
      </aside>

      {/* MAIN */}
      <main style={{ marginLeft: 240, flex: 1, padding: '28px 32px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>My Availability</h1>
            <p style={{ color: '#6b6860', marginTop: 4, fontSize: 13 }}>Set your available time slots for customers to book</p>
          </div>
          <button onClick={() => setShowAdd(true)}
            style={{ padding: '9px 18px', background: '#3d5afe', color: '#fff', border: 'none', borderRadius: 7, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
            + Add Slot
          </button>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
          {[
            { label: 'Total Slots', value: counts.all, color: '#1a1a2e' },
            { label: 'Open Slots', value: counts.available, color: '#2e7d32' },
            { label: 'Booked Slots', value: counts.booked, color: '#3d5afe' },
            { label: 'Past Slots', value: counts.past, color: '#9b978f' },
          ].map(s => (
            <div key={s.label} style={{ background: '#fff', border: '1px solid #d4d2cc', borderRadius: 10, padding: '18px 20px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
              <div style={{ fontSize: 11, color: '#9b978f', textTransform: 'uppercase', letterSpacing: 0.8, fontFamily: 'monospace' }}>{s.label}</div>
              <div style={{ fontSize: 28, fontWeight: 700, marginTop: 6, color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Filter Tabs */}
        <div style={{ display: 'flex', borderBottom: '2px solid #d4d2cc', marginBottom: 20 }}>
          {['all', 'available', 'booked', 'past'].map(tab => (
            <div key={tab} onClick={() => setFilter(tab)}
              style={{ padding: '10px 18px', fontSize: 13, cursor: 'pointer', color: filter === tab ? '#3d5afe' : '#6b6860', borderBottom: filter === tab ? '2px solid #3d5afe' : '2px solid transparent', marginBottom: -2, fontWeight: filter === tab ? 600 : 400 }}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
              <span style={{ marginLeft: 6, fontSize: 11, color: '#9b978f' }}>({counts[tab]})</span>
            </div>
          ))}
        </div>

        {/* Slots Table */}
        <div style={{ background: '#fff', border: '1px solid #d4d2cc', borderRadius: 10, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#9b978f' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📆</div>
              <p style={{ fontSize: 13 }}>No slots found. Add your available time slots!</p>
              <button onClick={() => setShowAdd(true)}
                style={{ marginTop: 12, padding: '8px 20px', background: '#3d5afe', color: '#fff', border: 'none', borderRadius: 7, cursor: 'pointer', fontSize: 13 }}>
                Add Slot
              </button>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f4f3f0' }}>
                  {['#', 'Date', 'Start Time', 'End Time', 'Duration', 'Status', 'Action'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, color: '#9b978f', fontFamily: 'monospace', borderBottom: '1px solid #d4d2cc' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((slot, i) => {
                  const isPast = slot.available_date < today
                  const start = slot.start_time?.slice(0, 5)
                  const end = slot.end_time?.slice(0, 5)

                  // Calculate duration
                  const [sh, sm] = start.split(':').map(Number)
                  const [eh, em] = end.split(':').map(Number)
                  const mins = (eh * 60 + em) - (sh * 60 + sm)
                  const duration = mins >= 60
                    ? `${Math.floor(mins / 60)}h ${mins % 60 > 0 ? mins % 60 + 'm' : ''}`
                    : `${mins}m`

                  return (
                    <tr key={slot.schedule_id} style={{ borderBottom: '1px solid #f0ede8', opacity: isPast ? 0.6 : 1 }}>
                      <td style={{ padding: '12px 14px', fontSize: 11, fontFamily: 'monospace', color: '#9b978f' }}>
                        #{String(i + 1).padStart(2, '0')}
                      </td>
                      <td style={{ padding: '12px 14px', fontSize: 13, fontWeight: 500 }}>
                        {new Date(slot.available_date + 'T00:00:00').toLocaleDateString('en-PK', { weekday: 'short', month: 'short', day: 'numeric' })}
                      </td>
                      <td style={{ padding: '12px 14px', fontSize: 13, fontFamily: 'monospace' }}>{start}</td>
                      <td style={{ padding: '12px 14px', fontSize: 13, fontFamily: 'monospace' }}>{end}</td>
                      <td style={{ padding: '12px 14px', fontSize: 12, color: '#6b6860' }}>{duration}</td>
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{
                          padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 500, fontFamily: 'monospace',
                          background: isPast ? '#f4f3f0' : slot.is_booked ? '#e3f2fd' : '#e8f5e9',
                          color: isPast ? '#9b978f' : slot.is_booked ? '#1565c0' : '#2e7d32'
                        }}>
                          {isPast ? 'past' : slot.is_booked ? 'booked' : 'open'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        {!slot.is_booked && (
                          <button onClick={() => deleteSlot(slot.schedule_id, slot.is_booked)}
                            style={{ padding: '5px 10px', background: '#fce4ec', color: '#b71c1c', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 11, fontWeight: 500 }}>
                            Delete
                          </button>
                        )}
                        {slot.is_booked && (
                          <span style={{ fontSize: 11, color: '#9b978f' }}>Booked</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </main>

      {/* ADD SLOT MODAL */}
      {showAdd && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}
          onClick={e => { if (e.target === e.currentTarget) setShowAdd(false) }}>
          <div style={{ background: '#fff', borderRadius: 14, padding: 28, width: 420, maxWidth: '95vw', boxShadow: '0 4px 16px rgba(0,0,0,0.10)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h3 style={{ fontSize: 17, fontWeight: 700, margin: 0 }}>Add Availability Slot</h3>
              <button onClick={() => setShowAdd(false)}
                style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#9b978f' }}>✕</button>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, fontWeight: 500, color: '#6b6860', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 6 }}>
                Date
              </label>
              <input type="date" value={form.available_date} min={today}
                onChange={e => setForm({ ...form, available_date: e.target.value })}
                style={{ width: '100%', border: '1.5px dashed #d4d2cc', borderRadius: 7, padding: '10px 13px', fontSize: 13, background: '#f4f3f0', outline: 'none', boxSizing: 'border-box' }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 500, color: '#6b6860', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 6 }}>
                  Start Time
                </label>
                <input type="time" value={form.start_time}
                  onChange={e => setForm({ ...form, start_time: e.target.value })}
                  style={{ width: '100%', border: '1.5px dashed #d4d2cc', borderRadius: 7, padding: '10px 13px', fontSize: 13, background: '#f4f3f0', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 500, color: '#6b6860', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 6 }}>
                  End Time
                </label>
                <input type="time" value={form.end_time}
                  onChange={e => setForm({ ...form, end_time: e.target.value })}
                  style={{ width: '100%', border: '1.5px dashed #d4d2cc', borderRadius: 7, padding: '10px 13px', fontSize: 13, background: '#f4f3f0', outline: 'none', boxSizing: 'border-box' }} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowAdd(false)}
                style={{ padding: '9px 18px', background: 'transparent', border: '1.5px solid #a8a49c', borderRadius: 7, cursor: 'pointer', fontSize: 13 }}>
                Cancel
              </button>
              <button onClick={addSlot} disabled={saving}
                style={{ padding: '9px 18px', background: '#3d5afe', color: '#fff', border: 'none', borderRadius: 7, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                {saving ? 'Saving...' : 'Add Slot'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}