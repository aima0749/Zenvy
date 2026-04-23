import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../../supabaseClient'

export default function ServiceDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [service, setService] = useState(null)
  const [providers, setProviders] = useState([])
  const [reviews, setReviews] = useState([])
  const [slots, setSlots] = useState([])
  const [selectedProvider, setSelectedProvider] = useState('')
  const [selectedSlot, setSelectedSlot] = useState('')
  const [serviceDate, setServiceDate] = useState('')
  const [location, setLocation] = useState('')
  const [loading, setLoading] = useState(true)
  const [booking, setBooking] = useState(false)
  const [currentUser, setCurrentUser] = useState(null)
  const navigate2 = useNavigate()

  useEffect(() => {
    fetchAll()
  }, [id])

  const fetchAll = async () => {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    setCurrentUser(user)

    // Get service details
    const { data: svcData } = await supabase
      .from('service')
      .select('*, category(category_name)')
      .eq('service_id', id)
      .single()
    setService(svcData)

    // Get providers for this service
    const { data: provData } = await supabase
      .from('provider_service')
      .select(`
        provider_id,
        service_provider(
          user_id, experience_years, average_rating, availability_status,
          users(first_name, last_name)
        )
      `)
      .eq('service_id', id)
    setProviders(provData || [])

    // Get reviews for providers of this service
    const { data: revData } = await supabase
      .from('review')
      .select(`
        review_id, rating, comment, review_date,
        customer(users(first_name, last_name))
      `)
      .eq('booking_id', id)
      .limit(5)
    setReviews(revData || [])

    setLoading(false)
  }

  // Fetch availability slots when provider is selected
  const fetchSlots = async (providerId) => {
    setSelectedProvider(providerId)
    setSelectedSlot('')
    const { data } = await supabase
      .from('availability')
      .select('*')
      .eq('provider_id', providerId)
      .eq('is_booked', false)
      .gte('available_date', new Date().toISOString().split('T')[0])
      .order('available_date', { ascending: true })
    setSlots(data || [])
  }

  const handleBooking = async () => {
    if (!selectedProvider) { alert('Please select a provider'); return }
    if (!serviceDate) { alert('Please select a service date'); return }
    if (!location) { alert('Please enter your location'); return }

    setBooking(true)

    // Get customer record
    const { data: customerData } = await supabase
      .from('customer')
      .select('user_id')
      .eq('user_id', currentUser.id)
      .single()

    if (!customerData) {
      alert('Customer profile not found')
      setBooking(false)
      return
    }

    // Create booking
    const { data: bookingData, error } = await supabase
      .from('booking')
      .insert({
        customer_id: currentUser.id,
        provider_id: selectedProvider,
        service_id: id,
        booking_date: new Date().toISOString().split('T')[0],
        service_date: serviceDate,
        location: location,
        status: 'pending'
      })
      .select()
      .single()

    if (error) {
      alert('Booking error: ' + error.message)
      setBooking(false)
      return
    }

    // Mark slot as booked if selected
    if (selectedSlot) {
      await supabase
        .from('availability')
        .update({ is_booked: true })
        .eq('schedule_id', selectedSlot)
    }

    alert('Booking created successfully!')
    navigate('/customer/bookings')
    setBooking(false)
  }

  const sidebarItems = [
    { label: 'Dashboard', icon: '🏠', path: '/customer/dashboard' },
    { label: 'Browse Services', icon: '🔍', path: '/customer/browse', active: true },
    { label: 'My Bookings', icon: '📅', path: '/customer/bookings' },
    { label: 'Bundle Offers', icon: '📦', path: '/customer/bundles' },
    { label: 'Payments', icon: '💳', path: '/customer/payments' },
    { label: 'My Reviews', icon: '⭐', path: '/customer/reviews' },
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

  if (!service) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      <p>Service not found</p>
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
            <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Book a Service</h1>
            <p style={{ color: '#6b6860', marginTop: 4, fontSize: 13 }}>
              {service.service_name} · {service.category?.category_name}
            </p>
          </div>
          <button onClick={() => navigate('/customer/browse')}
            style={{ padding: '9px 18px', background: 'transparent', border: '1.5px solid #a8a49c', borderRadius: 7, cursor: 'pointer', fontSize: 13 }}>
            ← Back to Browse
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 24 }}>

          {/* LEFT SIDE */}
          <div>
            {/* Service Info */}
            <div style={{ background: '#fff', border: '1px solid #d4d2cc', borderRadius: 10, padding: 20, marginBottom: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
              <div style={{ height: 180, background: '#eeecea', border: '2px dashed #d4d2cc', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: '#b0acaa', fontFamily: 'monospace', marginBottom: 16 }}>
                SERVICE IMAGE PLACEHOLDER
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 20, fontWeight: 700 }}>{service.service_name}</div>
                  <span style={{ background: '#e8ecff', color: '#3d5afe', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 500, marginTop: 6, display: 'inline-block' }}>
                    {service.category?.category_name}
                  </span>
                </div>
                <div style={{ fontSize: 22, fontWeight: 700 }}>Rs. {Number(service.price).toLocaleString()}</div>
              </div>
              <p style={{ fontSize: 13, color: '#6b6860', lineHeight: 1.7 }}>{service.description}</p>
            </div>

            {/* Providers */}
            <div style={{ background: '#fff', border: '1px solid #d4d2cc', borderRadius: 10, padding: 20, marginBottom: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
              <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Available Providers</div>
              {providers.length === 0 ? (
                <p style={{ color: '#9b978f', fontSize: 13 }}>No providers available for this service yet.</p>
              ) : (
                providers.map(p => {
                  const sp = p.service_provider
                  const isSelected = selectedProvider === p.provider_id
                  return (
                    <div key={p.provider_id}
                      onClick={() => fetchSlots(p.provider_id)}
                      style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, border: isSelected ? '2px solid #3d5afe' : '1px solid #d4d2cc', borderRadius: 8, marginBottom: 10, cursor: 'pointer', background: isSelected ? '#f0f3ff' : '#f4f3f0', transition: 'all .15s' }}>
                      <div style={{ width: 44, height: 44, borderRadius: 8, border: '2px dashed #d4d2cc', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: '#b0acaa', fontFamily: 'monospace', flexShrink: 0 }}>
                        PHOTO
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>
                          {sp?.users?.first_name} {sp?.users?.last_name}
                        </div>
                        <div style={{ fontSize: 12, color: '#6b6860' }}>
                          {sp?.experience_years} years experience
                        </div>
                        <div style={{ fontSize: 12, color: '#f9a825' }}>
                          ★ {sp?.average_rating || 'New'}
                        </div>
                      </div>
                      <span style={{
                        padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 500,
                        background: sp?.availability_status ? '#e8f5e9' : '#fce4ec',
                        color: sp?.availability_status ? '#2e7d32' : '#b71c1c'
                      }}>
                        {sp?.availability_status ? 'Available' : 'Busy'}
                      </span>
                    </div>
                  )
                })
              )}
            </div>

            {/* Reviews */}
            <div style={{ background: '#fff', border: '1px solid #d4d2cc', borderRadius: 10, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
              <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Customer Reviews</div>
              {reviews.length === 0 ? (
                <p style={{ color: '#9b978f', fontSize: 13 }}>No reviews yet for this service.</p>
              ) : (
                reviews.map(r => (
                  <div key={r.review_id} style={{ border: '1px solid #d4d2cc', borderRadius: 10, padding: 16, marginBottom: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>
                        {r.customer?.users?.first_name} {r.customer?.users?.last_name}
                      </div>
                      <div style={{ color: '#f9a825' }}>{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</div>
                    </div>
                    <p style={{ fontSize: 13, color: '#6b6860' }}>{r.comment}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* RIGHT SIDE - Booking Form */}
          <div>
            <div style={{ background: '#fff', border: '1px solid #d4d2cc', borderRadius: 10, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', position: 'sticky', top: 20 }}>
              <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Book This Service</div>

              <div style={{ background: '#e8ecff', border: '1px solid #c5cfff', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#2a3fd4', marginBottom: 16 }}>
                📋 Select a provider and your preferred date
              </div>

              {/* Provider Select */}
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12, fontWeight: 500, color: '#6b6860', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 6 }}>
                  Select Provider
                </label>
                <select value={selectedProvider} onChange={e => fetchSlots(e.target.value)}
                  style={{ width: '100%', border: '1.5px dashed #d4d2cc', borderRadius: 7, padding: '10px 13px', fontSize: 13, background: '#f4f3f0', outline: 'none', boxSizing: 'border-box' }}>
                  <option value="">— Choose a Provider —</option>
                  {providers.map(p => (
                    <option key={p.provider_id} value={p.provider_id}>
                      {p.service_provider?.users?.first_name} {p.service_provider?.users?.last_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Time Slot */}
              {slots.length > 0 && (
                <div style={{ marginBottom: 14 }}>
                  <label style={{ fontSize: 12, fontWeight: 500, color: '#6b6860', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 6 }}>
                    Available Time Slot
                  </label>
                  <select value={selectedSlot} onChange={e => {
                    setSelectedSlot(e.target.value)
                    const slot = slots.find(s => s.schedule_id === e.target.value)
                    if (slot) setServiceDate(slot.available_date)
                  }}
                    style={{ width: '100%', border: '1.5px dashed #d4d2cc', borderRadius: 7, padding: '10px 13px', fontSize: 13, background: '#f4f3f0', outline: 'none', boxSizing: 'border-box' }}>
                    <option value="">— Select a Slot —</option>
                    {slots.map(slot => (
                      <option key={slot.schedule_id} value={slot.schedule_id}>
                        {slot.available_date} | {slot.start_time} – {slot.end_time}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Service Date */}
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12, fontWeight: 500, color: '#6b6860', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 6 }}>
                  Service Date
                </label>
                <input type="date" value={serviceDate} onChange={e => setServiceDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  style={{ width: '100%', border: '1.5px dashed #d4d2cc', borderRadius: 7, padding: '10px 13px', fontSize: 13, background: '#f4f3f0', outline: 'none', boxSizing: 'border-box' }} />
              </div>

              {/* Location */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 12, fontWeight: 500, color: '#6b6860', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 6 }}>
                  Your Location / Address
                </label>
                <input placeholder="Enter your full address" value={location} onChange={e => setLocation(e.target.value)}
                  style={{ width: '100%', border: '1.5px dashed #d4d2cc', borderRadius: 7, padding: '10px 13px', fontSize: 13, background: '#f4f3f0', outline: 'none', boxSizing: 'border-box' }} />
              </div>

              {/* Price Summary */}
              <div style={{ borderTop: '1px solid #d4d2cc', paddingTop: 16, marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                  <span>Service Price</span>
                  <span>Rs. {Number(service.price).toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, fontWeight: 700 }}>
                  <span>Total</span>
                  <span style={{ color: '#3d5afe' }}>Rs. {Number(service.price).toLocaleString()}</span>
                </div>
              </div>

              <button onClick={handleBooking} disabled={booking}
                style={{ width: '100%', padding: 11, background: booking ? '#9b978f' : '#3d5afe', color: '#fff', border: 'none', borderRadius: 7, fontSize: 14, fontWeight: 600, cursor: booking ? 'not-allowed' : 'pointer' }}>
                {booking ? 'Creating Booking...' : 'Confirm Booking →'}
              </button>

              <div style={{ fontSize: 11, color: '#9b978f', textAlign: 'center', marginTop: 8 }}>
                Status will be Pending until provider accepts
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}