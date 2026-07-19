import { Plus } from 'lucide-react'

export function FAB() {
  return (
    <button
      type="button"
      aria-label="Adicionar"
      className="fixed bottom-10 left-1/2 z-20 flex h-14 w-14 -translate-x-1/2 items-center justify-center rounded-full bg-brand-500 text-white shadow-[0_0_20px_var(--color-brand-glow)] transition-all duration-200 hover:bg-brand-600"
    >
      <Plus size={28} />
    </button>
  )
}
