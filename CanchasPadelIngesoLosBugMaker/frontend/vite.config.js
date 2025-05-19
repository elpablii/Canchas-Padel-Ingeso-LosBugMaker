// frontend/vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: { // <--- Añade esta sección para el proxy
    proxy: {
      // Si tus rutas de API en el backend comienzan con '/api'
      '/api': {
        target: 'http://localhost:3001', // La URL de tu servidor backend
        changeOrigin: true, // Necesario para que el backend reciba la petición como si viniera del mismo origen
        // Opcional: reescribir la ruta si es necesario (aquí no parece serlo)
        // rewrite: (path) => path.replace(/^\/api/, '') 
      }
      // Puedes añadir más reglas de proxy si tienes diferentes backends o rutas
    }
  }
})
