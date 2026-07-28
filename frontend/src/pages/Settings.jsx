import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Settings as SettingsIcon, Store, Palette, Shield, Database, Bell, Users as UsersIcon, Moon, Sun, Phone, MapPin, Mail, FileText, Save, RotateCcw, Trash2, AlertTriangle, CheckCircle2 } from 'lucide-react'
import PageWrapper from '../components/PageWrapper'
import Card from '../design-system/components/Card'
import Button from '../design-system/components/Button'
import Input from '../design-system/components/Input'
import Users from './Users'
import { useUIStore } from '../store/useUIStore'
import { useAuthStore } from '../store/useAuthStore'
import { authApi } from '../api/auth'
import { api } from '../api/client'
import { useNotificationStore } from '../store/useNotificationStore'
import { corteApi } from '../api/corte'

const StoreSection = () => {
  const { addNotification } = useNotificationStore()
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [form, setForm] = useState({
    store_name: '', phone: '', address: '', email: '', rfc: '', instagram: ''
  })
  const [original, setOriginal] = useState({})

  useEffect(() => {
    api.get('/settings/store').then(res => {
      if (res.success) { setForm(res.data); setOriginal(res.data); setDirty(false) }
    })
  }, [])

  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setDirty(true) }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await api.put('/settings/store', form)
      if (res.success) {
        setOriginal(form); setDirty(false)
        addNotification('Configuración guardada', 'success')
      } else addNotification(res.error || 'Error al guardar', 'error')
    } catch { addNotification('Error al guardar', 'error') }
    setSaving(false)
  }

  const handleDiscard = () => { setForm(original); setDirty(false) }

  return (
    <Card className="p-8" padding="p-8">
      <h3 className="font-sans font-extrabold text-2xl tracking-tight mb-6 flex items-center gap-2 text-brand">
        <Store size={20} />
        Datos de la Sucursal
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Input label="Nombre de la Tienda" value={form.store_name} onChange={e => set('store_name', e.target.value)} />
        <Input label="Teléfono de Contacto" value={form.phone} onChange={e => set('phone', e.target.value)} />
        <div className="md:col-span-2">
          <Input label="Dirección" value={form.address} onChange={e => set('address', e.target.value)} />
        </div>
        <Input label="Correo Electrónico" type="email" value={form.email} onChange={e => set('email', e.target.value)} />
        <Input label="RFC" value={form.rfc} onChange={e => set('rfc', e.target.value)} />
        <Input label="Instagram" placeholder="@guawmiaw" value={form.instagram} onChange={e => set('instagram', e.target.value)} />
      </div>
      <div className="mt-8 flex justify-end gap-3 pt-6 border-t border-border-subtle">
        <Button variant="secondary" icon={RotateCcw} onClick={handleDiscard} disabled={!dirty}>Descartar</Button>
        <Button icon={Save} onClick={handleSave} disabled={!dirty || saving}>
          {saving ? 'Guardando...' : 'Guardar Cambios'}
        </Button>
      </div>
    </Card>
  )
}

