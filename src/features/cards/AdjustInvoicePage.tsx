import { useMemo, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAuthStore } from '../../stores/authStore'
import { useCards } from './useCards'
import { useCategories } from '../categories/useCategories'
import { createCategory } from '../categories/api'
import { createTransaction } from '../transactions/api'
import { getInvoicePeriod, shiftInvoicePeriod, todayDateString } from './invoiceUtils'
import { adjustInvoiceSchema, type AdjustInvoiceFormData } from './schemas'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { cn } from '../../lib/utils'

export function AdjustInvoicePage() {
  const navigate = useNavigate()
  const { cardId } = useParams<{ cardId: string }>()
  const [searchParams] = useSearchParams()
  const periodOffset = Number(searchParams.get('offset')) || 0
  const user = useAuthStore((state) => state.user)

  const { cards, loading: loadingCards } = useCards(user?.uid ?? '')
  const { categories } = useCategories(user?.uid ?? '')
  const [formError, setFormError] = useState<string | null>(null)

  const card = cards.find((c) => c.id === cardId)

  const period = useMemo(() => {
    if (!card) return null
    const openPeriod = getInvoicePeriod(card.closingDay, todayDateString())
    return shiftInvoicePeriod(card.closingDay, openPeriod, periodOffset)
  }, [card, periodOffset])

  const form = useForm<AdjustInvoiceFormData>({
    resolver: zodResolver(adjustInvoiceSchema),
    defaultValues: { amount: 0, type: 'expense' },
  })
  const type = form.watch('type')

  if (!user) return null

  if (!loadingCards && !card) {
    navigate('/cartoes', { replace: true })
    return null
  }

  async function onSubmit(data: AdjustInvoiceFormData) {
    if (!user || !card || !period) return
    setFormError(null)
    try {
      let categoryId = categories.find((c) => c.type === data.type && c.name === 'Outro')?.id
      if (categoryId === undefined) {
        categoryId = await createCategory(user.uid, {
          name: 'Outro',
          type: data.type,
          icon: 'more',
          color: data.type === 'expense' ? '#3B82F6' : '#F59E0B',
        })
      }
      await createTransaction(user.uid, {
        type: data.type,
        amount: data.amount,
        date: period.start,
        description: 'Ajuste de fatura',
        categoryId,
        paid: false,
        cardId: card.id,
      })
      navigate(`/cartoes/${card.id}/fatura`)
    } catch {
      setFormError('Não foi possível criar o ajuste. Tente novamente.')
    }
  }

  if (loadingCards || !card) {
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

      <form className="flex flex-col gap-4" onSubmit={form.handleSubmit(onSubmit)} noValidate>
        <Input
          label="Valor do ajuste"
          type="number"
          step="0.01"
          error={form.formState.errors.amount?.message}
          {...form.register('amount', { valueAsNumber: true })}
        />

        <div className="flex flex-col gap-1.5">
          <span className="text-sm text-light-secondary dark:text-dark-secondary">Tipo de ajuste</span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => form.setValue('type', 'expense')}
              className={cn(
                'flex-1 rounded-xl border px-3 py-2.5 text-sm font-medium transition-all duration-200',
                type === 'expense'
                  ? 'border-brand-500 bg-brand-500/10 text-brand-500'
                  : 'border-border-light text-light-secondary dark:border-border-dark dark:text-dark-secondary',
              )}
            >
              Despesa (aumenta a fatura)
            </button>
            <button
              type="button"
              onClick={() => form.setValue('type', 'income')}
              className={cn(
                'flex-1 rounded-xl border px-3 py-2.5 text-sm font-medium transition-all duration-200',
                type === 'income'
                  ? 'border-brand-500 bg-brand-500/10 text-brand-500'
                  : 'border-border-light text-light-secondary dark:border-border-dark dark:text-dark-secondary',
              )}
            >
              Receita (reduz a fatura)
            </button>
          </div>
        </div>

        {formError ? <p className="text-sm text-danger">{formError}</p> : null}

        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? 'Salvando...' : 'Criar ajuste'}
        </Button>
      </form>
    </div>
  )
}
