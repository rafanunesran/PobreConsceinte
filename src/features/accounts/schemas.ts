import { z } from 'zod'
import { ACCOUNT_TYPES } from './types'

export const accountSchema = z.object({
  name: z.string().trim().min(1, 'Nome obrigatório').max(40, 'Máximo de 40 caracteres'),
  type: z.enum(ACCOUNT_TYPES, 'Selecione um tipo'),
  balance: z.number('Informe um valor válido'),
  includeInTotal: z.boolean(),
})

export type AccountFormData = z.infer<typeof accountSchema>

// Sem .nonnegative() — diferente de fatura, uma conta pode ficar negativa
// (cheque especial).
export const adjustAccountBalanceSchema = z.object({
  realBalance: z.number('Informe um valor válido'),
})

export type AdjustAccountBalanceFormData = z.infer<typeof adjustAccountBalanceSchema>

export const accountTransferSchema = z
  .object({
    fromAccountId: z.string().min(1, 'Selecione a conta de origem'),
    toAccountId: z.string().min(1, 'Selecione a conta de destino'),
    amount: z.number('Informe um valor válido').positive('Informe um valor maior que zero'),
  })
  .refine((data) => data.fromAccountId !== data.toAccountId, {
    message: 'A conta de destino precisa ser diferente da de origem',
    path: ['toAccountId'],
  })

export type AccountTransferFormData = z.infer<typeof accountTransferSchema>
