import request from './api';

export const aiAPI = {
  chat: ({ message, history = [] }) =>
    request('/api/v1/ai/chat', {
      method: 'POST',
      body: JSON.stringify({ message, history }),
    }),

  analyzeDocument: (data) =>
    request('/api/v1/ai/analyze-document', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  moderateImage: (imageUrl) =>
    request('/api/v1/ai/moderate-image', {
      method: 'POST',
      body: JSON.stringify({ image_url: imageUrl }),
    }),

  analyzeReclamation: (data) =>
    request('/api/v1/ai/analyze-reclamation', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  /* ── Toxicity Content Moderation ──────────────────────────── */

  /**
   * Analyze plain text for toxicity.
   * POST /api/v1/ai/toxic/text  { text: string }
   */
  analyzeText: (text) => {
    const formData = new FormData();
    formData.append('text', text);
    return request('/api/v1/ai/toxic/text', {
      method: 'POST',
      body: JSON.stringify({ text }),
    });
  },

  /**
   * Analyze an image file for toxic content (OCR + analysis).
   * POST /api/v1/ai/toxic/image  multipart/form-data  field: file
   */
  analyzeImage: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return request('/api/v1/ai/toxic/image', {
      method: 'POST',
      body: formData,
    });
  },

  /**
   * Analyze a PDF file for toxic content (extract + analysis).
   * POST /api/v1/ai/toxic/pdf  multipart/form-data  field: file
   */
  analyzePDF: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return request('/api/v1/ai/toxic/pdf', {
      method: 'POST',
      body: formData,
    });
  },
};

export default aiAPI;