import { defineConfig } from 'vite';
export default defineConfig({
  // Antes todo iba en un solo HTML de ~10 MB (las imágenes en base64): la gente se iba mientras cargaba.
  // Ahora el HTML y el código bajan primero (~1 MB) y cada imagen es su propio archivo (con caché larga y sin internet por sw.js).
  build: { chunkSizeWarningLimit: 5000, target: 'es2020' },
});
