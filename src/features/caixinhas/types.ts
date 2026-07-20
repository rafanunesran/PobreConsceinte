export interface Caixinha {
  id: string
  accountId: string
  name: string
  balance: number
  yieldLabel?: string // só rótulo informativo, ex: "110% do CDI" — nunca calculado
}
