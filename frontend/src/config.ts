export const config = {
  apiUrl: process.env.REACT_APP_API_URL || 'http://localhost:8000',
  deepgramApiKey: process.env.REACT_APP_DEEPGRAM_API_KEY,
  endpoints: {
    transcribe: '/api/transcribe',
    generateSoap: '/api/generate-soap',
  },
} as const; 