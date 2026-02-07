import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShoppingBag, Trash2, Minus, Plus, ShieldCheck } from 'lucide-react'
import apiClient from '../services/api'
import { useAuth } from '../context/AuthContext'

function Cart() {
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [address, setAddress] = useState('')
  const [notes, setNotes] = useState('')
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }
    fetchCart()
  }, [isAuthenticated])

  const fetchCart = async () => {
    try {
      setLoading(true)
      setError('')
      const res = await apiClient.get('/cart/')
      setItems(res.data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load cart')
    } finally {
      setLoading(false)
    }
  }

  const updateQuantity = async (itemId, quantity) => {
    if (quantity < 1) return
    try {
      await apiClient.put(`/cart/${itemId}`, { quantity })
      fetchCart()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update cart')
    }
  }

  const removeItem = async (itemId) => {
    try {
      await apiClient.delete(`/cart/${itemId}`)
      fetchCart()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to remove item')
    }
  }

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const shipping = subtotal > 0 ? 20 : 0
  const total = subtotal + shipping

  const handleCheckout = async () => {
    if (!address.trim()) {
      setError('Please enter a shipping address')
      return
    }

    try {
      setProcessing(true)
      await apiClient.post('/cart/checkout', {
        shipping_address: address,
        notes: notes || null,
      })
      setAddress('')
      setNotes('')
      fetchCart()
      navigate('/my-orders')
    } catch (err) {
      setError(err.response?.data?.detail || 'Checkout failed')
    } finally {
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center text-slate-500">
        Loading cart...
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Shopping Cart</h1>
          <p className="text-sm text-slate-500">Review items before checkout.</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <ShieldCheck className="h-4 w-4 text-brand-primary" />
          Protected checkout with Bearer Token
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {items.length === 0 ? (
        <div className="card-surface flex flex-col items-center justify-center gap-3 p-10 text-center">
          <ShoppingBag className="h-10 w-10 text-slate-400" />
          <p className="text-slate-600">Your cart is empty.</p>
          <button className="btn-primary" onClick={() => navigate('/products')}>
            Browse products
          </button>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          <div className="space-y-4">
            {items.map((item) => (
              <div key={item.id} className="card-surface flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
                <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-xl bg-slate-100">
                  {item.image_url ? (
                    <img src={item.image_url} alt={item.product_name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs text-slate-400">
                      No Image
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-slate-900">{item.product_name}</h3>
                  <p className="text-sm text-slate-500">Stock: {item.stock_quantity}</p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    className="rounded-full border border-slate-200 p-2 text-slate-500 hover:text-slate-700"
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="min-w-[32px] text-center font-semibold">{item.quantity}</span>
                  <button
                    className="rounded-full border border-slate-200 p-2 text-slate-500 hover:text-slate-700"
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                <div className="text-right">
                  <p className="text-sm text-slate-500">Price</p>
                  <p className="text-lg font-semibold text-brand-price">${item.price.toFixed(2)}</p>
                </div>
                <button
                  className="ml-auto flex items-center gap-1 text-sm text-red-500 hover:text-red-600"
                  onClick={() => removeItem(item.id)}
                >
                  <Trash2 className="h-4 w-4" />
                  Remove
                </button>
              </div>
            ))}
          </div>

          <div className="card-surface h-fit p-5">
            <h2 className="text-lg font-semibold text-slate-900">Order Summary</h2>
            <div className="mt-4 space-y-3 text-sm text-slate-600">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-semibold text-slate-900">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping</span>
                <span className="font-semibold text-slate-900">${shipping.toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-3 text-base">
                <span>Total</span>
                <span className="font-semibold text-brand-price">${total.toFixed(2)}</span>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Shipping Address
                </label>
                <textarea
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm focus:border-brand-primary focus:outline-none"
                  rows={3}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Notes (optional)
                </label>
                <input
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-brand-primary focus:outline-none"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>

            <button
              className="btn-primary mt-5 w-full disabled:cursor-not-allowed disabled:opacity-60"
              onClick={handleCheckout}
              disabled={processing}
            >
              {processing ? 'Processing...' : 'Checkout'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default Cart
