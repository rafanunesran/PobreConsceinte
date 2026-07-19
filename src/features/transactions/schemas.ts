import { z } from 'zod'

export const expenseSchema = z
  .object({
    amount: z.number('Informe um valor válido').positive('Informe um valor maior que zero'),
    date: z.string().min(1, 'Informe a data'),
    description: z.string().trim().min(1, 'Descrição obrigatória').max(60, 'Máximo de 60 caracteres'),
    categoryId: z.string().min(1, 'Selecione uma categoria'),
    linkedType: z.enum(['account', 'card'], 'Selecione conta ou cartão'),
    accountId: z.string().optional(),
    cardId: z.string().optional(),
  })
  .refine((data) => (data.linkedType === 'account' ? Boolean(data.accountId) : Boolean(data.cardId)), {
    message: 'Selecione uma conta ou cartão',
    path: ['linkedType'],
  })

export type ExpenseFormData = z.infer<typeof expenseSchema>

export const incomeSchema = z.object({
  amount: z.number('Informe um valor válido').positive('Informe um valor maior que zero'),
  date: z.string().min(1, 'Informe a data'),
  description: z.string().trim().min(1, 'Descrição obrigatória').max(60, 'Máximo de 60 caracteres'),
  categoryId: z.string().min(1, 'Selecione uma categoria'),
  accountId: z.string().min(1, 'Selecione uma conta'),
})

export type IncomeFormData = z.infer<typeof incomeSchema>
