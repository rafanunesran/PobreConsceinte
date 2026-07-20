import { useMemo, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAuthStore } from '../../stores/authStore'
import { useWorkspaceStore } from '../../stores/workspaceStore'
import { useCards } from './useCards'
import { useTransactions } from '../transactions/useTransactions'
import { useCategories } from '../categories/useCategories'
import { getOrCreateCategoryByName } from '../categories/api'
import { createTransaction } from '../transactions/api'
import {
  getInvoicePeriod,
  shiftInvoicePeriod,
  sumUnpaid,
  todayDateString,
  transactionsInPeriod,
} from './invoiceUtils'
import { roundToCents } from '../transactions/dateUtils'
import { adjustInvoiceSchema, type AdjustInvoiceFormData } from './schemas'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { formatBRL } from '../../lib/utils'

export function AdjustInvoicePage() {
  const navigate = useNavigate()
  const { cardId } = useParams<{ cardId: string }>()
  const [searchParams] = useSearchParams()
  const periodOffset = Number(searchParams.get('offset')) || 0
  const user = useAuthStore((state) => state.user)
  const workspaceId = useWorkspaceStore((state) => state.workspaceId)

  const { cards, loading: loadingCards } = useCards(workspaceId ?? '')
  const { transactions, loading: loadingTransactions } = useTransactions(workspaceId ?? '')
  const { categories } = useCategories(workspaceId ?? '')
  const [formError, setFormError] = useState<string | null>(null)

  const card = cards.find((c) => c.id === cardId)

  const period = useMemo(() => {
    if (!card) return null
    const openPeriod = getInvoicePeriod(card.closingDay, todayDateString())
    return shiftInvoicePeriod(card.closingDay, openPeriod, periodOffset)
  }, [card, periodOffset])

  const calculatedOwed = useMemo(() => {
    if (!card || !period) return 0
    return sumUnpaid(transactionsInPeriod(transactions, card.id, period))
  }, [card, period, transactions])

  const form = useForm<AdjustInvoiceFormData>({
    resolver: zodResolver(adjustInvoiceSchema),
    defaultValues: { realValue: 0 },
  })
  const realValue = form.watch('realValue')
  const diff = roundToCents((realValue || 0) - calculatedOwed)

  const loading = loadingCards || loadingTransactions

  if (!user || !workspaceId) return null

  if (!loading && !card) {
    navigate('/cartoes', { replace: true })
    return null
  }

  async function onSubmit(data: AdjustInvoiceFormData) {
    if (!user || !workspaceId || !card || !period) return
    setFormError(null)
    const amount = roundToCents(data.realValue - calculatedOwed)
    if (amount === 0) {
      navigate(`/cartoes/${card.id}/fatura`)
      return
    }
    const type = amount > 0 ? 'expense' : 'income'
    try {
      const categoryId = await getOrCreateCategoryByName(
        workspaceId,
        categories,
        'Outro',
        type,
        'more',
        type === 'expense' ? '#3B82F6' : '#F59E0B',
        user.uid,
      )
      await createTransaction(
        workspaceId,
        {
          type,
          amount: Math.abs(amount),
          date: period.start,
          description: 'Ajuste de fatura',
          categoryId,
          paid: false,
          cardId: card.id,
        },
        user.uid,
      )
      navigate(`/cartoes/${card.id}/fatura`)
    } catch {
      setFormError('Não foi possível criar o ajuste. Tente novamente.')
    }
  }

  if (loading || !card) {
    return (
      <div className="px-6 pt-4 text-sm text-light-secondary dark:text-dark-secondary">
        Carregando...
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 px-6 pt-4">
      <h1 className="text-xl font-semibold text-light-primary dark:text-dark-primary">
        Ajuste de fatura — {card.name}
      </h1>

      <p className="text-sm text-light-secondary dark:text-dark-secondary">
        Valor calculado nesta fatura: <span className="font-semibold">{formatBRL(calculatedOwed)}</span>
      </p>

      <form className="flex flex-col gap-4" onSubmit={form.handleSubmit(onSubmit)} noValidate>
        <Input
          label="Valor real da fatura"
          type="number"
          step="0.01"
          error={form.formState.errors.realValue?.message}
          {...form.register('realValue', { valueAsNumber: true })}
        />

        {diff !== 0 ? (
          <p className="text-sm text-light-secondary dark:text-dark-secondary">
            {diff > 0
              ? `Será criada uma despesa de ${formatBRL(diff)} pra igualar a fatura ao valor real.`
              : `Será criada uma receita de ${formatBRL(-diff)} pra igualar a fatura ao valor real.`}
          </p>
        ) : (
          <p className="text-sm text-light-secondary dark:text-dark-secondary">
            Sem diferença — nenhum ajuste será criado.
          </p>
        )}

        {formError ? <p className="text-sm text-danger">{formError}</p> : null}

        <Button type="submit" disabled={form.formState.isSubmitting || diff === 0}>
          {form.formState.isSubmitting ? 'Salvando...' : 'Criar ajuste'}
        </Button>
      </form>
    </div>
  )
}
