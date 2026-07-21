import { api } from './client';

export const aiApi = {
  sendMessage: async (messages) => {
    return await api.post('/ai/chat', { messages });
  }
};
