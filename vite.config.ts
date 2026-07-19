import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  // NOTE: publicado como project page no GitHub Pages
  // (rafanunesran.github.io/PobreConsceinte/), não na raiz do domínio —
  // por isso o base só é diferente de "/" no build de produção.
  base: command === 'build' ? '/PobreConsceinte/' : '/',
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg'],
      manifest: {
        name: 'Pobre Consceinte',
        short_name: 'Pobre Consceinte',
        description: 'Controle financeiro pessoal',
        lang: 'pt-BR',
        theme_color: '#10B981',
        background_color: '#0A0A0B',
        display: 'standalone',
        // NOTE: sem start_url/scope explícitos — o plugin usa `base` como
        // padrão, o que já resolve certo tanto local quanto no GitHub Pages.
        icons: [
          { src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
          { src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'maskable' },
        ],
      },
    }),
  ],
}))
