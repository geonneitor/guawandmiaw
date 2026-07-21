import React, { useState, useEffect, useMemo } from 'react'
import { BarChart3, Download, Calendar, Filter, PieChart as PieChartIcon, TrendingUp, TrendingDown, Package, CreditCard } from 'lucide-react'
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell 
} from 'recharts'
import PageWrapper from '../components/PageWrapper'
import Card from '../design-system/components/Card'
import Button from '../design-system/components/Button'
import Badge from '../design-system/components/Badge'
import { useNotificationStore } from '../store/useNotificationStore'
import { salesApi } from '../api/sales'

const COLORS = ['#FFB7C5', '#A7F3D0', '#BFDBFE', '#FDE68A', '#DDD6FE', '#FBCFE8', '#F9A8D4'];

const Reports = () => {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [period, setPeriod] = useState('month')
  const { addNotification } = useNotificationStore()

  useEffect(() => {
    fetchData()
  }, [period])

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await salesApi.getAdvancedReports({ period })
      if (res.success) setData(res.data)
    } catch (err) {
      addNotification('Error al cargar reportes', 'error')
    } finally {
      setLoading(false)
    }
  }

  const pieData = useMemo(() => {
    if (!data?.top_products) return []
    return data.top_products.slice(0, 5).map((p, i) => ({
      name: p.name,
      value: p.total,
      color: COLORS[i % COLORS.length]
    }))
  }, [data])

  const paymentData = useMemo(() => {
    if (!data?.payment_breakdown) return []
    return [
      { name: 'Efectivo', value: data.payment_breakdown.cash.total, color: '#A7F3D0' },
      { name: 'Tarjeta', value: data.payment_breakdown.card.total, color: '#BFDBFE' },
      { name: 'Transf.', value: data.payment_breakdown.transfer.total, color: '#FDE68A' },
    ]
  }, [data])

  return (
    <PageWrapper className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-3xl md:text-4xl font-sans font-extrabold tracking-tight text-brand">Analítica y Reportes</h1>
          <p className="text-text-muted font-medium">Visualiza el crecimiento y rendimiento de tu tienda</p>
        </div>
        <div className="flex gap-2">
          <select 
            value={period} 
            onChange={(e) => setPeriod(e.target.value)}
            className="bg-bg-main px-4 py-2 rounded-2xl soft-shadow border border-border-subtle font-bold text-sm outline-none"
          >
            <option value="week">Esta Semana</option>
            <option value="fortnight">Esta Quincena</option>
            <option value="month">Este Mes</option>
          </select>
          <Button variant="secondary" icon={Download} onClick={() => window.print()}>Exportar PDF</Button>
        </div>
      </div>

      {loading && !data && (
        <div className="flex items-center justify-center h-40">
          <div className="w-8 h-8 border-4 border-brand/20 border-t-brand rounded-full animate-spin" />
        </div>
      )}

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="p-6 border-l-4 border-green-500" padding="p-6">
          <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1">Ingresos Totales</p>
          <h3 className="text-3xl font-sans font-extrabold tracking-tight text-text-main">${data?.income?.current?.toFixed(2) || '0.00'}</h3>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant={data?.income?.pct_change >= 0 ? 'success' : 'error'} size="sm">
              {data?.income?.pct_change >= 0 ? '+' : ''}{data?.income?.pct_change}%
            </Badge>
            <span className="text-[10px] text-text-muted font-bold uppercase">vs anterior</span>
          </div>
        </Card>

        <Card className="p-6 border-l-4 border-amber-500" padding="p-6">
          <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1">Egresos Totales</p>
          <h3 className="text-3xl font-sans font-extrabold tracking-tight text-text-main">${data?.expenses?.current?.toFixed(2) || '0.00'}</h3>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant={data?.expenses?.pct_change <= 0 ? 'success' : 'error'} size="sm">
              {data?.expenses?.pct_change > 0 ? '+' : ''}{data?.expenses?.pct_change}%
            </Badge>
            <span className="text-[10px] text-text-muted font-bold uppercase">vs anterior</span>
          </div>
        </Card>

        <Card className="p-6 border-l-4 border-brand bg-brand/5" padding="p-6">
          <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1">Balance Neto</p>
          <h3 className="text-3xl font-sans font-extrabold tracking-tight text-brand">
            ${data?.balance?.current?.toFixed(2) || '0.00'}
          </h3>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant={data?.balance?.pct_change >= 0 ? 'success' : 'error'} size="sm">
              {data?.balance?.pct_change >= 0 ? '+' : ''}{data?.balance?.pct_change}%
            </Badge>
            <span className="text-[10px] text-text-muted font-bold uppercase">vs anterior</span>
          </div>
        </Card>

        <Card className="p-6 border-l-4 border-blue-500" padding="p-6">
          <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1">Top Producto</p>
          <h3 className="text-2xl font-sans font-extrabold tracking-tight text-text-main truncate mt-1">{data?.top_products?.[0]?.name || '---'}</h3>
          <p className="text-[10px] text-text-muted font-bold uppercase mt-2">Más vendido</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales by Payment Method */}
        <Card className="p-8 h-[450px] flex flex-col" padding="p-8">
          <h3 className="font-sans font-extrabold text-2xl tracking-tight mb-8">Ventas por Método de Pago</h3>
          <div className="flex-1 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={paymentData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {paymentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.05)' }}
                  formatter={(val) => `$${val.toFixed(2)}`}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-3 gap-4 mt-6">
            {paymentData.map(item => (
              <div key={item.name} className="flex flex-col items-center gap-1">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-[10px] font-black uppercase text-text-muted">{item.name}</span>
                </div>
                <span className="font-black text-sm text-text-main">${item.value.toFixed(0)}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Top Products Comparison */}
        <Card className="p-8 h-[450px] flex flex-col" padding="p-8">
          <h3 className="font-sans font-extrabold text-2xl tracking-tight mb-8">Top 5 Productos (Ingresos)</h3>
          <div className="flex-1 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={pieData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f0f0f0" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fill: '#8E8E8E', fontSize: 10}} width={120} />
                <Tooltip cursor={{fill: '#FFF9FA'}} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.05)' }} />
                <Bar dataKey="value" radius={[0, 10, 10, 0]}>
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* ABC Analysis or Bottom stats */}
      <Card className="p-6">
        <h3 className="font-sans font-extrabold text-2xl tracking-tight mb-4">Análisis de Inventario (ABC)</h3>
        <p className="text-xs text-text-muted mb-6">Clasificación basada en el 80/15/5 de tus ingresos</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-4 bg-green-50 rounded-2xl border border-green-100">
            <Badge variant="success" className="mb-2">Clase A (80%)</Badge>
            <p className="text-sm font-bold text-green-900">{data?.abc?.A?.length || 0} productos generan la mayoría de tus ingresos.</p>
          </div>
          <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
            <Badge variant="info" className="mb-2">Clase B (15%)</Badge>
            <p className="text-sm font-bold text-blue-900">{data?.abc?.B?.length || 0} productos con rotación moderada.</p>
          </div>
          <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100">
            <Badge variant="warning" className="mb-2">Clase C (5%)</Badge>
            <p className="text-sm font-bold text-amber-900">{data?.abc?.C?.length || 0} productos con menor impacto financiero.</p>
          </div>
        </div>
      </Card>
    </PageWrapper>
  )
}

export default Reports
