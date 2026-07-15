import React, { useState } from 'react'
import { NavLink } from 'react-router-dom'
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
  Moon
} from 'lucide-react'
import { useUIStore } from '../store/useUIStore'
import { useAuthStore } from '../store/useAuthStore'
import RoleGuard from './RoleGuard'
import Avatar from './Avatar'

import croquetaCorazon from '../assets/croqueta-corazon.png'
import croquetaPescado from '../assets/croqueta-pescado.png'
import croquetaFlor from '../assets/croqueta-flor.png'

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

const Sidebar = () => {
  const { sidebarOpen, toggleSidebar, darkMode, toggleDarkMode } = useUIStore()
  const { user, logout } = useAuthStore()
 
  const menuItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard',  roles: [] },
    { to: '/pos',       icon: ShoppingCart,    label: 'Vender',     roles: [] },
    { to: '/inventory', icon: Package,         label: 'Inventario', roles: [] },
    { to: '/corte',     icon: Calculator,      label: 'Finanzas',   roles: [] }, // Ventas y Gastos como sub-tabs
    { to: '/reports',   icon: BarChart3,       label: 'Reportes',   roles: ['admin', 'encargado'] },
    { to: '/settings',  icon: SettingsIcon,    label: 'Ajustes',    roles: [] },
  ]
 
  return (
    <motion.aside
      animate={{ 
        width: sidebarOpen ? 260 : 88,
        x: 0,
        opacity: 1
      }}
      initial={{ x: -100, opacity: 0 }}
      className="fixed left-4 top-4 bottom-4 bg-bg-card/60 dark:bg-bg-card/40 backdrop-blur-2xl border border-white/20 dark:border-white/5 flex flex-col z-50 shadow-[0_20px_50px_rgba(0,0,0,0.05)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.3)] rounded-[2.5rem] overflow-hidden transition-colors duration-500 print:hidden"
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
              <img src="/src/assets/logo.png" alt="Logo" className="w-full h-full object-contain" />
            </div>
            <div className="flex flex-col">
              <span className="font-display font-black text-brand text-lg leading-none tracking-tighter">GUAW & MIAW</span>
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-brand/70 mt-1">Pet Shop</span>
            </div>
          </motion.div>
        ) : (
          <div className="w-10 h-10 overflow-hidden flex items-center justify-center bg-white rounded-full p-1 shadow-sm border border-brand-light mx-auto">
            <img src="/src/assets/logo.png" alt="Logo" className="w-full h-full object-contain" />
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
      <nav className="flex-1 px-3 py-2 flex flex-col gap-1 overflow-y-auto custom-scrollbar">
        {menuItems.map((item) => (
          <RoleGuard key={item.to} roles={item.roles}>
            <NavItem
              to={item.to}
              icon={item.icon}
              label={item.label}
              collapsed={!sidebarOpen}
            />
          </RoleGuard>
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
  )
}

export default Sidebar
