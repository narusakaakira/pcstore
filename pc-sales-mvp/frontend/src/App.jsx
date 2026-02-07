import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Navigation from './components/Navigation'
import Login from './pages/Login'
import Register from './pages/Register'
import Products from './pages/Products'
import Profile from './pages/Profile'
import ProductDetail from './pages/ProductDetail'
import AdminOrders from './pages/AdminOrders'
import ProductManager from './pages/Admin/ProductManager'
import RoleApprovals from './pages/Admin/RoleApprovals'
import OrderQueue from './pages/Shipper/OrderQueue'
import MyOrders from './pages/MyOrders'
import Cart from './pages/Cart'
import Home from './pages/Home'
import './App.css'

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen bg-slate-50 text-slate-900">
          <Navigation />
          <main className="mx-auto w-full max-w-7xl px-4 pb-12 pt-6 sm:px-6 lg:px-8">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/products" element={<Products />} />
              <Route path="/products/:id" element={<ProductDetail />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/my-orders" element={<MyOrders />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/admin/orders" element={<AdminOrders />} />
              <Route path="/admin/products" element={<ProductManager />} />
              <Route path="/admin/roles" element={<RoleApprovals />} />
              <Route path="/shipper/orders" element={<OrderQueue />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </AuthProvider>
    </Router>
  )
}

export default App
