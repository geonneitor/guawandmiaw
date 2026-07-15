import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { History, Search, Filter, X, Eye, Banknote, CreditCard, Smartphone, ChevronDown, ChevronUp, Package } from 'lucide-react'
import Card from '../design-system/components/Card'
import Button from '../design-system/components/Button'
import Badge from '../design-system/components/Badge'
import { useNotificationStore } from '../store/useNotificationStore'
import { salesApi } from '../api/sales'

const PAYMENT_OPTIONS = [
  { value: '', label: 'Todos los métodos' },
  { value: 'cash', label: 'Efectivo' },
  { value: 'card', label: 'Tarjeta' },
  { value: 'transfer', label: 'Transferencia' },
]

const PAYMENT_LABEL = {
  cash: 'Efectivo',
  card: 'Tarjeta',
  transfer: 'Transferencia',
  efectivo: 'Efectivo',
  tarjeta: 'Tarjeta',
  transferencia: 'Transferencia',
}

const PAYMENT_ICON = {
  cash: Banknote,
  card: CreditCard,
  transfer: Smartphone,
  efectivo: Banknote,
  tarjeta: CreditCard,
  transferencia: Smartphone,
}

const PAYMENT_VARIANT = {
  cash: 'success',
  card: 'info',
  transfer: 'warning',
  efectivo: 'success',
  tarjeta: 'info',
  transferencia: 'warning',
}

