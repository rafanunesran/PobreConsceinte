import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAuthStore } from '../../stores/authStore'
import { useWorkspaceStore } from '../../stores/workspaceStore'
import { useAccounts } from '../accounts/useAccounts'
import { useCards } from '../cards/useCards'
import { useCategories } from '../categories/useCategories'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { cn } from '../../lib/utils'
import { expenseSchema, incomeSchema, type ExpenseFormData, type IncomeFormData } from './schemas'
import { createTransaction, deleteTransaction, getTransaction, updateTransaction } from './api'
import { createRecurringExpense } from './recurring'
import { createInstallmentExpense } from './installments'
import type { TransactionFormData } from './types'

type Kind = 'despesa' | 'receita'

function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

export function TransactionFormPage() {
  const navigate = useNavigate()
  const { kind, transactionId } = useParams<{ kind: Kind; transactionId?: string }>()
  const isExpense = kind === 'despesa'
  const isEditMode = Boolean(transactionId)
  const user = useAuthStore((state) => state.user)
  const workspaceId = useWorkspaceStore((state) => state.workspaceId)

  const { accounts } = useAccounts(workspaceId ?? '')
  const { cards } = useCards(workspaceId ?? '')
  const { categories } = useCategories(workspaceId ?? '')
  const relevantCategories = categories.filter((c) => c.type === (isExpense ? 'expense' : 'income'))

  const [formError, setFormError] = useState<string | null>(null)
  const [isLoadingTransaction, setIsLoadingTransaction] = useState(isEditMode)
  const [loadError, setLoadError] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const expenseForm = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      amount: 0,
      date: todayISO(),
      description: '',
      categoryId: '',
      linkedType: 'account',
      accountId: '',
      cardId: '',
      paid: true,
      recurrence: 'none',
      installmentsCount: 2,
      installmentAmountMode: 'total',
    },
  })
  const incomeForm = useForm<IncomeFormData>({
    resolver: zodResolver(incomeSchema),
    defaultValues: { amount: 0, date: todayISO(), description: '', categoryId: '', accountId: '', paid: true },
  })

  useEffect(() => {
    if (!workspaceId || !transactionId) return
    let cancelled = false
    getTransaction(workspaceId, transactionId)
      .then((transaction) => {
        if (cancelled) return
        if (!transaction) {
          navigate('/registros', { replace: true })
          return
        }
        if (isExpense) {
          expenseForm.reset({
            amount: transaction.amount,
            date: transaction.date,
            description: transaction.description,
            categoryId: transaction.categoryId,
            linkedType: transaction.accountId !== undefined ? 'account' : 'card',
            accountId: transaction.accountId ?? '',
            cardId: transaction.cardId ?? '',
            paid: transaction.paid,
            recurrence: 'none',
            installmentsCount: 2,
            installmentAmountMode: 'total',
          })
        } else {
          incomeForm.reset({
            amount: transaction.amount,
            date: transaction.date,
            description: transaction.description,
            categoryId: transaction.categoryId,
            accountId: transaction.accountId ?? '',
            paid: transaction.paid,
          })
        }
        setIsLoadingTransaction(false)
      })
      .catch(() => {
        if (cancelled) return
        setLoadError(true)
        setIsLoadingTransaction(false)
      })
    return () => {
      cancelled = true
    }
  }, [workspaceId, transactionId, isExpense, navigate, expenseForm, incomeForm])

  if (!user || !workspaceId) return null

  async function onSubmitExpense(data: ExpenseFormData) {
    if (!user || !workspaceId) return
    setFormError(null)
    const linkage =
      data.linkedType === 'account' ? { accountId: data.accountId } : { cardId: data.cardId }
    // Defesa em profundidade: despesa de cartão só fica paga através do
    // pagamento de fatura (payCardInvoice) — nunca na criação. Edição não
    // entra aqui (o toggle já vem escondido pra card, `data.paid` reflete
    // só o que já estava salvo).
    const paidOnCreate = data.linkedType === 'card' ? false : data.paid

    try {
      if (transactionId) {
        // Edição só afeta esta ocorrência — não recria a série de
        // recorrência/parcelamento.
        const payload: TransactionFormData = {
          type: 'expense',
          amount: data.amount,
          date: data.date,
          description: data.description,
          categoryId: data.categoryId,
          paid: data.paid,
          ...linkage,
        }
        await updateTransaction(workspaceId, transactionId, payload)
      } else if (data.recurrence === 'fixed') {
        await createRecurringExpense(
          workspaceId,
          {
            amount: data.amount,
            description: data.description,
            categoryId: data.categoryId,
            dayOfMonth: Number(data.date.slice(-2)),
            ...linkage,
          },
          paidOnCreate,
          user.uid,
        )
      } else if (data.recurrence === 'installments') {
        await createInstallmentExpense(
          workspaceId,
          { amount: data.amount, description: data.description, categoryId: data.categoryId, date: data.date, ...linkage },
          data.installmentsCount ?? 2,
          data.installmentAmountMode === 'perInstallment',
          paidOnCreate,
          user.uid,
        )
      } else {
        const payload: TransactionFormData = {
          type: 'expense',
          amount: data.amount,
          date: data.date,
          description: data.description,
          categoryId: data.categoryId,
          paid: paidOnCreate,
          ...linkage,
        }
        await createTransaction(workspaceId, payload, user.uid)
      }
      navigate('/registros')
    } catch {
      setFormError('Não foi possível salvar a despesa. Tente novamente.')
    }
  }

  async function onSubmitIncome(data: IncomeFormData) {
    if (!user || !workspaceId) return
    setFormError(null)
    const payload: TransactionFormData = {
      type: 'income',
      amount: data.amount,
      date: data.date,
      description: data.description,
      categoryId: data.categoryId,
      accountId: data.accountId,
      paid: data.paid,
    }
    try {
      if (transactionId) {
        await updateTransaction(workspaceId, transactionId, payload)
      } else {
        await createTransaction(workspaceId, payload, user.uid)
      }
      navigate('/registros')
    } catch {
      setFormError('Não foi possível salvar a receita. Tente novamente.')
    }
  }

  async function handleDelete() {
    if (!workspaceId || !transactionId) return
    setIsDeleting(true)
    try {
      await deleteTransaction(workspaceId, transactionId)
      navigate('/registros')
    } catch {
      setFormError('Não foi possível excluir. Tente novamente.')
      setIsDeleting(false)
    }
  }

  if (isEditMode && isLoadingTransaction) {
    return (
      <div className="px-6 pt-4 text-sm text-light-secondary dark:text-dark-secondary">
        Carregando...
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="flex flex-col gap-3 px-6 pt-4">
        <p className="text-sm text-danger">
          Não foi possível carregar esse registro. Verifique sua conexão ou tente novamente mais
          tarde.
        </p>
        <Button type="button" variant="secondary" onClick={() => navigate('/registros')}>
          Voltar
        </Button>
      </div>
    )
  }

  if (relevantCategories.length === 0) {
    return (
      <div className="flex flex-col gap-3 px-6 pt-4">
        <p className="text-sm text-light-secondary dark:text-dark-secondary">
          Você ainda não tem categorias de {isExpense ? 'despesa' : 'receita'}. Crie uma antes de
          continuar.
        </p>
        <Button type="button" variant="secondary" onClick={() => navigate('/categorias')}>
          Ir para Categorias
        </Button>
      </div>
    )
  }

  const linkedType = expenseForm.watch('linkedType')
  const recurrence = expenseForm.watch('recurrence')
  const installmentAmountMode = expenseForm.watch('installmentAmountMode')
  const expensePaid = expenseForm.watch('paid')
  const incomePaid = incomeForm.watch('paid')

  return (
    <div className="flex flex-col gap-6 px-6 pt-4">
      <h1 className="text-xl font-semibold text-light-primary dark:text-dark-primary">
        {isEditMode ? 'Editar' : 'Nova'} {isExpense ? 'despesa' : 'receita'}
      </h1>

      {isExpense ? (
        <form
          className="flex flex-col gap-4"
          onSubmit={expenseForm.handleSubmit(onSubmitExpense)}
          noValidate
        >
          <Input
            label="Descrição"
            placeholder="Ex: Supermercado"
            error={expenseForm.formState.errors.description?.message}
            {...expenseForm.register('description')}
          />
          <Input
            label="Valor"
            type="number"
            step="0.01"
            error={expenseForm.formState.errors.amount?.message}
            {...expenseForm.register('amount', { valueAsNumber: true })}
          />
          <Input
            label="Data"
            type="date"
            error={expenseForm.formState.errors.date?.message}
            {...expenseForm.register('date')}
          />
          <Select
            label="Categoria"
            error={expenseForm.formState.errors.categoryId?.message}
            {...expenseForm.register('categoryId')}
          >
            <option value="">Selecione</option>
            {relevantCategories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </Select>

          <div className="flex flex-col gap-1.5">
            <span className="text-sm text-light-secondary dark:text-dark-secondary">Pago com</span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => expenseForm.setValue('linkedType', 'account', { shouldValidate: true })}
                className={cn(
                  'flex-1 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all duration-200',
                  linkedType === 'account'
                    ? 'border-brand-500 bg-brand-500/10 text-brand-500'
                    : 'border-border-light text-light-secondary dark:border-border-dark dark:text-dark-secondary',
                )}
              >
                Conta
              </button>
              <button
                type="button"
                onClick={() => {
                  expenseForm.setValue('linkedType', 'card', { shouldValidate: true })
                  // Despesa de cartão só fica paga através do pagamento de
                  // fatura (payCardInvoice) — nunca marcada direto aqui.
                  expenseForm.setValue('paid', false)
                }}
                className={cn(
                  'flex-1 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all duration-200',
                  linkedType === 'card'
                    ? 'border-brand-500 bg-brand-500/10 text-brand-500'
                    : 'border-border-light text-light-secondary dark:border-border-dark dark:text-dark-secondary',
                )}
              >
                Cartão
              </button>
            </div>
            {expenseForm.formState.errors.linkedType ? (
              <span className="text-sm text-danger">
                {expenseForm.formState.errors.linkedType.message}
              </span>
            ) : null}
          </div>

          {linkedType === 'account' ? (
            <Select label="Conta" {...expenseForm.register('accountId')}>
              <option value="">Selecione</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
            </Select>
          ) : (
            <Select label="Cartão" {...expenseForm.register('cardId')}>
              <option value="">Selecione</option>
              {cards.map((card) => (
                <option key={card.id} value={card.id}>
                  {card.name}
                </option>
              ))}
            </Select>
          )}

          {linkedType === 'account' ? (
            <button
              type="button"
              onClick={() => expenseForm.setValue('paid', !expensePaid)}
              className={cn(
                'flex items-center justify-between rounded-xl border px-4 py-2.5 text-sm font-medium transition-all duration-200',
                expensePaid
                  ? 'border-brand-500 bg-brand-500/10 text-brand-500'
                  : 'border-border-light text-light-secondary dark:border-border-dark dark:text-dark-secondary',
              )}
            >
              Já foi paga?
              <span>{expensePaid ? 'Sim' : 'Não'}</span>
            </button>
          ) : (
            <p className="text-sm text-light-secondary dark:text-dark-secondary">
              Despesa de cartão só fica paga quando a fatura é paga.
            </p>
          )}

          {!isEditMode ? (
            <div className="flex flex-col gap-1.5">
              <span className="text-sm text-light-secondary dark:text-dark-secondary">Recorrência</span>
              <div className="flex gap-2">
                {(
                  [
                    ['none', 'Nenhuma'],
                    ['fixed', 'Fixa'],
                    ['installments', 'Parcelamento'],
                  ] as const
                ).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => expenseForm.setValue('recurrence', value)}
                    className={cn(
                      'flex-1 rounded-xl border px-3 py-2.5 text-sm font-medium transition-all duration-200',
                      recurrence === value
                        ? 'border-brand-500 bg-brand-500/10 text-brand-500'
                        : 'border-border-light text-light-secondary dark:border-border-dark dark:text-dark-secondary',
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
              {recurrence === 'fixed' ? (
                <p className="text-sm text-light-secondary dark:text-dark-secondary">
                  Gera 12 lançamentos mensais no dia {expenseForm.watch('date').slice(-2)}, renovando
                  automaticamente conforme se aproxima do fim.
                </p>
              ) : null}
            </div>
          ) : null}

          {!isEditMode && recurrence === 'installments' ? (
            <div className="flex flex-col gap-4 rounded-xl border border-border-light p-4 dark:border-border-dark">
              <Input
                label="Número de parcelas"
                type="number"
                min={2}
                max={48}
                error={expenseForm.formState.errors.installmentsCount?.message}
                {...expenseForm.register('installmentsCount', { valueAsNumber: true })}
              />
              <div className="flex flex-col gap-1.5">
                <span className="text-sm text-light-secondary dark:text-dark-secondary">
                  O valor informado é
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => expenseForm.setValue('installmentAmountMode', 'total')}
                    className={cn(
                      'flex-1 rounded-xl border px-3 py-2.5 text-sm font-medium transition-all duration-200',
                      installmentAmountMode === 'total'
                        ? 'border-brand-500 bg-brand-500/10 text-brand-500'
                        : 'border-border-light text-light-secondary dark:border-border-dark dark:text-dark-secondary',
                    )}
                  >
                    O total a parcelar
                  </button>
                  <button
                    type="button"
                    onClick={() => expenseForm.setValue('installmentAmountMode', 'perInstallment')}
                    className={cn(
                      'flex-1 rounded-xl border px-3 py-2.5 text-sm font-medium transition-all duration-200',
                      installmentAmountMode === 'perInstallment'
                        ? 'border-brand-500 bg-brand-500/10 text-brand-500'
                        : 'border-border-light text-light-secondary dark:border-border-dark dark:text-dark-secondary',
                    )}
                  >
                    O valor de cada parcela
                  </button>
                </div>
              </div>
            </div>
          ) : null}

          {formError ? <p className="text-sm text-danger">{formError}</p> : null}

          <Button type="submit" disabled={expenseForm.formState.isSubmitting}>
            {expenseForm.formState.isSubmitting ? 'Salvando...' : 'Salvar'}
          </Button>
        </form>
      ) : (
        <form
          className="flex flex-col gap-4"
          onSubmit={incomeForm.handleSubmit(onSubmitIncome)}
          noValidate
        >
          <Input
            label="Descrição"
            placeholder="Ex: Salário"
            error={incomeForm.formState.errors.description?.message}
            {...incomeForm.register('description')}
          />
          <Input
            label="Valor"
            type="number"
            step="0.01"
            error={incomeForm.formState.errors.amount?.message}
            {...incomeForm.register('amount', { valueAsNumber: true })}
          />
          <Input
            label="Data"
            type="date"
            error={incomeForm.formState.errors.date?.message}
            {...incomeForm.register('date')}
          />
          <Select
            label="Categoria"
            error={incomeForm.formState.errors.categoryId?.message}
            {...incomeForm.register('categoryId')}
          >
            <option value="">Selecione</option>
            {relevantCategories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </Select>
          <Select
            label="Conta"
            error={incomeForm.formState.errors.accountId?.message}
            {...incomeForm.register('accountId')}
          >
            <option value="">Selecione</option>
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name}
              </option>
            ))}
          </Select>

          <button
            type="button"
            onClick={() => incomeForm.setValue('paid', !incomePaid)}
            className={cn(
              'flex items-center justify-between rounded-xl border px-4 py-2.5 text-sm font-medium transition-all duration-200',
              incomePaid
                ? 'border-brand-500 bg-brand-500/10 text-brand-500'
                : 'border-border-light text-light-secondary dark:border-border-dark dark:text-dark-secondary',
            )}
          >
            Já foi recebida?
            <span>{incomePaid ? 'Sim' : 'Não'}</span>
          </button>

          {formError ? <p className="text-sm text-danger">{formError}</p> : null}

          <Button type="submit" disabled={incomeForm.formState.isSubmitting}>
            {incomeForm.formState.isSubmitting ? 'Salvando...' : 'Salvar'}
          </Button>
        </form>
      )}

      {isEditMode ? (
        <div className="border-t border-border-light pt-4 dark:border-border-dark">
          {confirmingDelete ? (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-light-secondary dark:text-dark-secondary">
                Tem certeza? Essa ação não pode ser desfeita.
              </p>
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  className="flex-1"
                  onClick={() => setConfirmingDelete(false)}
                  disabled={isDeleting}
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  className="flex-1 bg-danger hover:bg-danger hover:shadow-none"
                  onClick={handleDelete}
                  disabled={isDeleting}
                >
                  {isDeleting ? 'Excluindo...' : 'Confirmar exclusão'}
                </Button>
              </div>
            </div>
          ) : (
            <Button type="button" variant="ghost" onClick={() => setConfirmingDelete(true)}>
              Excluir
            </Button>
          )}
        </div>
      ) : null}
    </div>
  )
}
