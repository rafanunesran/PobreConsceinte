import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, CheckCircle2 } from 'lucide-react'
import { useAuthStore } from '../../stores/authStore'
import { useWorkspaceStore } from '../../stores/workspaceStore'
import { useTransactions } from './useTransactions'
import { PendingTransactionsGrid } from './PendingTransactionsGrid'
import { MonthSelector } from '../../components/ui/MonthSelector'
import { currentYearMonth } from './dateUtils'
import { Button } from '../../components/ui/Button'

export function PendingTransactionsPage() {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const workspaceId = useWorkspaceStore((state) => state.workspaceId)
  const { transactions, loading, error } = useTransactions(workspaceId ?? '')
  const [selectedMonth, setSelectedMonth] = useState(currentYearMonth())

  if (!user || !workspaceId) return null

  const pending = transactions.filter((transaction) => !transaction.paid)

  return (
    <div className="flex flex-col gap-6 px-6 pt-4">
      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label="Voltar"
          onClick={() => navigate(-1)}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-border-light text-light-secondary transition-colors duration-200 hover:text-light-primary dark:border-border-dark dark:text-dark-secondary dark:hover:text-dark-primary"
        >
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-xl font-semibold text-light-primary dark:text-dark-primary">
          Pagamentos pendentes
        </h1>
      </div>

      {loading ? (
        <div className="flex flex-col gap-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-16 animate-pulse rounded-2xl border border-border-light bg-surface-light dark:border-border-dark dark:bg-surface-dark-elevated"
            />
          ))}
        </div>
      ) : error ? (
        <p className="text-sm text-danger">
          Não foi possível carregar seus registros. Verifique sua conexão ou tente novamente mais
          tarde.
        </p>
      ) : pending.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border-light py-16 text-center dark:border-border-dark">
          <CheckCircle2 size={32} className="text-light-secondary dark:text-dark-secondary" />
          <p className="text-sm text-light-secondary dark:text-dark-secondary">
            Nenhum pagamento ou recebimento pendente.
          </p>
          <Link to="/registros">
            <Button type="button" variant="secondary">
              Ver todos os registros
            </Button>
          </Link>
        </div>
      ) : (
        <>
          <MonthSelector value={selectedMonth} onChange={setSelectedMonth} />
          <PendingTransactionsGrid
            uid={workspaceId}
            transactions={transactions}
            selectedMonth={selectedMonth}
          />
        </>
      )}
    </div>
  )
}
