import { createBrowserRouter } from 'react-router-dom'
import { ProtectedRoute } from './components/layout/ProtectedRoute'
import { AppShell } from './components/layout/AppShell'

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
          lazy: async () => {
            const { CardsPage } = await import('./features/cards/CardsPage')
            return { Component: CardsPage }
          },
        },
        {
          path: 'cartoes/novo',
          lazy: async () => {
            const { CardFormPage } = await import('./features/cards/CardFormPage')
            return { Component: CardFormPage }
          },
        },
        {
          path: 'cartoes/:cardId/editar',
          lazy: async () => {
            const { CardFormPage } = await import('./features/cards/CardFormPage')
            return { Component: CardFormPage }
          },
        },
        {
          path: 'contas',
          lazy: async () => {
            const { AccountsPage } = await import('./features/accounts/AccountsPage')
            return { Component: AccountsPage }
          },
        },
        {
          path: 'contas/nova',
          lazy: async () => {
            const { AccountFormPage } = await import('./features/accounts/AccountFormPage')
            return { Component: AccountFormPage }
          },
        },
        {
          path: 'contas/:accountId/editar',
          lazy: async () => {
            const { AccountFormPage } = await import('./features/accounts/AccountFormPage')
            return { Component: AccountFormPage }
          },
        },
        {
          path: 'categorias',
          lazy: async () => {
            const { CategoriesPage } = await import('./features/categories/CategoriesPage')
            return { Component: CategoriesPage }
          },
        },
        {
          path: 'categorias/nova',
          lazy: async () => {
            const { CategoryFormPage } = await import('./features/categories/CategoryFormPage')
            return { Component: CategoryFormPage }
          },
        },
        {
          path: 'categorias/:categoryId/editar',
          lazy: async () => {
            const { CategoryFormPage } = await import('./features/categories/CategoryFormPage')
            return { Component: CategoryFormPage }
          },
        },
        {
          path: 'registros',
          lazy: async () => {
            const { RegistrosPage } = await import('./features/transactions/RegistrosPage')
            return { Component: RegistrosPage }
          },
        },
        {
          path: 'registros/novo',
          lazy: async () => {
            const { RegistroChooserPage } = await import('./features/transactions/RegistroChooserPage')
            return { Component: RegistroChooserPage }
          },
        },
        {
          path: 'registros/:kind/nova',
          lazy: async () => {
            const { TransactionFormPage } = await import('./features/transactions/TransactionFormPage')
            return { Component: TransactionFormPage }
          },
        },
        {
          path: 'registros/:kind/:transactionId/editar',
          lazy: async () => {
            const { TransactionFormPage } = await import('./features/transactions/TransactionFormPage')
            return { Component: TransactionFormPage }
          },
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
