import { useState, useEffect } from 'react'
import { Truck, CheckCircle, Clock, Package, User } from 'lucide-react'
import apiClient from '../../services/api'
import { useAuth } from '../../context/AuthContext'

function OrderQueue() {
  const { hasRole } = useAuth()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const isShipper = hasRole('SHIPPER')

  useEffect(() => {
    if (isShipper) {
      fetchAssignedOrders()
    }
  }, [isShipper])

  const fetchAssignedOrders = async () => {
    try {
      setLoading(true)
      const res = await apiClient.get('/orders/assigned')
      setOrders(res.data)
    } catch (err) {
      setError('Failed to fetch assigned orders')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      await apiClient.put(`/orders/${orderId}/status`, { status: newStatus })
      fetchAssignedOrders()
    } catch (err) {
      setError('Failed to update order status')
    }
  }

  if (!isShipper) return <div className="p-8 text-center text-red-600">Access Denied. Shipper only.</div>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Delivery Queue</h1>
        <p className="text-sm text-slate-500">Manage and complete your assigned deliveries.</p>
      </div>

      {error && <div className="rounded-xl bg-red-50 p-4 text-sm text-red-600 border border-red-200">{error}</div>}

      <div className="grid gap-6 md:grid-cols-2">
        {loading ? (
          <p>Loading queue...</p>
        ) : orders.length === 0 ? (
          <div className="card-surface p-12 text-center col-span-full">
            <Package className="mx-auto h-12 w-12 text-slate-200" />
            <p className="mt-4 text-slate-500 font-medium">No orders assigned to you yet.</p>
          </div>
        ) : (
          orders.map(order => (
            <div key={order.id} className="card-surface p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Order #{order.id}</span>
                <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                  order.status === 'SHIPPED' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                }`}>
                  {order.status}
                </span>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-3 text-slate-700">
                  <User className="h-5 w-5 text-slate-400" />
                  <span className="font-medium">Customer ID: {order.user_id}</span>
                </div>
                <div className="flex items-start gap-3 text-slate-700">
                  <Truck className="h-5 w-5 mt-0.5 text-slate-400" />
                  <span className="text-sm">{order.shipping_address}</span>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-1 text-xs text-slate-400">
                  <Clock className="h-3.5 w-3.5" />
                  <span>Placed: {new Date(order.created_at).toLocaleDateString()}</span>
                </div>
                <div className="font-bold text-brand-price">${order.total_price.toFixed(2)}</div>
              </div>

              {order.status !== 'DELIVERED' && (
                <button 
                  className="w-full btn-primary flex items-center justify-center gap-2 py-3"
                  onClick={() => handleUpdateStatus(order.id, 'DELIVERED')}
                >
                  <CheckCircle className="h-5 w-5" />
                  Mark as Delivered
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default OrderQueue
