import { CreditCard, Home, Receipt, User, Wallet, type LucideIcon } from 'lucide-react'

export interface NavItem {
  to: string
  label: string
  icon: LucideIcon
  end: boolean
}

// NOTE: compartilhado por BottomNav (mobile) e Sidebar (desktop) pra não
// duplicar a lista de rotas em dois lugares que podem desalinhar.
export const navItems: NavItem[] = [
  { to: '/', label: 'Home', icon: Home, end: true },
  { to: '/cartoes', label: 'Cartões', icon: CreditCard, end: false },
  { to: '/contas', label: 'Contas', icon: Wallet, end: false },
  { to: '/registros/novo', label: 'Extrato', icon: Receipt, end: false },
  { to: '/perfil', label: 'Perfil', icon: User, end: false },
]
