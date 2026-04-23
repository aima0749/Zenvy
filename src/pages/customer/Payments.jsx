import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../supabaseClient'

export default function Payments() {
  const [payments, setPayments] = useState([])
  const [unpaidBookings, setUnpaidBookings] = useState([])
  const [selectedBooking, setSelectedBooking] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('card')
  const [loading, setLoading] = useState(true)
  const [paying, setPaying] = useState(false)
  const [stats, setStats] = useState({ totalPaid: 0, pending: 0, transactions: 0 })
  const navigate = useNavigate()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { navigate('/auth'); return }

    // Get all payments
    const { data: paymentData } = await supabase
      .from('payment')
      .select(`
        payment_id, amount, payment_method, payment_status, payment_date, transaction_id,
        booking(booking_id, service(service_name), service_date)
      `)
      .order('payment_date', { ascending: false })

    setPayments(paymentData || [])

    // Get unpaid bookings (completed but no payment)
    const { data: bookingData } = await supabase
      .from('booking')
      .select('booking_id, service(service_name, price), service_date, status')
      .eq('customer_id', user.id)
      .in('status', ['accepted', 'completed'])

    // Filter bookings that don't have a payment yet
    const paidBookingIds = (paymentData || [])
      .filter(p => p.payment_status === 'completed')
      .map(p => p.booking?.booking_id)
      .filter(Boolean)

    const unpaid = (bookingData || []).filter(b => !paidBookingIds.includes(b.booking_id))
    setUnpaidBookings(unpaid)

    // Stats
    const totalPaid = (paymentData || [])
      .filter(p => p.payment_status === 'completed')
      .reduce((sum, p) => sum + Number(p.amount), 0)
    const pending = (paymentData || []).filter(p => p.payment_status === 'pending').length

    setStats({ totalPaid, pending, transactions: (paymentData || []).length })
    setLoading(false)
  }

  const handlePayment = async () => {
    if (!selectedBooking) { alert('Please select a booking to pay for'); return }
    setPaying(true)

    const booking = unpaidBookings.find(b => b.booking_id === selectedBooking)
    if (!booking) { setPaying(false); return }

    const { error } = await supabase.from('payment').insert({
      booking_id: selectedBooking,
      amount: booking.service?.price || 0,
      payment_method: paymentMethod,
      payment_status: 'completed',
      transaction_id: 'TXN-' + Date.now(),
      payment_date: new Date().toISOString()
    })

    if (error) { alert('Payment error: ' + error.message); setPaying(false); return }

    alert('Payment successful! ✅')
    setSelectedBooking('')
    fetchData()
    setPaying(false)
  }

  const sidebarItems = [
    { label: 'Dashboard', icon: '🏠', path: '/customer/dashboard' },
    { label: 'Browse Services', icon: '🔍', path: '/customer/browse' },
    { label: 'My Bookings', icon: '📅', path: '/customer/bookings' },
    { label: 'Bundle Offers', icon: '📦', path: '/customer/bundles' },
    { label: 'Payments', icon: '💳', path: '/customer/payments', active: true },
    { label: 'My Reviews', icon: '⭐', path: '/customer/reviews' },
  ]

  const logout = async () => {
    await supabase.auth.signOut()
    navigate('/auth')
  }

  const getBadge = (status) => {
    const map = {
      completed: { bg: '#e8f5e9', color: '#2e7d32' },
      pending: { bg: '#fff3e0', color: '#e65100' },
      failed: { bg: '#fce4ec', color: '#b71c1c' },
      refunded: { bg: '#e3f2fd', color: '#1565c0' },
    }
    return map[status] || map.pending
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

        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Payments</h1>
          <p style={{ color: '#6b6860', marginTop: 4, fontSize: 13 }}>View all transactions and make payments</p>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
          {[
            { label: 'Total Paid', value: `Rs. ${stats.totalPaid.toLocaleString()}`, color: '#2e7d32' },
            { label: 'Pending', value: stats.pending, color: '#e53935' },
            { label: 'Transactions', value: stats.transactions, color: '#1a1a2e' },
          ].map(s => (
            <div key={s.label} style={{ background: '#fff', border: '1px solid #d4d2cc', borderRadius: 10, padding: '18px 20px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
              <div style={{ fontSize: 11, color: '#9b978f', textTransform: 'uppercase', letterSpacing: 0.8, fontFamily: 'monospace' }}>{s.label}</div>
              <div style={{ fontSize: 28, fontWeight: 700, marginTop: 6, color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Make Payment */}
        {unpaidBookings.length > 0 && (
          <div style={{ background: '#fff', border: '1px solid #d4d2cc', borderRadius: 10, padding: 20, marginBottom: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Make a Payment</div>

            <div style={{ background: '#e8ecff', border: '1px solid #c5cfff', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#2a3fd4', marginBottom: 16 }}>
              💳 You have {unpaidBookings.length} booking(s) awaiting payment
            </div>

            {/* Select Booking */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, fontWeight: 500, color: '#6b6860', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 6 }}>
                Select Booking
              </label>
              <select value={selectedBooking} onChange={e => setSelectedBooking(e.target.value)}
                style={{ width: '100%', border: '1.5px dashed #d4d2cc', borderRadius: 7, padding: '10px 13px', fontSize: 13, background: '#f4f3f0', outline: 'none', maxWidth: 400 }}>
                <option value="">— Choose a booking —</option>
                {unpaidBookings.map(b => (
                  <option key={b.booking_id} value={b.booking_id}>
                    {b.service?.service_name} — {b.service_date} — Rs. {Number(b.service?.price || 0).toLocaleString()}
                  </option>
                ))}
              </select>
            </div>

            {/* Payment Method */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 12, fontWeight: 500, color: '#6b6860', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 10 }}>
                Payment Method
              </label>
              <div style={{ display: 'flex', gap: 12 }}>
                {[
                  { value: 'card', label: '💳 Card', },
                  { value: 'bank', label: '🏦 Bank Transfer' },
                  { value: 'cash', label: '💵 Cash on Service' },
                ].map(m => (
                  <div key={m.value} onClick={() => setPaymentMethod(m.value)}
                    style={{ border: paymentMethod === m.value ? '2px solid #3d5afe' : '2px solid #d4d2cc', borderRadius: 10, padding: '14px 20px', cursor: 'pointer', background: paymentMethod === m.value ? '#e8ecff' : '#fff', fontSize: 13, fontWeight: 500, transition: 'all .15s' }}>
                    {m.label}
                  </div>
                ))}
              </div>
            </div>

            {/* Amount */}
            {selectedBooking && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, fontWeight: 700, marginBottom: 16, padding: '12px 0', borderTop: '1px solid #d4d2cc' }}>
                <span>Amount to Pay</span>
                <span style={{ color: '#3d5afe' }}>
                  Rs. {Number(unpaidBookings.find(b => b.booking_id === selectedBooking)?.service?.price || 0).toLocaleString()}
                </span>
              </div>
            )}

            <button onClick={handlePayment} disabled={paying}
              style={{ padding: '10px 28px', background: paying ? '#9b978f' : '#3d5afe', color: '#fff', border: 'none', borderRadius: 7, cursor: paying ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 600 }}>
              {paying ? 'Processing...' : 'Pay Now →'}
            </button>
          </div>
        )}

        {/* Payment History */}
        <div style={{ background: '#fff', border: '1px solid #d4d2cc', borderRadius: 10, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #d4d2cc', fontSize: 15, fontWeight: 600 }}>
            Payment History
          </div>
          {payments.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#9b978f' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>💳</div>
              <p style={{ fontSize: 13 }}>No payment history yet.</p>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f4f3f0' }}>
                  {['Payment ID', 'For Service', 'Amount', 'Method', 'Date', 'Status', 'Receipt'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, color: '#9b978f', fontFamily: 'monospace', borderBottom: '1px solid #d4d2cc' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {payments.map(p => {
                  const badge = getBadge(p.payment_status)
                  return (
                    <tr key={p.payment_id} style={{ borderBottom: '1px solid #f0ede8' }}>
                      <td style={{ padding: '12px 14px', fontSize: 11, fontFamily: 'monospace', color: '#9b978f' }}>
                        {p.transaction_id || '—'}
                      </td>
                      <td style={{ padding: '12px 14px', fontSize: 13 }}>
                        {p.booking?.service?.service_name || '—'}
                      </td>
                      <td style={{ padding: '12px 14px', fontSize: 13, fontWeight: 600 }}>
                        Rs. {Number(p.amount).toLocaleString()}
                      </td>
                      <td style={{ padding: '12px 14px', fontSize: 13, textTransform: 'capitalize' }}>
                        {p.payment_method || '—'}
                      </td>
                      <td style={{ padding: '12px 14px', fontSize: 13 }}>
                        {new Date(p.payment_date).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{ background: badge.bg, color: badge.color, padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 500, fontFamily: 'monospace' }}>
                          {p.payment_status}
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <button style={{ padding: '5px 10px', background: 'transparent', border: '1.5px solid #a8a49c', borderRadius: 6, cursor: 'pointer', fontSize: 11 }}>
                          📄 View
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  )
}