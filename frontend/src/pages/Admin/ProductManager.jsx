import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, XCircle, Search, Package, Image as ImageIcon } from 'lucide-react'
import apiClient from '../../services/api'
import { useAuth } from '../../context/AuthContext'

function ProductManager() {
  const { hasRole } = useAuth()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  const [modalOpen, setModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'CPU',
    price: '',
    stock_quantity: '',
    sku: '',
    brand: '',
    model: '',
    warranty_months: 12,
    specifications: {}
  })

  const [specKey, setSpecKey] = useState('')
  const [specValue, setSpecValue] = useState('')
  const [imageFile, setImageFile] = useState(null)

  const isAdmin = hasRole('ADMIN')

  useEffect(() => {
    if (isAdmin) {
      fetchProducts()
    }
  }, [isAdmin])

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const res = await apiClient.get('/products/', { params: { is_active: null } })
      setProducts(res.data)
    } catch (err) {
      setError('Failed to fetch products')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenModal = (product = null) => {
    if (product) {
      setEditingProduct(product)
      const specsObj = typeof product.specifications === 'string' 
        ? JSON.parse(product.specifications) 
        : (product.specifications || {})
      
      setFormData({
        name: product.name,
        description: product.description || '',
        category: product.category,
        price: product.price,
        stock_quantity: product.stock_quantity,
        sku: product.sku,
        brand: product.brand || '',
        model: product.model || '',
        warranty_months: product.warranty_months || 12,
        specifications: specsObj
      })
    } else {
      setEditingProduct(null)
      setFormData({
        name: '',
        description: '',
        category: 'CPU',
        price: '',
        stock_quantity: '',
        sku: `PC-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
        brand: '',
        model: '',
        warranty_months: 12,
        specifications: {}
      })
    }
    setSpecKey('')
    setSpecValue('')
    setImageFile(null)
    setModalOpen(true)
  }

  const handleCloseModal = () => {
    setModalOpen(false)
    setEditingProduct(null)
  }

  const handleAddSpec = () => {
    if (specKey && specValue) {
      setFormData({
        ...formData,
        specifications: {
          ...formData.specifications,
          [specKey]: specValue
        }
      })
      setSpecKey('')
      setSpecValue('')
    }
  }

  const handleRemoveSpec = (key) => {
    const newSpecs = { ...formData.specifications }
    delete newSpecs[key]
    setFormData({ ...formData, specifications: newSpecs })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      let savedProduct
      if (editingProduct) {
        const res = await apiClient.put(`/products/${editingProduct.id}`, formData)
        savedProduct = res.data
        setSuccess('Product updated successfully')
      } else {
        const res = await apiClient.post('/products/', formData)
        savedProduct = res.data
        setSuccess('Product created successfully')
      }

      if (imageFile) {
        const imageFormData = new FormData()
        imageFormData.append('file', imageFile)
        await apiClient.post(`/products/${savedProduct.id}/image`, imageFormData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
      }

      handleCloseModal()
      fetchProducts()
    } catch (err) {
      setError(err.response?.data?.detail || 'Operation failed')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return
    try {
      await apiClient.delete(`/products/${id}`)
      setSuccess('Product deleted')
      fetchProducts()
    } catch (err) {
      setError('Failed to delete product')
    }
  }

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (!isAdmin) {
    return <div className="p-8 text-center text-red-600">Access Denied. Admin only.</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Product Management</h1>
          <p className="text-sm text-slate-500">Add, edit, and manage your inventory items.</p>
        </div>
        <button className="btn-primary flex items-center gap-2" onClick={() => handleOpenModal()}>
          <Plus className="h-5 w-5" />
          Add Product
        </button>
      </div>

      {error && <div className="rounded-xl bg-red-50 p-4 text-sm text-red-600 border border-red-200">{error}</div>}
      {success && <div className="rounded-xl bg-green-50 p-4 text-sm text-green-600 border border-green-200">{success}</div>}

      <div className="card-surface p-4 flex items-center gap-3">
        <Search className="h-5 w-5 text-slate-400" />
        <input 
          className="flex-1 bg-transparent focus:outline-none text-sm" 
          placeholder="Search by name or SKU..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="card-surface overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold uppercase text-slate-500">
            <tr>
              <th className="px-6 py-4 text-center w-20">Image</th>
              <th className="px-6 py-4">Product Info</th>
              <th className="px-6 py-4">Category</th>
              <th className="px-6 py-4">Price</th>
              <th className="px-6 py-4">Stock</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan="6" className="px-6 py-10 text-center">Loading...</td></tr>
            ) : filteredProducts.length === 0 ? (
              <tr><td colSpan="6" className="px-6 py-10 text-center text-slate-500">No products found.</td></tr>
            ) : filteredProducts.map(product => (
              <tr key={product.id} className="hover:bg-slate-50/50">
                <td className="px-6 py-4">
                  <div className="h-12 w-12 rounded-lg bg-slate-100 overflow-hidden flex items-center justify-center">
                    {product.image_url ? (
                      <img src={`${import.meta.env.VITE_API_URL}${product.image_url}`} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <ImageIcon className="h-6 w-6 text-slate-300" />
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <p className="font-bold text-slate-900">{product.name}</p>
                  <p className="text-xs text-slate-400">SKU: {product.sku}</p>
                </td>
                <td className="px-6 py-4">
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 uppercase">
                    {product.category}
                  </span>
                </td>
                <td className="px-6 py-4 font-bold text-brand-price">${product.price.toFixed(2)}</td>
                <td className="px-6 py-4">
                  <span className={`font-semibold ${product.stock_quantity < 6 ? 'text-red-500' : 'text-slate-600'}`}>
                    {product.stock_quantity}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button className="p-2 text-slate-400 hover:text-brand-primary" onClick={() => handleOpenModal(product)}>
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button className="p-2 text-slate-400 hover:text-red-500" onClick={() => handleDelete(product.id)}>
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="card-surface w-full max-w-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h2 className="text-xl font-bold text-slate-900">{editingProduct ? 'Edit Product' : 'Add New Product'}</h2>
              <button className="text-slate-400 hover:text-slate-600" onClick={handleCloseModal}>
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase text-slate-500">Product Name</label>
                  <input required className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm focus:border-brand-primary focus:outline-none" 
                    value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase text-slate-500">SKU</label>
                  <input required className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm focus:border-brand-primary focus:outline-none" 
                    value={formData.sku} onChange={e => setFormData({...formData, sku: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase text-slate-500">Category</label>
                  <select className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm focus:border-brand-primary focus:outline-none" 
                    value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                    {['CPU', 'RAM', 'SSD', 'GPU', 'PSU', 'CASE', 'MAIN'].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase text-slate-500">Price ($)</label>
                  <input required type="number" step="0.01" className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm focus:border-brand-primary focus:outline-none" 
                    value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase text-slate-500">Stock Quantity</label>
                  <input required type="number" className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm focus:border-brand-primary focus:outline-none" 
                    value={formData.stock_quantity} onChange={e => setFormData({...formData, stock_quantity: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase text-slate-500">Brand</label>
                  <input className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm focus:border-brand-primary focus:outline-none" 
                    value={formData.brand} onChange={e => setFormData({...formData, brand: e.target.value})} />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-slate-500">Description</label>
                <textarea rows={3} className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm focus:border-brand-primary focus:outline-none" 
                  value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
              </div>

              {/* Dynamic Specifications */}
              <div className="space-y-3 rounded-xl border border-slate-100 bg-slate-50/50 p-4">
                <label className="text-xs font-bold uppercase text-slate-500">CUSTOM SPECIFICATIONS</label>
                <div className="flex gap-2">
                  <input className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs focus:outline-none" 
                    placeholder="Spec Name (e.g. Ports)" value={specKey} onChange={e => setSpecKey(e.target.value)} />
                  <input className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs focus:outline-none" 
                    placeholder="Value (e.g. 3x DP, 1x HDMI)" value={specValue} onChange={e => setSpecValue(e.target.value)} />
                  <button type="button" onClick={handleAddSpec} className="rounded-lg bg-slate-200 px-4 py-1.5 text-xs font-bold hover:bg-slate-300 transition-colors">Add</button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {Object.entries(formData.specifications || {}).map(([key, val]) => (
                    <div key={key} className="flex items-center gap-1 rounded-full bg-white border border-slate-200 px-3 py-1 text-[10px] font-medium text-slate-600">
                      <span>{key}: {val}</span>
                      <button type="button" onClick={() => handleRemoveSpec(key)} className="text-slate-400 hover:text-red-500">
                        <XCircle className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-slate-500">Product Image</label>
                <input type="file" accept="image/*" onChange={e => setImageFile(e.target.files[0])} className="text-sm" />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button type="button" className="btn-outline px-6" onClick={handleCloseModal}>Cancel</button>
                <button type="submit" className="btn-primary px-8">Save Product</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default ProductManager
