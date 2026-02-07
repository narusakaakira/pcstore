import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ShoppingCart, ArrowLeft, ShieldCheck, Truck, RotateCcw, Image as ImageIcon } from 'lucide-react'
import apiClient from '../services/api'
import { useAuth } from '../context/AuthContext'

function ProductDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [quantity, setQuantity] = useState(1)

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true)
        const res = await apiClient.get(`/products/${id}`)
        setProduct(res.data)
      } catch (err) {
        setError(err.response?.data?.detail || 'Product not found')
      } finally {
        setLoading(false)
      }
    }
    fetchProduct()
  }, [id])

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }

    try {
      await apiClient.post('/cart/', {
        product_id: product.id,
        quantity: quantity,
      })
      alert('Added to cart!')
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to add to cart')
    }
  }

  if (loading) return <div className="flex min-h-[400px] items-center justify-center text-slate-500">Loading product details...</div>
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>
  if (!product) return null

  const getSpecs = () => {
    const baseSpecs = [
      { label: 'Brand', value: product.brand || 'Updating...' },
      { label: 'Model', value: product.model || 'Updating...' },
      { label: 'Product Code (SKU)', value: product.sku },
      { label: 'Category', value: product.category },
      { label: 'Warranty', value: `${product.warranty_months} months` },
      { label: 'Status', value: product.stock_quantity > 0 ? 'In Stock' : 'Out of Stock' },
    ]

    let extraSpecs = []
    try {
      const specsObj = typeof product.specifications === 'string' 
        ? JSON.parse(product.specifications) 
        : (product.specifications || {})
      
      extraSpecs = Object.entries(specsObj).map(([key, value]) => ({
        label: key,
        value: value
      }))
    } catch (e) {
      console.error("Failed to parse specifications", e)
    }

    return [...baseSpecs, ...extraSpecs]
  }

  const specs = getSpecs()

  return (
    <div className="space-y-6">
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-brand-primary transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Left: Product Image */}
        <div className="card-surface p-6 flex items-center justify-center bg-white min-h-[400px]">
          {product.image_url ? (
            <img 
              src={`${import.meta.env.VITE_API_URL}${product.image_url}`} 
              alt={product.name}
              className="max-h-[400px] w-full object-contain"
            />
          ) : (
            <div className="flex flex-col items-center text-slate-300">
              <ImageIcon className="h-20 w-20" />
              <span>No Image Available</span>
            </div>
          )}
        </div>

        {/* Right: Product Info */}
        <div className="flex flex-col gap-6">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">{product.name}</h1>
            <p className="text-sm text-slate-500">Brand: <span className="text-brand-primary font-semibold">{product.brand || 'N/A'}</span> | SKU: {product.sku}</p>
          </div>

          <div className="flex items-baseline gap-4">
            <span className="text-3xl font-bold text-brand-price">${(product.price || 0).toFixed(2)}</span>
            <span className="text-lg text-slate-400 line-through">${(product.price * 1.15).toFixed(2)}</span>
            <span className="rounded-lg bg-red-50 px-2 py-1 text-xs font-bold text-red-500">-15%</span>
          </div>

          <div className="card-surface p-4 bg-slate-50 border-none space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center rounded-xl border border-slate-200 bg-white">
                <button 
                  className="px-3 py-2 hover:text-brand-primary"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                >
                  -
                </button>
                <span className="w-12 text-center font-semibold">{quantity}</span>
                <button 
                  className="px-3 py-2 hover:text-brand-primary"
                  onClick={() => setQuantity(Math.min(product.stock_quantity, quantity + 1))}
                >
                  +
                </button>
              </div>
              <button 
                className="btn-primary flex-1 py-3 flex items-center justify-center gap-2"
                disabled={product.stock_quantity <= 0}
                onClick={handleAddToCart}
              >
                <ShoppingCart className="h-5 w-5" />
                {product.stock_quantity > 0 ? 'Add to Cart' : 'Out of Stock'}
              </button>
            </div>
          </div>

          {/* Highlights / Specs Table */}
          <div className="space-y-4">
            <div className="bg-red-600 text-white px-4 py-2 font-bold uppercase text-sm rounded-t-xl">
              Technical Specifications
            </div>
            <div className="border border-slate-100 rounded-b-xl overflow-hidden">
              {specs.map((spec, idx) => (
                <div key={idx} className={`flex text-sm ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}`}>
                  <div className="w-1/3 px-4 py-3 font-semibold text-slate-600 border-r border-slate-100">{spec.label}</div>
                  <div className="w-2/3 px-4 py-3 text-slate-700">{spec.value}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-slate-100">
            <div className="flex items-center gap-3 text-sm text-slate-600">
              <ShieldCheck className="h-5 w-5 text-green-500" />
              <span>Genuine warranty {product.warranty_months} months</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-slate-600">
              <Truck className="h-5 w-5 text-blue-500" />
              <span>Nationwide delivery, free installation</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-slate-600">
              <RotateCcw className="h-5 w-5 text-orange-500" />
              <span>30-day replacement policy</span>
            </div>
          </div>
        </div>
      </div>

      {/* Description Section */}
      <div className="card-surface p-6 mt-8">
        <h2 className="text-xl font-bold text-slate-900 mb-4 border-b pb-2">Product Description</h2>
        <div className="prose prose-slate max-w-none text-slate-600">
          {product.description || 'No detailed description available for this product.'}
        </div>
      </div>
    </div>
  )
}

export default ProductDetail
