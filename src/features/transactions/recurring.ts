import {
  collection,
  doc,
  getDocs,
  runTransaction,
  writeBatch,
  type FirestoreDataConverter,
  type QueryDocumentSnapshot,
} from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { accountDoc } from '../accounts/api'
import { transactionDoc, signedEffect } from './api'
import { addMonthsClamped, daysInMonth, formatDate, monthsBetween, parseDate } from './dateUtils'
import type { TransactionFormData } from './types'

export interface RecurringRule {
  id: string
  amount: number
  description: string
  categoryId: string
  dayOfMonth: number // 1-31
  generatedUntil: string // 'YYYY-MM-DD' da última ocorrência já gerada
  accountId?: string
  cardId?: string
  createdBy: string // uid de quem criou a regra — ocorrências geradas por topUp herdam este valor
}

export interface RecurringRuleFormData {
  amount: number
  description: string
  categoryId: string
  dayOfMonth: number
  accountId?: string
  cardId?: string
}

const recurringRuleConverter: FirestoreDataConverter<RecurringRule> = {
  toFirestore: (r) => {
    const base = {
      amount: r.amount,
      description: r.description,
      categoryId: r.categoryId,
      dayOfMonth: r.dayOfMonth,
      generatedUntil: r.generatedUntil,
      createdBy: r.createdBy,
    }
    return r.accountId !== undefined ? { ...base, accountId: r.accountId } : { ...base, cardId: r.cardId }
  },
  fromFirestore: (snapshot: QueryDocumentSnapshot) => {
    const data = snapshot.data()
    const accountId = typeof data.accountId === 'string' ? data.accountId : undefined
    const cardId = typeof data.cardId === 'string' ? data.cardId : undefined
    return {
      id: snapshot.id,
      amount: typeof data.amount === 'number' ? data.amount : 0,
      description: typeof data.description === 'string' ? data.description : '',
      categoryId: typeof data.categoryId === 'string' ? data.categoryId : '',
      dayOfMonth: typeof data.dayOfMonth === 'number' ? data.dayOfMonth : 1,
      generatedUntil: typeof data.generatedUntil === 'string' ? data.generatedUntil : '',
      createdBy: typeof data.createdBy === 'string' ? data.createdBy : '',
      ...(accountId !== undefined ? { accountId } : {}),
      ...(cardId !== undefined ? { cardId } : {}),
    }
  },
}

function recurringRulesCollection(uid: string) {
  return collection(db, 'users', uid, 'recurringRules').withConverter(recurringRuleConverter)
}
function recurringRuleDoc(uid: string, ruleId: string) {
  return doc(db, 'users', uid, 'recurringRules', ruleId).withConverter(recurringRuleConverter)
}

function firstOccurrenceDate(dayOfMonth: number, today: Date = new Date()): string {
  const year = today.getFullYear()
  const month1based = today.getMonth() + 1
  const day = today.getDate()
  const thisMonthDay = Math.min(dayOfMonth, daysInMonth(year, month1based))
  if (day <= thisMonthDay) return formatDate(year, month1based, thisMonthDay)
  const next = addMonthsClamped(year, month1based, dayOfMonth, 1)
  return formatDate(next.year, next.month1based, next.day)
}

// Gera `count` ocorrências mensais SEGUINTES a `afterDate` (exclusive), no
// mesmo dia-do-mês da regra. Sempre `paid: false` — é o caller
// (createRecurringExpense) quem decide se a 1ª ocorrência nasce paga; esta
// função nunca gera doc pago, então nunca precisa tocar em saldo de conta —
// puramente determinística, sem I/O.
export function generateRecurringOccurrences(
  rule: Pick<RecurringRule, 'amount' | 'description' | 'categoryId' | 'accountId' | 'cardId' | 'dayOfMonth'>,
  recurringRuleId: string,
  afterDate: string,
  count: number,
): (TransactionFormData & { recurringRuleId: string })[] {
  const { year, month1based } = parseDate(afterDate)
  const occurrences: (TransactionFormData & { recurringRuleId: string })[] = []
  for (let i = 1; i <= count; i++) {
    const { year: y, month1based: m, day } = addMonthsClamped(year, month1based, rule.dayOfMonth, i)
    const base = {
      type: 'expense' as const,
      amount: rule.amount,
      date: formatDate(y, m, day),
      description: rule.description,
      categoryId: rule.categoryId,
      paid: false,
      recurringRuleId,
    }
    occurrences.push(
      rule.accountId !== undefined ? { ...base, accountId: rule.accountId } : { ...base, cardId: rule.cardId },
    )
  }
  return occurrences
}

