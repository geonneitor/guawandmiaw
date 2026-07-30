import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Send, Mic, MicOff, Sparkles, Zap,
  Maximize2, Minimize2, RefreshCw, AlertTriangle,
  WifiOff
} from 'lucide-react';
import mascotaFrontal from '../assets/mascota-frontal.png';
import { aiApi } from '../api/ai';
import { useCartStore } from '../store/useCartStore';
import { useNotificationStore } from '../store/useNotificationStore';
import { useAuthStore } from '../store/useAuthStore';
import { useNavigate, useLocation } from 'react-router-dom';

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTES
// ═══════════════════════════════════════════════════════════════════════════════

const STORAGE_KEY = '__gm_ai_messages';
const MAX_STORED_MSGS = 50;
const MAX_RETRIES = 2;
const RETRY_DELAY = 1000;
const CHILITAI_TYPING_DELAY = 800; // ms extra de escritura

// ═══════════════════════════════════════════════════════════════════════════════
// SKINS / PERSONALIDADES
// ═══════════════════════════════════════════════════════════════════════════════

const FIGARO_SKIN = {
  id: 'figaro',
  name: 'Fígaro',
  subtitle: 'Asistente Virtual',
  greeting: '¡Miau! Soy Fígaro 🐾, tu asistente gatuno. Estoy conectado a la base de datos de tu tienda. ¿En qué te puedo ayudar?',
  placeholder: 'Pregúntale a Fígaro...',
  headerBg: 'bg-brand',
  headerText: 'text-white',
  bubbleUser: 'bg-brand text-white rounded-br-sm',
  bubbleAI: 'bg-white border border-slate-200 text-slate-800 rounded-bl-sm',
  btn: 'bg-brand hover:bg-brand-light',
  floatBtn: 'bg-brand border-brand/50',
  floatShadow: 'shadow-brand/30',
  badgeBg: 'bg-yellow-400 text-yellow-900',
  inputFocus: 'focus:ring-brand/30',
  filterStyle: {},
  badgeIcon: <Sparkles size={12} />,
  typing: 'bg-brand/50',
  accentColor: '#C62828',
  isChaotic: false,
};

const CHILITIT_SKIN = {
  id: 'chilitit',
  name: 'Chilitit(AI)',
  subtitle: '— Inteligencia Promedio™',
  greeting: '...Hola. Soy Chilitit. Uso... la inteligencia promedio. 🐈 Como el Correcaminos pero sin correr. Puedo contestar cosas. Creo.',
  placeholder: 'Pregúntale a Chilitit (sin garantías)...',
  headerBg: 'bg-gray-700',
  headerText: 'text-white',
  bubbleUser: 'bg-gray-500 text-white rounded-br-sm',
  bubbleAI: 'bg-gray-100 border border-gray-300 text-gray-700 rounded-bl-sm',
  btn: 'bg-gray-600 hover:bg-gray-500',
  floatBtn: 'bg-gray-600 border-gray-400/50',
  floatShadow: 'shadow-gray-400/30',
  badgeBg: 'bg-gray-300 text-gray-700',
  inputFocus: 'focus:ring-gray-400/30',
  filterStyle: { filter: 'grayscale(100%) brightness(1.1) contrast(0.9)' },
  badgeIcon: <Zap size={12} />,
  typing: 'bg-gray-400',
  accentColor: '#6B7280',
  isChaotic: true,       // Las burbujas se mueven aleatoriamente
};

// ═══════════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

const renderText = (text) => {
  if (!text || typeof text !== 'string') return null;
  return text.split('\n').map((line, j) => {
    const parts = line.split(/(\*\*.*?\*\*)/g);
    return (
      <span key={j} className="block min-h-[1em]">
        {parts.map((part, k) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={k}>{part.slice(2, -2)}</strong>;
          }
          return part;
        })}
      </span>
    );
  });
};

/** Carga historial de localStorage */
const loadHistory = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.messages) && parsed.messages.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('[AI] Error cargando historial:', e);
  }
  return null;
};

/** Guarda historial en localStorage */
const saveHistory = (skin, messages) => {
  try {
    // Truncar si es muy largo
    const truncated = messages.length > MAX_STORED_MSGS
      ? messages.slice(-MAX_STORED_MSGS)
      : messages;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ skin, messages: truncated }));
  } catch (e) {
    // localStorage lleno — limpiar y reintentar
    if (e.name === 'QuotaExceededError') {
      localStorage.removeItem(STORAGE_KEY);
    }
  }
};

