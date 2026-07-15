import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence, Reorder } from 'framer-motion'
import { 
  TrendingUp, 
  Users, 
  Package, 
  AlertTriangle, 
  Clock, 
  Settings2, 
  Eye, 
  EyeOff, 
  GripVertical,
  CheckCircle2,
  Calendar,
  PackageSearch,
  ShoppingCart,
  Award
} from 'lucide-react'
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer
} from 'recharts'
import PageWrapper from '../components/PageWrapper'
import Card from '../design-system/components/Card'
import Button from '../design-system/components/Button'
import Badge from '../design-system/components/Badge'
import AnimatedNumber from '../components/AnimatedNumber'
import { useDashboardStore } from '../store/useDashboardStore'
import { useNotificationStore } from '../store/useNotificationStore'
import { salesApi } from '../api/sales'

import mascotaPose1 from '../assets/mascota-pose-1.png'

// --- WIDGET COMPONENTS ---

const StatsWidget = ({ stats }) => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
    {[
      { label: 'Ventas Hoy', value: stats?.daily_total || 0, icon: TrendingUp, bg: 'bg-[#FFF0F0]', color: 'text-[#C62828]' },
      { label: 'Transacciones', value: stats?.transaction_count || 0, icon: Clock, bg: 'bg-[#F4BFBF]/30', color: 'text-[#C62828]' },
      { label: 'Alertas Stock', value: stats?.low_stock_products?.length || 0, icon: AlertTriangle, bg: 'bg-amber-50', color: 'text-amber-600' },
    ].map((stat, i) => (
      <Card key={i} className="flex items-center gap-4 p-6 border border-brand-light/30 shadow-lg shadow-brand/5" hover>
        <div className={`w-14 h-14 rounded-2xl ${stat.bg} flex items-center justify-center ${stat.color}`}>
          <stat.icon size={26} strokeWidth={2.5} />
        </div>
        <div>
          <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1">{stat.label}</p>
          <p className="text-2xl font-black text-text-main leading-none">
            {stat.label.includes('Ventas') || stat.label.includes('Ticket') ? '$' : ''}
            <AnimatedNumber value={stat.value} />
          </p>
        </div>
      </Card>
    ))}
  </div>
)

const ChartWidget = ({ chartData }) => {
  const data = useMemo(() => {
    if (!chartData) return []
    return Object.entries(chartData).map(([name, sales]) => ({ name, sales }))
  }, [chartData])

  return (
    <Card className="p-6 h-[400px] flex flex-col border border-brand-light/30 shadow-lg shadow-brand/5" padding="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-sans font-extrabold text-[#C62828] tracking-tight text-xl">Ventas por Hora (Hoy)</h3>
          <p className="text-xs text-text-muted font-bold">Flujo de ingresos durante el día</p>
        </div>
      </div>
      <div className="flex-1 w-full">
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#C62828" stopOpacity={0.25}/>
                  <stop offset="95%" stopColor="#C62828" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F4BFBF" strokeOpacity={0.5} />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#7B3535', fontSize: 10, fontWeight: 'bold'}} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#7B3535', fontSize: 10, fontWeight: 'bold'}} />
              <Tooltip 
                contentStyle={{ 
                  borderRadius: '16px', 
                  border: '2px solid #F4BFBF', 
                  backgroundColor: '#FFF5F5',
                  boxShadow: '0 10px 25px rgba(198,40,40,0.15)', 
                  fontWeight: '900' 
                }}
                itemStyle={{ color: '#C62828' }}
              />
              <Area type="monotone" dataKey="sales" stroke="#C62828" strokeWidth={4} fillOpacity={1} fill="url(#colorSales)" />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-brand-light opacity-60">
            <TrendingUp size={48} className="mb-2" />
            <p className="font-black text-sm uppercase">Sin datos de ventas hoy</p>
          </div>
        )}
      </div>
    </Card>
  )
}

