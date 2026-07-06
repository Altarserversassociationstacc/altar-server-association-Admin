import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [
    react(), 
    tailwindcss()
  ],
  server: {
    host: 'localhost',
    // 🌐 Let Vite choose the port dynamically or fallback safely
    port: 5173, 
    strictPort: false, // 🚀 CRITICAL: Tells Vite it's okay to use 5174 if 5173 is busy
    hmr: {
      // ✅ FIXED: Removing the hardcoded port makes the WebSocket automatically
      // use the exact same port as your browser window (5173 or 5174)!
      host: 'localhost',
      protocol: 'ws'
    }
  }
});