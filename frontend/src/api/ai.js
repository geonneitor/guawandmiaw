import { api } from './client';

export const aiApi = {
  sendMessage: async (prompt) => {
    return await api.post('/ai/chat', { prompt });
  }
};
