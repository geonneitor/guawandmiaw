const API_URL = import.meta.env.VITE_API_URL || '';

export const aiApi = {
  sendMessage: async (prompt) => {
    const response = await fetch(`${API_URL}/api/v1/ai/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ prompt })
    });
    return await response.json();
  }
};
