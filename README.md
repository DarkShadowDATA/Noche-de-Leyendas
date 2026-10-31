# Noche de Leyendas — DarkShadow Studios

Survivors de leyendas del mundo, empezando por México. Phaser 3 + Vite; todo el juego sale en un solo archivo `dist/index.html`.

- Compilar: `npm ci && npx vite build` → `dist/index.html` (se sube ya compilado, igual que Bloquevilla).
- Publicar: cada push a `main` se publica en Cloudflare (Worker `noche-de-leyendas`, `npx wrangler deploy`) en https://leyendas.darkshadow-studios.com
- Código: `src/main.js` (juego), `src/data.js` (cazadores, armas, objetos, enemigos, tiempos de jefes), `index.html` (interfaz).
- Imágenes: originales de ChatGPT en `art_src/`, versiones del juego en `src/img/*.webp`.
- Pruebas: `?go=<cazador>` entra directo; `&auto` se mueve solo; `&god` no recibe daño; `&t=<segundos>` empieza en ese minuto; `&speed=4` acelera.
- Documento de diseño: https://claude.ai/artifact/CdNMkNavQTmvdcGmDXwzme