// Cria a regra + as 12 primeiras ocorrências mensais. IDs de transação são
// DETERMINÍSTICOS (`${ruleId}_${date}`), não `doc(collection())` aleatório —
// é isso que torna topUpRecurringRules seguro contra duplicação mesmo se
// chamado mais de uma vez (duas abas, reload repetido, etc).
//
// Usa runTransaction, não writeBatch: a 1ª ocorrência é a ÚNICA que pode
// nascer paga (`firstOccurrencePaid`), e se nascer paga ela precisa afetar
// o saldo da conta atomicamente com sua própria criação — mesma regra de
// createTransaction. writeBatch não faz esse read+write atômico da conta.
export async function createRecurringExpense(
  uid: string,
  data: RecurringRuleFormData,
  firstOccurrencePaid: boolean,
  createdBy: string,
): Promise<string> {
  if ((data.accountId !== undefined) === (data.cardId !== undefined)) {
    throw new Error('A regra recorrente deve estar vinculada a exatamente uma conta ou um cartão.')
  }

  const ruleRef = doc(recurringRulesCollection(uid))
  const firstDate = firstOccurrenceDate(data.dayOfMonth)
  const rest = generateRecurringOccurrences(data, ruleRef.id, firstDate, 11)
  const first: TransactionFormData & { recurringRuleId: string } = {
    type: 'expense',
    amount: data.amount,
    date: firstDate,
    description: data.description,
    categoryId: data.categoryId,
    paid: firstOccurrencePaid,
    recurringRuleId: ruleRef.id,
    ...(data.accountId !== undefined ? { accountId: data.accountId } : { cardId: data.cardId }),
  }
  const occurrences = [first, ...rest]
  const lastOccurrence = occurrences[occurrences.length - 1] ?? first // noUncheckedIndexedAccess

  await runTransaction(db, async (transaction) => {
    const accountSnap =
      data.accountId !== undefined && firstOccurrencePaid
        ? await transaction.get(accountDoc(uid, data.accountId))
        : undefined
    if (accountSnap !== undefined && !accountSnap.exists()) throw new Error('Conta vinculada não encontrada.')

    if (data.accountId !== undefined && firstOccurrencePaid && accountSnap?.exists()) {
      transaction.update(accountDoc(uid, data.accountId), {
        balance: accountSnap.data().balance + signedEffect('expense', data.amount),
      })
    }

    for (const occurrence of occurrences) {
      const txId = `${ruleRef.id}_${occurrence.date}`
      transaction.set(transactionDoc(uid, txId), { id: txId, createdBy, ...occurrence })
    }

    transaction.set(ruleRef, {
      id: ruleRef.id,
      amount: data.amount,
      description: data.description,
      categoryId: data.categoryId,
      dayOfMonth: data.dayOfMonth,
      generatedUntil: lastOccurrence.date,
      createdBy,
      ...(data.accountId !== undefined ? { accountId: data.accountId } : { cardId: data.cardId }),
    })
  })

  return ruleRef.id
}

const TOP_UP_THRESHOLD_MONTHS = 6
const TOP_UP_BATCH_SIZE = 6

// Roda no mount da área protegida (AppShell). Pra cada regra com <=6 meses
// de ocorrências futuras restantes, gera mais 6, continuando de
// `generatedUntil`. writeBatch (não runTransaction): essas ocorrências são
// sempre `paid: false`, sem efeito de saldo a manter atômico com nada — a
// idempotência vem do ID DETERMINÍSTICO de cada transação
// (`${ruleId}_${date}`): duas chamadas concorrentes leem o mesmo
// `generatedUntil`, calculam as mesmas datas, os mesmos ids de doc, e os
// writeBatch's escrevem o MESMO conteúdo nos MESMOS docs — resultado final
// idêntico, nunca duplicado.
export async function topUpRecurringRules(uid: string): Promise<void> {
  const today = new Date()
  const todayStr = formatDate(today.getFullYear(), today.getMonth() + 1, today.getDate())
  const rulesSnap = await getDocs(recurringRulesCollection(uid))

  for (const ruleSnap of rulesSnap.docs) {
    const rule = ruleSnap.data()
    const remaining = monthsBetween(todayStr, rule.generatedUntil)
    if (remaining > TOP_UP_THRESHOLD_MONTHS) continue

    const newOccurrences = generateRecurringOccurrences(rule, rule.id, rule.generatedUntil, TOP_UP_BATCH_SIZE)
    const lastOccurrence = newOccurrences[newOccurrences.length - 1]
    if (lastOccurrence === undefined) continue

    const batch = writeBatch(db)
    for (const occurrence of newOccurrences) {
      const txId = `${rule.id}_${occurrence.date}`
      // ocorrências geradas automaticamente herdam a autoria de quem
      // criou a regra — não há uma "pessoa agindo agora" pra atribuir.
      batch.set(transactionDoc(uid, txId), { id: txId, createdBy: rule.createdBy, ...occurrence })
    }
    batch.set(recurringRuleDoc(uid, rule.id), { ...rule, generatedUntil: lastOccurrence.date })
    await batch.commit()
  }
}
