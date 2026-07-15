import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Calculator, 
  Plus, 
  ArrowUpCircle, 
  ArrowDownCircle, 
  History, 
  Receipt,
  Lock,
  Unlock,
  AlertCircle,
  CheckCircle2,
  Banknote,
  TrendingUp,
  TrendingDown,
  X,
  CreditCard,
  Smartphone,
  ClipboardList,
  User,
  Clock,
  AlertTriangle
} from 'lucide-react'
import PageWrapper from '../components/PageWrapper'
import Card from '../design-system/components/Card'
import Button from '../design-system/components/Button'
import Input from '../design-system/components/Input'
import Modal from '../design-system/components/Modal'
import { useNotificationStore } from '../store/useNotificationStore'
import { useAuthStore } from '../store/useAuthStore'
import { corteApi } from '../api/corte'
import Sales from './Sales'
import Expenses from './Expenses'
import AnimatedNumber from '../components/AnimatedNumber'

const Finanzas = () => {
  const [activeTab, setActiveTab] = useState('corte')
  const [status, setStatus] = useState({ is_open: false, last_expected_amount: 0 })
  const [corte, setCorte] = useState(null)
  const [loading, setLoading] = useState(false)
  const [history, setHistory] = useState([])
  const [loadingHistory, setLoadingHistory] = useState(false)

  
  // Modal states
  const [showOpenModal, setShowOpenModal] = useState(false)
  const [showCloseModal, setShowCloseModal] = useState(false)
  const [showMovementModal, setShowMovementModal] = useState({ open: false, type: 'in' })
  
  // Form states (separated to avoid conflicts)
  const [openAmount, setOpenAmount] = useState('')
  const [moveAmount, setMoveAmount] = useState('')
  const [moveReason, setMoveReason] = useState('')
  const [actualAmount, setActualAmount] = useState('')
  const [closeReason, setCloseReason] = useState('')

  const { addNotification } = useNotificationStore()
  const { user } = useAuthStore()

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const statusRes = await corteApi.getStatus()
      if (statusRes.success) {
        setStatus(statusRes.data)
        if (statusRes.data.is_open) {
          const corteRes = await corteApi.getCorte()
          if (corteRes.success) setCorte(corteRes.data)
        } else {
          setCorte(null)
        }
      }
    } catch (err) {
      addNotification('Error al cargar datos de caja', 'error')
    } finally {
      setLoading(false)
    }
  }, [addNotification])

  const fetchHistory = useCallback(async () => {
    setLoadingHistory(true)
    try {
      const res = await corteApi.getHistory()
      if (res.success) setHistory(res.data)
    } catch (e) {
      console.error('Error loading history', e)
    } finally {
      setLoadingHistory(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    if (activeTab === 'history') fetchHistory()
  }, [activeTab, fetchHistory])

  const handleOpenRegister = async () => {
    const val = parseFloat(openAmount)
    if (isNaN(val) || val < 0) {
      addNotification('Ingresa un monto inicial válido', 'error')
      return
    }
    
    try {
      const res = await corteApi.openRegister({
        amount: val,
        user: user?.username
      })
      if (res.success) {
        addNotification('Caja abierta exitosamente', 'success')
        setShowOpenModal(false)
        setOpenAmount('')
        fetchData()
      }
    } catch (err) {
      addNotification(err.response?.data?.error || 'Error al abrir caja', 'error')
    }
  }

  const handleCloseRegister = async () => {
    const val = parseFloat(actualAmount)
    if (isNaN(val) || val < 0) {
      addNotification('Ingresa el monto real en caja', 'error')
      return
    }

    const expected = corte?.expected_cash_in_drawer || 0
    if (Math.abs(val - expected) > 0.01 && !closeReason) {
      addNotification('Debes explicar el motivo del descuadre', 'error')
      return
    }

    try {
      const res = await corteApi.closeRegister({
        expected_amount: expected,
        actual_amount: val,
        discrepancy_reason: closeReason,
        user: user?.username
      })
      if (res.success) {
        addNotification('Caja cerrada correctamente', 'success')
        setShowCloseModal(false)
        setActualAmount('')
        setCloseReason('')
        fetchData()
      }
    } catch (err) {
      addNotification(err.response?.data?.error || 'Error al cerrar caja', 'error')
    }
  }

  const handleAddMovement = async () => {
    const val = parseFloat(moveAmount)
    if (isNaN(val) || val <= 0) {
      addNotification('Ingresa un monto válido mayor a cero', 'error')
      return
    }
    if (!moveReason) {
      addNotification('Debes ingresar un concepto o motivo', 'error')
      return
    }

    try {
      const res = await corteApi.addMovement({
        type: showMovementModal.type,
        amount: val,
        description: moveReason
      })
      if (res.success) {
        addNotification('Movimiento registrado', 'success')
        setShowMovementModal({ open: false, type: 'in' })
        setMoveAmount('')
        setMoveReason('')
        fetchData()
      }
    } catch (err) {
      addNotification('Error al registrar movimiento', 'error')
    }
  }

  const PAYMENT_ICON = {
    cash: Banknote,
    card: CreditCard,
    transfer: Smartphone,
    efectivo: Banknote,
    tarjeta: CreditCard,
    transferencia: Smartphone,
  }

  return (
    <PageWrapper className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 relative">
        <div className="flex items-end gap-6 relative z-10">
          <motion.img 
            src="/src/assets/mascota-pose3.png" 
            alt="Mascota" 
            className="w-32 h-32 md:w-40 md:h-40 object-contain drop-shadow-2xl hidden md:block"
            animate={{ y: [0, -10, 0] }}
            transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
          />
          <div className="pb-2">
            <h1 className="text-4xl font-sans font-extrabold tracking-tight text-brand">Finanzas</h1>
            <p className="text-text-muted font-medium">Caja, historial de ventas y movimientos</p>
          </div>
        </div>
        
        <div className="flex bg-bg-card/50 backdrop-blur-sm p-1.5 rounded-[1.5rem] border border-border-subtle shadow-sm self-start relative z-10">
          {[
            { id: 'corte', label: 'Caja', icon: Calculator },
            { id: 'history', label: 'Historial', icon: ClipboardList },
            { id: 'sales', label: 'Ventas', icon: History },
            { id: 'expenses', label: 'Gastos', icon: Receipt },
          ].map(tab => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-2 rounded-xl font-black text-xs uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === tab.id ? 'bg-brand text-white shadow-lg shadow-brand/20' : 'text-text-muted hover:text-brand'}`}
            >
              <tab.icon size={14} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'sales' ? (
          <motion.div key="sales" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <Sales />
          </motion.div>
        ) : activeTab === 'expenses' ? (
          <motion.div key="expenses" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <Expenses />
          </motion.div>
        ) : activeTab === 'history' ? (
          <motion.div key="history" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
            <Card className="p-6" padding="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-2xl bg-brand/10 flex items-center justify-center text-brand">
                  <ClipboardList size={20} />
                </div>
                <div>
                  <h2 className="font-sans font-extrabold text-2xl text-text-main tracking-tight">Historial de Turnos</h2>
                  <p className="text-xs text-text-muted font-bold">Registro completo de aperturas y cierres de caja</p>
                </div>
              </div>

              {loadingHistory ? (
                <div className="flex justify-center py-20">
                  <div className="w-8 h-8 border-4 border-brand/20 border-t-brand rounded-full animate-spin" />
                </div>
              ) : history.length === 0 ? (
                <div className="text-center py-20 text-text-muted">
                  <ClipboardList size={48} strokeWidth={1} className="mx-auto mb-3 opacity-20" />
                  <p className="font-bold">No hay historial de turnos aún</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {history.map((shift, idx) => {
                    const diff = shift.difference || 0
                    const isOpen = shift.status === 'open'
                    const hasDiscrepancy = !isOpen && Math.abs(diff) > 0.01
                    const openedAt = shift.opened_at ? new Date(shift.opened_at) : null
                    const closedAt = shift.closed_at ? new Date(shift.closed_at) : null
                    const durationMs = openedAt && closedAt ? closedAt - openedAt : null
                    const hours = durationMs ? Math.floor(durationMs / 3600000) : 0
                    const mins = durationMs ? Math.floor((durationMs % 3600000) / 60000) : 0

                    return (
                      <motion.div
                        key={shift.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.04 }}
                        className={`relative overflow-hidden rounded-3xl border-2 transition-all hover:shadow-md ${
                          isOpen 
                            ? 'border-emerald-300 dark:border-emerald-950 bg-emerald-500/5' 
                            : hasDiscrepancy 
                              ? 'border-amber-200 dark:border-amber-900 bg-bg-card' 
                              : 'border-border-subtle bg-bg-card'
                        }`}
                      >
                        {/* Top color stripe */}
                        <div className={`h-1.5 w-full ${
                          isOpen 
                            ? 'bg-gradient-to-r from-emerald-400 to-green-500 animate-pulse' 
                            : hasDiscrepancy 
                              ? 'bg-gradient-to-r from-amber-400 to-orange-400' 
                              : 'bg-gradient-to-r from-brand to-brand-dark'
                        }`} />

                        <div className="p-5">
                          {/* Header row */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                                isOpen
                                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-500'
                                  : hasDiscrepancy 
                                    ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-500' 
                                    : 'bg-green-50 dark:bg-green-950/40 text-green-500'
                              }`}>
                                {isOpen ? (
                                  <Unlock size={18} className="animate-bounce" />
                                ) : hasDiscrepancy ? (
                                  <AlertTriangle size={18} />
                                ) : (
                                  <CheckCircle2 size={18} />
                                )}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="font-sans font-extrabold text-text-main text-lg tracking-tight">
                                    Turno de {shift.opened_by || 'Usuario'}
                                    <span className="text-xs font-semibold text-text-muted ml-2 hidden sm:inline">#{shift.id}</span>
                                  </p>
                                  {isOpen && (
                                    <span className="flex h-2 w-2 relative">
                                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                    </span>
                                  )}
                                </div>
                                <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest">
                                  {openedAt ? openedAt.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' }) : '—'}
                                </p>
                              </div>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest self-start sm:self-center ${
                              isOpen
                                ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900'
                                : hasDiscrepancy 
                                  ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900' 
                                  : 'bg-green-50 dark:bg-green-950/40 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-900'
                            }`}>
                              {isOpen 
                                ? 'Abierto / Activo' 
                                : hasDiscrepancy 
                                  ? (diff > 0 ? `Sobrante +$${Math.abs(diff).toFixed(2)}` : `Faltante -$${Math.abs(diff).toFixed(2)}`) 
                                  : 'Cuadrado ✓'}
                            </span>
                          </div>

                          {/* Timeline row */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                            <div className="flex items-center gap-3 p-3 bg-bg-main rounded-2xl border border-border-subtle/50">
                              <div className="w-8 h-8 rounded-xl bg-brand/10 text-brand flex items-center justify-center shrink-0">
                                <Unlock size={14} />
                              </div>
                              <div className="min-w-0">
                                <p className="text-[9px] font-black text-text-muted uppercase tracking-widest">Apertura</p>
                                <p className="text-xs font-black text-text-main">
                                  {openedAt ? openedAt.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '—'}
                                </p>
                                <p className="text-[9px] text-text-muted truncate font-semibold flex items-center gap-1">
                                  <User size={10} className="inline shrink-0" />
                                  {shift.opened_by}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-bg-main rounded-2xl border border-border-subtle/50">
                              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                                isOpen 
                                  ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400' 
                                  : 'bg-red-100 dark:bg-red-950/40 text-red-400'
                              }`}>
                                <Lock size={14} />
                              </div>
                              <div className="min-w-0">
                                <p className="text-[9px] font-black text-text-muted uppercase tracking-widest">Cierre</p>
                                <p className="text-xs font-black text-text-main">
                                  {isOpen 
                                    ? 'En progreso...' 
                                    : (closedAt ? closedAt.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '—')}
                                </p>
                                <p className="text-[9px] text-text-muted truncate font-semibold flex items-center gap-1">
                                  <User size={10} className="inline shrink-0" />
                                  {isOpen ? '—' : shift.closed_by}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Money grid */}
                          <div className="grid grid-cols-3 gap-2">
                            <div className="p-2.5 rounded-xl bg-bg-main text-center border border-border-subtle/30">
                              <p className="text-[8px] font-black text-text-muted uppercase tracking-widest mb-0.5">Fondo Inicial</p>
                              <p className="text-xl font-sans font-extrabold tracking-tight text-text-main">${(shift.opening_amount || 0).toFixed(2)}</p>
                            </div>
                            <div className="p-2.5 rounded-xl bg-bg-main text-center border border-border-subtle/30">
                              <p className="text-[8px] font-black text-text-muted uppercase tracking-widest mb-0.5">Esperado</p>
                                <p className="text-xl font-sans font-extrabold tracking-tight text-text-main">
                                  {isOpen ? '—' : `$${(shift.expected_amount || 0).toFixed(2)}`}
                                </p>
                            </div>
                            <div className={`p-2.5 rounded-xl text-center border ${
                              isOpen 
                                ? 'bg-bg-main border-border-subtle/30' 
                                : hasDiscrepancy 
                                  ? 'bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400' 
                                  : 'bg-green-500/10 border-green-500/20 text-green-600 dark:text-green-400'
                            }`}>
                              <p className="text-[8px] font-black text-text-muted uppercase tracking-widest mb-0.5">Real Contado</p>
                              <p className="text-xl font-sans font-extrabold tracking-tight">
                                {isOpen ? '—' : `$${(shift.actual_amount || 0).toFixed(2)}`}
                              </p>
                            </div>
                          </div>

                          {/* Discrepancy Reason */}
                          {!isOpen && shift.discrepancy_reason && (
                            <div className="mt-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-start gap-2 text-xs text-amber-800 dark:text-amber-300 font-medium">
                              <AlertTriangle size={15} className="shrink-0 mt-0.5 text-amber-500" />
                              <div>
                                <p className="font-black uppercase tracking-wider text-[9px] mb-0.5 text-amber-600 dark:text-amber-400">Motivo del descuadre</p>
                                <p className="italic">"{shift.discrepancy_reason}"</p>
                              </div>
                            </div>
                          )}

                          {/* Duration badge */}
                          {isOpen ? (
                            <div className="mt-3 flex items-center gap-1.5 text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                              <Clock size={11} className="animate-spin [animation-duration:10s]" />
                              Turno activo en curso
                            </div>
                          ) : (
                            durationMs && (
                              <div className="mt-3 flex items-center gap-1.5 text-[10px] text-text-muted font-bold">
                                <Clock size={11} />
                                Duración del turno: {hours > 0 ? `${hours}h ` : ''}{mins}min
                              </div>
                            )
                          )}
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              )}
            </Card>
          </motion.div>
        ) : (
          <motion.div
            key="corte"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {!status.is_open ? (
              <Card className="p-12 flex flex-col items-center justify-center text-center space-y-6" padding="p-12">
                <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center text-red-500 shadow-inner">
                  <Lock size={40} />
                </div>
                <div>
                  <h2 className="text-3xl font-black text-text-main uppercase tracking-tighter">Caja Cerrada</h2>
                  <p className="text-text-muted max-w-sm mx-auto mt-2">Para comenzar a realizar ventas y registrar movimientos, debes abrir un turno.</p>
                </div>
                <Button 
                  icon={Unlock} 
                  className="px-12 py-4 text-xl"
                  onClick={() => { setOpenAmount(status.last_expected_amount.toString()); setShowOpenModal(true); }}
                >
                  Abrir Turno
                </Button>
              </Card>
            ) : (
              <div className="space-y-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <Card className="p-6 border-l-4 border-brand" padding="p-6">
                    <div className="flex items-center gap-3 text-brand mb-2">
                      <Banknote size={16} />
                      <span className="text-[10px] font-black uppercase tracking-widest">Fondo Inicial</span>
                    </div>
                    <h3 className="text-3xl font-sans font-extrabold tracking-tight text-text-main">${corte?.opening_amount.toFixed(2)}</h3>
                  </Card>
                  
                  <Card className="p-6 border-l-4 border-green-500" padding="p-6">
                    <div className="flex items-center gap-3 text-green-500 mb-2">
                      <TrendingUp size={16} />
                      <span className="text-[10px] font-black uppercase tracking-widest">Ventas Efectivo</span>
                    </div>
                    <h3 className="text-3xl font-sans font-extrabold tracking-tight text-text-main">${corte?.total_cash_sales.toFixed(2)}</h3>
                  </Card>

                  <Card className="p-6 border-l-4 border-amber-500" padding="p-6">
                    <div className="flex items-center gap-3 text-amber-500 mb-2">
                      <TrendingDown size={16} />
                      <span className="text-[10px] font-black uppercase tracking-widest">Salidas / Gastos</span>
                    </div>
                    <h3 className="text-3xl font-sans font-extrabold tracking-tight text-text-main">${corte?.total_expenses.toFixed(2)}</h3>
                  </Card>

                  <Card className="p-6 border-l-4 border-text-main bg-bg-card" padding="p-6">
                    <div className="flex items-center gap-3 text-text-muted mb-2">
                      <Calculator size={16} />
                      <span className="text-[10px] font-black uppercase tracking-widest">Esperado en Caja</span>
                    </div>
                    <h3 className="text-3xl font-sans font-extrabold tracking-tight text-brand">${corte?.expected_cash_in_drawer.toFixed(2)}</h3>
                  </Card>
                </div>

                {/* Second Row: Non-Cash Sales */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <Card className="p-4 flex items-center justify-between bg-blue-50/50 border-blue-100" padding="p-4">
                      <div className="flex items-center gap-3">
                         <div className="p-2 bg-blue-100 text-blue-600 rounded-xl">
                            <CreditCard size={20} />
                         </div>
                         <div>
                            <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Ventas Tarjeta</p>
                            <h4 className="text-2xl font-sans font-extrabold tracking-tight text-text-main">${corte?.total_card_sales.toFixed(2)}</h4>
                         </div>
                      </div>
                      <div className="text-right">
                         <p className="text-[9px] text-text-muted font-bold">No afecta fondo de caja</p>
                      </div>
                   </Card>
                   <Card className="p-4 flex items-center justify-between bg-amber-50/50 border-amber-100" padding="p-4">
                      <div className="flex items-center gap-3">
                         <div className="p-2 bg-amber-100 text-amber-600 rounded-xl">
                            <Smartphone size={20} />
                         </div>
                         <div>
                            <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Transferencias</p>
                            <h4 className="text-2xl font-sans font-extrabold tracking-tight text-text-main">${corte?.total_transfer_sales.toFixed(2)}</h4>
                         </div>
                      </div>
                      <div className="text-right">
                         <p className="text-[9px] text-text-muted font-bold">No afecta fondo de caja</p>
                      </div>
                   </Card>
                </div>

                {/* Quick Actions */}
                <div className="flex flex-wrap gap-4">
                  <Button 
                    variant="secondary" 
                    icon={ArrowUpCircle} 
                    className="flex-1 min-w-[200px]"
                    onClick={() => { setMoveAmount(''); setMoveReason(''); setShowMovementModal({ open: true, type: 'in' }); }}
                  >
                    Entrada Efectivo
                  </Button>
                  <Button 
                    variant="secondary" 
                    icon={ArrowDownCircle} 
                    className="flex-1 min-w-[200px] !text-red-500 !border-red-100 hover:!bg-red-50"
                    onClick={() => { setMoveAmount(''); setMoveReason(''); setShowMovementModal({ open: true, type: 'out' }); }}
                  >
                    Salida Efectivo
                  </Button>
                  <Button 
                    icon={Lock} 
                    className="flex-1 min-w-[200px]"
                    onClick={() => { setActualAmount(corte?.expected_cash_in_drawer.toString()); setCloseReason(''); setShowCloseModal(true); }}
                  >
                    Cerrar Turno
                  </Button>
                </div>

                {/* Details Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card title="Últimas Ventas (Turno Actual)" className="flex-1">
                    <div className="space-y-3">
                      {!corte?.sales_details || corte?.sales_details.length === 0 ? (
                        <p className="text-center py-10 text-text-muted text-sm italic">Sin ventas registradas en este turno</p>
                      ) : (
                        corte?.sales_details.slice(0, 10).map((sale, i) => {
                          const pm = (sale.payment_method || 'cash').toLowerCase()
                          const Icon = PAYMENT_ICON[pm] || TrendingUp
                          return (
                            <div key={i} className="flex items-center justify-between p-3 bg-bg-main rounded-xl border border-border-subtle">
                              <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${pm === 'cash' || pm === 'efectivo' ? 'bg-green-50 text-green-500' : 'bg-blue-50 text-blue-500'}`}>
                                  <Icon size={14} />
                                </div>
                                <div>
                                  <p className="text-xs font-bold text-text-main line-clamp-1">{sale.product}</p>
                                  <p className="text-[9px] text-text-muted font-bold">{sale.time} • Cant: {sale.quantity} • {pm.toUpperCase()}</p>
                                </div>
                              </div>
                              <span className="font-black text-text-main">${sale.subtotal.toFixed(2)}</span>
                            </div>
                          )
                        })
                      )}
                    </div>
                  </Card>

                  <Card title="Movimientos y Gastos" className="flex-1">
                    <div className="space-y-3">
                      {!corte?.expenses_details || corte?.expenses_details.length === 0 ? (
                        <p className="text-center py-10 text-text-muted text-sm italic">Sin movimientos registrados</p>
                      ) : (
                        corte?.expenses_details.map((exp, i) => (
                          <div key={i} className="flex items-center justify-between p-3 bg-bg-main rounded-xl border border-border-subtle">
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${exp.type === 'expense' ? 'bg-amber-50 text-amber-500' : exp.type === 'movement_in' ? 'bg-green-50 text-green-500' : 'bg-red-50 text-red-500'}`}>
                                {exp.type === 'movement_in' ? <ArrowUpCircle size={14} /> : <TrendingDown size={14} />}
                              </div>
                              <div>
                                <p className="text-xs font-bold text-text-main line-clamp-1">{exp.description}</p>
                                <p className="text-[9px] text-text-muted font-bold">{exp.time} • {exp.type === 'expense' ? 'GASTO' : exp.type === 'movement_in' ? 'ENTRADA' : 'SALIDA'}</p>
                              </div>
                            </div>
                            <span className={`font-black ${exp.type === 'movement_in' ? 'text-green-600' : 'text-red-500'}`}>
                              {exp.type === 'movement_in' ? '+' : '-'}${exp.amount.toFixed(2)}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </Card>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL: ABRIR TURNO */}
      <Modal isOpen={showOpenModal} onClose={() => setShowOpenModal(false)} title="Abrir Turno de Caja">
        <div className="space-y-6 py-2">
          <div className="p-4 bg-brand/5 rounded-2xl border border-brand/20 flex items-start gap-4">
            <AlertCircle className="text-brand shrink-0" size={20} />
            <p className="text-xs text-brand font-medium">Ingresa el monto de efectivo inicial con el que empiezas el turno (fondo de caja).</p>
          </div>
          <Input 
            label="Monto Inicial ($)" 
            type="number" 
            placeholder="0.00"
            value={openAmount}
            onChange={(e) => setOpenAmount(e.target.value)}
            className="text-2xl font-black"
            autoFocus
          />
          <Button className="w-full py-4 text-lg" icon={Unlock} onClick={handleOpenRegister}>Confirmar Apertura</Button>
        </div>
      </Modal>

      {/* MODAL: MOVIMIENTOS (ENTRADA/SALIDA) */}
      <Modal 
        isOpen={showMovementModal.open} 
        onClose={() => setShowMovementModal({ open: false, type: 'in' })} 
        title={showMovementModal.type === 'in' ? 'Entrada de Efectivo' : 'Salida de Efectivo'}
      >
        <div className="space-y-4 py-2">
          <Input 
            label="Monto ($)" 
            type="number" 
            placeholder="0.00"
            value={moveAmount}
            onChange={(e) => setMoveAmount(e.target.value)}
            className="text-2xl font-black"
            autoFocus
          />
          <Input 
            label="Concepto / Motivo" 
            placeholder="Ej. Cambio para caja, pago a proveedor..."
            value={moveReason}
            onChange={(e) => setMoveReason(e.target.value)}
          />
          <Button 
            className={`w-full py-4 text-lg ${showMovementModal.type === 'out' ? '!bg-red-500 shadow-red-200' : ''}`} 
            icon={showMovementModal.type === 'in' ? ArrowUpCircle : ArrowDownCircle} 
            onClick={handleAddMovement}
          >
            Registrar {showMovementModal.type === 'in' ? 'Entrada' : 'Salida'}
          </Button>
        </div>
      </Modal>

      {/* MODAL: CERRAR TURNO */}
      <Modal isOpen={showCloseModal} onClose={() => setShowCloseModal(false)} title="Cerrar Turno y Corte">
        <div className="space-y-6 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-bg-main rounded-2xl border border-border-subtle">
              <p className="text-[9px] font-black text-text-muted uppercase tracking-widest mb-1">Efectivo Esperado</p>
              <p className="text-xl font-black text-text-main">${corte?.expected_cash_in_drawer.toFixed(2)}</p>
            </div>
            <div className={`p-4 rounded-2xl border ${Math.abs((parseFloat(actualAmount) || 0) - (corte?.expected_cash_in_drawer || 0)) < 0.01 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
              <p className="text-[9px] font-black text-text-muted uppercase tracking-widest mb-1">Diferencia</p>
              <p className={`text-xl font-black ${(parseFloat(actualAmount) || 0) - (corte?.expected_cash_in_drawer || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ${((parseFloat(actualAmount) || 0) - (corte?.expected_cash_in_drawer || 0)).toFixed(2)}
              </p>
            </div>
          </div>

          <Input 
            label="Efectivo Real en Caja ($)" 
            type="number" 
            placeholder="Cuenta el dinero y anota aquí..."
            value={actualAmount}
            onChange={(e) => setActualAmount(e.target.value)}
            className="text-2xl font-black"
            autoFocus
          />

          {Math.abs((parseFloat(actualAmount) || 0) - (corte?.expected_cash_in_drawer || 0)) > 0.01 && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
              <Input 
                label="Motivo del Descuadre" 
                placeholder="Explica por qué sobra o falta dinero..."
                value={closeReason}
                onChange={(e) => setCloseReason(e.target.value)}
                required
              />
            </motion.div>
          )}

          <Button className="w-full py-4 text-lg" icon={Lock} onClick={handleCloseRegister}>Realizar Corte y Cerrar</Button>
        </div>
      </Modal>
    </PageWrapper>
  )
}

export default Finanzas
