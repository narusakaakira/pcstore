import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Menu, ShoppingCart, User2, LogOut, ChevronDown } from 'lucide-react'
import apiClient from '../services/api'
import { useAuth } from '../context/AuthContext'

function Navigation() {
  const { user, isAuthenticated, roles, logout, hasRole } = useAuth()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [showCategories, setShowCategories] = useState(false)
  const [categories, setCategories] = useState([])
  const [cartCount, setCartCount] = useState(0)

  const isAdmin = hasRole('ADMIN')
  const isShipper = hasRole('SHIPPER')

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await apiClient.get('/products/')
        const unique = Array.from(new Set(res.data.map((p) => p.category).filter(Boolean)))
        setCategories(unique)
      } catch (err) {
        setCategories([])
      }
    }

    fetchCategories()
  }, [])

  useEffect(() => {
    const fetchCartCount = async () => {
      if (!isAuthenticated) {
        setCartCount(0)
        return
      }
      try {
        const res = await apiClient.get('/cart/')
        const count = res.data.reduce((sum, item) => sum + item.quantity, 0)
        setCartCount(count)
      } catch (err) {
        setCartCount(0)
      }
    }

    fetchCartCount()
  }, [isAuthenticated])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const handleCategoryClick = (category) => {
    setShowCategories(false)
    navigate(`/products?category=${encodeURIComponent(category)}`)
  }

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4">
          <button
            className="flex items-center gap-2 text-slate-900"
            onClick={() => navigate('/')}
          >
            <span className="text-xl font-extrabold">PC Store</span>
            <span className="rounded-full bg-brand-primary px-2 py-0.5 text-xs font-semibold text-white">Pro</span>
          </button>
        </div>

        <div className="hidden items-center gap-6 text-sm font-semibold text-slate-600 lg:flex">
          <Link to="/products" className="hover:text-slate-900">
            Products
          </Link>
          {isAuthenticated && (
            <Link to="/my-orders" className="hover:text-slate-900">
              My Orders
            </Link>
          )}
          {isAdmin && (
            <Link to="/admin/products" className="hover:text-slate-900">
              Manage Products
            </Link>
          )}
          {(isAdmin || isShipper) && (
            <Link to="/admin/orders" className="hover:text-slate-900">
              All Orders
            </Link>
          )}
          {isShipper && (
            <Link to="/shipper/orders" className="hover:text-slate-900 text-brand-primary">
              Delivery Queue
            </Link>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button
            className="relative rounded-xl border border-slate-200 p-2 text-slate-600 hover:border-slate-300"
            onClick={() => navigate('/cart')}
          >
            <ShoppingCart className="h-5 w-5" />
            {cartCount > 0 && (
              <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-brand-primary text-xs font-semibold text-white">
                {cartCount}
              </span>
            )}
          </button>

          {isAuthenticated ? (
            <div className="hidden items-center gap-3 sm:flex">
              <button 
                onClick={() => navigate('/profile')}
                className="flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 transition-all"
              >
                <div className="h-6 w-6 overflow-hidden rounded-full bg-slate-200">
                  {user?.avatar_url ? (
                    <img src={`${import.meta.env.VITE_API_URL}${user.avatar_url}`} className="h-full w-full object-cover" alt="" />
                  ) : (
                    <User2 className="h-4 w-4 m-1 text-slate-400" />
                  )}
                </div>
                {user?.username}
              </button>
              <button className="btn-outline" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </button>
            </div>
          ) : (
            <div className="hidden items-center gap-2 sm:flex">
              <button className="btn-outline" onClick={() => navigate('/login')}>
                Login
              </button>
              <button className="btn-primary" onClick={() => navigate('/register')}>
                Sign up
              </button>
            </div>
          )}

          <button
            className="inline-flex items-center justify-center rounded-xl border border-slate-200 p-2 text-slate-600 sm:hidden"
            onClick={() => setMobileOpen((prev) => !prev)}
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-slate-200 bg-white px-4 py-4 sm:hidden">
          <div className="flex flex-col gap-3 text-sm font-semibold text-slate-700">
            <Link to="/products" onClick={() => setMobileOpen(false)}>
              Products
            </Link>
            {isAuthenticated && (
              <Link to="/my-orders" onClick={() => setMobileOpen(false)}>
                My Orders
              </Link>
            )}
            {isAdmin && (
              <Link to="/admin/products" onClick={() => setMobileOpen(false)}>
                Manage Products
              </Link>
            )}
            {(isAdmin || isShipper) && (
              <Link to="/admin/orders" onClick={() => setMobileOpen(false)}>
                All Orders
              </Link>
            )}
            {isShipper && (
              <Link to="/shipper/orders" onClick={() => setMobileOpen(false)}>
                Delivery Queue
              </Link>
            )}
            {isAuthenticated ? (
              <button className="btn-outline" onClick={handleLogout}>
                Sign out
              </button>
            ) : (
              <div className="flex gap-2">
                <button className="btn-outline" onClick={() => navigate('/login')}>
                  Login
                </button>
                <button className="btn-primary" onClick={() => navigate('/register')}>
                  Sign up
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  )
}

export default Navigation