/** Limpia historial */
const clearHistory = () => {
  localStorage.removeItem(STORAGE_KEY);
};

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════════

const AIAssistantWidget = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthStore();

  // ── Estado ──────────────────────────────────────────────────────────────
  const [skin, setSkin] = useState(FIGARO_SKIN);
  const [isOpen, setIsOpen] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [errorState, setErrorState] = useState(null); // null | 'network' | 'api' | 'timeout'
  const [retryCount, setRetryCount] = useState(0);
  const [chilitaiThinking, setChilitaiThinking] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const recognitionRef = useRef(null);
  const chatContainerRef = useRef(null);
  const initialSkinLoaded = useRef(false);

  // ── Inicializar desde localStorage ──────────────────────────────────────
  useEffect(() => {
    if (initialSkinLoaded.current) return;
    initialSkinLoaded.current = true;

    const saved = loadHistory();
    if (saved) {
      // Restaurar skin
      const restoredSkin = saved.skin === 'chilitit' ? CHILITIT_SKIN : FIGARO_SKIN;
      setSkin(restoredSkin);
      setMessages(saved.messages);
    } else {
      setMessages([{ role: 'assistant', content: FIGARO_SKIN.greeting }]);
    }
  }, []);

  // ── Scroll al fondo ─────────────────────────────────────────────────────
  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, chilitaiThinking, scrollToBottom]);

  // ── Cerrar al navegar (mobile) ──────────────────────────────────────────
  useEffect(() => {
    if (isOpen && window.innerWidth < 768) {
      // Pequeña pausa para no cerrar inmediatamente al abrir
      const timer = setTimeout(() => setIsOpen(false), 100);
      return () => clearTimeout(timer);
    }
  }, [location.pathname]);

  // ── Guardar historial cuando cambien los mensajes o skin ────────────────
  useEffect(() => {
    if (messages.length > 0) {
      saveHistory(skin, messages);
    }
  }, [messages, skin]);

  // ── Cleanup del reconocimiento de voz ───────────────────────────────────
  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
    };
  }, []);

  // ── Cambiar skin ─────────────────────────────────────────────────────────
  const toggleSkin = useCallback(() => {
    const next = skin.id === 'figaro' ? CHILITIT_SKIN : FIGARO_SKIN;
    setSkin(next);
    // Limpiar historial y empezar nuevo con el saludo correspondiente
    setMessages([{ role: 'assistant', content: next.greeting }]);
    clearHistory();
    setErrorState(null);
    setRetryCount(0);
  }, [skin]);

  // ── Ref para llevar el contador de retries (evita stale closures) ──────────
  const retryCountRef = useRef(0);

  // ── Función interna de envío con retry count por parámetro ─────────────────
  const doSend = useCallback(async (textToSend, attempt = 0) => {
    if (!textToSend || isLoading) return;

    setInput('');
    setErrorState(null);

    const userMessage = { role: 'user', content: textToSend };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);

    setIsLoading(true);

    if (skin.id === 'chilitit') {
      setChilitaiThinking(true);
    }

    try {
      const cart = useCartStore.getState().items;
      const path = window.location.pathname;
      const context = { path, cart };

      const response = await aiApi.sendMessage(
        newMessages,
        context,
        skin.id,
        { name: user?.display_name || user?.username || 'Usuario', role: user?.role || 'cajero' }
      );

      setChilitaiThinking(false);
      retryCountRef.current = 0;
      setRetryCount(0);

      if (response?.success && response?.data) {
        if (response.data.messages) {
          setMessages(response.data.messages);
        } else if (response.data.reply) {
          setMessages(prev => [...prev, { role: 'assistant', content: String(response.data.reply) }]);
        }

        const actions = response?.data?.actions || [];
        actions.forEach(action => {
          if (action.type === 'ADD_TO_CART' && action.product) {
            useCartStore.getState().addItem(action.product, action.quantity || 1);
            useNotificationStore.getState().addNotification(
              <div className="flex items-center gap-3">
                <div>Se agregó <strong>{action.product.name}</strong> al carrito.</div>
                <button
                  onClick={() => { navigate('/pos'); setIsOpen(false); }}
                  className="bg-brand text-white px-3 py-1 rounded-lg text-xs font-bold hover:bg-brand-light"
                >
                  Ver Carrito
                </button>
              </div>,
              'success'
            );
          } else if (action.type === 'CLEAR_CART') {
            useCartStore.getState().clear();
            useNotificationStore.getState().addNotification('El carrito ha sido vaciado.', 'success');
          }
        });
      } else {
        const errMsg = response?.error || 'Algo salió mal.';
        setMessages(prev => [...prev, { role: 'assistant', content: `Ups: ${errMsg}` }]);
      }
    } catch (err) {
      setChilitaiThinking(false);
      console.error('[AI] Error de conexión:', err);

      if (err.message?.includes('fetch') || err.message?.includes('Network')) {
        setErrorState('network');
      } else if (err.message?.includes('timeout') || err.message?.includes('408')) {
        setErrorState('timeout');
      } else {
        setErrorState('api');
      }

      // Auto-retry con exponential backoff (usamos attempt del parámetro)
      const nextAttempt = attempt + 1;
      if (nextAttempt <= MAX_RETRIES) {
        const delay = RETRY_DELAY * Math.pow(2, attempt);
        retryCountRef.current = nextAttempt;
        setRetryCount(nextAttempt);
        useNotificationStore.getState().addNotification(
          `Reintentando conexión con la IA... (${nextAttempt}/${MAX_RETRIES})`,
          'warning'
        );
        await new Promise(r => setTimeout(r, delay));
        return doSend(textToSend, nextAttempt);
      }

      const fallback = skin.id === 'chilitit'
        ? 'Uy... creo que el internet se fue. O tal vez no. 😅 Intenta de nuevo cuando quieras.'
        : 'Error de conexión con mis servidores gatunos. Verifica tu conexión o intenta de nuevo. 🐾';

      setMessages(prev => [...prev, { role: 'assistant', content: fallback }]);
      retryCountRef.current = 0;
      setRetryCount(0);
    } finally {
      setIsLoading(false);
      setChilitaiThinking(false);
    }
  }, [isLoading, messages, skin, user, navigate]);

  // ── Handler público que extrae el texto y lo pasa a doSend ────────────────
  const handleSend = useCallback((e) => {
    e?.preventDefault();
    const text = input.trim();
    if (!text) return;
    doSend(text);
  }, [input, doSend]);

  // ── Reintentar después de error ──────────────────────────────────────────
  const handleRetry = useCallback(() => {
    setErrorState(null);
    setRetryCount(0);
    // Reenviar el último mensaje del usuario
    const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
    if (lastUserMsg) {
      setInput(lastUserMsg.content);
      // Quitar el último mensaje de error del asistente
      setMessages(prev => {
        const withoutLast = prev.slice(0, -1);
        return withoutLast;
      });
    }
  }, [messages]);

  // ── Limpiar conversación ──────────────────────────────────────────────────
  const handleClearChat = useCallback(() => {
    const greeting = skin.greeting;
    setMessages([{ role: 'assistant', content: greeting }]);
    clearHistory();
    setErrorState(null);
    setRetryCount(0);
  }, [skin]);

  // ── Micrófono (Web Speech API) ────────────────────────────────────────────
  const toggleMic = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      useNotificationStore.getState().addNotification(
        'Tu navegador no soporta reconocimiento de voz.',
        'warning'
      );
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'es-MX';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInput(prev => prev ? `${prev} ${transcript}` : transcript);
      setIsListening(false);
    };
    recognition.onerror = () => {
      setIsListening(false);
      useNotificationStore.getState().addNotification('No pude escuchar. ¿Tal vez más fuerte?', 'warning');
    };
    recognition.onend = () => setIsListening(false);

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }, [isListening]);

  // ── Toggle full-screen ────────────────────────────────────────────────────
  const toggleFullScreen = useCallback(() => {
    setIsFullScreen(prev => !prev);
  }, []);

  // ── Atajos de teclado ─────────────────────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl+Enter para enviar rápido
      if (e.ctrlKey && e.key === 'Enter' && isOpen) {
        handleSend(e);
      }
      // Escape para cerrar
      if (e.key === 'Escape' && isOpen && !isFullScreen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSend, isOpen, isFullScreen]);

  // ── Manejo de swipe hacia abajo para cerrar (mobile) ─────────────────────
  const touchStartY = useRef(0);
  const touchStartX = useRef(0);

  const handleTouchStart = (e) => {
    touchStartY.current = e.touches[0].clientY;
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e) => {
    if (isFullScreen) return; // No cerrar en full screen
    const deltaY = e.changedTouches[0].clientY - touchStartY.current;
    const deltaX = Math.abs(e.changedTouches[0].clientX - touchStartX.current);
    // Swipe hacia abajo de más de 100px, y no diagonal
    if (deltaY > 100 && deltaX < 50) {
      setIsOpen(false);
    }
  };

  // ══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════════════════════

  const chatHeight = isFullScreen ? '100dvh' : 'min(560px, calc(100dvh - 140px))';
  const chatWidth = isFullScreen
    ? '100vw'
    : 'min(92vw, 400px)';
  const chatMaxHeight = isFullScreen ? '100dvh' : 'min(72vh, 600px)';

  return (
    <div
      className={`fixed z-[100] flex flex-col items-end ${
        isFullScreen ? 'inset-0' : 'bottom-16 sm:bottom-6 right-2 sm:right-6'
      }`}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* ── Ventana del Chat ──────────────────────────────────────────────── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={isFullScreen ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={isFullScreen ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.92 }}
            transition={{ type: 'spring', stiffness: 340, damping: 28 }}
            className={`mb-2 sm:mb-6 shadow-2xl rounded-2xl sm:rounded-3xl overflow-hidden flex flex-col border border-white/20 ${
              isFullScreen ? 'w-full h-full rounded-none !mb-0' : ''
            }`}
            style={{
              width: isFullScreen ? '100vw' : chatWidth,
              height: isFullScreen ? '100dvh' : chatHeight,
              maxHeight: chatMaxHeight,
              background: 'rgba(255,255,255,0.97)',
              backdropFilter: 'blur(20px)',
            }}
          >
            {/* ── HEADER ─────────────────────────────────────────────────── */}
            <div
              className={`${skin.headerBg} ${skin.headerText} p-3 sm:p-4 flex items-center justify-between shadow-md relative overflow-hidden shrink-0`}
            >
              <div
                className="absolute inset-0 opacity-10 pointer-events-none"
                style={{ background: 'radial-gradient(circle at 80% 50%, white 0%, transparent 60%)' }}
              />

              <div className="flex items-center gap-2 sm:gap-3 relative z-10 flex-1 min-w-0">
                {/* Avatar gato con animaciones vitales */}
                <div className="relative shrink-0">
                  {/* Glow al hablar */}
                  {isLoading && (
                    <motion.div
                      className="absolute inset-0 rounded-full"
                      animate={{
                        boxShadow: [
                          `0 0 0 0 ${skin.id === 'figaro' ? 'rgba(198,40,40,0.3)' : 'rgba(107,114,128,0.3)'}`,
                          `0 0 0 12px ${skin.id === 'figaro' ? 'rgba(198,40,40,0)' : 'rgba(107,114,128,0)'}`,
                        ],
                      }}
                      transition={{ repeat: Infinity, duration: 1.5 }}
                    />
                  )}
                  {/* Gato con respiración y flotación */}
                  <motion.div
                    animate={{
                      y: skin.id === 'chilitit' ? [-2, 4, -2] : [-3, 3, -3],
                      rotate: skin.id === 'chilitit' ? [-2, 3, -2] : [-1, 1, -1],
                      scale: isLoading ? [1, 1.02, 1] : [1, 1.005, 1],
                    }}
                    transition={{
                      repeat: Infinity,
                      duration: skin.id === 'chilitit' ? 2.5 : 3.5,
                      ease: 'easeInOut',
                    }}
                  >
                    <img
                      src={mascotaFrontal}
                      alt={skin.name}
                      className="w-10 h-10 sm:w-14 sm:h-14 object-contain drop-shadow-lg"
                      style={{
                        filter: (skin.filterStyle?.filter || '') + ' drop-shadow(0 4px 8px rgba(0,0,0,0.25))',
                      }}
                    />
                  </motion.div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-black text-base sm:text-xl leading-tight truncate">{skin.name}</h3>
                    {skin.id === 'figaro'
                      ? <Sparkles size={14} className="text-yellow-300 shrink-0" />
                      : <Zap size={14} className="text-gray-300 shrink-0" />}
                  </div>
                  <p className="text-[9px] sm:text-[10px] uppercase tracking-widest opacity-80 font-bold leading-tight truncate">
                    {skin.subtitle}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 sm:gap-2 relative z-10 shrink-0">
                {/* Full screen toggle (mobile) */}
                <button
                  onClick={toggleFullScreen}
                  className="p-1.5 hover:bg-white/20 rounded-full transition-colors sm:hidden"
                  title={isFullScreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
                >
                  {isFullScreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                </button>

                {/* Toggle skin */}
                <button
                  onClick={toggleSkin}
                  title={skin.id === 'figaro' ? 'Cambiar a Chilitit(AI)' : 'Cambiar a Fígaro'}
                  className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider px-1.5 sm:px-2 py-1 rounded-xl bg-white/20 hover:bg-white/30 transition-colors whitespace-nowrap"
                >
                  {skin.id === 'figaro' ? '😶' : '😼'}
                </button>

                {/* Limpiar chat */}
                <button
                  onClick={handleClearChat}
                  className="p-1.5 hover:bg-white/20 rounded-full transition-colors"
                  title="Limpiar conversación"
                >
                  <RefreshCw size={14} />
                </button>

                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 hover:bg-white/20 rounded-full transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* ── ERROR BANNER ──────────────────────────────────────────── */}
            <AnimatePresence>
              {errorState && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden shrink-0"
                >
                  <div className="flex items-center gap-2 p-2.5 bg-red-50 border-b border-red-200 text-red-700 text-xs font-medium">
                    {errorState === 'network' ? (
                      <><WifiOff size={14} className="shrink-0" /> Sin conexión al servidor</>
                    ) : errorState === 'timeout' ? (
                      <><AlertTriangle size={14} className="shrink-0" /> Tiempo de espera agotado</>
                    ) : (
                      <><AlertTriangle size={14} className="shrink-0" /> Error al procesar respuesta</>
                    )}
                    <button
                      onClick={handleRetry}
                      className="ml-auto px-2.5 py-1 bg-red-100 hover:bg-red-200 rounded-lg font-bold text-[10px] uppercase transition-colors flex items-center gap-1"
                    >
                      <RefreshCw size={12} /> Reintentar
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── MESSAGES ───────────────────────────────────────────────── */}
            <div
              ref={chatContainerRef}
              className="flex-1 overflow-y-auto p-3 sm:p-4 flex flex-col gap-2 sm:gap-3 custom-scrollbar"
              style={{
                background: skin.id === 'chilitit'
                  ? 'linear-gradient(to bottom, #f3f4f6, #ffffff)'
                  : 'linear-gradient(to bottom, #f8f9fa, #ffffff)',
              }}
            >
              {messages.filter(msg => (msg.role === 'user' || msg.role === 'assistant') && msg.content).map((msg, i) => {
                const isUser = msg.role === 'user';
                const bubbleClass = skin[isUser ? 'bubbleUser' : 'bubbleAI'];

                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: isUser ? 20 : -20, y: 6 }}
                    animate={{
                      opacity: 1,
                      x: 0,
                      y: 0,
                      // Si es ChilitAI, animación caótica en las burbujas de AI
                      rotate: skin.isChaotic && !isUser ? [0, 0.5, -0.5, 0] : 0,
                    }}
                    transition={{
                      type: 'spring',
                      stiffness: skin.isChaotic ? 150 : 300,
                      damping: skin.isChaotic ? 15 : 25,
                    }}
                    className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[90%] sm:max-w-[85%] p-3 sm:p-3.5 rounded-2xl text-sm shadow-sm ${bubbleClass}`}
                    >
                      {renderText(msg.content)}
                    </div>
                  </motion.div>
                );
              })}

              {/* ── ChilitAI Thinking ────────────────────────────────────── */}
              {chilitaiThinking && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{
                    opacity: 1,
                    x: 0,
                    rotate: [0, 1, -1, 0], // Temblor característico
                  }}
                  transition={{ rotate: { repeat: Infinity, duration: 0.3 } }}
                  className="flex justify-start"
                >
                  <div className="bg-gray-100 border border-gray-300 p-3 rounded-2xl rounded-bl-sm shadow-sm flex items-center gap-2">
                    <span className="text-[10px] text-gray-500 font-bold animate-pulse">
                      Procesando...
                    </span>
                    {[0, 0.2, 0.4].map((delay, i) => (
                      <motion.div
                        key={i}
                        animate={{
                          y: [0, -6, 0],
                          opacity: [0.4, 1, 0.4],
                          scale: [1, 0.7, 1],
                        }}
                        transition={{ repeat: Infinity, duration: 0.8, delay }}
                        className={`w-1.5 h-1.5 rounded-full bg-gray-400`}
                      />
                    ))}
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* ── INPUT ──────────────────────────────────────────────────── */}
            <form
              onSubmit={handleSend}
              className="p-2.5 sm:p-3 bg-white border-t border-slate-100 flex gap-2 items-center shadow-[0_-8px_20px_rgba(0,0,0,0.04)] shrink-0"
            >
              {/* Micrófono */}
              <button
                type="button"
                onClick={toggleMic}
                title={isListening ? 'Detener grabación' : 'Hablar'}
                className={`p-2 sm:p-2.5 rounded-xl transition-all shrink-0 ${
                  isListening
                    ? 'bg-red-500 text-white animate-pulse'
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}
              >
                {isListening ? <MicOff size={16} /> : <Mic size={16} />}
              </button>

              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={skin.placeholder}
                className={`flex-1 bg-slate-100 rounded-2xl px-4 py-2.5 text-sm outline-none focus:ring-2 ${skin.inputFocus} transition-all font-medium`}
                disabled={isLoading}
              />

              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className={`${skin.btn} text-white p-2 sm:p-2.5 rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center shrink-0`}
              >
                <Send size={16} />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Botón flotante ────────────────────────────────────────────────── */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.94 }}
            onClick={() => setIsOpen(true)}
            className="relative flex items-end justify-center"
            style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
            title={`Abrir ${skin.name}`}
          >
            {/* Halo pulsante */}
            <motion.div
              animate={{ scale: [1, 1.25, 1], opacity: [0.4, 0, 0.4] }}
              transition={{ repeat: Infinity, duration: 2.4, ease: 'easeInOut' }}
              className={`absolute bottom-1 sm:bottom-2 left-1/2 -translate-x-1/2 w-8 sm:w-10 h-3 sm:h-4 rounded-full ${
                skin.id === 'figaro' ? 'bg-brand' : 'bg-gray-500'
              }`}
              style={{ filter: 'blur(6px)' }}
            />

            {/* El gato con animación vital */}
            <motion.div
              className="relative z-10"
              animate={{
                y: skin.id === 'chilitit' ? [-3, 6, -3] : [-4, 4, -4],
                rotate: skin.id === 'chilitit' ? [-2, 4, -2] : [-1, 1, -1],
                scale: [1, 1.015, 1],
              }}
              transition={{
                repeat: Infinity,
                duration: skin.id === 'chilitit' ? 2 : 3,
                ease: 'easeInOut',
              }}
            >
              <img
                src={mascotaFrontal}
                alt={skin.name}
                className="w-16 h-16 sm:w-20 sm:h-20 object-contain drop-shadow-xl"
                style={{
                  ...(skin.filterStyle || {}),
                  filter: (skin.filterStyle?.filter || '') + ' drop-shadow(0 8px 16px rgba(0,0,0,0.3))',
                }}
              />
            </motion.div>

            {/* Badge */}
            <div
              className={`absolute -top-1 -right-1 ${skin.badgeBg} w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center shadow-lg border-2 border-white z-20`}
            >
              {skin.badgeIcon}
            </div>

            {/* Tooltip nombre */}
            <motion.div
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              className={`absolute right-full mr-2 sm:mr-3 bottom-3 sm:bottom-4 px-2 sm:px-3 py-1 sm:py-1.5 ${
                skin.id === 'figaro' ? 'bg-brand' : 'bg-gray-700'
              } text-white text-[10px] sm:text-xs font-black rounded-xl whitespace-nowrap shadow-lg hidden sm:block`}
            >
              {skin.name}
              <div
                className={`absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-2 h-2 ${
                  skin.id === 'figaro' ? 'bg-brand' : 'bg-gray-700'
                } rotate-45`}
              />
            </motion.div>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AIAssistantWidget;
