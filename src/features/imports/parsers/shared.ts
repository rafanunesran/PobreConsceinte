// Utilitários compartilhados pelos 3 parsers (CSV/OFX/PDF) — cada um lida
// com texto bruto em formatos variados, mas todos convergem pros mesmos
// formatos de data/valor/parcela antes de virar um ParsedEntry.

const INSTALLMENT_PATTERN = /\s*(?:parc(?:ela)?\.?\s*)?(\d{1,2})\s*\/\s*(\d{1,2})\s*$/i

export interface InstallmentMatch {
  description: string
  installmentIndex?: number
  installmentTotal?: number
}

// Detecta o padrão "NN/MM" (com ou sem "parcela"/"parc" na frente) no fim
// da descrição — formato comum de fatura brasileira, ex: "AMAZON BR 02/10".
// MM (total) precisa ser >= NN (índice) e >= 2 pra não confundir com uma
// data (ex: "COMPRA 15/07" não vira parcela 15 de 7).
export function extractInstallment(rawDescription: string): InstallmentMatch {
  const match = INSTALLMENT_PATTERN.exec(rawDescription)
  if (!match) return { description: rawDescription.trim() }

  const index = Number(match[1])
  const total = Number(match[2])
  if (total < 2 || index < 1 || index > total) return { description: rawDescription.trim() }

  const description = rawDescription.slice(0, match.index).trim()
  if (!description) return { description: rawDescription.trim() }

  return { description, installmentIndex: index, installmentTotal: total }
}

// Normaliza data pra 'YYYY-MM-DD'. Aceita ISO (passa direto), 'DD/MM/YYYY',
// 'DD/MM/YY' (assume 20YY), 'DD-MM-YYYY' e 'DD/MM' sem ano (comum em
// fatura — assume o ano corrente; se isso cair mais de 15 dias no futuro,
// assume que é do ano anterior, já que fatura só lista lançamentos
// passados/do período fechado). Retorna null se não reconhecer.
export function parseFlexibleDate(raw: string): string | null {
  const trimmed = raw.trim()
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed

  const withYear = /^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/.exec(trimmed)
  if (withYear) {
    const [, dayStr, monthStr, yearStr] = withYear
    const day = Number(dayStr)
    const month = Number(monthStr)
    if (!day || !month || day > 31 || month > 12) return null
    const year = (yearStr?.length ?? 0) <= 2 ? 2000 + Number(yearStr) : Number(yearStr)
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  }

  const withoutYear = /^(\d{1,2})[/-](\d{1,2})$/.exec(trimmed)
  if (withoutYear) {
    const [, dayStr, monthStr] = withoutYear
    const day = Number(dayStr)
    const month = Number(monthStr)
    if (!day || !month || day > 31 || month > 12) return null
    const now = new Date()
    let year = now.getFullYear()
    const candidate = new Date(year, month - 1, day)
    const fifteenDaysMs = 15 * 24 * 60 * 60 * 1000
    if (candidate.getTime() - now.getTime() > fifteenDaysMs) year -= 1
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  }

  return null
}

// Valor em formato brasileiro ("R$ 1.234,56", "-R$ 89,90", "-89,90",
// "(89,90)") vira número absoluto — o sinal é decidido por quem chama
// (ParsedEntry.type), não carregado no valor em si. Remove "R$" ANTES de
// checar o sinal — "-R$ 89,90" (hífen antes do símbolo) é comum o
// suficiente pra não poder assumir que "R$" sempre vem primeiro.
export function parseAmount(raw: string): number | null {
  const isParenNegative = /^\(.*\)$/.test(raw.trim())
  let cleaned = raw.trim().replace(/[()]/g, '').replace(/R\$/gi, '').trim()
  const isNegative = isParenNegative || cleaned.startsWith('-')
  cleaned = cleaned.replace(/^-/, '').trim()
  if (!cleaned) return null

  const lastComma = cleaned.lastIndexOf(',')
  const lastDot = cleaned.lastIndexOf('.')
  if (lastComma > lastDot) {
    // formato BR: '.' separa milhar, ',' separa decimal
    cleaned = cleaned.replace(/\./g, '').replace(',', '.')
  } else if (lastDot > lastComma) {
    // formato US: ',' separa milhar, '.' separa decimal
    cleaned = cleaned.replace(/,/g, '')
  }

  const value = Number(cleaned)
  if (!Number.isFinite(value)) return null
  return isNegative ? -value : value
}
