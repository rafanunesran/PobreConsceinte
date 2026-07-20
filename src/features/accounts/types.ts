export const ACCOUNT_TYPES = ['corrente', 'poupanca', 'carteira', 'investimento'] as const
export type AccountType = (typeof ACCOUNT_TYPES)[number]

export const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  corrente: 'Conta corrente',
  poupanca: 'Poupança',
  carteira: 'Carteira',
  investimento: 'Investimento',
}

export interface Account {
  id: string
  name: string
  type: AccountType
  balance: number
  currency: 'BRL'
  includeInTotal: boolean // false = fica fora da somatória do Home
}