const TopProductsWidget = ({ topProduct }) => (
  <Card className="p-6 flex flex-col border border-brand-light/30 shadow-lg shadow-brand/5 bg-[#FFF0F0]" padding="p-6">
    <h3 className="font-sans font-extrabold text-[#C62828] tracking-tight text-xl mb-6 flex items-center gap-2">
      <Award size={22} /> Producto Estrella
    </h3>
    {topProduct ? (
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-4 p-4 bg-white rounded-3xl border border-[#F4BFBF] shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-[#C62828] flex items-center justify-center text-white text-3xl shadow-lg shadow-brand/30">
            🐾
          </div>
          <div className="flex-1">
            <p className="text-[10px] font-black text-[#C62828] uppercase tracking-widest mb-1">Más Vendido Hoy</p>
            <h4 className="text-xl font-black text-text-main leading-tight truncate">{topProduct.name}</h4>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-white rounded-2xl border border-brand-light/50">
            <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1">Unidades</p>
            <p className="text-2xl font-black text-[#C62828]">{topProduct.units}</p>
          </div>
          <div className="p-4 bg-white rounded-2xl border border-brand-light/50">
            <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1">Total Hoy</p>
            <p className="text-2xl font-black text-[#C62828]">${topProduct.total.toFixed(2)}</p>
          </div>
        </div>
      </div>
    ) : (
      <div className="flex flex-col items-center justify-center py-10 text-brand-light opacity-60">
        <PackageSearch size={48} className="mb-2" />
        <p className="font-black text-sm uppercase">Sin estrellas hoy</p>
      </div>
    )}
  </Card>
)

const RecentSalesWidget = ({ recentSales }) => (
  <Card className="overflow-hidden border border-brand-light/30 shadow-lg shadow-brand/5" padding="p-0">
    <div className="p-6 border-b border-brand-light/30 bg-white">
      <h3 className="font-sans font-extrabold text-[#C62828] tracking-tight text-xl">Ventas Recientes</h3>
    </div>
    <div className="overflow-x-auto bg-white">
      <table className="w-full">
        <thead>
          <tr className="text-[10px] font-black text-text-muted uppercase tracking-widest bg-[#FFF5F5]">
            <th className="px-6 py-4 text-left">Ticket</th>
            <th className="px-6 py-4 text-left">Vendedor</th>
            <th className="px-6 py-4 text-left">Total</th>
            <th className="px-6 py-4 text-left">Hora</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-brand-light/20">
          {recentSales?.length > 0 ? recentSales.map(sale => (
            <tr key={sale.id} className="hover:bg-brand/5 transition-colors">
              <td className="px-6 py-4 font-bold text-sm">#{sale.folio}</td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-brand/10 text-[#C62828] text-[10px] flex items-center justify-center font-black">
                    {sale.seller.charAt(0)}
                  </div>
                  <span className="text-sm font-bold text-text-main">{sale.seller}</span>
                </div>
              </td>
              <td className="px-6 py-4 font-black text-sm text-[#C62828]">${sale.total.toFixed(2)}</td>
              <td className="px-6 py-4 text-xs font-bold text-text-muted">
                {sale.time}
              </td>
            </tr>
          )) : (
            <tr>
              <td colSpan="4" className="px-6 py-10 text-center text-brand-light font-bold italic">Aún no hay ventas hoy</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  </Card>
)

const LowStockWidget = ({ lowStock }) => (
  <Card className="p-6 border border-brand-light/30 shadow-lg shadow-brand/5" padding="p-6">
    <h3 className="font-sans font-extrabold text-amber-600 tracking-tight text-xl mb-6 flex items-center gap-2">
      <AlertTriangle size={22} />
      Stock Crítico
    </h3>
    <div className="space-y-3">
      {lowStock?.length > 0 ? lowStock.map((item, i) => (
        <div key={i} className="flex items-center justify-between p-3 bg-amber-50 border border-amber-200 rounded-2xl">
          <span className="text-sm font-bold text-amber-900 truncate flex-1 mr-2">{item.name}</span>
          <Badge variant="warning">{item.stock} {item.is_bulk ? 'kg' : 'pzs'}</Badge>
        </div>
      )) : (
        <div className="flex flex-col items-center justify-center py-6 text-green-500 opacity-60">
          <CheckCircle2 size={32} className="mb-2" />
          <p className="text-xs font-black uppercase">Inventario Saludable</p>
        </div>
      )}
    </div>
    <Button variant="outline" className="w-full mt-4 text-xs font-bold" size="sm" onClick={() => window.location.href='/inventory'}>Ver inventario</Button>
  </Card>
)

// --- MAIN DASHBOARD PAGE ---

const Dashboard = () => {
  const [isCustomizing, setIsCustomizing] = useState(false)
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(false)
  const { layout, reorder, toggleVisibility } = useDashboardStore()
  const { addNotification } = useNotificationStore()

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    setLoading(true)
    try {
      const res = await salesApi.getStats()
      if (res.success) setStats(res.data)
    } catch (err) {
      // addNotification('Error al cargar estadísticas', 'error')
    } finally {
      setLoading(false)
    }
  }

  const widgetMap = {
    stats:        <StatsWidget stats={stats} />,
    salesChart:   <ChartWidget chartData={stats?.chart_data} />,
    topProducts:  <TopProductsWidget topProduct={stats?.top_product_today} />,
    lowStock:     <LowStockWidget lowStock={stats?.low_stock_products} />,
    recentSales:  <RecentSalesWidget recentSales={stats?.recent_sales} />,
  }

  return (
    <PageWrapper className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <img src={mascotaPose1} alt="Mascota" className="w-16 h-16 md:w-20 md:h-20 object-contain drop-shadow-md hover:scale-110 transition-transform duration-300" />
          <div>
            <h1 className="text-4xl font-extrabold font-sans text-[#C62828] tracking-tight drop-shadow-sm">Panel de Control</h1>
            <p className="text-text-muted font-bold">Sistema Central Guaw & Miaw 🐾</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button 
            variant={isCustomizing ? 'primary' : 'secondary'} 
            icon={isCustomizing ? CheckCircle2 : Settings2}
            onClick={() => setIsCustomizing(!isCustomizing)}
          >
            {isCustomizing ? 'Guardar Diseño' : 'Personalizar'}
          </Button>
          <div className="bg-white px-4 py-2 rounded-2xl soft-shadow border border-[#F4BFBF] flex items-center gap-2 text-[#C62828]">
            <Calendar size={18} />
            <span className="font-bold text-sm">{new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
          </div>
        </div>
      </div>

      {loading && !stats && (
        <div className="flex items-center justify-center h-40">
          <div className="w-8 h-8 border-4 border-brand-light border-t-brand rounded-full animate-spin" />
        </div>
      )}

      <AnimatePresence>
        {isCustomizing && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <Card className="bg-brand/5 border-dashed border-brand/40 p-4 mb-2 flex flex-wrap gap-3">
              <p className="w-full text-sm font-sans font-extrabold text-brand tracking-wide mb-2 px-2">Configurar Paneles</p>
              {layout.map(w => (
                <button
                  key={w.id}
                  onClick={() => toggleVisibility(w.id)}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all
                    ${w.visible ? 'bg-[#C62828] text-white shadow-md' : 'bg-white text-text-muted opacity-60'}
                  `}
                >
                  {w.visible ? <Eye size={16} /> : <EyeOff size={16} />}
                  {w.id.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                </button>
              ))}
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Grid de Widgets Reordenable */}
      <Reorder.Group 
        axis="y" 
        values={layout} 
        onReorder={reorder}
        className="flex flex-col gap-6"
      >
        {layout.filter(w => w.visible).map((w) => (
          <Reorder.Item 
            key={w.id} 
            value={w}
            dragListener={isCustomizing}
            className="relative"
          >
            {isCustomizing && (
              <div className="absolute -left-3 top-1/2 -translate-y-1/2 z-10 w-8 h-12 bg-white rounded-lg soft-shadow flex items-center justify-center text-[#C62828] cursor-grab active:cursor-grabbing border border-brand-light">
                <GripVertical size={20} />
              </div>
            )}
            <motion.div 
              layout 
              className={isCustomizing ? 'opacity-70 scale-[0.99] border-2 border-brand/20 rounded-[2rem]' : ''}
            >
              {widgetMap[w.id]}
            </motion.div>
          </Reorder.Item>
        ))}
      </Reorder.Group>

    </PageWrapper>
  )
}

export default Dashboard
