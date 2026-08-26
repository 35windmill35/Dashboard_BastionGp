import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  plugins: [react()],
  // GitHub Pages для project-сайта (не username.github.io, а
  // username.github.io/Dashboard_BastionGp) отдаёт файлы из подпапки —
  // без base пути к JS/CSS в index.html будут вести на несуществующий
  // /assets/... в корне домена. Условие на command, чтобы не ломать
  // локальный dev-сервер (там всё живёт на "/"). Роутинг у нас на
  // HashRouter (см. main.jsx) — сам base на маршруты не влияет, только на
  // пути статических файлов.
  base: command === 'build' ? '/Dashboard_BastionGp/' : '/',
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
}))
