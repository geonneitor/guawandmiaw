import { api } from './client';

export const aiApi = {
  sendMessage: async (prompt) => {
    try {
      const data = await api.post('/ai/chat', { prompt });
      return { success: true, data };
    } catch (error) {
      console.error("AI Error:", error);
      return { success: false, error: 'Error processing AI chat' };
    }
  }
};
