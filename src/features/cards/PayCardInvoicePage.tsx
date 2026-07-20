import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAuthStore } from '../../stores/authStore'
import { useCards } from './useCards'
import { useTransactions } from '../transactions/useTransactions'
import { useAccounts } from '../accounts/useAccounts'
import { useCategories } from '../categories/useCategories'
import { buildPayInvoiceSchema, type PayInvoiceFormData } from './schemas'
import { payCardInvoice } from './invoicePayment'
import {
  getInvoicePeriod,
  nextInvoicePeriod,
  previousInvoicePeriod,
  sumUnpaid,
  todayDateString,
  transactionsInPeriod,
} from './invoiceUtils'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'

export function PayCardInvoicePage() {
  const navigate = useNavigate()
  const { cardId } = useParams<{ cardId: string }>()
  const [searchParams] = useSearchParams()
  const invoiceView = searchParams.get('period') === 'fechada' ? 'fechada' : 'aberta'
  const user = useAuthStore((state) => state.user)

  const { cards, loading: loadingCards } = useCards(user?.uid ?? '')
  const { transactions, loading: loadingTransactions } = useTransactions(user?.uid ?? '')
  const { accounts } = useAccounts(user?.uid ?? '')
  const { categories } = useCategories(user?.uid ?? '')
  const expenseCategories = categories.filter((c) => c.type === 'expense')

  const [formError, setFormError] = useState<string | null>(null)

  const card = cards.find((c) => c.id === cardId)

  const period = useMemo(() => {
    if (!card) return null
    const openPeriod = getInvoicePeriod(card.closingDay, todayDateString())
    return invoiceView === 'aberta' ? openPeriod : previousInvoicePeriod(card.closingDay, openPeriod)
  }, [card, invoiceView])

  const unpaidPeriodTransactions = useMemo(() => {
    if (!card || !period) return []
    return transactionsInPeriod(transactions, card.id, period).filter((t) => !t.paid)
  }, [card, period, transactions])

  const owed = useMemo(() => sumUnpaid(unpaidPeriodTransactions), [unpaidPeriodTransactions])

  const form = useForm<PayInvoiceFormData>({
    resolver: zodResolver(buildPayInvoiceSchema(owed || 1)),
    defaultValues: { amountPaid: 0, accountId: '', categoryId: '' },
  })

  // Só reage a `owed` (o teto muda quando os dados carregam) — `form` do
  // react-hook-form é estável entre renders, não precisa entrar nas deps.
  useEffect(() => {
    form.reset({ amountPaid: owed, accountId: form.getValues('accountId'), categoryId: form.getValues('categoryId') })
  }, [owed, form])

  const loading = loadingCards || loadingTransactions

  useEffect(() => {
    if (!loading && card && owed === 0) {
      navigate(`/cartoes/${card.id}/fatura`, { replace: true })
    }
  }, [loading, card, owed, navigate])

  if (!user) return null

  if (!loading && !card) {
    navigate('/cartoes', { replace: true })
    return null
  }

  async function onSubmit(data: PayInvoiceFormData) {
    if (!user || !card || !period) return
    setFormError(null)
    try {
      await payCardInvoice(user.uid, {
        cardId: card.id,
        cardName: card.name,
        accountId: data.accountId,
        categoryId: data.categoryId,
        amountPaid: data.amountPaid,
        paymentDate: todayDateString(),
        unpaidTransactionIds: unpaidPeriodTransactions.map((t) => t.id),
        nextPeriodStart: nextInvoicePeriod(card.closingDay, period).start,
      })
      navigate(`/cartoes/${card.id}/fatura`)
    } catch {
      setFormError('Não foi possível pagar a fatura. Tente novamente.')
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
        Pagar fatura — {card.name}
      </h1>

      <form className="flex flex-col gap-4" onSubmit={form.handleSubmit(onSubmit)} noValidate>
        <Input
          label="Valor a pagar"
          type="number"
          step="0.01"
          error={form.formState.errors.amountPaid?.message}
          {...form.register('amountPaid', { valueAsNumber: true })}
        />
        <p className="-mt-2 text-sm text-light-secondary dark:text-dark-secondary">
          Se pagar menos que o total, o restante entra na próxima fatura.
        </p>

        <Select
          label="Conta de origem"
          error={form.formState.errors.accountId?.message}
          {...form.register('accountId')}
        >
          <option value="">Selecione</option>
          {accounts.map((account) => (
            <option key={account.id} value={account.id}>
              {account.name}
            </option>
          ))}
        </Select>

        <Select
          label="Categoria"
          error={form.formState.errors.categoryId?.message}
          {...form.register('categoryId')}
        >
          <option value="">Selecione</option>
          {expenseCategories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </Select>

        {formError ? <p className="text-sm text-danger">{formError}</p> : null}

        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? 'Pagando...' : 'Confirmar pagamento'}
        </Button>
      </form>
    </div>
  )
}
