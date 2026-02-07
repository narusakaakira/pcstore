import { useState, useEffect } from 'react'
import { PackageSearch, XCircle, Truck } from 'lucide-react'
import apiClient from '../services/api'
import { useAuth } from '../context/AuthContext'

function MyOrders() {
  const { isAuthenticated } = useAuth()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [detailDialog, setDetailDialog] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState(null)

  const [cancelDialog, setCancelDialog] = useState(false)
  const [orderToCancel, setOrderToCancel] = useState(null)

  useEffect(() => {
    if (isAuthenticated) {
      fetchOrders()
    }
  }, [isAuthenticated])

  const fetchOrders = async () => {
    try {
      setLoading(true)
      setError('')
      const res = await apiClient.get('/orders/my')
      setOrders(res.data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load orders')
    } finally {
      setLoading(false)
    }
  }

  const openDetailDialog = (order) => {
    setSelectedOrder(order)
    setDetailDialog(true)
  }

  const closeDetailDialog = () => {
    setDetailDialog(false)
    setSelectedOrder(null)
  }

  const openCancelDialog = (order) => {
    setOrderToCancel(order)
    setCancelDialog(true)
  }

  const closeCancelDialog = () => {
    setCancelDialog(false)
    setOrderToCancel(null)
  }

  const handleCancelOrder = async () => {
    if (!orderToCancel) return

    try {
      await apiClient.put(`/orders/${orderToCancel.id}/cancel`)
      setSuccess(`Order #${orderToCancel.id} cancelled. Items restocked.`)
      closeCancelDialog()
      fetchOrders()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to cancel order')
    }
  }

  const canCancelOrder = (order) => {
    return order.status === 'PENDING' || order.status === 'CONFIRMED'
  }

  if (!isAuthenticated) {
    return (
      <div className="card-surface p-6 text-sm text-slate-600">
        Please log in to view your orders.
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center text-slate-500">
        Loading orders...
      </div>
    )
  }

  const totalSpent = orders.reduce((sum, order) => sum + order.total_price, 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">My Orders</h1>
        <p className="text-sm text-slate-500">Track deliveries, view invoices, and manage purchases.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="card-surface p-4">
          <p className="text-xs uppercase tracking-wide text-slate-400">Total Orders</p>
          <p className="text-2xl font-bold text-slate-900">{orders.length}</p>
        </div>
        <div className="card-surface p-4">
          <p className="text-xs uppercase tracking-wide text-slate-400">Total Spent</p>
          <p className="text-2xl font-bold text-brand-price">${totalSpent.toFixed(2)}</p>
        </div>
        <div className="card-surface p-4">
          <p className="text-xs uppercase tracking-wide text-slate-400">Active Orders</p>
          <p className="text-2xl font-bold text-slate-900">
            {orders.filter((order) => order.status !== 'DELIVERED' && order.status !== 'CANCELLED').length}
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-600">
          {success}
        </div>
      )}

      {orders.length === 0 ? (
        <div className="card-surface flex flex-col items-center gap-3 p-10 text-center">
          <PackageSearch className="h-10 w-10 text-slate-400" />
          <p className="text-slate-600">You haven't placed any orders yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="card-surface p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-lg font-semibold text-slate-900">Order #{order.id}</p>
                  <p className="text-xs text-slate-400">
                    {new Date(order.created_at).toLocaleDateString()}
                  </p>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                  {order.status}
                </span>
              </div>

              <div className="mt-4 grid gap-4 lg:grid-cols-[2fr_1fr]">
                <div>
                  <p className="text-sm font-semibold text-slate-700">Items ({order.items.length})</p>
                  <div className="mt-2 space-y-1 text-sm text-slate-500">
                    {order.items.slice(0, 3).map((item) => (
                      <p key={item.id}>
                        {item.product_name} × {item.quantity} · ${item.price_at_order.toFixed(2)}
                      </p>
                    ))}
                    {order.items.length > 3 && (
                      <p className="text-xs text-slate-400">+{order.items.length - 3} more items</p>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-700">Shipping Address</p>
                  <p className="mt-2 text-sm text-slate-500">{order.shipping_address}</p>
                </div>
              </div>

              {order.notes && (
                <div className="mt-4 rounded-xl bg-slate-50 p-3 text-sm text-slate-500">
                  Notes: {order.notes}
                </div>
              )}

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Truck className="h-4 w-4" />
                  Estimated delivery in 2-5 days
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-semibold text-brand-price">
                    ${order.total_price.toFixed(2)}
                  </span>
                  <button className="btn-outline" onClick={() => openDetailDialog(order)}>
                    Details
                  </button>
                  {canCancelOrder(order) && (
                    <button className="btn-outline text-red-500" onClick={() => openCancelDialog(order)}>
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {detailDialog && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="card-surface w-full max-w-2xl p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Order #{selectedOrder.id}</h2>
              <button className="text-slate-400 hover:text-slate-600" onClick={closeDetailDialog}>
                <XCircle className="h-5 w-5" />
              </button>
            </div>
            <p className="text-xs text-slate-400">Placed: {new Date(selectedOrder.created_at).toLocaleString()}</p>

            <div className="mt-4 space-y-2 text-sm">
              {selectedOrder.items.map((item) => (
                <div key={item.id} className="flex justify-between text-slate-600">
                  <span>{item.product_name} × {item.quantity}</span>
                  <span>${item.price_at_order.toFixed(2)}</span>
                </div>
              ))}
              <div className="flex justify-between border-t border-slate-200 pt-3 text-base font-semibold text-slate-900">
                <span>Total</span>
                <span>${selectedOrder.total_price.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {cancelDialog && orderToCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="card-surface w-full max-w-md p-6">
            <h2 className="text-lg font-semibold text-slate-900">Cancel Order</h2>
            <p className="mt-2 text-sm text-slate-500">
              Are you sure you want to cancel Order #{orderToCancel.id}? Items will be restocked.
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <button className="btn-outline" onClick={closeCancelDialog}>
                Keep order
              </button>
              <button className="btn-primary bg-red-500 hover:bg-red-600" onClick={handleCancelOrder}>
                Cancel order
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default MyOrders
