import type { Transaction, TransactionType } from '../transactions/types'

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // remove acentos
    .replace(/[0-9]/g, '')
    .replace(/[^a-z\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function mostFrequent(ids: string[]): string {
  const counts = new Map<string, number>()
  for (const id of ids) counts.set(id, (counts.get(id) ?? 0) + 1)
  let best = ids[0] ?? ''
  let bestCount = 0
  for (const [id, count] of counts) {
    if (count > bestCount) {
      best = id
      bestCount = count
    }
  }
  return best
}

// Monta um "sugeridor" a partir do histórico já categorizado (mesmo hook
// useTransactions que as páginas já usam) — separado por tipo
// (expense/income não se misturam) pra não sugerir categoria de receita
// pra uma despesa importada. Retorna uma função reutilizável pra não
// reconstruir o índice a cada entrada.
export function buildCategorySuggester(
  history: Transaction[],
): (description: string, type: TransactionType) => string | undefined {
  const byType: Record<TransactionType, { normalized: string; categoryId: string }[]> = {
    expense: [],
    income: [],
  }
  for (const t of history) {
    if (!t.categoryId || !t.description) continue
    const normalized = normalize(t.description)
    if (!normalized) continue
    byType[t.type].push({ normalized, categoryId: t.categoryId })
  }

  return (description, type) => {
    const norm = normalize(description)
    if (!norm) return undefined
    const candidates = byType[type]

    const exact = candidates.filter((c) => c.normalized === norm)
    if (exact.length > 0) return mostFrequent(exact.map((c) => c.categoryId))

    // contém/está contido — pega o item já categorizado mais frequente
    // entre os que compartilham um trecho significativo com a descrição
    // nova (ex: "uber" dentro de "uber trip help uber com").
    const contains = candidates.filter(
      (c) => c.normalized.length >= 3 && (norm.includes(c.normalized) || c.normalized.includes(norm)),
    )
    if (contains.length > 0) return mostFrequent(contains.map((c) => c.categoryId))

    return undefined
  }
}
