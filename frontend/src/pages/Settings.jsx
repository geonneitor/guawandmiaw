import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Settings as SettingsIcon, Store, Palette, Shield, Database, Bell, Users as UsersIcon, Moon, Sun, Phone, MapPin, Mail, FileText, Save, RotateCcw } from 'lucide-react'
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
  const [activeSection, setActiveSection] = useState('store')

  return (
    <PageWrapper className="flex flex-col gap-6">
      <h1 className="text-4xl font-sans font-extrabold tracking-tight text-brand">Configuración</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar de Ajustes */}
        <Card className="lg:col-span-1 p-2 h-fit" padding="p-2">
          <nav className="flex flex-col gap-1">
            {[
              { id: 'store', label: 'Tienda', icon: Store },
              { id: 'users', label: 'Usuarios', icon: UsersIcon },
              { id: 'appearance', label: 'Apariencia', icon: Palette },
              { id: 'security', label: 'Seguridad', icon: Shield },
              { id: 'db', label: 'Base de Datos', icon: Database },
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
            {activeSection === 'users' ? (
              <motion.div key="users" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
                <Users />
              </motion.div>
            ) : activeSection === 'store' ? (
              <motion.div key="store" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-6">
                <StoreSection />
              </motion.div>
            ) : activeSection === 'appearance' ? (
              <motion.div key="appearance" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
                <AppearanceSection />
              </motion.div>
            ) : (
              <motion.div key="other" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
                <Card className="p-20 text-center" padding="p-20">
                  <p className="text-text-muted font-bold">Esta sección está en desarrollo.</p>
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
