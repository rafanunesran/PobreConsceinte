import type { TextItem } from 'pdfjs-dist/types/src/display/api'
import { extractInstallment, parseAmount, parseFlexibleDate } from './shared'
import type { RawParsedEntry } from '../types'

// Leitura de PDF é heurística por natureza — o layout de fatura/extrato
// varia de banco pra banco. O padrão coberto aqui é o mais comum em faturas
// brasileiras: uma linha por lançamento, começando com a data e terminando
// no valor ("DD/MM  DESCRIÇÃO...  R$ 123,45"). É por isso que a tela de
// revisão (ImportPage) é obrigatória pra PDF — linhas que não baterem nesse
// padrão simplesmente não viram entrada, e as que baterem precisam ser
// conferidas antes de importar de verdade.
const DATE_PREFIX = /^(\d{2}\/\d{2}(?:\/\d{2,4})?)\s+/
const AMOUNT_SUFFIX = /(-?\(?R?\$?\s?\d{1,3}(?:[.,]\d{3})*[.,]\d{2}\)?)\s*$/

function linesFromPageText(items: TextItem[]): string[] {
  const lines: string[] = []
  let current = ''
  for (const item of items) {
    current += (current && item.str ? ' ' : '') + item.str
    if (item.hasEOL) {
      lines.push(current.replace(/\s+/g, ' ').trim())
      current = ''
    }
  }
  if (current.trim()) lines.push(current.replace(/\s+/g, ' ').trim())
  return lines
}

function parseLine(line: string): RawParsedEntry | null {
  const dateMatch = DATE_PREFIX.exec(line)
  if (!dateMatch) return null
  const rest = line.slice(dateMatch[0].length)

  const amountMatch = AMOUNT_SUFFIX.exec(rest)
  if (!amountMatch) return null
  const rawDescription = rest.slice(0, amountMatch.index).trim()
  if (!rawDescription) return null

  const dateStr = dateMatch[1]
  if (!dateStr) return null
  const date = parseFlexibleDate(dateStr)
  const amount = parseAmount(amountMatch[1] ?? '')
  if (!date || amount === null || amount === 0) return null

  const { description, installmentIndex, installmentTotal } = extractInstallment(rawDescription)
  return {
    date,
    description,
    amount,
    ...(installmentIndex !== undefined ? { installmentIndex, installmentTotal } : {}),
  }
}

export async function parsePdf(file: File): Promise<RawParsedEntry[]> {
  // Import dinâmico: pdfjs-dist é pesado (worker + wasm-like código de
  // decodificação) e só faz sentido baixar quando a pessoa realmente
  // escolhe um arquivo PDF — nenhuma outra página paga esse custo.
  const pdfjs = await import('pdfjs-dist')
  const workerUrl = (await import('pdfjs-dist/build/pdf.worker.min.mjs?url')).default
  pdfjs.GlobalWorkerOptions.workerSrc = workerUrl

  const buffer = await file.arrayBuffer()
  const doc = await pdfjs.getDocument({ data: buffer }).promise

  const entries: RawParsedEntry[] = []
  for (let pageNumber = 1; pageNumber <= doc.numPages; pageNumber++) {
    const page = await doc.getPage(pageNumber)
    const content = await page.getTextContent()
    const items = content.items.filter((item): item is TextItem => 'str' in item)
    for (const line of linesFromPageText(items)) {
      const entry = parseLine(line)
      if (entry) entries.push(entry)
    }
  }

  return entries
}
