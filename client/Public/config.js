// client/public/config.js
window.API_BASE = location.hostname.includes('localhost')
  ? 'http://localhost:5050'       // saat develop
  : 'https://YOUR-railway-app.up.railway.app';  // ganti setelah Railway live