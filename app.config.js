// app.config.js
export default {
  name: 'Krishiva',
  slug: 'krishiva',
  version: '1.0.0',
  orientation: 'portrait',
  extra: {
    apiUrl: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001',
  },
  // ... other config
}
