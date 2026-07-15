import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/useAuthStore'
import { useNotificationStore } from '../store/useNotificationStore'
import { authApi } from '../api/auth'
import { Delete, X } from 'lucide-react'

import logoImg from '../assets/logo.png'
import portadaImg from '../assets/portada-login.png'
import croquetaCorazon from '../assets/croqueta-corazon.png'
import croquetaPescado from '../assets/croqueta-pescado.png'
import croquetaFlor from '../assets/croqueta-flor.png'

// ─── Mock de usuarios (fallback si la API falla) ───────────────────────────
const MOCK_USERS = [
  { id: 1, username: 'geonnetor', display_name: 'Geonnetor', role: 'admin' },
  { id: 2, username: 'merrgato',  display_name: 'Merrgato',  role: 'admin' },
  { id: 3, username: 'yolanda',   display_name: 'Yolanda',   role: 'encargado' },
  { id: 4, username: 'saul',      display_name: 'Saúl',      role: 'encargado' },
  { id: 5, username: 'rodrigo',   display_name: 'Rodrigo',   role: 'encargado' },
]

// ─── Etiqueta de rol legible ───────────────────────────────────────────────
const ROLE_LABELS = {
  admin: '👑 Administrador',
  encargado: '🐾 Encargado',
  cajero: '🛒 Cajero',
}

// ─── Color de avatar por rol ───────────────────────────────────────────────
const ROLE_COLORS = {
  admin: { bg: '#C62828', text: '#FFFFFF' },
  encargado: { bg: '#8B1A1A', text: '#FFFFFF' },
  cajero: { bg: '#F4BFBF', text: '#C62828' },
}

// ─── Croquetas flotantes alrededor de cada tarjeta de usuario ──────────────
const FloatingCroquetas = ({ visible }) => {
  const snacks = [
    { src: croquetaCorazon, style: { top: '-18px', right: '12px' },   delay: 0,    dur: 2.8 },
    { src: croquetaPescado, style: { bottom: '-16px', left: '14px' }, delay: 0.35, dur: 3.2 },
    { src: croquetaFlor,    style: { top: '50%', right: '-18px',
        transform: 'translateY(-50%)' },                                delay: 0.7,  dur: 2.5 },
  ]

  return (
    <AnimatePresence>
      {visible && snacks.map((snack, i) => (
        <motion.img
          key={i}
          src={snack.src}
          alt=""
          aria-hidden="true"
          className="absolute w-9 h-9 object-contain pointer-events-none select-none z-20"
          style={snack.style}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{
            opacity: 1,
            scale: 1,
            y: [0, -10, 0],
            rotate: [0, 6, -6, 0],
          }}
          exit={{ opacity: 0, scale: 0.3 }}
          transition={{
            opacity: { duration: 0.25 },
            scale: { duration: 0.25 },
            y: { duration: snack.dur, repeat: Infinity, ease: 'easeInOut', delay: snack.delay },
            rotate: { duration: snack.dur * 1.2, repeat: Infinity, ease: 'easeInOut', delay: snack.delay },
          }}
        />
      ))}
    </AnimatePresence>
  )
}

