import { useNavigate } from 'react-router-dom'
import { Monitor, Cpu, MemoryStick as Ram, HardDrive, Zap, Box, ShoppingBag } from 'lucide-react'

const categories = [
  { name: 'MAIN', icon: Monitor, color: 'bg-blue-500' },
  { name: 'CPU', icon: Cpu, color: 'bg-purple-500' },
  { name: 'RAM', icon: Ram, color: 'bg-pink-500' },
  { name: 'SSD', icon: HardDrive, color: 'bg-orange-500' },
  { name: 'GPU', icon: Zap, color: 'bg-yellow-500' },
  { name: 'PSU', icon: Box, color: 'bg-green-500' },
  { name: 'CASE', icon: Box, color: 'bg-slate-500' },
]

function Home() {
  const navigate = useNavigate()

  return (
    <div className="space-y-12 py-6">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-[2.5rem] bg-slate-900 px-8 py-20 text-white shadow-2xl">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-brand-primary opacity-20 blur-3xl"></div>
        <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-indigo-500 opacity-20 blur-3xl"></div>
        
        <div className="relative z-10 mx-auto max-w-3xl text-center">
          <h1 className="text-5xl font-extrabold tracking-tight sm:text-6xl">
            Ultimate <span className="text-brand-primary">PC Builds</span> for Pro Gamers
          </h1>
          <p className="mt-6 text-lg text-slate-400">
            From high-performance CPUs to stunning cases, build your dream machine with the world's best components.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <button
              className="btn-primary px-8 py-4 text-base"
              onClick={() => navigate('/products')}
            >
              Start Building
            </button>
            <button
              className="btn-outline border-slate-700 text-white hover:bg-slate-800 px-8 py-4 text-base"
              onClick={() => navigate('/products')}
            >
              Browse Deals
            </button>
          </div>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-900">Shop by Category</h2>
          <button
            className="text-sm font-semibold text-brand-primary hover:underline"
            onClick={() => navigate('/products')}
          >
            View all
          </button>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-7">
          {categories.map((cat) => (
            <button
              key={cat.name}
              className="group flex flex-col items-center gap-3 rounded-3xl border border-slate-100 bg-white p-6 shadow-sm transition-all hover:border-brand-primary hover:shadow-md"
              onClick={() => navigate(`/products?category=${cat.name}`)}
            >
              <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${cat.color} text-white transition-transform group-hover:scale-110`}>
                <cat.icon className="h-7 w-7" />
              </div>
              <span className="text-sm font-bold text-slate-700">{cat.name}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Featured Section */}
      <section className="grid gap-6 md:grid-cols-2">
        <div className="group relative overflow-hidden rounded-[2rem] bg-indigo-600 p-8 text-white shadow-lg">
          <div className="relative z-10">
            <h3 className="text-2xl font-bold">New Arrivals</h3>
            <p className="mt-2 text-indigo-100">Check out the latest RTX 50 series cards now in stock.</p>
            <button
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-indigo-600 transition-transform hover:scale-105"
              onClick={() => navigate('/products')}
            >
              Explore Now
            </button>
          </div>
          <ShoppingBag className="absolute -bottom-6 -right-6 h-40 w-40 opacity-10 transition-transform group-hover:scale-110 group-hover:rotate-12" />
        </div>
        <div className="group relative overflow-hidden rounded-[2rem] bg-brand-dark p-8 text-white shadow-lg">
          <div className="relative z-10">
            <h3 className="text-2xl font-bold">Build Your Own</h3>
            <p className="mt-2 text-blue-100">Use our configurator to ensure part compatibility.</p>
            <button
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-brand-dark transition-transform hover:scale-105"
              onClick={() => navigate('/products')}
            >
              Configurator
            </button>
          </div>
          <Cpu className="absolute -bottom-6 -right-6 h-40 w-40 opacity-10 transition-transform group-hover:scale-110 group-hover:-rotate-12" />
        </div>
      </section>
    </div>
  )
}

export default Home
