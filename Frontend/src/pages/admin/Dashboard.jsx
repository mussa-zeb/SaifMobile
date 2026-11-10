import { useEffect, useState } from 'react'
import { Smartphone, SprayCan, Headphones, TrendingUp, TrendingDown, ShoppingCart, Package } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { api } from '../../api'
import { CURRENCY } from '../../config'

function StatCard({ title, value, sub, Icon, accent = 'text-text-primary', iconBg = 'bg-gray-100', iconColor = 'text-gray-600' }) {
  return (
    <div className="stat-card">
      <div className="flex items-start justify-between">
        <div>
          <p className="stat-title text-[10px] sm:text-xs">{title}</p>
          <p className={`stat-value text-xl sm:text-3xl ${accent}`}>{value}</p>
          {sub && <p className="mt-1 text-[10px] sm:text-xs text-text-muted">{sub}</p>}
        </div>
        <span className={`grid h-8 w-8 sm:h-12 sm:w-12 place-items-center rounded-lg sm:rounded-xl ${iconBg} ${iconColor}`}>
          <Icon className="h-4 w-4 sm:h-6 sm:w-6" />
        </span>
      </div>
    </div>
  )
}

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const value = payload[0].value;
    return (
      <div className="rounded-xl border border-border bg-surface p-3 shadow-xl">
        <p className="text-sm font-bold text-text-primary mb-1">{label}</p>
        <p className={`text-sm font-extrabold ${value >= 0 ? 'text-success' : 'text-danger'}`}>{value >= 0 ? '+' : '-'}{CURRENCY} {Math.abs(value).toLocaleString()}</p>
      </div>
    )
  }
  return null
}

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [range, setRange] = useState('1w') 

  useEffect(() => {
    setData(null)
    api.getDashboard({ range }).then(setData).catch((e) => setError(e.message))
  }, [range])

  if (error) return <p className="text-danger font-bold p-8">{error}</p>
  if (!data) return <p className="text-text-muted p-8 animate-pulse">Loading dashboard...</p>

  const trendData = data.trend || []
  const isProfit = data.rangeStats.profit >= 0

  return (
    <div className="w-full overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="page-title text-xl sm:text-2xl">Dashboard</h1>
          <p className="page-subtitle text-xs sm:text-sm">Overview of your store's performance</p>
        </div>
        
        {/* Toggle Group - fits perfectly on mobile */}
        <div className="flex rounded-xl border border-border bg-gray-50 p-1 w-full sm:w-auto">
          {['1w', '1m', '90d', '1y'].map((t) => (
            <button key={t} onClick={() => setRange(t)} className={`flex-1 sm:flex-none rounded-lg px-2 sm:px-4 py-1.5 text-xs sm:text-sm font-bold transition-all ${range === t ? 'bg-brand text-white shadow-md' : 'text-text-secondary hover:text-text-primary hover:bg-white'}`}>
              {t === '1w' ? '7D' : t === '1m' ? '30D' : t === '90d' ? '90D' : '1Y'}
            </button>
          ))}
        </div>
      </div>

      {/* Grid is 2 cols on mobile, 3 on desktop exactly like screenshot */}
      <div className="mt-6 grid gap-3 sm:gap-5 grid-cols-2 lg:grid-cols-3">
        <StatCard title="Available Mobiles" value={data.available.mobile} sub="current stock" Icon={Smartphone} iconColor="text-brand" iconBg="bg-brand/10" />
        <StatCard title="Available Perfumes" value={data.available.perfume} sub="current stock" Icon={SprayCan} iconColor="text-gold" iconBg="bg-gold/10" />
        <StatCard title="Available Headphones" value={data.available.headphone} sub="current stock" Icon={Headphones} iconColor="text-blue-600" iconBg="bg-blue-50" />
        <StatCard title="Sales Revenue" value={`${CURRENCY} ${Number(data.rangeStats.salesTotal).toLocaleString()}`} sub={`${data.rangeStats.salesCount} items sold`} Icon={ShoppingCart} iconColor="text-success" iconBg="bg-success/10" />
        <StatCard title="Restocks" value={`${CURRENCY} ${Number(data.rangeStats.buysTotal).toLocaleString()}`} sub="added cost" Icon={Package} iconColor="text-text-secondary" iconBg="bg-gray-100" />
        <StatCard title="Profit / Loss" value={`${CURRENCY} ${Number(data.rangeStats.profit).toLocaleString()}`} sub="selected period" Icon={isProfit ? TrendingUp : TrendingDown} accent={isProfit ? 'text-success' : 'text-danger'} iconBg={isProfit ? 'bg-success/10' : 'bg-danger/10'} iconColor={isProfit ? 'text-success' : 'text-danger'} />
      </div>

      <div className="mt-6 sm:mt-8 card p-4 sm:p-6 w-full overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4 sm:mb-6">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-text-primary">Profit Growth</h2>
            <p className="text-xs sm:text-sm text-text-secondary mt-0.5">Daily profit</p>
          </div>
          <p className={`text-sm sm:text-xl font-black ${isProfit ? 'text-success' : 'text-danger'}`}>
            {isProfit ? '+' : ''}{CURRENCY} {Number(data.rangeStats.profit).toLocaleString()}
          </p>
        </div>

        <div className="h-[250px] sm:h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendData} margin={{ top: 10, right: 0, left: -25, bottom: 0 }}>
              <defs>
                <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#73152A" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#73152A" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
              <XAxis dataKey="label" stroke="#9ca3af" tick={{ fill: '#6b7280', fontSize: 10 }} tickLine={false} axisLine={false} minTickGap={20} />
              <YAxis stroke="#9ca3af" tick={{ fill: '#6b7280', fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={(value) => value >= 1000 ? `${value / 1000}k` : value} />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#d1d5db', strokeWidth: 1, strokeDasharray: '3 3' }} />
              <Area type="monotone" dataKey="profit" stroke="#73152A" strokeWidth={3} fillOpacity={1} fill="url(#colorProfit)" activeDot={{ r: 6, fill: '#73152A', stroke: '#ffffff', strokeWidth: 2 }} dot={{ r: 3, fill: '#ffffff', stroke: '#73152A', strokeWidth: 2 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}