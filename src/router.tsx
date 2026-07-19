import { createBrowserRouter } from 'react-router-dom'
import { ProtectedRoute } from './components/layout/ProtectedRoute'
import { AppShell } from './components/layout/AppShell'
import { PlaceholderPage } from './components/layout/PlaceholderPage'

export const router = createBrowserRouter(
  [
    {
      path: '/login',
      lazy: async () => {
        const { LoginPage } = await import('./features/auth/LoginPage')
        return { Component: LoginPage }
      },
    },
    {
      path: '/',
      element: (
        <ProtectedRoute>
          <AppShell />
        </ProtectedRoute>
      ),
      children: [
        {
          index: true,
          lazy: async () => {
            const { HomePage } = await import('./features/home/HomePage')
            return { Component: HomePage }
          },
        },
        {
          path: 'cartoes',
          element: <PlaceholderPage title="Cartões" />,
        },
        {
          path: 'contas',
          element: <PlaceholderPage title="Contas" />,
        },
        {
          path: 'perfil',
          lazy: async () => {
            const { PerfilPage } = await import('./features/auth/PerfilPage')
            return { Component: PerfilPage }
          },
        },
      ],
    },
  ],
  // NOTE: no GitHub Pages o app fica sob /PobreConsceinte/ (project page),
  // não na raiz do domínio. import.meta.env.BASE_URL reflete o `base` do
  // vite.config.ts automaticamente (dev: "/", build: "/PobreConsceinte/").
  { basename: import.meta.env.BASE_URL },
)
