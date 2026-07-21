import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '';

export const aiApi = {
  sendMessage: async (prompt) => {
    const response = await axios.post(`${API_URL}/api/v1/ai/chat`, { prompt }, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    return response.data;
  }
};