// ─── Avatar con iniciales ──────────────────────────────────────────────────
const UserAvatar = ({ name, role, size = 'md' }) => {
  const initials = name
    .split(' ')
    .map(w => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  const colors = ROLE_COLORS[role] || ROLE_COLORS.cajero
  const sizeClasses = {
    sm:  'w-9 h-9 text-sm',
    md:  'w-12 h-12 text-base',
    lg:  'w-16 h-16 text-xl',
    xl:  'w-20 h-20 text-2xl',
  }

  return (
    <div
      className={`${sizeClasses[size]} rounded-full flex items-center justify-center font-black shrink-0 ring-2 ring-white/60 shadow-md`}
      style={{ backgroundColor: colors.bg, color: colors.text }}
    >
      {initials}
    </div>
  )
}

// ─── Componente principal ──────────────────────────────────────────────────
const Login = () => {
  const [users, setUsers]               = useState([])
  const [loadingUsers, setLoadingUsers] = useState(true)
  const [selectedUser, setSelectedUser] = useState(null)
  const [hoveredUser, setHoveredUser]   = useState(null)
  const [pin, setPin]                   = useState('')
  const [isError, setIsError]           = useState(false)
  const [isLoggingIn, setIsLoggingIn]   = useState(false)

  const navigate = useNavigate()
  const { setAuth } = useAuthStore()
  const { addNotification } = useNotificationStore()

  // ── Cargar usuarios ──────────────────────────────────────────────────────
  useEffect(() => {
    const loadUsers = async () => {
      try {
        const res = await authApi.getUsersList()
        if (res.success && res.data?.length) {
          setUsers(res.data)
        } else {
          setUsers(MOCK_USERS)
        }
      } catch {
        setUsers(MOCK_USERS)
      } finally {
        setLoadingUsers(false)
      }
    }
    loadUsers()
  }, [])

  // ── Soporte de teclado ───────────────────────────────────────────────────
  useEffect(() => {
    const handleKey = (e) => {
      if (!selectedUser) return
      if (e.key >= '0' && e.key <= '9') handleKeyPress(e.key)
      if (e.key === 'Backspace') handleDelete()
      if (e.key === 'Escape') setSelectedUser(null)
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [selectedUser, pin])

  const handleUserSelect = (user) => {
    setSelectedUser(user)
    setPin('')
    setIsError(false)
  }

  const handleKeyPress = (num) => {
    if (pin.length < 6) {
      const newPin = pin + String(num)
      setPin(newPin)
      if (newPin.length === 6) {
        handleLogin(newPin)
      }
    }
  }

  const handleDelete = () => {
    setPin(p => p.slice(0, -1))
    setIsError(false)
  }

  const handleLogin = async (currentPin) => {
    setIsLoggingIn(true)

    try {
      const res = await authApi.login({
        username: selectedUser.username,
        password: currentPin,
      })
      if (res.success) {
        setAuth({
          user:          res.data.user,
          access_token:  res.data.access_token,
          refresh_token: res.data.refresh_token,
          expires_in:    3600,
        })
        addNotification(`¡Bienvenido de nuevo, ${res.data.user.display_name}! 🐾`, 'success')
        navigate('/dashboard')
      } else {
        setIsError(true)
        addNotification(res.error || 'PIN incorrecto', 'error')
        setTimeout(() => {
          setPin('')
          setIsError(false)
        }, 600)
      }
    } catch {
      setIsError(true)
      addNotification('Error al conectar con el servidor', 'error')
      setTimeout(() => {
        setPin('')
        setIsError(false)
      }, 600)
    } finally {
      setIsLoggingIn(false)
    }
  }

  // ── RENDER ────────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 flex flex-col md:flex-row overflow-hidden" style={{ background: '#FFF5F5' }}>

      {/* ── Panel Izquierdo: Portada de marca ─────────────────────────────── */}
      <div 
        className="relative w-full md:w-[58%] h-[38vh] md:h-full overflow-hidden flex items-center justify-center"
        style={{ background: '#C62828' }}
      >
        <motion.img
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          src={portadaImg}
          alt="Guaw & Miaw Pet Shop"
          className="w-full h-full object-contain object-center drop-shadow-2xl"
        />
        {/* Gradiente inferior en mobile para transición suave */}
        <div
          className="absolute inset-x-0 bottom-0 h-20 md:hidden pointer-events-none"
          style={{ background: 'linear-gradient(to bottom, transparent, #FFF5F5)' }}
        />
        {/* Borde rojo vertical (solo desktop) */}
        <div
          className="absolute inset-y-0 right-0 w-1 hidden md:block"
          style={{ background: 'linear-gradient(to bottom, #C62828, #F4BFBF, #C62828)' }}
        />
      </div>

      {/* ── Panel Derecho: Auth ───────────────────────────────────────────── */}
      <div
        className="w-full md:w-[42%] h-[62vh] md:h-full flex flex-col items-center justify-center px-6 py-8 md:px-10 relative overflow-y-auto"
        style={{ background: '#FFF5F5' }}
      >
        {/* Logo */}
        <motion.img
          src={logoImg}
          alt="Guaw & Miaw"
          className="h-16 md:h-20 object-contain mb-6 drop-shadow-lg"
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />

        <AnimatePresence mode="wait">

          {/* ── Vista 1: Selección de usuario ─────────────────────────────── */}
          {!selectedUser ? (
            <motion.div
              key="user-selection"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="w-full max-w-xs"
            >
              {/* Encabezado */}
              <div className="text-center mb-6">
                <h1 className="text-3xl font-black mb-1" style={{ color: '#C62828', fontFamily: 'var(--font-display)' }}>
                  ¡Hola! 👋
                </h1>
                <p className="text-sm font-semibold" style={{ color: '#7B3535' }}>
                  ¿Quién eres tú hoy?
                </p>
              </div>

              {/* Lista de usuarios */}
              <div className="flex flex-col gap-3">
                {loadingUsers ? (
                  <div className="py-10 flex justify-center">
                    <div
                      className="w-7 h-7 border-4 rounded-full animate-spin"
                      style={{ borderColor: '#F4BFBF', borderTopColor: '#C62828' }}
                    />
                  </div>
                ) : (
                  users.map((user) => (
                    <motion.button
                      key={user.id}
                      onClick={() => handleUserSelect(user)}
                      onMouseEnter={() => setHoveredUser(user.id)}
                      onMouseLeave={() => setHoveredUser(null)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.97 }}
                      className="relative flex items-center gap-4 p-4 rounded-3xl text-left transition-all duration-200 overflow-visible"
                      style={{
                        background: '#FFFFFF',
                        border: `2px solid ${hoveredUser === user.id ? '#C62828' : '#F4BFBF'}`,
                        boxShadow: hoveredUser === user.id
                          ? '0 8px 24px -6px rgba(198,40,40,0.22)'
                          : '0 4px 14px -4px rgba(198,40,40,0.08)',
                      }}
                    >
                      {/* Croquetas flotantes (aparecen al hover) */}
                      <FloatingCroquetas visible={hoveredUser === user.id} />

                      <UserAvatar name={user.display_name} role={user.role} size="md" />

                      <div className="flex-1 overflow-hidden">
                        <p className="font-black text-base truncate" style={{ color: '#1A0505' }}>
                          {user.display_name}
                        </p>
                        <p className="text-xs font-bold mt-0.5" style={{ color: '#C62828' }}>
                          {ROLE_LABELS[user.role] || user.role}
                        </p>
                      </div>

                      {/* Flecha animada */}
                      <motion.span
                        animate={{ x: hoveredUser === user.id ? 4 : 0 }}
                        transition={{ duration: 0.15 }}
                        className="text-lg shrink-0"
                        style={{ color: '#F4BFBF' }}
                      >
                        →
                      </motion.span>
                    </motion.button>
                  ))
                )}
              </div>

              <p className="text-center text-xs mt-6 font-medium" style={{ color: '#C62828', opacity: 0.5 }}>
                🐾 Sistema de Gestión Interno
              </p>
            </motion.div>

          ) : (

            /* ── Vista 2: Teclado PIN ──────────────────────────────────────── */
            <motion.div
              key="pin-entry"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="w-full max-w-xs flex flex-col items-center"
            >
              {/* Botón volver */}
              <button
                onClick={() => { setSelectedUser(null); setPin(''); setIsError(false) }}
                className="absolute top-5 right-5 p-2.5 rounded-full transition-all hover:scale-110 active:scale-95"
                style={{ background: '#F4BFBF20', color: '#C62828' }}
                aria-label="Volver a selección"
              >
                <X size={20} />
              </button>

              {/* Avatar + saludo */}
              <div className="text-center mb-8">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  className="flex justify-center mb-3"
                >
                  <UserAvatar name={selectedUser.display_name} role={selectedUser.role} size="xl" />
                </motion.div>
                <h2 className="text-2xl font-black" style={{ color: '#1A0505', fontFamily: 'var(--font-display)' }}>
                  Hola, {selectedUser.display_name} 🐾
                </h2>
                <p className="text-sm mt-1" style={{ color: '#7B3535' }}>
                  Ingresa tu PIN de 6 dígitos
                </p>
              </div>

              {/* Indicador de PIN (6 puntos) */}
              <motion.div
                className="flex gap-4 mb-8"
                animate={isError ? { x: [0, -10, 10, -10, 10, -6, 6, 0] } : { x: 0 }}
                transition={{ duration: 0.5 }}
              >
                {[...Array(6)].map((_, i) => (
                  <motion.div
                    key={i}
                    animate={{
                      scale: i < pin.length ? 1.15 : 1,
                      backgroundColor: i < pin.length
                        ? (isError ? '#DC2626' : '#C62828')
                        : '#F4BFBF',
                    }}
                    transition={{ duration: 0.15, type: 'spring', stiffness: 400 }}
                    className="w-4 h-4 rounded-full"
                    style={{
                      boxShadow: i < pin.length
                        ? `0 0 10px ${isError ? 'rgba(220,38,38,0.6)' : 'rgba(198,40,40,0.5)'}`
                        : 'none',
                    }}
                  />
                ))}
              </motion.div>

              {/* Teclado numérico 3×4 */}
              <div className="grid grid-cols-3 gap-3 w-full max-w-[260px]">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                  <motion.button
                    key={num}
                    onClick={() => handleKeyPress(num)}
                    whileHover={{ scale: 1.06 }}
                    whileTap={{ scale: 0.88 }}
                    disabled={isLoggingIn}
                    className="h-[60px] rounded-2xl text-xl font-black transition-colors duration-150 disabled:opacity-40"
                    style={{
                      background: '#FFFFFF',
                      border: '2px solid #F4BFBF',
                      color: '#1A0505',
                      boxShadow: '0 3px 10px -3px rgba(198,40,40,0.1)',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = '#C62828'
                      e.currentTarget.style.color = '#FFFFFF'
                      e.currentTarget.style.borderColor = '#C62828'
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = '#FFFFFF'
                      e.currentTarget.style.color = '#1A0505'
                      e.currentTarget.style.borderColor = '#F4BFBF'
                    }}
                  >
                    {num}
                  </motion.button>
                ))}

                {/* Fila inferior: vacío | 0 | borrar */}
                <div />

                <motion.button
                  onClick={() => handleKeyPress(0)}
                  whileHover={{ scale: 1.06 }}
                  whileTap={{ scale: 0.88 }}
                  disabled={isLoggingIn}
                  className="h-[60px] rounded-2xl text-xl font-black transition-colors duration-150 disabled:opacity-40"
                  style={{
                    background: '#FFFFFF',
                    border: '2px solid #F4BFBF',
                    color: '#1A0505',
                    boxShadow: '0 3px 10px -3px rgba(198,40,40,0.1)',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = '#C62828'
                    e.currentTarget.style.color = '#FFFFFF'
                    e.currentTarget.style.borderColor = '#C62828'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = '#FFFFFF'
                    e.currentTarget.style.color = '#1A0505'
                    e.currentTarget.style.borderColor = '#F4BFBF'
                  }}
                >
                  0
                </motion.button>

                <motion.button
                  onClick={handleDelete}
                  whileHover={{ scale: 1.06 }}
                  whileTap={{ scale: 0.88 }}
                  disabled={isLoggingIn}
                  className="h-[60px] rounded-2xl flex items-center justify-center transition-all duration-150 disabled:opacity-40"
                  style={{
                    background: '#FFF0F0',
                    border: '2px solid #F4BFBF',
                    color: '#C62828',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = '#FECACA'
                    e.currentTarget.style.borderColor = '#C62828'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = '#FFF0F0'
                    e.currentTarget.style.borderColor = '#F4BFBF'
                  }}
                >
                  <Delete size={22} />
                </motion.button>
              </div>

              {/* Loader mientras hace login */}
              {isLoggingIn && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-5 flex items-center gap-2"
                  style={{ color: '#C62828' }}
                >
                  <div
                    className="w-4 h-4 border-2 rounded-full animate-spin"
                    style={{ borderColor: '#F4BFBF', borderTopColor: '#C62828' }}
                  />
                  <span className="text-sm font-semibold">Verificando...</span>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Partículas de ambiente (fondo sutil) */}
        <div
          className="fur-particle pointer-events-none"
          style={{ '--dur': '22s', top: '5%', right: '8%', width: '280px', height: '280px', opacity: 0.15 }}
        />
        <div
          className="fur-particle pointer-events-none"
          style={{ '--dur': '28s', bottom: '8%', left: '3%', width: '220px', height: '220px', opacity: 0.1 }}
        />
      </div>
    </div>
  )
}

export default Login
