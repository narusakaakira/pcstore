import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Search, SlidersHorizontal, Sparkles, ShoppingCart, Plus, XCircle, Image as ImageIcon, Trash2 } from 'lucide-react'
import apiClient from '../services/api'
import { useAuth } from '../context/AuthContext'

function Products() {
  const { isAuthenticated, hasRole } = useAuth()
  const isAdmin = hasRole('ADMIN')
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const categoryParam = searchParams.get('category')

  const [products, setProducts] = useState([])
  const [allProducts, setAllProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [customCategories, setCustomCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('name')

  // Modals state
  const [modalOpen, setModalOpen] = useState(false)
  const [categoryModalOpen, setCategoryModalOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [imageFile, setImageFile] = useState(null)
  
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    price: '',
    category: categoryParam || 'MAIN',
    stock_quantity: 10,
    description: '',
    brand: '',
    model: '',
    warranty_months: 12,
    specifications: {}
  })

  const [specKey, setSpecKey] = useState('')
  const [specValue, setSpecValue] = useState('')
  const [newCategoryName, setNewCategoryName] = useState('')

  const [currentSlide, setCurrentSlide] = useState(0)
  const slides = [
    {
      title: "Build your dream PC",
      description: "Explore curated components and performance-ready builds. Use categories to dive deeper.",
      gradient: "from-brand-dark via-brand-primary to-indigo-500",
      buttonText: "See featured deals"
    },
    {
      title: "Ultimate Gaming Gear",
      description: "Upgrade your setup with the latest RTX 40-series cards and high-refresh monitors.",
      gradient: "from-purple-600 via-indigo-600 to-blue-600",
      buttonText: "Shop Graphics Cards"
    },
    {
      title: "Workstation Excellence",
      description: "Power through your workflow with Threadripper processors and professional GPUs.",
      gradient: "from-slate-800 via-slate-900 to-brand-dark",
      buttonText: "View Workstations"
    }
  ]

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [slides.length])

  const fetchAll = async () => {
    try {
      const res = await apiClient.get('/products/')
      setAllProducts(res.data)
      const unique = Array.from(new Set(res.data.map((p) => p.category).filter(Boolean)))
      setCategories(unique)
    } catch (err) {
      setCategories([])
    }
  }

  const fetchProducts = async () => {
    try {
      setLoading(true)
      setError('')
      const params = {}
      if (categoryParam) {
        params.category = categoryParam
      }
      const res = await apiClient.get('/products/', { params })
      setProducts(res.data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load products')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAll()
  }, [])

  useEffect(() => {
    fetchProducts()
  }, [categoryParam])

  const mergedCategories = useMemo(() => {
    const combined = [...categories, ...customCategories]
    return Array.from(new Set(combined)).sort()
  }, [categories, customCategories])

  const filteredProducts = useMemo(() => {
    return products
      .filter((p) =>
        (p.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (p.description?.toLowerCase() || '').includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => {
        switch (sortBy) {
          case 'price-asc':
            return (a.price || 0) - (b.price || 0)
          case 'price-desc':
            return (b.price || 0) - (a.price || 0)
          case 'stock':
            return (b.stock_quantity || 0) - (a.stock_quantity || 0)
          case 'name':
          default:
            return (a.name || '').localeCompare(b.name || '')
        }
      })
  }, [products, searchTerm, sortBy])

  const previewCategory = categoryParam || mergedCategories[0]
  const previewProducts = (allProducts || []).filter((p) => p.category === previewCategory).slice(0, 3)

  const handleAddToCart = async (productId) => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }

    try {
      await apiClient.post('/cart/', {
        product_id: productId,
        quantity: 1,
      })
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to add to cart')
    }
  }

  const handleCategorySelect = (category) => {
    if (category === 'All') {
      searchParams.delete('category')
      setSearchParams(searchParams)
      return
    }
    setSearchParams({ category })
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

  const handleOpenModal = () => {
    setFormData({
      name: '',
      sku: `PC-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      price: '',
      category: categoryParam || 'MAIN',
      stock_quantity: 10,
      description: '',
      brand: '',
      model: '',
      warranty_months: 12,
      specifications: {}
    })
    setImageFile(null)
    setModalOpen(true)
  }

  const handleCreateProduct = async (e) => {
    e.preventDefault()
    try {
      setSubmitting(true)
      const res = await apiClient.post('/products/', formData)
      const newProduct = res.data

      if (imageFile) {
        const imageFormData = new FormData()
        imageFormData.append('file', imageFile)
        await apiClient.post(`/products/${newProduct.id}/image`, imageFormData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
      }

      setModalOpen(false)
      fetchProducts()
      fetchAll()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create product')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return
    try {
      await apiClient.delete(`/products/${id}`)
      fetchProducts()
      fetchAll()
    } catch (err) {
      setError('Failed to delete product')
    }
  }

  const handleAddCategory = (e) => {
    e.preventDefault()
    if (newCategoryName && !mergedCategories.includes(newCategoryName)) {
      setCustomCategories([...customCategories, newCategoryName])
      setNewCategoryName('')
      setCategoryModalOpen(false)
    }
  }

  const handleDeleteCategory = async (category) => {
    if (!window.confirm(`Are you sure you want to delete ALL products in category "${category}"?`)) return
    try {
      const productsToDelete = allProducts.filter(p => p.category === category)
      await Promise.all(productsToDelete.map(p => apiClient.delete(`/products/${p.id}`)))
      if (categoryParam === category) {
        searchParams.delete('category')
        setSearchParams(searchParams)
      }
      fetchProducts()
      fetchAll()
    } catch (err) {
      setError('Failed to delete category')
    }
  }

  return (
    <div className="space-y-6 relative">
      <div className={`relative overflow-hidden rounded-3xl bg-gradient-to-r ${slides[currentSlide].gradient} px-6 py-8 text-white shadow-card transition-all duration-700 ease-in-out`}>
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between relative z-10">
          <div className="animate-in fade-in slide-in-from-left-4 duration-500">
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">
              <Sparkles className="h-4 w-4" />
              New drops every week
            </div>
            <h1 className="text-3xl font-bold">{slides[currentSlide].title}</h1>
            <p className="mt-2 max-w-xl text-sm text-white/80">
              {slides[currentSlide].description}
            </p>
          </div>
          <button className="btn-outline bg-white/10 text-white hover:bg-white/20 animate-in fade-in slide-in-from-right-4 duration-500">
            {slides[currentSlide].buttonText}
          </button>
        </div>
        
        {/* Slide indicators */}
        <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-2">
          {slides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentSlide(idx)}
              className={`h-1.5 rounded-full transition-all ${
                currentSlide === idx ? 'w-6 bg-white' : 'w-1.5 bg-white/40'
              }`}
            />
          ))}
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        <div className="space-y-4">
          <div className="card-surface p-4">
            <h3 className="text-sm font-semibold text-slate-700">Categories</h3>
            <div className="mt-3 flex flex-col gap-2">
              <button
                className={`rounded-lg px-3 py-2 text-left text-sm font-semibold ${
                  !categoryParam ? 'bg-brand-primary/10 text-brand-primary' : 'text-slate-600 hover:bg-slate-100'
                }`}
                onClick={() => handleCategorySelect('All')}
              >
                All Products
              </button>
              {mergedCategories.map((category) => (
                <div key={category} className="group flex items-center gap-1">
                  <button
                    className={`flex-1 rounded-lg px-3 py-2 text-left text-sm font-semibold transition-all ${
                      categoryParam === category
                        ? 'bg-brand-primary/10 text-brand-primary'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                    onClick={() => handleCategorySelect(category)}
                  >
                    {category}
                  </button>
                  {isAdmin && (
                    <button 
                      onClick={() => handleDeleteCategory(category)}
                      className="p-2 text-slate-300 opacity-0 hover:text-red-500 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
              {isAdmin && (
                <button 
                  onClick={() => setCategoryModalOpen(true)}
                  className="flex w-full items-center justify-center rounded-lg py-2 text-slate-300 hover:bg-slate-50 hover:text-brand-primary transition-all"
                  title="Thêm danh mục"
                >
                  <Plus className="h-5 w-5" />
                </button>
              )}
            </div>
          </div>

          <div className="card-surface p-4">
            <h3 className="text-sm font-semibold text-slate-700">Category Preview</h3>
            <p className="text-xs text-slate-500 uppercase">
              {previewCategory || 'All Products'}
            </p>
            <div className="mt-3 space-y-3">
              {previewProducts.length === 0 && (
                <p className="text-sm text-slate-500">No preview items.</p>
              )}
              {previewProducts.map((product) => (
                <div key={product.id} className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-slate-100 overflow-hidden">
                    {product.image_url ? (
                      <img
                        src={`${import.meta.env.VITE_API_URL}${product.image_url}`}
                        alt={product.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-[10px] text-slate-300">
                        No Image
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-700 truncate">{product.name}</p>
                    <p className="text-xs text-brand-price">${(product.price || 0).toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="card-surface flex flex-wrap items-center gap-3 p-4">
            <div className="flex flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2">
              <Search className="h-4 w-4 text-slate-400" />
              <input
                className="w-full text-sm text-slate-700 focus:outline-none"
                placeholder="Search products, brands, models..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600">
              <SlidersHorizontal className="h-4 w-4" />
              <select
                className="bg-transparent text-sm font-semibold text-slate-700 focus:outline-none"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="name">Name (A-Z)</option>
                <option value="price-asc">Price (Low to High)</option>
                <option value="price-desc">Price (High to Low)</option>
                <option value="stock">Stock Available</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="flex min-h-[280px] items-center justify-center text-slate-500">
              Loading products...
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredProducts.map((product) => (
                <div 
                  key={product.id} 
                  className="card-surface overflow-hidden group relative cursor-pointer"
                  onClick={() => navigate(`/products/${product.id}`)}
                >
                  {isAdmin && (
                    <button 
                      className="absolute right-2 top-2 z-10 rounded-full bg-white/80 p-2 text-slate-400 opacity-0 backdrop-blur-sm hover:text-red-500 group-hover:opacity-100 transition-all shadow-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteProduct(product.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                  <div className="h-44 bg-slate-100">
                    {product.image_url ? (
                      <img
                        src={`${import.meta.env.VITE_API_URL}${product.image_url}`}
                        alt={product.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs text-slate-400">
                        No Image
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-2 p-4">
                    <div>
                      <h3 className="text-base font-semibold text-slate-900 group-hover:text-brand-primary transition-colors">{product.name}</h3>
                      <p className="text-xs text-slate-500 line-clamp-2">{product.description}</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-semibold text-brand-price">
                        ${(product.price || 0).toFixed(2)}
                      </span>
                      <span className={`rounded-full px-2 py-1 text-xs ${product.stock_quantity < 6 ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-600'}`}>
                        Stock: {product.stock_quantity}
                      </span>
                    </div>
                    <button
                      className="btn-primary mt-2 w-full"
                      disabled={product.stock_quantity <= 0}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddToCart(product.id);
                      }}
                    >
                      <ShoppingCart className="mr-2 h-4 w-4" />
                      {product.stock_quantity <= 0 ? 'Out of stock' : 'Add to cart'}
                    </button>
                  </div>
                </div>
              ))}

              {isAdmin && (
                <div 
                  className="card-surface flex flex-col items-center justify-center border-2 border-dashed border-slate-200 p-8 text-slate-400 hover:border-brand-primary hover:text-brand-primary cursor-pointer transition-all group min-h-[300px]"
                  onClick={handleOpenModal}
                >
                  <div className="rounded-full border-4 border-slate-200 p-6 group-hover:border-brand-primary group-hover:bg-brand-primary/5 transition-all">
                    <Plus className="h-16 w-16" />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Add Product Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm transition-opacity">
          <div className="card-surface w-full max-w-lg p-6 shadow-2xl animate-in fade-in zoom-in duration-200 overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h2 className="text-xl font-bold text-slate-900">Add New Product</h2>
              <button className="text-slate-400 hover:text-slate-600 transition-colors" onClick={() => setModalOpen(false)}>
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="mt-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-slate-500">Product Name</label>
                <input required className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-brand-primary focus:outline-none transition-all" 
                  value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. Asus ROG Gaming Laptop" />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase text-slate-500">Product Code (SKU)</label>
                  <input required className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-brand-primary focus:outline-none transition-all" 
                    value={formData.sku} onChange={e => setFormData({...formData, sku: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase text-slate-500">Price ($)</label>
                  <input required type="number" step="0.01" className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-brand-primary focus:outline-none transition-all" 
                    value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} placeholder="0.00" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase text-slate-500">Category</label>
                  <select className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-brand-primary focus:outline-none transition-all" 
                    value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                    {mergedCategories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase text-slate-500">Stock Quantity</label>
                  <input required type="number" className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-brand-primary focus:outline-none transition-all" 
                    value={formData.stock_quantity} onChange={e => setFormData({...formData, stock_quantity: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase text-slate-500">Brand</label>
                  <input className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-brand-primary focus:outline-none transition-all" 
                    value={formData.brand} onChange={e => setFormData({...formData, brand: e.target.value})} placeholder="e.g. ASUS, MSI..." />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase text-slate-500">Warranty (Months)</label>
                  <input type="number" className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-brand-primary focus:outline-none transition-all" 
                    value={formData.warranty_months} onChange={e => setFormData({...formData, warranty_months: e.target.value})} />
                </div>
              </div>

              {/* Dynamic Specifications */}
              <div className="space-y-3 rounded-xl border border-slate-100 bg-slate-50/50 p-4">
                <label className="text-xs font-bold uppercase text-slate-500">Custom Specifications</label>
                <div className="flex gap-2">
                  <input className="flex-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs focus:outline-none" 
                    placeholder="Spec Name (e.g. Ports)" value={specKey} onChange={e => setSpecKey(e.target.value)} />
                  <input className="flex-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs focus:outline-none" 
                    placeholder="Value (e.g. 3x DP, 1x HDMI)" value={specValue} onChange={e => setSpecValue(e.target.value)} />
                  <button type="button" onClick={handleAddSpec} className="rounded-lg bg-slate-200 px-3 py-1.5 text-xs font-bold hover:bg-slate-300">Add</button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {Object.entries(formData.specifications).map(([key, val]) => (
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
                <div className="flex items-center gap-3">
                  <label className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 px-4 py-3 hover:border-brand-primary transition-all">
                    <ImageIcon className="h-5 w-5 text-slate-400" />
                    <span className="text-sm text-slate-500">{imageFile ? imageFile.name : 'Select image...'}</span>
                    <input type="file" accept="image/*" className="hidden" onChange={e => setImageFile(e.target.files[0])} />
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button type="button" className="btn-outline px-6" onClick={() => setModalOpen(false)}>Cancel</button>
                <button type="submit" disabled={submitting} className="btn-primary px-8 flex items-center gap-2">
                  {submitting ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : <Plus className="h-4 w-4" />}
                  Add Now
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Category Modal */}
      {categoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm transition-opacity">
          <div className="card-surface w-full max-w-sm p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h2 className="text-xl font-bold text-slate-900">Add New Category</h2>
              <button className="text-slate-400 hover:text-slate-600 transition-colors" onClick={() => setCategoryModalOpen(false)}>
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleAddCategory} className="mt-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-slate-500">Category Name</label>
                <input required autoFocus className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-brand-primary focus:outline-none transition-all" 
                  value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} placeholder="e.g. RAM, CPU, GPU..." />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button type="button" className="btn-outline px-6" onClick={() => setCategoryModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn-primary px-8">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Products
