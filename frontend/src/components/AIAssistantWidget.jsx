import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Mic, MicOff, Sparkles, Zap } from 'lucide-react';
import mascotaFrontal from '../assets/mascota-frontal.png';
import { aiApi } from '../api/ai';
import { useCartStore } from '../store/useCartStore';
import { useNotificationStore } from '../store/useNotificationStore';
import { useNavigate } from 'react-router-dom';
// ─── Constantes de personalidad ──────────────────────────────────────────────
const FIGARO_SKIN = {
  id: 'figaro',
  name: 'Fígaro',
  subtitle: 'Asistente Virtual',
  greeting: '¡Miau! Soy Fígaro 🐾, tu asistente gatuno. Estoy conectado a la base de datos de tu tienda. ¿En qué te puedo ayudar?',
  placeholder: 'Pregúntale a Fígaro...',
  // Colores rojo-negro (los originales de la app)
  headerBg: 'bg-brand',
  headerText: 'text-white',
  bubbleUser: 'bg-brand text-white rounded-br-sm',
  bubbleAI: 'bg-white border border-slate-200 text-slate-800 rounded-bl-sm',
  btn: 'bg-brand hover:bg-brand-light',
  floatBtn: 'bg-brand border-brand/50',
  floatShadow: 'shadow-brand/30',
  badgeBg: 'bg-yellow-400 text-yellow-900',
  inputFocus: 'focus:ring-brand/30',
  filterStyle: {},          // gato a color normal
  badgeIcon: <Sparkles size={12} />,
  typing: 'bg-brand/50',
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
};

// ─── Render de texto con markdown básico ─────────────────────────────────────
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

