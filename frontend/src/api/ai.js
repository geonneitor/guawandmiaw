import { api } from './client';

// ─── Retry helper con exponential backoff ────────────────────────────────────
async function withRetry(fn, maxRetries = 2, baseDelay = 1000) {
  let lastError;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt);
        console.warn(`[AI Retry] Intento ${attempt + 1} falló, reintentando en ${delay}ms...`);
        await new Promise(r => setTimeout(r, delay));
      }
    }
  }
  throw lastError;
}

export const aiApi = {
  /**
   * Envía un mensaje al asistente IA.
   * @param {Array} messages - Historial de mensajes.
   * @param {Object} context - Contexto de la app (path, cart, etc).
   * @param {string} skin - 'figaro' | 'chilitit'
   * @param {Object} user - Información del usuario { name, role }
   */
  sendMessage: async (messages, context, skin = 'figaro', user = {}) => {
    return await withRetry(
      () => api.post('/ai/chat', {
        messages,
        context,
        skin,
        user,
      }),
      2,  // max 2 retries
      800 // initial delay
    );
  }
};
