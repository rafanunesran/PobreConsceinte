export const CARD_BRANDS = ['visa', 'mastercard', 'elo', 'amex', 'outro'] as const
export type CardBrand = (typeof CARD_BRANDS)[number]

export const CARD_BRAND_LABELS: Record<CardBrand, string> = {
  visa: 'Visa',
  mastercard: 'Mastercard',
  elo: 'Elo',
  amex: 'American Express',
  outro: 'Outro',
}

// NOTE: "CreditCard" (não "Card") pra não colidir com o componente de UI
// components/ui/Card.tsx (superfície visual genérica, sem relação com esta
// entidade de domínio).
export interface CreditCard {
  id: string
  name: string
  brand: CardBrand
  limit: number
  closingDay: number
  dueDay: number
}