// ─── Componente principal ────────────────────────────────────────────────────
const AIAssistantWidget = () => {
  const [skin, setSkin] = useState(FIGARO_SKIN);
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', text: FIGARO_SKIN.greeting }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);
  const navigate = useNavigate();

  // ── Scroll al fondo ───────────────────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  // ── Cambiar skin ──────────────────────────────────────────────────────────
  const toggleSkin = () => {
    const next = skin.id === 'figaro' ? CHILITIT_SKIN : FIGARO_SKIN;
    setSkin(next);
    setMessages([{ role: 'assistant', text: next.greeting }]);
  };

  // ── Enviar mensaje ────────────────────────────────────────────────────────
  const handleSend = async (e) => {
    e?.preventDefault();
    const text = input.trim();
    if (!text || isLoading) return;

    setInput('');
    const newMessages = [...messages, { role: 'user', text }];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      // Filtrar el saludo inicial si es necesario o simplemente mapear
      const apiMessages = newMessages.map(m => ({
        role: m.role,
        content: m.text
      }));
      
      const response = await aiApi.sendMessage(apiMessages);
      
      const reply = response?.data?.reply ?? response?.reply ?? null;
      if (response?.success && reply) {
        setMessages(prev => [...prev, { role: 'assistant', text: String(reply) }]);
        
        // Manejar acciones del Agente
        const actions = response?.data?.actions ?? response?.actions ?? [];
        actions.forEach(action => {
          if (action.type === 'ADD_TO_CART' && action.product) {
            useCartStore.getState().addItem(action.product, action.quantity || 1);
            
            // Notificación interactiva
            useNotificationStore.getState().addNotification(
              <div className="flex items-center gap-3">
                <div>Se agregó <strong>{action.product.name}</strong> al carrito.</div>
                <button 
                  onClick={() => navigate('/pos')}
                  className="bg-brand text-white px-3 py-1 rounded-lg text-xs font-bold hover:bg-brand-light"
                >
                  Ver Carrito
                </button>
              </div>,
              'success'
            );
          }
        });

      } else {
        const errMsg = response?.error || 'Algo salió mal.';
        setMessages(prev => [...prev, { role: 'assistant', text: `Ups: ${errMsg}` }]);
      }
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        text: 'Error de conexión con mis servidores gatunos. Verifica tu API Key o conexión.'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  // ── Micrófono (Web Speech API) ────────────────────────────────────────────
  const toggleMic = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Tu navegador no soporta reconocimiento de voz.');
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
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end">

      {/* ── Ventana del Chat ──────────────────────────────────────────────── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.92 }}
            transition={{ type: 'spring', stiffness: 340, damping: 28 }}
            className="mb-6 w-[92vw] sm:w-96 shadow-2xl rounded-3xl overflow-hidden flex flex-col border border-white/20"
            style={{ height: '560px', maxHeight: '82vh', background: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(20px)' }}
          >
            {/* Header */}
            <div className={`${skin.headerBg} ${skin.headerText} p-4 flex items-center justify-between shadow-md relative overflow-hidden`}>
              {/* Decoración fondo */}
              <div className="absolute inset-0 opacity-10 pointer-events-none"
                style={{ background: 'radial-gradient(circle at 80% 50%, white 0%, transparent 60%)' }} />

              <div className="flex items-center gap-3 relative z-10 flex-1">
                {/* Cat avatar — orgánico, sin marco */}
                <motion.div
                  animate={{ y: [-3, 3, -3], rotate: [-1, 1, -1] }}
                  transition={{ repeat: Infinity, duration: 3.5, ease: 'easeInOut' }}
                  className="shrink-0"
                  style={skin.filterStyle}
                >
                  <img
                    src={mascotaFrontal}
                    alt={skin.name}
                    className="w-14 h-14 object-contain drop-shadow-lg"
                    style={{ filter: (skin.filterStyle?.filter || '') + ' drop-shadow(0 4px 8px rgba(0,0,0,0.25))' }}
                  />
                </motion.div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-black text-xl leading-tight">{skin.name}</h3>
                    {skin.id === 'figaro'
                      ? <Sparkles size={15} className="text-yellow-300 shrink-0" />
                      : <Zap size={15} className="text-gray-300 shrink-0" />}
                  </div>
                  <p className="text-[10px] uppercase tracking-widest opacity-80 font-bold leading-tight truncate">
                    {skin.subtitle}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 relative z-10">
                {/* Toggle de skin */}
                <button
                  onClick={toggleSkin}
                  title={skin.id === 'figaro' ? 'Cambiar a Chilitit(AI)' : 'Cambiar a Fígaro'}
                  className="text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-xl bg-white/20 hover:bg-white/30 transition-colors whitespace-nowrap"
                >
                  {skin.id === 'figaro' ? '😶 Chilitit' : '😼 Fígaro'}
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-white/20 rounded-full transition-colors"
                >
                  <X size={19} />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 custom-scrollbar"
              style={{ background: 'linear-gradient(to bottom, #f8f9fa, #ffffff)' }}>
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: msg.role === 'user' ? 20 : -20, y: 6 }}
                  animate={{ opacity: 1, x: 0, y: 0 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[85%] p-3.5 rounded-2xl text-sm shadow-sm ${skin[msg.role === 'user' ? 'bubbleUser' : 'bubbleAI']}`}>
                    {renderText(msg.text)}
                  </div>
                </motion.div>
              ))}

              {/* Typing indicator */}
              {isLoading && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                  <div className="bg-white border border-slate-200 p-3.5 rounded-2xl rounded-bl-sm shadow-sm flex items-center gap-1.5">
                    {[0, 0.18, 0.36].map((delay, i) => (
                      <motion.div
                        key={i}
                        animate={{ y: [0, -5, 0] }}
                        transition={{ repeat: Infinity, duration: 0.55, delay }}
                        className={`w-2 h-2 ${skin.typing} rounded-full`}
                      />
                    ))}
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSend}
              className="p-3 bg-white border-t border-slate-100 flex gap-2 items-center shadow-[0_-8px_20px_rgba(0,0,0,0.04)]">

              {/* Micrófono */}
              <button
                type="button"
                onClick={toggleMic}
                title={isListening ? 'Detener grabación' : 'Hablar'}
                className={`p-2.5 rounded-xl transition-all shrink-0 ${
                  isListening
                    ? 'bg-red-500 text-white animate-pulse'
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}
              >
                {isListening ? <MicOff size={17} /> : <Mic size={17} />}
              </button>

              <input
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
                className={`${skin.btn} text-white p-2.5 rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center shrink-0`}
              >
                <Send size={17} />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Botón flotante — gato orgánico, sin círculo ───────────────────── */}
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
            title={`Abrir ${skin.name}`}
            style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
          >
            {/* Halo de pulsación bajo el gato */}
            <motion.div
              animate={{ scale: [1, 1.25, 1], opacity: [0.4, 0, 0.4] }}
              transition={{ repeat: Infinity, duration: 2.4, ease: 'easeInOut' }}
              className={`absolute bottom-2 left-1/2 -translate-x-1/2 w-10 h-4 rounded-full ${skin.id === 'figaro' ? 'bg-brand' : 'bg-gray-500'}`}
              style={{ filter: 'blur(6px)' }}
            />

            {/* El gato — sin marco/círculo */}
            <motion.img
              src={mascotaFrontal}
              alt={skin.name}
              animate={{ y: [-4, 4, -4] }}
              transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
              className={`relative z-10 w-20 h-20 object-contain drop-shadow-xl`}
              style={{
                ...(skin.filterStyle || {}),
                filter: (skin.filterStyle?.filter || '') + ' drop-shadow(0 8px 16px rgba(0,0,0,0.3))',
              }}
            />

            {/* Badge de notificación */}
            <div className={`absolute -top-1 -right-1 ${skin.badgeBg} w-6 h-6 rounded-full flex items-center justify-center shadow-lg border-2 border-white z-20`}>
              {skin.badgeIcon}
            </div>

            {/* Tooltip con el nombre */}
            <motion.div
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              className={`absolute right-full mr-3 bottom-4 px-3 py-1.5 ${skin.id === 'figaro' ? 'bg-brand' : 'bg-gray-700'} text-white text-xs font-black rounded-xl whitespace-nowrap shadow-lg`}
            >
              {skin.name}
              <div className={`absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-2 h-2 ${skin.id === 'figaro' ? 'bg-brand' : 'bg-gray-700'} rotate-45`} />
            </motion.div>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AIAssistantWidget;
