import { extractInstallment, parseAmount } from './shared'
import type { RawParsedEntry } from '../types'

// OFX 1.x é SGML (tags sem fechamento obrigatório), então não dá pra usar
// um parser de XML — regex sobre cada bloco <STMTTRN>...</STMTTRN> (ou até
// o próximo <STMTTRN>, se o arquivo não fechar a tag) é o jeito robusto de
// ler os dois formatos (1.x SGML e 2.x XML) com o mesmo código.
function extractTag(block: string, tag: string): string | null {
  const match = new RegExp(`<${tag}>([^\\r\\n<]+)`, 'i').exec(block)
  return match?.[1]?.trim() ?? null
}

function parseOfxDate(raw: string): string | null {
  const digits = raw.replace(/[^0-9]/g, '')
  if (digits.length < 8) return null
  const year = digits.slice(0, 4)
  const month = digits.slice(4, 6)
  const day = digits.slice(6, 8)
  return `${year}-${month}-${day}`
}

export function parseOfx(text: string): RawParsedEntry[] {
  const blocks = text.split(/<STMTTRN>/i).slice(1) // primeiro pedaço é o que vem antes da 1ª transação
  const entries: RawParsedEntry[] = []

  for (const block of blocks) {
    const body = block.split(/<\/STMTTRN>/i)[0] ?? block

    const rawDate = extractTag(body, 'DTPOSTED')
    const rawAmount = extractTag(body, 'TRNAMT')
    const name = extractTag(body, 'NAME')
    const memo = extractTag(body, 'MEMO')
    const rawDesc = name ?? memo
    if (!rawDate || !rawAmount || !rawDesc) continue

    const date = parseOfxDate(rawDate)
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
