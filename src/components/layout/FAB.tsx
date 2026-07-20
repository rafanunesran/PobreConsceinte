import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'

export function FAB() {
  return (
    <Link
      to="/registros/novo"
      aria-label="Adicionar"
      className="fixed bottom-20 left-1/2 z-20 flex h-14 w-14 -translate-x-1/2 items-center justify-center rounded-full bg-brand-500 text-white shadow-[0_0_20px_var(--color-brand-glow)] transition-all duration-200 hover:bg-brand-600 lg:bottom-8 lg:left-auto lg:right-8 lg:translate-x-0"
    >
      <Plus size={28} />
    </Link>
  )
}
