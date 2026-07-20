import { useState } from 'react'
import { Link } from 'react-router-dom'
import { FileText, MoreHorizontal, Plus, Receipt } from 'lucide-react'
import { useAuthStore } from '../../stores/authStore'
import { useAccounts } from '../accounts/useAccounts'
import { useTransactions } from '../transactions/useTransactions'
import { BalanceteCard } from '../transactions/BalanceteCard'
import { currentYearMonth } from '../transactions/dateUtils'
import { MonthSelector } from '../../components/ui/MonthSelector'
import { formatBRL } from '../../lib/utils'

const quickActions = [
  { label: 'Adicionar', icon: Plus, to: '/registros/novo' },
  { label: 'Fatura', icon: FileText, to: '/cartoes' },
  { label: 'Extrato', icon: Receipt, to: '/registros' },
  { label: 'Mais', icon: MoreHorizontal, to: '/perfil' },
] as const

export function HomePage() {
  const user = useAuthStore((state) => state.user)
  const { accounts, loading } = useAccounts(user?.uid ?? '')
  const { transactions } = useTransactions(user?.uid ?? '')
  const [selectedMonth, setSelectedMonth] = useState(currentYearMonth())

  if (!user) return null

  const totalBalance = accounts.reduce((sum, account) => sum + account.balance, 0)

  return (
    <div className="flex flex-col gap-6 px-6 pt-4">
      <section className="rounded-2xl border border-border-light bg-surface-light p-6 dark:border-border-dark dark:bg-gradient-to-b dark:from-surface-dark dark:to-surface-dark-elevated">
        <p className="text-sm text-light-secondary dark:text-dark-secondary">Saldo total</p>
        <p className="mt-2 text-3xl font-semibold text-light-primary dark:text-dark-primary">
          {loading ? '···' : formatBRL(totalBalance)}
        </p>
        <p className="mt-1 text-sm text-light-secondary dark:text-dark-secondary">
          {accounts.length === 0 ? 'Nenhuma conta conectada ainda' : `${accounts.length} conta(s)`}
        </p>
      </section>

      <section className="flex justify-between">
        {quickActions.map(({ label, icon: Icon, to }) => (
          <Link key={label} to={to} className="flex flex-col items-center gap-2">
            <span className="flex h-14 w-14 items-center justify-center rounded-full border border-border-light bg-surface-light text-brand-500 transition-all duration-200 hover:shadow-[0_0_20px_var(--color-brand-glow)] dark:border-border-dark dark:bg-surface-dark-elevated">
              <Icon size={24} />
            </span>
            <span className="text-xs text-light-secondary dark:text-dark-secondary">{label}</span>
          </Link>
        ))}
      </section>

      <MonthSelector value={selectedMonth} onChange={setSelectedMonth} />

      <BalanceteCard transactions={transactions} selectedMonth={selectedMonth} />
    </div>
  )
}
