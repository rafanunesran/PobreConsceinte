import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowDownCircle, ArrowLeftRight, ArrowUpCircle, ClipboardCheck } from 'lucide-react'
import { useWorkspaceStore } from '../../stores/workspaceStore'
import { useTransactions } from './useTransactions'
import { useCards } from '../cards/useCards'
import { PendingTransactionsGrid } from './PendingTransactionsGrid'
import { BalanceteCard } from './BalanceteCard'
import { currentYearMonth } from './dateUtils'
import { MonthSelector } from '../../components/ui/MonthSelector'
import { Button } from '../../components/ui/Button'

export function RegistroChooserPage() {
  const workspaceId = useWorkspaceStore((state) => state.workspaceId)
  const { transactions } = useTransactions(workspaceId ?? '')
  const { cards } = useCards(workspaceId ?? '')
  const cardsById = useMemo(() => new Map(cards.map((c) => [c.id, c])), [cards])
  const [selectedMonth, setSelectedMonth] = useState(currentYearMonth())

  return (
    <div className="flex flex-col gap-6 px-6 pt-4">
      <h1 className="text-xl font-semibold text-light-primary dark:text-dark-primary">
        Novo registro
      </h1>

      <MonthSelector value={selectedMonth} onChange={setSelectedMonth} />

      <div className="grid grid-cols-3 gap-3">
        <Link
          to="/registros/despesa/nova"
          className="flex flex-col items-center gap-2 rounded-2xl border border-border-light bg-surface-light p-4 text-center transition-colors duration-200 hover:border-brand-500 dark:border-border-dark dark:bg-surface-dark-elevated"
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-danger/10 text-danger">
            <ArrowDownCircle size={24} />
          </span>
          <div>
            <p className="font-medium text-light-primary dark:text-dark-primary">Nova despesa</p>
            <p className="text-xs text-light-secondary dark:text-dark-secondary">
              Conta ou cartão
            </p>
          </div>
        </Link>

        <Link
          to="/registros/receita/nova"
          className="flex flex-col items-center gap-2 rounded-2xl border border-border-light bg-surface-light p-4 text-center transition-colors duration-200 hover:border-brand-500 dark:border-border-dark dark:bg-surface-dark-elevated"
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-500/10 text-brand-500">
            <ArrowUpCircle size={24} />
          </span>
          <div>
            <p className="font-medium text-light-primary dark:text-dark-primary">Nova receita</p>
            <p className="text-xs text-light-secondary dark:text-dark-secondary">
              Vinculada a conta
            </p>
          </div>
        </Link>

        <Link
          to="/contas/transferir"
          className="flex flex-col items-center gap-2 rounded-2xl border border-border-light bg-surface-light p-4 text-center transition-colors duration-200 hover:border-brand-500 dark:border-border-dark dark:bg-surface-dark-elevated"
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-violet-500/10 text-violet-500">
            <ArrowLeftRight size={24} />
          </span>
          <div>
            <p className="font-medium text-light-primary dark:text-dark-primary">Transferência</p>
            <p className="text-xs text-light-secondary dark:text-dark-secondary">
              Entre suas contas
            </p>
          </div>
        </Link>
      </div>

      <BalanceteCard transactions={transactions} selectedMonth={selectedMonth} cardsById={cardsById} />

      <PendingTransactionsGrid
        uid={workspaceId ?? ''}
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
