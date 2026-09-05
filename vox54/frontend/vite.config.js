import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    fs: {
      // El nombre real de la carpeta del repo tiene espacios (Windows) — el
      // launcher local de este proyecto arranca el server con el cwd resuelto
      // vía su alias corto 8.3 para evitar problemas de quoting al invocar
      // npm/cmd, así que hace falta declarar ambas formas acá o Vite rechaza
      // servir el propio index.html por quedar "fuera de la allow list".
      allow: [
        'C:/SOLANG~1/PROYEC~1/vox54/frontend',
        'C:/SOLANGE RESPALDOS/PROYECTO_SOL GIT RESPALDO/vox54/frontend',
      ],
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
    globals: true,
  },
})
