import { useMemo, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ArrowLeft } from 'lucide-react'
import { useAuthStore } from '../../stores/authStore'
import { useWorkspaceStore } from '../../stores/workspaceStore'
import { useCards } from './useCards'
import { useTransactions } from '../transactions/useTransactions'
import { useCategories } from '../categories/useCategories'
import { getInvoicePeriod, shiftInvoicePeriod, todayDateString, transactionsInPeriod } from './invoiceUtils'
import { markCardTransactionsUnpaid } from './fixImportedInvoice'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { cn, formatBRL } from '../../lib/utils'

function formatDisplayDate(date: string): string {
  return format(new Date(`${date}T00:00:00`), "d 'de' MMM", { locale: ptBR })
}

export function FixImportedInvoicePage() {
  const navigate = useNavigate()
  const { cardId } = useParams<{ cardId: string }>()
  const [searchParams] = useSearchParams()
  const periodOffset = Number(searchParams.get('offset')) || 0
  const user = useAuthStore((state) => state.user)
  const workspaceId = useWorkspaceStore((state) => state.workspaceId)

  const { cards, loading: loadingCards } = useCards(workspaceId ?? '')
  const { transactions, loading: loadingTransactions } = useTransactions(workspaceId ?? '')
  const { categories } = useCategories(workspaceId ?? '')

  const card = cards.find((c) => c.id === cardId)

  const period = useMemo(() => {
    if (!card) return null
    const openPeriod = getInvoicePeriod(card.closingDay, todayDateString())
    return shiftInvoicePeriod(card.closingDay, openPeriod, periodOffset)
  }, [card, periodOffset])

  const paidInPeriod = useMemo(() => {
    if (!card || !period) return []
    return transactionsInPeriod(transactions, card.id, period)
      .filter((t) => t.paid)
      .sort((a, b) => (a.date < b.date ? 1 : -1))
  }, [card, period, transactions])

  const categoriesById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories])

  const [selected, setSelected] = useState<Set<string>>(() => new Set(paidInPeriod.map((t) => t.id)))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function toggle(id: string) {
    setSelected((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function handleConfirm() {
    if (!user || !workspaceId || !card) return
    setSaving(true)
    setError(null)
    try {
      await markCardTransactionsUnpaid(workspaceId, Array.from(selected))
      navigate(`/cartoes/${card.id}/fatura?offset=${periodOffset}`)
    } catch {
      setError('Não foi possível corrigir os lançamentos. Tente novamente.')
      setSaving(false)
    }
  }

  const loading = loadingCards || loadingTransactions

  if (!user || !workspaceId) return null

  if (!loading && !card) {
    navigate('/cartoes', { replace: true })
    return null
  }

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
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-xl font-semibold text-light-primary dark:text-dark-primary">
            Corrigir cobranças pagas por engano
          </h1>
          {card ? (
            <p className="text-sm text-light-secondary dark:text-dark-secondary">
              {card.name}
              {period ? ` · ${formatDisplayDate(period.start)} até ${formatDisplayDate(period.end)}` : ''}
            </p>
          ) : null}
        </div>
      </div>

      {loading ? (
        <div className="h-40 animate-pulse rounded-2xl border border-border-light bg-surface-light dark:border-border-dark dark:bg-surface-dark-elevated" />
      ) : paidInPeriod.length === 0 ? (
        <p className="text-sm text-light-secondary dark:text-dark-secondary">
          Nenhuma cobrança marcada como paga nesta fatura — nada pra corrigir aqui.
        </p>
      ) : (
        <>
          <p className="text-sm text-light-secondary dark:text-dark-secondary">
            Estas cobranças estão marcadas como pagas e por isso não entram no total da fatura.
            Desmarque qualquer uma que já estivesse paga de verdade (não por causa da importação)
            antes de confirmar.
          </p>

          <div className="flex flex-col gap-2">
            {paidInPeriod.map((t) => (
              <Card key={t.id} className="flex items-center gap-3 p-3">
                <input
                  type="checkbox"
                  aria-label="Selecionar"
                  checked={selected.has(t.id)}
                  onChange={() => toggle(t.id)}
                  className="h-4 w-4 shrink-0 accent-brand-500"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-light-primary dark:text-dark-primary">
                    {t.description}
                  </p>
                  <p className="text-xs text-light-secondary dark:text-dark-secondary">
                    {formatDisplayDate(t.date)}
                    {categoriesById.get(t.categoryId) ? ` · ${categoriesById.get(t.categoryId)!.name}` : ''}
                  </p>
                </div>
                <p
                  className={cn(
                    'shrink-0 text-sm font-semibold',
                    t.type === 'expense' ? 'text-danger' : 'text-brand-500',
                  )}
                >
                  {t.type === 'expense' ? '-' : '+'}
                  {formatBRL(t.amount)}
                </p>
              </Card>
            ))}
          </div>

          {error ? <p className="text-sm text-danger">{error}</p> : null}

          <Button type="button" onClick={handleConfirm} disabled={saving || selected.size === 0}>
            {saving ? 'Corrigindo...' : `Marcar ${selected.size} como não pago(s)`}
          </Button>
        </>
      )}
    </div>
  )
}
