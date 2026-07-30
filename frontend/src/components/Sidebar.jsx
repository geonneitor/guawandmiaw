import React, { useState, useEffect, useRef } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  History, 
  Calculator, 
  Receipt, 
  Users, 
  Truck, 
  BarChart3, 
  UserCircle, 
  Settings as SettingsIcon,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Sun,
  Moon,
  MoreHorizontal,
  X
} from 'lucide-react'
import { useUIStore } from '../store/useUIStore'
import { useAuthStore } from '../store/useAuthStore'
import RoleGuard from './RoleGuard'
import Avatar from './Avatar'

import croquetaCorazon from '../assets/croqueta-corazon.png'
import croquetaPescado from '../assets/croqueta-pescado.png'
import croquetaFlor from '../assets/croqueta-flor.png'
import logoImg from '../assets/logo.png'

const FloatingCroquetas = ({ visible }) => {
  const snacks = [
    { src: croquetaCorazon, style: { top: '-5px', right: '5px' },    delay: 0,    dur: 2.5 },
    { src: croquetaPescado, style: { bottom: '-5px', left: '10px' }, delay: 0.2, dur: 2.8 },
    { src: croquetaFlor,    style: { top: '50%', right: '-10px', transform: 'translateY(-50%)' }, delay: 0.4, dur: 2.2 },
  ]

  return (
    <AnimatePresence>
      {visible && snacks.map((snack, i) => (
        <motion.img
          key={i}
          src={snack.src}
          alt=""
          aria-hidden="true"
          className="absolute w-5 h-5 object-contain pointer-events-none select-none z-30"
          style={snack.style}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{
            opacity: 1,
            scale: 1,
            y: [0, -5, 0],
            rotate: [0, 8, -8, 0],
          }}
          exit={{ opacity: 0, scale: 0.3 }}
          transition={{
            opacity: { duration: 0.2 },
            scale: { duration: 0.2 },
            y: { duration: snack.dur, repeat: Infinity, ease: 'easeInOut', delay: snack.delay },
            rotate: { duration: snack.dur * 1.2, repeat: Infinity, ease: 'easeInOut', delay: snack.delay },
          }}
        />
      ))}
    </AnimatePresence>
  )
}

const NavItem = ({ to, icon: Icon, label, collapsed }) => {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <NavLink
      to={to}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={({ isActive }) => `
        relative flex items-center gap-3 px-4 py-3 rounded-[1.2rem] transition-all duration-300 group
        ${isActive 
          ? 'bg-brand text-white shadow-md shadow-brand/20' 
          : 'text-text-muted hover:text-brand hover:bg-brand-light/30'}
      `}
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <motion.div
              layoutId="pill"
              className="absolute inset-0 bg-brand rounded-[1.2rem] shadow-lg shadow-brand/20 z-0"
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            />
          )}
          
          <motion.div 
            className="relative z-10 shrink-0"
            whileHover={{ 
              y: [-3, 3, -3],
              scale: 1.15,
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
            <FloatingCroquetas visible={isHovered && collapsed} />
          </motion.div>

          {!collapsed && (
            <motion.span
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className={`relative z-10 font-black tracking-wider uppercase text-sm ${isActive ? 'text-white' : ''}`}
            >
              {label}
            </motion.span>
          )}

          <FloatingCroquetas visible={isHovered && !collapsed} />

          {isActive && !collapsed && (
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute right-4 z-10"
            >
              <Sparkles size={12} className="text-white/40" />
            </motion.div>
          )}
        </>
      )}
    </NavLink>
  )
}

const LiveClock = () => {
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const formatter = new Intl.DateTimeFormat('es-MX', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  })
  
  // formatea como "vie, 21 jul, 12:00 p.m." y lo capitaliza
  const formatted = formatter.format(time).replace('.', '').replace('.', '')
  const capitalized = formatted.charAt(0).toUpperCase() + formatted.slice(1)

  return (
    <div className="mt-1.5 bg-brand/10 text-brand px-2 py-1 rounded-lg text-[10px] font-bold tracking-tight inline-flex items-center gap-1.5 border border-brand/20 shadow-sm whitespace-nowrap">
      <div className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse"></div>
      {capitalized}
    </div>
  )
}

