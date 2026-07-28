import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { History, Search, Filter, X, Eye, Banknote, CreditCard, Smartphone, ChevronDown, ChevronUp, Package, Trash2, AlertTriangle, CheckCircle2 } from 'lucide-react'
import Card from '../design-system/components/Card'
import Button from '../design-system/components/Button'
import Badge from '../design-system/components/Badge'
import { useNotificationStore } from '../store/useNotificationStore'
import { useAuthStore } from '../store/useAuthStore'
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

// ─── Modal de Confirmación de Cancelación ────────────────────────────────────
const CancelSaleModal = ({ sale, onConfirm, onClose, loading }) => {
  const [step, setStep] = useState(1) // paso 1: advertencia, paso 2: confirmar

  if (!sale) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="bg-white dark:bg-bg-card rounded-3xl shadow-2xl w-full max-w-md p-8 relative"
          onClick={e => e.stopPropagation()}
        >
          {/* Icono de advertencia */}
          <div className="flex flex-col items-center text-center mb-6">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${step === 1 ? 'bg-amber-100' : 'bg-red-100'}`}>
              {step === 1
                ? <AlertTriangle size={32} className="text-amber-500" />
                : <Trash2 size={32} className="text-red-500" />
              }
            </div>
            <h3 className="text-xl font-black text-text-main mb-2">
              {step === 1 ? 'Cancelar venta' : '¿Confirmar cancelación?'}
            </h3>
            <p className="text-text-muted text-sm font-bold">
              {step === 1
                ? 'Esta acción cancelará la venta y restaurará el inventario automáticamente.'
                : 'Esta es la confirmación final. La venta quedará marcada como cancelada.'}
            </p>
          </div>

          {/* Info de la venta */}
          <div className="bg-bg-main rounded-2xl p-4 mb-6 border border-border-subtle">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">Folio</span>
              <span className="font-black text-text-main">#{sale.folio}</span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">Total</span>
              <span className="font-black text-brand text-lg">${sale.total?.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">Cliente</span>
              <span className="font-bold text-sm">{sale.client_name || 'Público General'}</span>
            </div>
          </div>

          {/* Botones */}
          {step === 1 ? (
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-3 rounded-2xl border-2 border-border-subtle font-black text-sm text-text-muted hover:border-brand/30 transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={() => setStep(2)}
                className="flex-1 py-3 rounded-2xl bg-amber-500 text-white font-black text-sm hover:bg-amber-600 transition-colors flex items-center justify-center gap-2"
              >
                <AlertTriangle size={16} />
                Continuar
              </button>
            </div>
          ) : (
            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="flex-1 py-3 rounded-2xl border-2 border-border-subtle font-black text-sm text-text-muted hover:border-brand/30 transition-all"
                disabled={loading}
              >
                Atrás
              </button>
              <button
                onClick={onConfirm}
                disabled={loading}
                className="flex-1 py-3 rounded-2xl bg-red-500 text-white font-black text-sm hover:bg-red-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {loading ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Trash2 size={16} />
                )}
                {loading ? 'Cancelando...' : 'Sí, cancelar venta'}
              </button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

// ─── Componente Principal ─────────────────────────────────────────────────────
const Sales = () => {
  const [sales, setSales] = useState([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [paymentFilter, setPaymentFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [expandedSale, setExpandedSale] = useState(null)
  const [cancelTarget, setCancelTarget] = useState(null)   // venta a cancelar
  const [cancelLoading, setCancelLoading] = useState(false)
  const { addNotification } = useNotificationStore()
  const { user } = useAuthStore()

  const canCancel = user?.role === 'admin' || user?.role === 'encargado'

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

  const handleCancelSale = async () => {
    if (!cancelTarget) return
    setCancelLoading(true)
    try {
      const res = await salesApi.cancelSale(cancelTarget.id)
      if (res.success) {
        addNotification(`Venta #${cancelTarget.folio} cancelada. Inventario restaurado.`, 'success')
        // Actualizar estado local en lugar de recargar todo
        setSales(prev => prev.map(s =>
          s.id === cancelTarget.id ? { ...s, status: 'cancelled' } : s
        ))
        setCancelTarget(null)
      } else {
        addNotification(res.error || 'Error al cancelar', 'error')
      }
    } catch (err) {
      addNotification('Error de conexión', 'error')
    } finally {
      setCancelLoading(false)
    }
  }

  const activeFiltersCount = [paymentFilter, dateFrom, dateTo].filter(Boolean).length

  const filteredSales = useMemo(() => {
    return sales.filter(s => {
      const folio = s.folio || `GM-${1000 + s.id}`
      const matchesSearch =
        folio.toLowerCase().includes(search.toLowerCase()) ||
        (s.client_name && s.client_name.toLowerCase().includes(search.toLowerCase())) ||
        (s.seller && s.seller.toLowerCase().includes(search.toLowerCase()))

      const pm = (s.payment_method || '').toLowerCase()
      const matchesPayment = !paymentFilter ||
        pm === paymentFilter ||
        (paymentFilter === 'cash' && (pm === 'efectivo' || pm === 'cash')) ||
        (paymentFilter === 'card' && (pm === 'tarjeta' || pm === 'card')) ||
        (paymentFilter === 'transfer' && (pm === 'transferencia' || pm === 'transfer'))

      const saleDate = new Date(s.date)
      const matchesFrom = !dateFrom || saleDate >= new Date(dateFrom + 'T00:00:00')
      const matchesTo = !dateTo || saleDate <= new Date(dateTo + 'T23:59:59')

      return matchesSearch && matchesPayment && matchesFrom && matchesTo
    })
  }, [search, paymentFilter, dateFrom, dateTo, sales])

  const totalFiltered = useMemo(() => filteredSales.reduce((acc, s) => acc + (s.status !== 'cancelled' ? s.total : 0), 0), [filteredSales])

  const clearFilters = () => {
    setSearch('')
    setPaymentFilter('')
    setDateFrom('')
    setDateTo('')
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Modal de cancelación */}
      {cancelTarget && (
        <CancelSaleModal
          sale={cancelTarget}
          onConfirm={handleCancelSale}
          onClose={() => setCancelTarget(null)}
          loading={cancelLoading}
        />
      )}

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
            ${filteredSales.length > 0 ? (totalFiltered / filteredSales.filter(s => s.status !== 'cancelled').length || 0).toFixed(2) : '0.00'}
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
                <div>
                  <label className="text-[10px] font-black text-text-muted uppercase tracking-widest block mb-2">Desde</label>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="w-full px-4 py-3 bg-bg-main rounded-2xl outline-none font-bold text-text-main border-none"
                  />
                </div>
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
                <th className="px-6 py-4 text-right">
                  {canCancel ? 'Acciones' : 'Detalle'}
                </th>
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
                    const isCancelled = sale.status === 'cancelled'

                    return (
                      <React.Fragment key={sale.id}>
                        <tr className={`transition-colors group ${
                          isCancelled
                            ? 'bg-gray-50 dark:bg-gray-900/30 opacity-60'
                            : isExpanded
                              ? 'bg-brand/5'
                              : 'hover:bg-bg-hover'
                        }`}>
                          <td className="px-6 py-4 font-black text-sm">
                            <span className={isCancelled ? 'line-through text-text-muted' : ''}>
                              #{folio}
                            </span>
                            {isCancelled && (
                              <span className="ml-2 text-[10px] font-black text-red-400 bg-red-50 px-2 py-0.5 rounded-full uppercase">Cancelada</span>
                            )}
                          </td>
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
                          <td className={`px-6 py-4 font-black ${isCancelled ? 'text-text-muted line-through' : 'text-brand'}`}>
                            ${sale.total.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {/* Botón ver detalle */}
                              <button
                                onClick={() => setExpandedSale(isExpanded ? null : sale.id)}
                                className={`p-2 rounded-xl transition-colors ${isExpanded ? 'text-brand bg-brand/10' : 'text-text-muted hover:text-brand'}`}
                                title="Ver productos"
                              >
                                <Eye size={18} />
                              </button>
                              {/* Botón cancelar — solo admin/encargado y venta activa */}
                              {canCancel && !isCancelled && (
                                <button
                                  onClick={() => setCancelTarget(sale)}
                                  className="p-2 rounded-xl text-text-muted hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                                  title="Cancelar venta"
                                >
                                  <Trash2 size={18} />
                                </button>
                              )}
                            </div>
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
