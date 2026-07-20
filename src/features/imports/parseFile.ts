import { parseCsv } from './parsers/csv'
import { parseOfx } from './parsers/ofx'
import { parsePdf } from './parsers/pdf'
import type { ImportFileFormat, ParsedEntry, RawParsedEntry } from './types'

function detectFormat(fileName: string): ImportFileFormat | null {
  const lower = fileName.toLowerCase()
  if (lower.endsWith('.csv')) return 'csv'
  if (lower.endsWith('.ofx')) return 'ofx'
  if (lower.endsWith('.pdf')) return 'pdf'
  return null
}

// O sinal do valor no arquivo de origem significa coisas opostas
// dependendo de pra onde está importando:
// - fatura de cartão: linha nasce despesa (aumenta o que é devido);
//   crédito/estorno vem negativo na fonte e vira receita (abate a fatura).
// - extrato de conta: segue a convenção contábil normal — positivo é
//   dinheiro entrando (receita), negativo é saindo (despesa).
function applySignConvention(raw: RawParsedEntry[], targetKind: 'card' | 'account'): ParsedEntry[] {
  return raw.map(({ amount, ...rest }) => ({
    ...rest,
    amount: Math.abs(amount),
    type: targetKind === 'card' ? (amount < 0 ? 'income' : 'expense') : amount < 0 ? 'expense' : 'income',
  }))
}

export async function parseFile(file: File, targetKind: 'card' | 'account'): Promise<ParsedEntry[]> {
  const format = detectFormat(file.name)
  if (!format) {
    throw new Error('Formato não reconhecido. Envie um arquivo .csv, .ofx ou .pdf.')
  }

  let raw: RawParsedEntry[]
  if (format === 'csv') {
    raw = parseCsv(await file.text())
  } else if (format === 'ofx') {
    raw = parseOfx(await file.text())
  } else {
    raw = await parsePdf(file)
  }

  if (raw.length === 0) {
    throw new Error('Nenhum lançamento foi encontrado neste arquivo. Confira se é o arquivo certo.')
  }

  return applySignConvention(raw, targetKind)
}