const Sidebar = () => {
  const { sidebarOpen, toggleSidebar, darkMode, toggleDarkMode } = useUIStore()
  const { user, logout } = useAuthStore()
  const location = useLocation()
 
  const menuGroups = [
    {
      title: 'Operaciones',
      items: [
        { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard',  roles: [] },
        { to: '/pos',       icon: ShoppingCart,    label: 'Vender',     roles: [] }
      ]
    },
    {
      title: 'Administración',
      items: [
        { to: '/inventory', icon: Package,         label: 'Inventario', roles: ['admin', 'encargado'] },
        { to: '/corte',     icon: Calculator,      label: 'Finanzas',   roles: [] },
        { to: '/reports',   icon: BarChart3,       label: 'Reportes',   roles: ['admin'] }
      ]
    },
    {
      title: 'Sistema',
      items: [
        { to: '/settings',  icon: SettingsIcon,    label: 'Ajustes',    roles: [] }
      ]
    }
  ]

  // Estado para el sheet "Más" en móvil — declarado después de todos los hooks
  const [showMobileSheet, setShowMobileSheet] = useState(false)
  const sheetRef = useRef(null)

  // Cerrar sheet al navegar
  useEffect(() => {
    setShowMobileSheet(false)
  }, [location.pathname])

  // Cerrar sheet al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (sheetRef.current && !sheetRef.current.contains(e.target)) {
        setShowMobileSheet(false)
      }
    }
    if (showMobileSheet) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('touchstart', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
    }
  }, [showMobileSheet])

  // Items principales que siempre se ven en la barra inferior
  const primaryMobileItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Inicio', roles: [] },
    { to: '/pos',       icon: ShoppingCart,    label: 'Vender', roles: [] },
    { to: '/inventory', icon: Package,         label: 'Stock',  roles: ['admin', 'encargado'] },
  ]

  // Items secundarios que van en el sheet "Más"
  const secondaryMobileItems = [
    { to: '/corte',     icon: Calculator,      label: 'Finanzas',   roles: [] },
    { to: '/sales',     icon: History,         label: 'Ventas',     roles: ['admin', 'encargado', 'cajero'] },
    { to: '/reports',   icon: BarChart3,       label: 'Reportes',   roles: ['admin'] },
    { to: '/clients',   icon: Users,           label: 'Clientes',   roles: ['admin', 'encargado'] },
    { to: '/suppliers', icon: Truck,           label: 'Proveedores',roles: ['admin', 'encargado'] },
    { to: '/expenses',  icon: Receipt,         label: 'Gastos',     roles: ['admin', 'encargado'] },
    { to: '/settings',  icon: SettingsIcon,    label: 'Ajustes',    roles: [] },
  ]

  // Determinar si la ruta actual está en los items primarios
  const isPrimaryActive = primaryMobileItems.some(item =>
    location.pathname === item.to || location.pathname.startsWith(item.to + '/')
  )
  const isSecondaryActive = secondaryMobileItems.some(item =>
    location.pathname === item.to || location.pathname.startsWith(item.to + '/')
  )
 
  return (
    <>
    <motion.aside
      animate={{ 
        width: sidebarOpen ? 260 : 88,
        x: 0,
        opacity: 1
      }}
      initial={{ x: -100, opacity: 0 }}
      className="hidden md:flex fixed left-4 top-4 bottom-4 bg-bg-card/60 dark:bg-bg-card/40 backdrop-blur-2xl border border-white/20 dark:border-white/5 flex-col z-50 shadow-[0_20px_50px_rgba(0,0,0,0.05)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.3)] rounded-[2.5rem] overflow-hidden transition-colors duration-500 print:hidden"
    >
      {/* Header / Logo & Theme Toggle */}
      <div className="p-6 flex items-center justify-between">
        {sidebarOpen ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-3"
          >
            <div className="w-10 h-10 overflow-hidden flex items-center justify-center bg-white rounded-full p-1 shadow-sm border border-brand-light">
              <img src={logoImg} alt="Logo" className="w-full h-full object-contain" />
            </div>
            <div className="flex flex-col">
              <span className="font-display font-black text-brand text-lg leading-none tracking-tighter">GUAW & MIAW</span>
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-brand/70 mt-1">Pet Shop</span>
              <LiveClock />
            </div>
          </motion.div>
        ) : (
          <div className="w-10 h-10 overflow-hidden flex items-center justify-center bg-white rounded-full p-1 shadow-sm border border-brand-light mx-auto">
            <img src={logoImg} alt="Logo" className="w-full h-full object-contain" />
          </div>
        )}
        
        {sidebarOpen && (
          <button
            onClick={toggleDarkMode}
            className="p-2.5 rounded-xl bg-bg-hover text-text-muted hover:text-brand transition-all active:scale-95"
          >
            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-2 flex flex-col gap-4 overflow-y-auto custom-scrollbar">
        {menuGroups.map((group, idx) => (
          <div key={idx} className="flex flex-col gap-1">
            {sidebarOpen && (
              <span className="px-4 text-[10px] font-black tracking-widest uppercase text-text-muted mb-1 mt-2">
                {group.title}
              </span>
            )}
            {group.items.map((item) => (
              <RoleGuard key={item.to} roles={item.roles}>
                <NavItem
                  to={item.to}
                  icon={item.icon}
                  label={item.label}
                  collapsed={!sidebarOpen}
                />
              </RoleGuard>
            ))}
          </div>
        ))}
      </nav>

      {/* Footer / User */}
      <div className="p-4 m-2 bg-white/40 dark:bg-white/5 rounded-[2rem] border border-white/60 dark:border-white/10 transition-colors">
        <div className={`flex items-center gap-3 ${!sidebarOpen ? 'justify-center' : ''}`}>
          <Avatar name={user?.display_name || user?.username} size="sm" />
          {sidebarOpen && (
            <div className="flex-1 overflow-hidden">
              <p className="text-xs font-black truncate text-text-main">{user?.display_name || user?.username}</p>
              <p className="text-[9px] text-brand font-black uppercase tracking-wider">{user?.role}</p>
            </div>
          )}
          {sidebarOpen && (
            <button
              onClick={logout}
              className="p-2 text-text-muted hover:text-red-500 transition-colors"
              title="Cerrar sesión"
            >
              <LogOut size={16} />
            </button>
          )}
        </div>
      </div>
 
      {/* Toggle Button (Collapse) */}
      <button
        onClick={toggleSidebar}
        className="absolute -right-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-bg-card border border-border-subtle rounded-full flex items-center justify-center text-text-muted hover:text-brand shadow-lg z-20 hover:scale-110 transition-all"
      >
        {sidebarOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
      </button>
    </motion.aside>

    {/* ── Mobile Bottom Navigation ── */}
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 print:hidden pb-safe">
      {/* Barra principal */}
      <div className="flex items-center justify-around h-12 sm:h-14 bg-bg-card/95 backdrop-blur-2xl border-t border-border-subtle shadow-[0_-4px_20px_rgba(0,0,0,0.04)] dark:shadow-[0_-4px_20px_rgba(0,0,0,0.2)]">
        {primaryMobileItems.map((item) => (
          <RoleGuard key={item.to} roles={item.roles}>
            <NavLink
              to={item.to}
              className={({ isActive }) => `
                flex flex-col items-center justify-center flex-1 h-full py-1 transition-all duration-200 relative
                ${isActive ? 'text-brand' : 'text-text-muted hover:text-brand/70'}
              `}
            >
              {({ isActive }) => (
                <>
                  {/* Indicador activo */}
                  {isActive && (
                    <motion.div
                      layoutId="mobilePill"
                      className="absolute top-0 left-[20%] right-[20%] h-0.5 bg-brand rounded-full"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                  <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} className="mb-0.5" />
                  <span className="text-[9px] font-bold tracking-tight hidden sm:block leading-none">{item.label}</span>
                </>
              )}
            </NavLink>
          </RoleGuard>
        ))}

        {/* Botón "Más" que abre el sheet */}
        <button
          onClick={() => setShowMobileSheet(!showMobileSheet)}
          className={`flex flex-col items-center justify-center flex-1 h-full py-1 transition-all duration-200 relative ${
            showMobileSheet || isSecondaryActive ? 'text-brand' : 'text-text-muted hover:text-brand/70'
          }`}
        >
          {(showMobileSheet || isSecondaryActive) && (
            <motion.div
              layoutId="mobilePill"
              className="absolute top-0 left-[20%] right-[20%] h-0.5 bg-brand rounded-full"
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            />
          )}
          <MoreHorizontal size={20} strokeWidth={showMobileSheet || isSecondaryActive ? 2.5 : 2} className="mb-0.5" />
          <span className="text-[9px] font-bold tracking-tight hidden sm:block leading-none">Más</span>
        </button>
      </div>

      {/* ── Sheet deslizable "Más" ── */}
      <AnimatePresence>
        {showMobileSheet && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
              onClick={() => setShowMobileSheet(false)}
            />
            
            {/* Sheet */}
            <motion.div
              ref={sheetRef}
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 35 }}
              className="fixed bottom-12 sm:bottom-14 left-0 right-0 z-50 bg-bg-card rounded-t-[2.5rem] border-t border-border-subtle shadow-2xl pb-safe max-h-[70vh] overflow-hidden"
            >
              {/* Handle visual */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full bg-border-accent" />
              </div>

              {/* Título */}
              <div className="flex items-center justify-between px-6 py-3">
                <h3 className="text-sm font-black text-text-main uppercase tracking-widest">Más Opciones</h3>
                <button
                  onClick={() => setShowMobileSheet(false)}
                  className="touch-target p-1.5 rounded-full hover:bg-bg-hover transition-colors text-text-muted"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Divider */}
              <div className="mx-6 border-t border-border-subtle" />

              {/* Items del sheet */}
              <div className="overflow-y-auto py-2 px-3 max-h-[calc(70vh-100px)] custom-scrollbar">
                <div className="grid grid-cols-2 gap-1">
                  {secondaryMobileItems.map((item) => (
                    <RoleGuard key={item.to} roles={item.roles}>
                      <NavLink
                        to={item.to}
                        onClick={() => setShowMobileSheet(false)}
                        className={({ isActive }) => `
                          flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-200
                          ${isActive
                            ? 'bg-brand text-white shadow-md shadow-brand/20'
                            : 'text-text-muted hover:bg-bg-hover hover:text-brand'
                          }
                        `}
                      >
                        <item.icon size={18} strokeWidth={2} />
                        <span className="text-xs font-bold">{item.label}</span>
                      </NavLink>
                    </RoleGuard>
                  ))}
                </div>
              </div>

              {/* Footer del sheet */}
              <div className="px-6 py-3 border-t border-border-subtle bg-bg-main/50">
                <p className="text-[9px] text-text-muted font-medium text-center">
                  Desliza hacia abajo para cerrar
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </nav>
    </>
  )
}

export default Sidebar
