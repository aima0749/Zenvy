import './index.css'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'

// Auth & Landing
import Landing from './pages/Landing'
import Auth from './pages/Auth'

// Customer Pages
import CustomerDashboard from './pages/customer/CustomerDashboard'
import BrowseServices from './pages/customer/BrowseServices'
import ServiceDetail from './pages/customer/ServiceDetail'
import MyBookings from './pages/customer/MyBookings'
import BundleOffers from './pages/customer/BundleOffers'
import Payments from './pages/customer/Payments'
import MyReviews from './pages/customer/MyReviews'

// Provider Pages
import ProviderDashboard from './pages/provider/ProviderDashboard'
import MyServices from './pages/provider/MyServices'
import Availability from './pages/provider/Availability'
import AssignedBookings from './pages/provider/AssignedBookings'
import BundleTasks from './pages/provider/BundleTasks'
import ProviderReviews from './pages/provider/ProviderReviews'

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminUsers from './pages/admin/AdminUsers'
import AdminBookings from './pages/admin/AdminBookings'
import AdminServices from './pages/admin/AdminServices'
import AdminPayments from './pages/admin/AdminPayments'
import AdminReviews from './pages/admin/AdminReviews'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Public */}
        <Route path="/" element={<Landing />} />
        <Route path="/auth" element={<Auth />} />

        {/* Customer */}
        <Route path="/customer/dashboard" element={<ProtectedRoute role="customer"><CustomerDashboard /></ProtectedRoute>} />
        <Route path="/customer/browse"    element={<ProtectedRoute role="customer"><BrowseServices /></ProtectedRoute>} />
        <Route path="/customer/service/:id" element={<ProtectedRoute role="customer"><ServiceDetail /></ProtectedRoute>} />
        <Route path="/customer/bookings"  element={<ProtectedRoute role="customer"><MyBookings /></ProtectedRoute>} />
        <Route path="/customer/bundles"   element={<ProtectedRoute role="customer"><BundleOffers /></ProtectedRoute>} />
        <Route path="/customer/payments"  element={<ProtectedRoute role="customer"><Payments /></ProtectedRoute>} />
        <Route path="/customer/reviews"   element={<ProtectedRoute role="customer"><MyReviews /></ProtectedRoute>} />

        {/* Provider */}
        <Route path="/provider/dashboard"    element={<ProtectedRoute role="service_provider"><ProviderDashboard /></ProtectedRoute>} />
        <Route path="/provider/services"     element={<ProtectedRoute role="service_provider"><MyServices /></ProtectedRoute>} />
        <Route path="/provider/availability" element={<ProtectedRoute role="service_provider"><Availability /></ProtectedRoute>} />
        <Route path="/provider/bookings"     element={<ProtectedRoute role="service_provider"><AssignedBookings /></ProtectedRoute>} />
        <Route path="/provider/bundles"      element={<ProtectedRoute role="service_provider"><BundleTasks /></ProtectedRoute>} />
        <Route path="/provider/reviews"      element={<ProtectedRoute role="service_provider"><ProviderReviews /></ProtectedRoute>} />

        {/* Admin */}
        <Route path="/admin/dashboard" element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/users"     element={<ProtectedRoute role="admin"><AdminUsers /></ProtectedRoute>} />
        <Route path="/admin/bookings"  element={<ProtectedRoute role="admin"><AdminBookings /></ProtectedRoute>} />
        <Route path="/admin/services"  element={<ProtectedRoute role="admin"><AdminServices /></ProtectedRoute>} />
        <Route path="/admin/payments"  element={<ProtectedRoute role="admin"><AdminPayments /></ProtectedRoute>} />
        <Route path="/admin/reviews"   element={<ProtectedRoute role="admin"><AdminReviews /></ProtectedRoute>} />

      </Routes>
    </BrowserRouter>
  )
}
