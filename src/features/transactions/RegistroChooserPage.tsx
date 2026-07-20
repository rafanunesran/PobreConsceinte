import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowDownCircle, ArrowUpCircle, ClipboardCheck } from 'lucide-react'
import { useAuthStore } from '../../stores/authStore'
import { useTransactions } from './useTransactions'
import { PendingTransactionsGrid } from './PendingTransactionsGrid'
import { MonthSelector } from '../../components/ui/MonthSelector'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { cn, formatBRL } from '../../lib/utils'

function currentMonth(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

export function RegistroChooserPage() {
  const user = useAuthStore((state) => state.user)
  const { transactions } = useTransactions(user?.uid ?? '')
  const [selectedMonth, setSelectedMonth] = useState(currentMonth())

  const balancete = useMemo(() => {
    const ofMonth = transactions.filter((t) => t.date.startsWith(selectedMonth))
    const sum = (predicate: (t: (typeof ofMonth)[number]) => boolean) =>
      ofMonth.filter(predicate).reduce((acc, t) => acc + t.amount, 0)

    const recebido = sum((t) => t.type === 'income' && t.paid)
    const pago = sum((t) => t.type === 'expense' && t.paid)
    const aReceber = sum((t) => t.type === 'income' && !t.paid)
    const aPagar = sum((t) => t.type === 'expense' && !t.paid)

    return { recebido, pago, aReceber, aPagar, resultado: recebido - pago }
  }, [transactions, selectedMonth])

  return (
    <div className="flex flex-col gap-6 px-6 pt-4">
      <h1 className="text-xl font-semibold text-light-primary dark:text-dark-primary">
        Novo registro
      </h1>

      <MonthSelector value={selectedMonth} onChange={setSelectedMonth} />

      <div className="flex flex-col gap-3">
        <Link
          to="/registros/despesa/nova"
          className="flex items-center gap-4 rounded-2xl border border-border-light bg-surface-light p-4 transition-colors duration-200 hover:border-brand-500 dark:border-border-dark dark:bg-surface-dark-elevated"
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-danger/10 text-danger">
            <ArrowDownCircle size={24} />
          </span>
          <div>
            <p className="font-medium text-light-primary dark:text-dark-primary">Nova despesa</p>
            <p className="text-sm text-light-secondary dark:text-dark-secondary">
              Vinculada a uma conta ou cartão
            </p>
          </div>
        </Link>

        <Link
          to="/registros/receita/nova"
          className="flex items-center gap-4 rounded-2xl border border-border-light bg-surface-light p-4 transition-colors duration-200 hover:border-brand-500 dark:border-border-dark dark:bg-surface-dark-elevated"
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-500/10 text-brand-500">
            <ArrowUpCircle size={24} />
          </span>
          <div>
            <p className="font-medium text-light-primary dark:text-dark-primary">Nova receita</p>
            <p className="text-sm text-light-secondary dark:text-dark-secondary">
              Vinculada a uma conta
            </p>
          </div>
        </Link>
      </div>

      <Card className="flex flex-col gap-3">
        <p className="text-sm font-medium text-light-primary dark:text-dark-primary">
          Balancete do mês
        </p>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-light-secondary dark:text-dark-secondary">Recebido</p>
            <p className="font-semibold text-brand-500">{formatBRL(balancete.recebido)}</p>
          </div>
          <div>
            <p className="text-light-secondary dark:text-dark-secondary">Pago</p>
            <p className="font-semibold text-danger">{formatBRL(balancete.pago)}</p>
          </div>
          <div>
            <p className="text-light-secondary dark:text-dark-secondary">A receber</p>
            <p className="font-semibold text-light-primary dark:text-dark-primary">
              {formatBRL(balancete.aReceber)}
            </p>
          </div>
          <div>
            <p className="text-light-secondary dark:text-dark-secondary">A pagar</p>
            <p className="font-semibold text-light-primary dark:text-dark-primary">
              {formatBRL(balancete.aPagar)}
            </p>
          </div>
        </div>
        <div className="border-t border-border-light pt-3 dark:border-border-dark">
          <p className="text-light-secondary dark:text-dark-secondary">Resultado</p>
          <p
            className={cn(
              'text-lg font-semibold',
              balancete.resultado >= 0 ? 'text-brand-500' : 'text-danger',
            )}
          >
            {formatBRL(balancete.resultado)}
          </p>
        </div>
      </Card>

      <PendingTransactionsGrid
        uid={user?.uid ?? ''}
        transactions={transactions}
        selectedMonth={selectedMonth}
      />

      <Link to="/registros/pendentes">
        <Button type="button" variant="secondary" className="w-full gap-2">
          <ClipboardCheck size={18} />
          Confirmar pagamentos pendentes
        </Button>
      </Link>
    </div>
  )
}
