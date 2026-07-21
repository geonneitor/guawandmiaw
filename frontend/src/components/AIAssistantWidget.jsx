import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Sparkles } from 'lucide-react';
import logoGato from '../assets/logo.png';
import { aiApi } from '../api/ai';

const AIAssistantWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', text: '¡Hola! Soy Miaw AI 🐾. Estoy conectado a la base de datos de tu tienda. ¿En qué te puedo ayudar hoy?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsLoading(true);

    try {
      const response = await aiApi.sendMessage(userMessage);
      if (response.success) {
        setMessages(prev => [...prev, { role: 'assistant', text: response.data.reply }]);
      } else {
        setMessages(prev => [...prev, { role: 'assistant', text: `Ups: ${response.error || 'Algo salió mal.'}` }]);
      }
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', text: 'Error de conexión con mis servidores gatunos. Verifica tu API Key o conexión a internet.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end">
      {/* Ventana del Chat */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9, transformOrigin: 'bottom right' }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="mb-4 w-[90vw] sm:w-96 bg-white/90 backdrop-blur-xl border border-white/40 shadow-2xl rounded-3xl overflow-hidden flex flex-col"
            style={{ height: '550px', maxHeight: '80vh' }}
          >
            {/* Header */}
            <div className="bg-brand text-white p-4 flex items-center justify-between shadow-md relative overflow-hidden">
              <div className="flex items-center gap-3 relative z-10">
                <motion.div
                  animate={{ y: [-2, 2, -2] }}
                  transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                  className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-inner overflow-hidden p-1 border-2 border-white/20"
                >
                  <img src={logoGato} alt="Miaw AI" className="w-full h-full object-contain" />
                </motion.div>
                <div>
                  <h3 className="font-black text-xl leading-tight flex items-center gap-1">
                    Miaw AI <Sparkles size={16} className="text-yellow-300" />
                  </h3>
                  <p className="text-xs uppercase tracking-widest opacity-90 font-bold">Asistente Virtual</p>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-white/20 rounded-full transition-colors relative z-10"
              >
                <X size={20} />
              </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 custom-scrollbar bg-slate-50/50">
              {messages.map((msg, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, x: msg.role === 'user' ? 20 : -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div 
                    className={`max-w-[85%] p-4 rounded-3xl text-sm shadow-sm ${
                      msg.role === 'user' 
                        ? 'bg-brand text-white rounded-br-sm'
                        : 'bg-white border border-slate-200 text-slate-800 rounded-bl-sm'
                    }`}
                  >
                    {msg.text.split('\n').map((line, j) => {
                      // Basic markdown bold parsing for **text**
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
                    })}
                  </div>
                </motion.div>
              ))}
              
              {isLoading && (
                <motion.div 
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="flex justify-start"
                >
                  <div className="bg-white border border-slate-200 p-4 rounded-3xl rounded-bl-sm shadow-sm flex gap-2">
                    <motion.div animate={{ y: [0, -6, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0 }} className="w-2.5 h-2.5 bg-brand/50 rounded-full" />
                    <motion.div animate={{ y: [0, -6, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }} className="w-2.5 h-2.5 bg-brand/50 rounded-full" />
                    <motion.div animate={{ y: [0, -6, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }} className="w-2.5 h-2.5 bg-brand/50 rounded-full" />
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <form onSubmit={handleSend} className="p-3 bg-white border-t border-slate-100 flex gap-2 shadow-[0_-10px_20px_rgba(0,0,0,0.02)]">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Pregúntale a Miaw AI..."
                className="flex-1 bg-slate-100 rounded-2xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-brand/30 transition-all font-medium"
                disabled={isLoading}
              />
              <button 
                type="submit"
                disabled={!input.trim() || isLoading}
                className="bg-brand text-white p-3 rounded-2xl hover:bg-brand-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                <Send size={20} />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsOpen(true)}
            className="w-16 h-16 bg-brand rounded-full shadow-2xl flex items-center justify-center relative overflow-hidden group border-2 border-white"
          >
            {/* Pulsing background effect */}
            <div className="absolute inset-0 bg-white/30 animate-ping opacity-50 duration-1000"></div>
            
            <motion.div
              animate={{ y: [-2, 2, -2] }}
              transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
              className="relative z-10 w-full h-full flex items-center justify-center bg-white rounded-full p-2"
            >
               <img src={logoGato} alt="AI" className="w-full h-full object-contain" />
            </motion.div>
            
            {/* Sparkle badge */}
            <div className="absolute -top-1 -right-1 bg-yellow-400 text-yellow-900 w-6 h-6 rounded-full flex items-center justify-center shadow-lg border-2 border-white z-20">
              <Sparkles size={12} />
            </div>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AIAssistantWidget;