const Sales = () => {
  const [sales, setSales] = useState([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [paymentFilter, setPaymentFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [expandedSale, setExpandedSale] = useState(null)
  const { addNotification } = useNotificationStore()

  useEffect(() => {
    fetchSales()
  }, [])

  const fetchSales = async () => {
    setLoading(true)
    try {
      const res = await salesApi.getSales()
      if (res.success) setSales(res.data)
    } catch (err) {
      addNotification('Error al cargar ventas', 'error')
    } finally {
      setLoading(false)
    }
  }

  const activeFiltersCount = [paymentFilter, dateFrom, dateTo].filter(Boolean).length

  const filteredSales = useMemo(() => {
    return sales.filter(s => {
      // Text search
      const folio = s.folio || `GM-${1000 + s.id}`
      const matchesSearch = 
        folio.toLowerCase().includes(search.toLowerCase()) ||
        (s.client_name && s.client_name.toLowerCase().includes(search.toLowerCase())) ||
        (s.seller && s.seller.toLowerCase().includes(search.toLowerCase()))

      // Payment method filter
      const pm = (s.payment_method || '').toLowerCase()
      const matchesPayment = !paymentFilter || 
        pm === paymentFilter ||
        (paymentFilter === 'cash' && (pm === 'efectivo' || pm === 'cash')) ||
        (paymentFilter === 'card' && (pm === 'tarjeta' || pm === 'card')) ||
        (paymentFilter === 'transfer' && (pm === 'transferencia' || pm === 'transfer'))

      // Date range filter
      const saleDate = new Date(s.date)
      const matchesFrom = !dateFrom || saleDate >= new Date(dateFrom + 'T00:00:00')
      const matchesTo = !dateTo || saleDate <= new Date(dateTo + 'T23:59:59')

      return matchesSearch && matchesPayment && matchesFrom && matchesTo
    })
  }, [search, paymentFilter, dateFrom, dateTo, sales])

  const totalFiltered = useMemo(() => filteredSales.reduce((acc, s) => acc + s.total, 0), [filteredSales])

  const clearFilters = () => {
    setSearch('')
    setPaymentFilter('')
    setDateFrom('')
    setDateTo('')
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Summary bar */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4 border-l-4 border-brand" padding="p-4">
          <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1">Ventas Mostradas</p>
          <p className="text-2xl font-black text-text-main">{filteredSales.length}</p>
        </Card>
        <Card className="p-4 border-l-4 border-green-500" padding="p-4">
          <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1">Total Filtrado</p>
          <p className="text-2xl font-black text-green-600">${totalFiltered.toFixed(2)}</p>
        </Card>
        <Card className="p-4 border-l-4 border-amber-500" padding="p-4">
          <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1">Ticket Promedio</p>
          <p className="text-2xl font-black text-text-main">
            ${filteredSales.length > 0 ? (totalFiltered / filteredSales.length).toFixed(2) : '0.00'}
          </p>
        </Card>
      </div>

      {/* Search & Filters */}
      <Card className="p-4" padding="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={20} />
            <input 
              type="text" 
              placeholder="Buscar por folio, cliente o vendedor..."
              className="w-full pl-12 pr-4 py-3 bg-bg-main dark:bg-bg-card rounded-2xl outline-none font-bold text-text-main"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-5 py-3 rounded-2xl border-2 font-black text-sm uppercase tracking-widest transition-all ${
              showFilters || activeFiltersCount > 0
                ? 'border-brand bg-brand/10 text-brand'
                : 'border-border-subtle text-text-muted hover:border-brand/40'
            }`}
          >
            <Filter size={18} />
            Filtros
            {activeFiltersCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-brand text-white text-[9px] font-black flex items-center justify-center">
                {activeFiltersCount}
              </span>
            )}
            {showFilters ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>

        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="pt-4 border-t border-border-subtle mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Payment Method */}
                <div>
                  <label className="text-[10px] font-black text-text-muted uppercase tracking-widest block mb-2">Método de Pago</label>
                  <select
                    value={paymentFilter}
                    onChange={(e) => setPaymentFilter(e.target.value)}
                    className="w-full px-4 py-3 bg-bg-main rounded-2xl outline-none font-bold text-text-main border-none appearance-none cursor-pointer"
                  >
                    {PAYMENT_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                {/* Date From */}
                <div>
                  <label className="text-[10px] font-black text-text-muted uppercase tracking-widest block mb-2">Desde</label>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="w-full px-4 py-3 bg-bg-main rounded-2xl outline-none font-bold text-text-main border-none"
                  />
                </div>

                {/* Date To */}
                <div>
                  <label className="text-[10px] font-black text-text-muted uppercase tracking-widest block mb-2">Hasta</label>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="w-full px-4 py-3 bg-bg-main rounded-2xl outline-none font-bold text-text-main border-none"
                  />
                </div>
              </div>

              {activeFiltersCount > 0 && (
                <button
                  onClick={clearFilters}
                  className="mt-3 flex items-center gap-2 text-xs font-black text-text-muted hover:text-red-500 transition-colors uppercase tracking-widest"
                >
                  <X size={14} />
                  Limpiar filtros
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </Card>

      {/* Table */}
      <Card className="overflow-hidden" padding="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-bg-main/50 text-[10px] font-black text-text-muted uppercase tracking-widest border-b border-border-subtle">
                <th className="px-6 py-4">Folio</th>
                <th className="px-6 py-4">Fecha / Hora</th>
                <th className="px-6 py-4">Cliente</th>
                <th className="px-6 py-4">Método</th>
                <th className="px-6 py-4">Total</th>
                <th className="px-6 py-4 text-right">Detalle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-20 text-center">
                    <div className="flex items-center justify-center gap-3 text-text-muted">
                      <div className="w-6 h-6 border-4 border-brand/20 border-t-brand rounded-full animate-spin" />
                      <span className="font-bold">Cargando ventas...</span>
                    </div>
                  </td>
                </tr>
              ) : (
                <>
                  {filteredSales.map((sale) => {
                    const folio = sale.folio || `GM-${1000 + sale.id}`
                    const pm = (sale.payment_method || 'cash').toLowerCase()
                    const PayIcon = PAYMENT_ICON[pm] || Banknote
                    const isExpanded = expandedSale === sale.id

                    return (
                      <React.Fragment key={sale.id}>
                        <tr className={`hover:bg-bg-hover transition-colors group ${isExpanded ? 'bg-brand/5' : ''}`}>
                          <td className="px-6 py-4 font-black text-sm">#{folio}</td>
                          <td className="px-6 py-4 text-sm font-medium">
                            <div className="flex items-center gap-2 text-text-muted">
                              <History size={14} />
                              {new Date(sale.date).toLocaleDateString('es-MX')} — {new Date(sale.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm font-bold">{sale.client_name || 'Público General'}</td>
                          <td className="px-6 py-4">
                            <Badge variant={PAYMENT_VARIANT[pm] || 'info'} size="sm">
                              <span className="flex items-center gap-1.5">
                                <PayIcon size={10} />
                                {PAYMENT_LABEL[pm] || pm}
                              </span>
                            </Badge>
                          </td>
                          <td className="px-6 py-4 font-black text-brand">${sale.total.toFixed(2)}</td>
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => setExpandedSale(isExpanded ? null : sale.id)}
                              className={`p-2 rounded-xl transition-colors ${isExpanded ? 'text-brand bg-brand/10' : 'text-text-muted hover:text-brand'}`}
                            >
                              <Eye size={18} />
                            </button>
                          </td>
                        </tr>

                        {/* Expanded items row */}
                        <AnimatePresence>
                          {isExpanded && sale.items && sale.items.length > 0 && (
                            <tr>
                              <td colSpan="6" className="px-6 pb-4">
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: 'auto' }}
                                  exit={{ opacity: 0, height: 0 }}
                                  className="bg-bg-main rounded-2xl border border-border-subtle overflow-hidden"
                                >
                                  <div className="p-3 border-b border-border-subtle">
                                    <p className="text-[10px] font-black text-text-muted uppercase tracking-widest flex items-center gap-2">
                                      <Package size={10} />
                                      Productos de esta venta
                                    </p>
                                  </div>
                                  <div className="divide-y divide-border-subtle">
                                    {sale.items.map((item, idx) => (
                                      <div key={idx} className="flex items-center justify-between px-4 py-2">
                                        <span className="text-sm font-bold text-text-main">{item.product_name}</span>
                                        <div className="flex items-center gap-6 text-sm">
                                          <span className="text-text-muted">x{item.quantity}</span>
                                          <span className="text-text-muted">${item.price?.toFixed(2)}/ud</span>
                                          <span className="font-black text-text-main">${item.subtotal?.toFixed(2)}</span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </motion.div>
                              </td>
                            </tr>
                          )}
                        </AnimatePresence>
                      </React.Fragment>
                    )
                  })}

                  {filteredSales.length === 0 && !loading && (
                    <tr>
                      <td colSpan="6" className="px-6 py-20 text-center text-text-muted italic text-sm">
                        {search || activeFiltersCount > 0
                          ? 'No hay ventas que coincidan con los filtros aplicados'
                          : 'No se encontraron ventas registradas'}
                      </td>
                    </tr>
                  )}
                </>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}

export default Sales
