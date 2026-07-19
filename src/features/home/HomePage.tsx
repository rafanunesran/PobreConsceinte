import { FileText, MoreHorizontal, Plus, Receipt } from 'lucide-react'

// NOTE: home é placeholder visual — sem dados reais de contas/transações
// (isso entra na Fase 2, junto com a integração real do Firestore).
const quickActions = [
  { label: 'Adicionar', icon: Plus },
  { label: 'Fatura', icon: FileText },
  { label: 'Extrato', icon: Receipt },
  { label: 'Mais', icon: MoreHorizontal },
] as const

export function HomePage() {
  return (
    <div className="flex flex-col gap-6 px-6 pt-4">
      <section className="rounded-2xl border border-border-light bg-surface-light p-6 dark:border-border-dark dark:bg-gradient-to-b dark:from-surface-dark dark:to-surface-dark-elevated">
        <p className="text-sm text-light-secondary dark:text-dark-secondary">Saldo total</p>
        <p className="mt-2 text-3xl font-semibold text-light-primary dark:text-dark-primary">
          R$ ••••••
        </p>
        <p className="mt-1 text-sm text-light-secondary dark:text-dark-secondary">
          Contas e cartões ainda não conectados
        </p>
      </section>

      <section className="flex justify-between">
        {quickActions.map(({ label, icon: Icon }) => (
          <button key={label} type="button" className="flex flex-col items-center gap-2">
            <span className="flex h-14 w-14 items-center justify-center rounded-full border border-border-light bg-surface-light text-brand-500 transition-all duration-200 hover:shadow-[0_0_20px_var(--color-brand-glow)] dark:border-border-dark dark:bg-surface-dark-elevated">
              <Icon size={24} />
            </span>
            <span className="text-xs text-light-secondary dark:text-dark-secondary">{label}</span>
          </button>
        ))}
      </section>
    </div>
  )
}
