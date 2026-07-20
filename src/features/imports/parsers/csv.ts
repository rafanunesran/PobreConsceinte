import Papa from 'papaparse'
import { extractInstallment, parseAmount, parseFlexibleDate } from './shared'
import type { RawParsedEntry } from '../types'

const DATE_HEADERS = ['data', 'date', 'dt']
const DESCRIPTION_HEADERS = [
  'descricao',
  'descrição',
  'historico',
  'histórico',
  'description',
  'title',
  'estabelecimento',
  'lancamento',
  'lançamento',
]
const AMOUNT_HEADERS = ['valor', 'amount', 'value']

function normalizeHeader(header: string): string {
  return header
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
}

function findColumn(headers: string[], candidates: string[]): string | null {
  const normalized = headers.map((h) => ({ original: h, normalized: normalizeHeader(h) }))
  for (const candidate of candidates) {
    const found = normalized.find((h) => h.normalized === candidate)
    if (found) return found.original
  }
  return null
}

// Detecta as 3 colunas por nome de cabeçalho (data/descrição/valor, com
// sinônimos comuns) — se não conseguir identificar todas as 3 com
// confiança, lança erro pedindo pra conferir o arquivo em vez de arriscar
// ler a coluna errada.
export function parseCsv(text: string): RawParsedEntry[] {
  const result = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
    delimiter: '', // auto-detect ',' vs ';'
  })

  const headers = result.meta.fields ?? []
  const dateCol = findColumn(headers, DATE_HEADERS.map(normalizeHeader))
  const descCol = findColumn(headers, DESCRIPTION_HEADERS.map(normalizeHeader))
  const amountCol = findColumn(headers, AMOUNT_HEADERS.map(normalizeHeader))

  if (!dateCol || !descCol || !amountCol) {
    throw new Error(
      'Não foi possível identificar as colunas de data, descrição e valor neste CSV. Confira se o arquivo tem cabeçalho.',
    )
  }

  const entries: RawParsedEntry[] = []
  for (const row of result.data) {
    const rawDate = row[dateCol]
    const rawDesc = row[descCol]
    const rawAmount = row[amountCol]
    if (!rawDate || !rawDesc || !rawAmount) continue

    const date = parseFlexibleDate(rawDate)
    const amount = parseAmount(rawAmount)
    if (!date || amount === null || amount === 0) continue

    const { description, installmentIndex, installmentTotal } = extractInstallment(rawDesc)
    entries.push({
      date,
      description,
      amount,
      ...(installmentIndex !== undefined ? { installmentIndex, installmentTotal } : {}),
    })
  }

  return entries
}