// ── SECCIÓN LIMPIEZA ─────────────────────────────────────────────────────────
const CleanupSection = () => {
  const { addNotification } = useNotificationStore()
  const [summary, setSummary] = useState(null)
  const [loadingSummary, setLoadingSummary] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [modalStep, setModalStep] = useState(1)
  const [loading, setLoading] = useState(false)

  const fetchSummary = async () => {
    setLoadingSummary(true)
    try {
      const res = await corteApi.getDaySummary()
      if (res.success) setSummary(res.data)
    } catch (e) { /* silencioso */ }
    setLoadingSummary(false)
  }

  useEffect(() => { fetchSummary() }, [])

  const handleCleanup = async () => {
    setLoading(true)
    try {
      const res = await corteApi.dayCleanup()
      if (res.success) {
        addNotification('Limpieza completada. Inventario restaurado.', 'success')
        setShowModal(false)
        setModalStep(1)
        fetchSummary()
      } else {
        addNotification(res.error || 'Error al limpiar', 'error')
      }
    } catch (e) {
      addNotification('Error de conexión', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Modal de advertencia rojo */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
            onClick={() => { setShowModal(false); setModalStep(1) }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-bg-card rounded-3xl shadow-2xl w-full max-w-md p-8"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex flex-col items-center text-center mb-6">
                <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-4 ${modalStep === 1 ? 'bg-red-100' : 'bg-red-500'}`}>
                  <AlertTriangle size={40} className={modalStep === 1 ? 'text-red-500' : 'text-white'} />
                </div>
                <h3 className="text-xl font-black text-text-main mb-2">
                  {modalStep === 1 ? 'Atención: Borrar datos del día' : '¿Confirmar limpieza total?'}
                </h3>
                <p className="text-text-muted text-sm font-medium leading-relaxed">
                  {modalStep === 1
                    ? 'Esta acción eliminará todas las ventas de hoy y restaurará el inventario de los productos vendidos. Esta acción NO se puede deshacer.'
                    : 'Esta es la confirmación final. El inventario será restaurado al estado previo a las ventas de hoy.'}
                </p>
              </div>

              {/* Info del día */}
              {summary && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-6">
                  <div className="flex justify-between mb-2">
                    <span className="text-xs font-black text-red-600 uppercase tracking-widest">Ventas a borrar</span>
                    <span className="font-black text-red-700">{summary.sale_count}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs font-black text-red-600 uppercase tracking-widest">Total a revertir</span>
                    <span className="font-black text-red-700">${summary.total?.toFixed(2)}</span>
                  </div>
                </div>
              )}

              {modalStep === 1 ? (
                <div className="flex gap-3">
                  <button
                    onClick={() => { setShowModal(false); setModalStep(1) }}
                    className="flex-1 py-3 rounded-2xl border-2 border-border-subtle font-black text-sm text-text-muted hover:border-red-300 transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => setModalStep(2)}
                    className="flex-1 py-3 rounded-2xl bg-red-500 text-white font-black text-sm hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
                  >
                    <AlertTriangle size={16} />
                    Continuar
                  </button>
                </div>
              ) : (
                <div className="flex gap-3">
                  <button
                    onClick={() => setModalStep(1)}
                    className="flex-1 py-3 rounded-2xl border-2 border-border-subtle font-black text-sm text-text-muted transition-all"
                    disabled={loading}
                  >
                    Atrás
                  </button>
                  <button
                    onClick={handleCleanup}
                    disabled={loading}
                    className="flex-1 py-3 rounded-2xl bg-red-600 text-white font-black text-sm hover:bg-red-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    {loading
                      ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      : <Trash2 size={16} />}
                    {loading ? 'Limpiando...' : 'Confirmar y limpiar'}
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Panel de Limpieza */}
      <Card className="p-8" padding="p-8">
        <h3 className="font-sans font-extrabold text-2xl tracking-tight mb-2 flex items-center gap-2 text-red-600">
          <Trash2 size={22} />
          Limpieza del Día
        </h3>
        <p className="text-text-muted text-sm font-medium mb-8">
          Borra todas las ventas del día actual y restaura el inventario. Úsa solo si las ventas fueron de prueba o hay un error grave.
        </p>

        {/* Resumen del día */}
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 mb-6">
          <p className="text-[10px] font-black text-red-600 uppercase tracking-widest mb-4">Situación actual del día</p>
          {loadingSummary ? (
            <div className="flex justify-center py-4">
              <div className="w-6 h-6 border-4 border-red-200 border-t-red-500 rounded-full animate-spin" />
            </div>
          ) : summary ? (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-1">Ventas registradas</p>
                <p className="text-3xl font-black text-red-700">{summary.sale_count}</p>
              </div>
              <div>
                <p className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-1">Total del día</p>
                <p className="text-3xl font-black text-red-700">${summary.total?.toFixed(2)}</p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-red-500 font-bold">No se pudieron cargar los datos del día.</p>
          )}
        </div>

        <button
          onClick={() => { fetchSummary(); setShowModal(true); setModalStep(1) }}
          disabled={!summary || summary.sale_count === 0}
          className="w-full py-4 rounded-2xl bg-red-500 text-white font-black text-base hover:bg-red-600 transition-colors flex items-center justify-center gap-3 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Trash2 size={20} />
          Borrar datos del día ({summary?.sale_count || 0} ventas)
        </button>
        {summary?.sale_count === 0 && (
          <p className="text-center text-xs text-green-600 font-bold mt-3 flex items-center justify-center gap-1">
            <CheckCircle2 size={14} />
            Sin ventas registradas hoy — no hay nada que limpiar.
          </p>
        )}
      </Card>
    </>
  )
}

// ─── SECCIÓN APARIENCIA ──────────────────────────────────────────────────────
const AppearanceSection = () => {
  const { theme, darkMode, setTheme, setDarkMode } = useUIStore()
  const { addNotification } = useNotificationStore()

  const THEMES = [
    { id: 'pastel', label: 'Rosa', color: '#F9A8C9', dark: '#2D1021' },
    { id: 'mint', label: 'Menta', color: '#34D399', dark: '#063326' },
    { id: 'lavender', label: 'Lavanda', color: '#A78BFA', dark: '#1C0F38' },
    { id: 'peach', label: 'Durazno', color: '#FB923C', dark: '#2E1500' },
    { id: 'sky', label: 'Océano', color: '#38BDF8', dark: '#061A2E' },
    { id: 'obsidian-gold', label: 'Obsidian Gold', color: '#D4AF37', dark: '#1A150A' },
  ]

  const handleThemeChange = async (newTheme) => {
    setTheme(newTheme)
    try {
      await authApi.updatePreferences({ theme: newTheme })
      useAuthStore.setState(s => ({ user: { ...s.user, theme: newTheme } }))
    } catch (e) {
      addNotification('Error al guardar preferencia', 'error')
    }
  }

  const handleModeChange = async (isDark) => {
    setDarkMode(isDark)
    try {
      await authApi.updatePreferences({ dark_mode: isDark })
      useAuthStore.setState(s => ({ user: { ...s.user, dark_mode: isDark } }))
    } catch (e) {
      addNotification('Error al guardar preferencia', 'error')
    }
  }

  return (
    <Card className="p-8" padding="p-8">
      <h3 className="font-sans font-extrabold text-2xl tracking-tight mb-6 flex items-center gap-2 text-brand">
        <Palette size={20} />
        Apariencia
      </h3>
      
      <div className="space-y-8">
        <div>
          <h4 className="font-bold mb-4 text-text-muted uppercase text-xs tracking-widest">Modo de Visualización</h4>
          <div className="flex gap-4">
            <button 
              onClick={() => handleModeChange(false)}
              className={`flex-1 p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${!darkMode ? 'border-brand bg-brand/5' : 'border-border-subtle hover:border-brand/30'}`}
            >
              <Sun size={24} className={!darkMode ? 'text-brand' : 'text-text-muted'} />
              <span className="font-bold">Modo Claro</span>
            </button>
            <button 
              onClick={() => handleModeChange(true)}
              className={`flex-1 p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${darkMode ? 'border-brand bg-brand/5' : 'border-border-subtle hover:border-brand/30'}`}
            >
              <Moon size={24} className={darkMode ? 'text-brand' : 'text-text-muted'} />
              <span className="font-bold">Modo Oscuro</span>
            </button>
          </div>
        </div>

        <div>
          <h4 className="font-bold mb-4 text-text-muted uppercase text-xs tracking-widest">Tema de Color</h4>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {THEMES.map(t => (
              <button
                key={t.id}
                onClick={() => handleThemeChange(t.id)}
                className={`flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all ${theme === t.id ? 'border-brand bg-bg-hover' : 'border-transparent hover:border-border-subtle'}`}
              >
                <div className="w-12 h-12 rounded-full soft-shadow overflow-hidden flex">
                  <div className="flex-1 h-full" style={{ backgroundColor: t.color }} />
                  <div className="flex-1 h-full" style={{ backgroundColor: t.dark }} />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-center">{t.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </Card>
  )
}

const Settings = () => {
  const { user } = useAuthStore()
  const isAdmin = user?.role === 'admin'
  const [activeSection, setActiveSection] = useState(isAdmin ? 'store' : 'appearance')

  return (
    <PageWrapper className="flex flex-col gap-6">
      <h1 className="text-3xl md:text-4xl font-sans font-extrabold tracking-tight text-brand">Configuración</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar de Ajustes */}
        <Card className="lg:col-span-1 p-2 h-fit" padding="p-2">
          <nav className="flex flex-col gap-1">
            {[
              ...(isAdmin ? [
                { id: 'store', label: 'Tienda', icon: Store },
                { id: 'users', label: 'Usuarios', icon: UsersIcon },
              ] : []),
              { id: 'appearance', label: 'Apariencia', icon: Palette },
              ...(isAdmin ? [
                { id: 'security', label: 'Seguridad', icon: Shield },
                { id: 'db', label: 'Base de Datos', icon: Database },
                { id: 'cleanup', label: 'Limpieza', icon: Trash2 }
              ] : []),
            ].map((item) => (
              <button 
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all
                  ${activeSection === item.id ? 'bg-brand text-white shadow-lg shadow-brand/20' : 'text-text-muted hover:bg-bg-hover hover:text-brand'}
                `}
              >
                <item.icon size={16} />
                {item.label}
              </button>
            ))}
          </nav>
        </Card>

        {/* Panel Central */}
        <div className="lg:col-span-3">
          <AnimatePresence mode="wait">
            {activeSection === 'users' && isAdmin ? (
              <motion.div key="users" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
                <Users />
              </motion.div>
            ) : activeSection === 'store' && isAdmin ? (
              <motion.div key="store" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-6">
                <StoreSection />
              </motion.div>
            ) : activeSection === 'appearance' ? (
              <motion.div key="appearance" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
                <AppearanceSection />
              </motion.div>
            ) : activeSection === 'cleanup' && isAdmin ? (
              <motion.div key="cleanup" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
                <CleanupSection />
              </motion.div>
            ) : (
              <motion.div key="other" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
                <Card className="p-20 text-center" padding="p-20">
                  <p className="text-text-muted font-bold">Esta sección está en desarrollo o restringida.</p>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </PageWrapper>
  )
}

export default Settings
