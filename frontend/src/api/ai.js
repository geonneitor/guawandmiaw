import { api } from './client';

export const aiApi = {
  sendMessage: async (messages, context) => {
    return await api.post('/ai/chat', { messages, context });
  }
};
