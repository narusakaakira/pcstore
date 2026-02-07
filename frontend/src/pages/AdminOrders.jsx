import { useState, useEffect } from 'react'
import { XCircle, ShieldCheck, Truck, Package } from 'lucide-react'
import apiClient from '../services/api'
import { useAuth } from '../context/AuthContext'

const OrderStatus = {
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  SHIPPED: 'SHIPPED',
  DELIVERED: 'DELIVERED',
  CANCELLED: 'CANCELLED'
}

function AdminOrders() {
  const { roles, hasRole } = useAuth()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [statusDialog, setStatusDialog] = useState(false)
  const [shipperDialog, setShipperDialog] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [newStatus, setNewStatus] = useState('')
  const [shipperId, setShipperId] = useState('')

  const isAdmin = hasRole('ADMIN')
  const isShipper = hasRole('SHIPPER')

  useEffect(() => {
    if (isAdmin || isShipper) {
      fetchOrders()
    }
  }, [isAdmin, isShipper])

  const fetchOrders = async () => {
    try {
      setLoading(true)
      setError('')
      const endpoint = isAdmin ? '/orders/' : '/orders/assigned'
      const res = await apiClient.get(endpoint)
      setOrders(res.data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load orders')
    } finally {
      setLoading(false)
    }
  }

  const openStatusDialog = (order) => {
    setSelectedOrder(order)
    setNewStatus(order.status)
    setStatusDialog(true)
  }

  const closeStatusDialog = () => {
    setStatusDialog(false)
    setSelectedOrder(null)
  }

  const openShipperDialog = (order) => {
    setSelectedOrder(order)
    setShipperId(order.shipper_id || '')
    setShipperDialog(true)
  }

  const closeShipperDialog = () => {
    setShipperDialog(false)
    setSelectedOrder(null)
  }

  const handleUpdateStatus = async () => {
    try {
      await apiClient.put(`/orders/${selectedOrder.id}/status`, { status: newStatus })
      setSuccess(`Order #${selectedOrder.id} status updated to ${newStatus}`)
      closeStatusDialog()
      fetchOrders()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update status')
    }
  }

  const handleAssignShipper = async () => {
    try {
      await apiClient.put(`/orders/${selectedOrder.id}/assign-shipper`, { shipper_id: parseInt(shipperId) })
      setSuccess(`Shipper ${shipperId} assigned to Order #${selectedOrder.id}`)
      closeShipperDialog()
      fetchOrders()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to assign shipper')
    }
  }

  if (!isAdmin && !isShipper) {
    return (
      <div className="card-surface p-8 text-center">
        <ShieldCheck className="mx-auto h-12 w-12 text-red-400" />
        <h2 className="mt-4 text-xl font-bold text-slate-900">Access Denied</h2>
        <p className="mt-2 text-slate-500">You need Admin or Shipper roles to access this page.</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center text-slate-500">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-primary border-t-transparent"></div>
          <p className="text-sm font-medium">Loading orders...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            {isAdmin ? 'Order Management' : 'Delivery Queue'}
          </h1>
          <p className="text-sm text-slate-500">
            {isAdmin ? 'Manage all system orders and assignments.' : 'View and update your assigned deliveries.'}
          </p>
        </div>
        <button className="btn-outline" onClick={fetchOrders}>
          Refresh
        </button>
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

      <div className="card-surface overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-6 py-4">Order ID</th>
              <th className="px-6 py-4">Customer ID</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Total</th>
              <th className="px-6 py-4">Shipping Address</th>
              <th className="px-6 py-4">Shipper</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {orders.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-6 py-10 text-center text-slate-500">
                  <div className="flex flex-col items-center gap-2">
                    <Package className="h-8 w-8 text-slate-300" />
                    No orders found.
                  </div>
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr key={order.id} className="hover:bg-slate-50/50">
                  <td className="px-6 py-4 font-bold text-slate-900">#{order.id}</td>
                  <td className="px-6 py-4 text-slate-600">User {order.user_id}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${
                      order.status === 'DELIVERED' ? 'bg-green-100 text-green-700' :
                      order.status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
                      order.status === 'SHIPPED' ? 'bg-blue-100 text-blue-700' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-semibold text-brand-price">
                    ${(order.total_price || 0).toFixed(2)}
                  </td>
                  <td className="max-w-xs truncate px-6 py-4 text-slate-500" title={order.shipping_address}>
                    {order.shipping_address}
                  </td>
                  <td className="px-6 py-4">
                    {order.shipper_id ? (
                      <div className="flex items-center gap-2 text-slate-600">
                        <Truck className="h-4 w-4" />
                        ID: {order.shipper_id}
                      </div>
                    ) : (
                      <span className="text-slate-400 italic">Unassigned</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button className="btn-outline" onClick={() => openStatusDialog(order)}>
                        Status
                      </button>
                      {isAdmin && (
                        <button className="btn-outline" onClick={() => openShipperDialog(order)}>
                          Assign
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {statusDialog && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="card-surface w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">Update Order Status</h2>
              <button className="text-slate-400 hover:text-slate-600" onClick={closeStatusDialog}>
                <XCircle className="h-6 w-6" />
              </button>
            </div>
            <p className="mt-2 text-sm text-slate-500">Set current status for Order #{selectedOrder.id}</p>
            
            <div className="mt-6 space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Status</label>
                <select
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium focus:border-brand-primary focus:outline-none"
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                >
                  {Object.values(OrderStatus).map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>
              <button className="btn-primary w-full py-3" onClick={handleUpdateStatus}>
                Update status
              </button>
            </div>
          </div>
        </div>
      )}

      {shipperDialog && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="card-surface w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">Assign Shipper</h2>
              <button className="text-slate-400 hover:text-slate-600" onClick={closeShipperDialog}>
                <XCircle className="h-6 w-6" />
              </button>
            </div>
            <p className="mt-2 text-sm text-slate-500">Assign Order #{selectedOrder.id} to a delivery partner</p>
            
            <div className="mt-6 space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Shipper User ID</label>
                <input
                  type="number"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm focus:border-brand-primary focus:outline-none"
                  placeholder="Enter shipper's unique ID"
                  value={shipperId}
                  onChange={(e) => setShipperId(e.target.value)}
                />
              </div>
              <button className="btn-primary w-full py-3" onClick={handleAssignShipper}>
                Assign shipper
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminOrders
