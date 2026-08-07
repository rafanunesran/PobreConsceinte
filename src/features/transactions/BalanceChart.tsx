import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { BalancePoint } from './balanceHistory'

interface BalanceChartProps {
  series: BalancePoint[] // ordem cronológica crescente, datas distintas
}

const W = 320
const H = 130
const PAD_L = 6
const PAD_R = 6
const PAD_T = 12
const PAD_B = 20

function shortDate(date: string): string {
  return format(new Date(`${date}T00:00:00`), 'd MMM', { locale: ptBR })
}

// Gráfico de área/linha simples de série única (evolução do saldo). SVG
// inline, sem lib — escala uniforme (viewBox fixo + width 100%) pra não
// distorcer a espessura do traço. Cor da marca pra linha e área (~12%).
export function BalanceChart({ series }: BalanceChartProps) {
  if (series.length < 2) return null

  const times = series.map((p) => new Date(`${p.date}T00:00:00`).getTime())
  const balances = series.map((p) => p.balance)
  const tMin = Math.min(...times)
  const tMax = Math.max(...times)
  const bMin = Math.min(...balances)
  const bMax = Math.max(...balances)
  const pad = (bMax - bMin) * 0.12 || Math.abs(bMax) * 0.12 || 1
  const yMin = bMin - pad
  const yMax = bMax + pad

  const x = (t: number) => PAD_L + ((t - tMin) / (tMax - tMin)) * (W - PAD_L - PAD_R)
  const y = (b: number) => PAD_T + ((yMax - b) / (yMax - yMin)) * (H - PAD_T - PAD_B)

  const pts = series.map((p, i) => ({ px: x(times[i]!), py: y(p.balance) }))
  const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.px.toFixed(1)} ${p.py.toFixed(1)}`).join(' ')
  const bottom = H - PAD_B
  const area = `${line} L ${pts[pts.length - 1]!.px.toFixed(1)} ${bottom} L ${pts[0]!.px.toFixed(1)} ${bottom} Z`
  const end = pts[pts.length - 1]!

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="Evolução do saldo">
      <path d={area} className="fill-brand-500" fillOpacity={0.12} />
      <path d={line} className="stroke-brand-500" strokeWidth={2} fill="none" strokeLinejoin="round" strokeLinecap="round" />
      {/* anel na cor da superfície + ponto na ponta */}
      <circle cx={end.px} cy={end.py} r={4.5} className="fill-surface-light dark:fill-surface-dark-elevated" />
      <circle cx={end.px} cy={end.py} r={3} className="fill-brand-500" />
      <text x={PAD_L} y={H - 6} className="fill-light-secondary text-[9px] dark:fill-dark-secondary">
        {shortDate(series[0]!.date)}
      </text>
      <text
        x={W - PAD_R}
        y={H - 6}
        textAnchor="end"
        className="fill-light-secondary text-[9px] dark:fill-dark-secondary"
      >
        {shortDate(series[series.length - 1]!.date)}
      </text>
    </svg>
  )
}
