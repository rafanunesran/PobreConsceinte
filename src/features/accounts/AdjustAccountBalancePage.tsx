import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAuthStore } from '../../stores/authStore'
import { useWorkspaceStore } from '../../stores/workspaceStore'
import { useAccounts } from './useAccounts'
import { useCategories } from '../categories/useCategories'
import { getOrCreateCategoryByName } from '../categories/api'
import { createTransaction } from '../transactions/api'
import { todayDateString } from '../cards/invoiceUtils'
import { roundToCents } from '../transactions/dateUtils'
import { adjustAccountBalanceSchema, type AdjustAccountBalanceFormData } from './schemas'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { formatBRL } from '../../lib/utils'

export function AdjustAccountBalancePage() {
  const navigate = useNavigate()
  const { accountId } = useParams<{ accountId: string }>()
  const user = useAuthStore((state) => state.user)
  const workspaceId = useWorkspaceStore((state) => state.workspaceId)

  const { accounts, loading } = useAccounts(workspaceId ?? '')
  const { categories } = useCategories(workspaceId ?? '')
  const [formError, setFormError] = useState<string | null>(null)

  const account = accounts.find((a) => a.id === accountId)

  const form = useForm<AdjustAccountBalanceFormData>({
    resolver: zodResolver(adjustAccountBalanceSchema),
    defaultValues: { realBalance: 0 },
  })
  const realBalance = form.watch('realBalance')
  const diff = useMemo(
    () => roundToCents((realBalance || 0) - (account?.balance ?? 0)),
    [realBalance, account],
  )

  if (!user || !workspaceId) return null

  if (!loading && !account) {
    navigate('/contas', { replace: true })
    return null
  }

  async function onSubmit(data: AdjustAccountBalanceFormData) {
    if (!user || !workspaceId || !account) return
    setFormError(null)
    const amount = roundToCents(data.realBalance - account.balance)
    if (amount === 0) {
      navigate(`/contas/${account.id}`)
      return
    }
    // diferente da fatura: saldo real maior que o registrado significa que
    // dinheiro apareceu (receita); menor significa que dinheiro sumiu
    // (despesa) — sinal invertido em relação ao ajuste de fatura.
    const type = amount > 0 ? 'income' : 'expense'
    try {
      const categoryId = await getOrCreateCategoryByName(
        workspaceId,
        categories,
        'Outro',
        type,
        'more',
        type === 'income' ? '#F59E0B' : '#3B82F6',
        user.uid,
      )
      await createTransaction(
        workspaceId,
        {
          type,
          amount: Math.abs(amount),
          date: todayDateString(),
          description: 'Ajuste de saldo',
          categoryId,
          paid: true,
          accountId: account.id,
        },
        user.uid,
      )
      navigate(`/contas/${account.id}`)
    } catch {
      setFormError('Não foi possível criar o ajuste. Tente novamente.')
    }
  }

  if (loading || !account) {
    return (
      <div className="px-6 pt-4 text-sm text-light-secondary dark:text-dark-secondary">
        Carregando...
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 px-6 pt-4">
      <h1 className="text-xl font-semibold text-light-primary dark:text-dark-primary">
        Ajuste de saldo — {account.name}
      </h1>

      <p className="text-sm text-light-secondary dark:text-dark-secondary">
        Saldo registrado: <span className="font-semibold">{formatBRL(account.balance)}</span>
      </p>

      <form className="flex flex-col gap-4" onSubmit={form.handleSubmit(onSubmit)} noValidate>
        <Input
          label="Saldo real da conta"
          type="number"
          step="0.01"
          error={form.formState.errors.realBalance?.message}
          {...form.register('realBalance', { valueAsNumber: true })}
        />

        {diff !== 0 ? (
          <p className="text-sm text-light-secondary dark:text-dark-secondary">
            {diff > 0
              ? `Será criada uma receita de ${formatBRL(diff)} pra igualar o saldo ao valor real.`
              : `Será criada uma despesa de ${formatBRL(-diff)} pra igualar o saldo ao valor real.`}
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
