import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ArrowDownCircle, ArrowLeft, ArrowUpCircle, LineChart } from 'lucide-react'
import { useAuthStore } from '../../stores/authStore'
import { useWorkspaceStore } from '../../stores/workspaceStore'
import { useAccounts } from '../accounts/useAccounts'
import { useTransactions } from './useTransactions'
import { buildBalanceHistory } from './balanceHistory'
import { BalanceChart } from './BalanceChart'
import { Card } from '../../components/ui/Card'
import { cn, formatBRL } from '../../lib/utils'

function displayDate(date: string): string {
  return format(new Date(`${date}T00:00:00`), "d 'de' MMM, yyyy", { locale: ptBR })
}

export function BalanceHistoryPage() {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const workspaceId = useWorkspaceStore((state) => state.workspaceId)
  const { accounts, loading } = useAccounts(workspaceId ?? '')
  const { transactions } = useTransactions(workspaceId ?? '')

  const history = useMemo(() => buildBalanceHistory(transactions, accounts), [transactions, accounts])

  if (!user || !workspaceId) return null

  return (
    <div className="flex flex-col gap-6 px-6 pt-4">
      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label="Voltar"
          onClick={() => navigate('/')}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-border-light text-light-secondary transition-colors duration-200 hover:text-light-primary dark:border-border-dark dark:text-dark-secondary dark:hover:text-dark-primary"
        >
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-xl font-semibold text-light-primary dark:text-dark-primary">Saldo atual</h1>
      </div>

      <section className="rounded-2xl border border-border-light bg-surface-light p-6 dark:border-border-dark dark:bg-gradient-to-b dark:from-surface-dark dark:to-surface-dark-elevated">
        <p className="text-sm text-light-secondary dark:text-dark-secondary">Saldo atual</p>
        <p className="mt-2 text-3xl font-semibold text-light-primary dark:text-dark-primary">
          {loading ? '···' : formatBRL(history.currentTotal)}
        </p>
        <p className="mt-1 text-sm text-light-secondary dark:text-dark-secondary">
          Soma das contas que entram no total
        </p>
      </section>

      {history.series.length >= 2 ? (
        <Card className="flex flex-col gap-3">
          <p className="text-sm font-medium text-light-primary dark:text-dark-primary">
            Evolução do saldo
          </p>
          <BalanceChart series={history.series} />
        </Card>
      ) : null}

      <div className="flex flex-col gap-3">
        <p className="text-sm font-medium text-light-primary dark:text-dark-primary">Movimentações</p>
        {history.movements.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border-light py-16 text-center dark:border-border-dark">
            <LineChart size={32} className="text-light-secondary dark:text-dark-secondary" />
            <p className="text-sm text-light-secondary dark:text-dark-secondary">
              Nenhuma movimentação registrada ainda.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {history.movements.map((m) => {
              const positive = m.effect >= 0
              const Icon = positive ? ArrowUpCircle : ArrowDownCircle
              return (
                <Card key={m.id} className="flex items-center gap-3 p-3">
                  <span
                    className={cn(
                      'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                      positive ? 'bg-brand-500/10 text-brand-500' : 'bg-danger/10 text-danger',
                    )}
                  >
                    <Icon size={14} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-light-primary dark:text-dark-primary">
                      {m.description}
                    </p>
                    <p className="truncate text-xs text-light-secondary dark:text-dark-secondary">
                      {displayDate(m.date)}
                      {m.accountName ? ` · ${m.accountName}` : ''}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className={cn('text-sm font-semibold', positive ? 'text-brand-500' : 'text-danger')}>
                      {positive ? '+' : '-'}
                      {formatBRL(m.amount)}
                    </p>
                    <p className="text-xs text-light-secondary dark:text-dark-secondary">
                      Saldo: {formatBRL(m.balanceAfter)}
                    </p>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
