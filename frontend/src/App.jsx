import React, { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import Sidebar from './components/Sidebar'
import Notifications from './components/Notifications'
import PageWrapper from './components/PageWrapper'
import RoleGuard from './components/RoleGuard'
import { useUIStore } from './store/useUIStore'
import { useAuthStore } from './store/useAuthStore'
import AIAssistantWidget from './components/AIAssistantWidget'

// Páginas
import Login from './pages/Login'
import POS from './pages/POS'
import Corte from './pages/Corte'
import Dashboard from './pages/Dashboard'
import Inventory from './pages/Inventory'
import Clients from './pages/Clients'
import Reports from './pages/Reports'
import Settings from './pages/Settings'
import Sales from './pages/Sales'
import Suppliers from './pages/Suppliers'
import Expenses from './pages/Expenses'
import Users from './pages/Users'
import Restock from './pages/Restock'

const Placeholder = ({ name }) => (
  <PageWrapper className="flex flex-col items-center justify-center min-h-[80vh] p-8 text-center">
    <div className="w-32 h-32 mb-8 rounded-[2.5rem] bg-brand/10 flex items-center justify-center soft-shadow border border-brand/20">
      <span className="text-6xl animate-bounce">🐾</span>
    </div>
    <h1 className="text-5xl font-black text-brand mb-4 tracking-tighter uppercase">{name}</h1>
    <p className="text-text-muted text-xl max-w-md font-medium">
      Estamos construyendo la nueva experiencia pastel de Guaw & Miaw.
    </p>
  </PageWrapper>
)

const AppContent = () => {
  const { sidebarOpen, darkMode, theme, setTheme } = useUIStore()
  const { isAuthenticated, user } = useAuthStore()
  const location = useLocation()
  const isLoginPage = location.pathname === '/login'
  
  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.theme && user.theme !== theme) setTheme(user.theme)
      if (user.dark_mode !== undefined && user.dark_mode !== darkMode) {
         useUIStore.getState().setDarkMode(user.dark_mode)
      }
    }
  }, [isAuthenticated, user])

  useEffect(() => {
    if (isLoginPage) {
      document.documentElement.classList.remove('dark')
    } else {
      if (darkMode) {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
    }
  }, [darkMode, isLoginPage])
  
  useEffect(() => {
    const classes = document.documentElement.className.split(' ').filter(c => c.startsWith('theme-'))
    document.documentElement.classList.remove(...classes)
    
    if (isLoginPage) {
      document.documentElement.classList.add('theme-pastel')
    } else {
      document.documentElement.classList.add(`theme-${theme || 'pastel'}`)
    }
  }, [theme, isLoginPage])

  return (
    <div className="min-h-screen bg-bg-main text-text-main font-body selection:bg-brand/30">
      {!isLoginPage && isAuthenticated && <Sidebar />}
      <Notifications />
      
      <main 
        className={`transition-all duration-300 min-h-screen pb-20 md:pb-0 print:pl-0 ${(!isLoginPage && isAuthenticated) ? (sidebarOpen ? 'md:pl-[276px]' : 'md:pl-[104px]') : ''}`}
      >
        <div className={!isLoginPage ? "max-w-[1600px] mx-auto p-4 md:p-8" : ""}>
          <Routes location={location} key={location.pathname}>
            <Route path="/login" element={<Login />} />
            
            {/* Rutas protegidas */}
            <Route path="/pos"       element={isAuthenticated ? <POS /> : <Navigate to="/login" />} />
            <Route path="/corte"     element={isAuthenticated ? <Corte /> : <Navigate to="/login" />} />
            <Route path="/settings"  element={isAuthenticated ? <Settings /> : <Navigate to="/login" />} />
            
            <Route path="/dashboard" element={isAuthenticated ? <RoleGuard roles={['admin', 'encargado']} fallback={<Navigate to="/pos" />}><Dashboard /></RoleGuard> : <Navigate to="/login" />} />
            <Route path="/inventory" element={isAuthenticated ? <RoleGuard roles={['admin', 'encargado']} fallback={<Navigate to="/pos" />}><Inventory /></RoleGuard> : <Navigate to="/login" />} />
            <Route path="/clients"   element={isAuthenticated ? <RoleGuard roles={['admin', 'encargado']} fallback={<Navigate to="/pos" />}><Clients /></RoleGuard> : <Navigate to="/login" />} />
            <Route path="/reports"   element={isAuthenticated ? <RoleGuard roles={['admin', 'encargado']} fallback={<Navigate to="/pos" />}><Reports /></RoleGuard> : <Navigate to="/login" />} />
            
            {/* Rutas protegidas — módulos que antes redirigían a otras páginas */}
            <Route path="/suppliers" element={isAuthenticated ? <RoleGuard roles={['admin', 'encargado']} fallback={<Navigate to="/pos" />}><Suppliers /></RoleGuard> : <Navigate to="/login" />} />
            <Route path="/sales"     element={isAuthenticated ? <RoleGuard roles={['admin', 'encargado']} fallback={<Navigate to="/pos" />}><Sales /></RoleGuard> : <Navigate to="/login" />} />
            <Route path="/expenses"  element={isAuthenticated ? <RoleGuard roles={['admin', 'encargado']} fallback={<Navigate to="/pos" />}><Expenses /></RoleGuard> : <Navigate to="/login" />} />
            <Route path="/users"     element={isAuthenticated ? <RoleGuard roles={['admin']} fallback={<Navigate to="/pos" />}><Users /></RoleGuard> : <Navigate to="/login" />} />
            <Route path="/restock"   element={isAuthenticated ? <RoleGuard roles={['admin', 'encargado']} fallback={<Navigate to="/pos" />}><Restock /></RoleGuard> : <Navigate to="/login" />} />
            
            <Route path="/" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />} />
          </Routes>
        </div>
      </main>

      {!isLoginPage && isAuthenticated && <AIAssistantWidget />}
    </div>
  )
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  )
}

export default App
