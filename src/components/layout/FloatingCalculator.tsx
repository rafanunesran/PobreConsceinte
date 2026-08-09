import { useEffect, useRef, useState } from 'react'
import { X, Move } from 'lucide-react'

// Calculadora "flutuante" não-modal: sobrepõe a tela (position: fixed, z alto)
// mas NÃO usa overlay/backdrop — logo não bloqueia o resto da tela, dá pra
// clicar/rolar tudo o que está atrás normalmente. É arrastável pela barra de
// título (mouse e toque). O tipo de janela que o usuário descreveu ("um frame
// que sobrepõe sem bloquear") costuma ser chamado de painel/janela flutuante
// ou não-modal.

interface FloatingCalculatorProps {
  onClose: () => void
}

// Avalia a sequência de tokens respeitando precedência (× ÷ antes de + −),
// sem usar eval. Trabalha só com os operadores que os botões produzem.
function calculate(tokens: (number | string)[]): number {
  if (tokens.length === 0) return 0
  // Primeiro passo: resolve × e ÷.
  const pass1: (number | string)[] = [tokens[0] as number]
  for (let i = 1; i < tokens.length; i += 2) {
    const op = tokens[i] as string
    const next = tokens[i + 1] as number
    if (op === '×' || op === '÷') {
      const prev = pass1.pop() as number
      pass1.push(op === '×' ? prev * next : prev / next)
    } else {
      pass1.push(op, next)
    }
  }
  // Segundo passo: resolve + e −.
  let result = pass1[0] as number
  for (let i = 1; i < pass1.length; i += 2) {
    const op = pass1[i] as string
    const next = pass1[i + 1] as number
    result = op === '+' ? result + next : result - next
  }
  return result
}

const KEYS = [
  ['C', '÷', '×', '⌫'],
  ['7', '8', '9', '−'],
  ['4', '5', '6', '+'],
  ['1', '2', '3', '='],
  ['0', '.'],
] as const

export function FloatingCalculator({ onClose }: FloatingCalculatorProps) {
  const [display, setDisplay] = useState('0')
  // Tokens já confirmados (números e operadores) + o número em edição no display.
  const [tokens, setTokens] = useState<(number | string)[]>([])
  const [justEvaluated, setJustEvaluated] = useState(false)

  const panelRef = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null)
  const dragState = useRef<{ startX: number; startY: number; baseX: number; baseY: number } | null>(
    null,
  )

  // Posição inicial: canto inferior direito (acima da bottom nav no mobile).
  useEffect(() => {
    if (pos) return
    const w = 288
    const h = 380
    const x = Math.max(12, window.innerWidth - w - 16)
    const y = Math.max(12, window.innerHeight - h - 96)
    setPos({ x, y })
  }, [pos])

  useEffect(() => {
    function onMove(e: PointerEvent) {
      const st = dragState.current
      if (!st) return
      const nextX = st.baseX + (e.clientX - st.startX)
      const nextY = st.baseY + (e.clientY - st.startY)
      const w = panelRef.current?.offsetWidth ?? 288
      const h = panelRef.current?.offsetHeight ?? 380
      setPos({
        x: Math.min(Math.max(8, nextX), window.innerWidth - w - 8),
        y: Math.min(Math.max(8, nextY), window.innerHeight - h - 8),
      })
    }
    function onUp() {
      dragState.current = null
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
  }, [])

  function startDrag(e: React.PointerEvent) {
    if (!pos) return
    dragState.current = { startX: e.clientX, startY: e.clientY, baseX: pos.x, baseY: pos.y }
  }

  function inputDigit(d: string) {
    setDisplay((prev) => {
      if (justEvaluated) {
        setJustEvaluated(false)
        return d
      }
      if (prev === '0') return d
      return prev + d
    })
    if (justEvaluated) {
      setTokens([])
    }
  }

  function inputDot() {
    setDisplay((prev) => {
      if (justEvaluated) {
        setJustEvaluated(false)
        setTokens([])
        return '0.'
      }
      if (prev.includes('.')) return prev
      return prev + '.'
    })
  }

  function inputOperator(op: string) {
    setTokens((prev) => [...prev, parseFloat(display), op])
    setDisplay('0')
    setJustEvaluated(false)
  }

  function evaluate() {
    const all = [...tokens, parseFloat(display)]
    const result = calculate(all)
    const formatted = Number.isFinite(result)
      ? parseFloat(result.toFixed(10)).toString()
      : 'Erro'
    setDisplay(formatted)
    setTokens([])
    setJustEvaluated(true)
  }

  function clearAll() {
    setDisplay('0')
    setTokens([])
    setJustEvaluated(false)
  }

  function backspace() {
    setDisplay((prev) => {
      if (justEvaluated) {
        setJustEvaluated(false)
        return '0'
      }
      if (prev.length <= 1 || (prev.length === 2 && prev.startsWith('-'))) return '0'
      return prev.slice(0, -1)
    })
  }

  function handleKey(key: string) {
    if (key >= '0' && key <= '9') return inputDigit(key)
    switch (key) {
      case '.':
        return inputDot()
      case '+':
      case '−':
      case '×':
      case '÷':
        return inputOperator(key)
      case '=':
        return evaluate()
      case 'C':
        return clearAll()
      case '⌫':
        return backspace()
    }
  }

  // Teclado do PC: mantém um ref pro handler mais recente (evita closure
  // stale) e registra UM listener global. Ignora quando o foco está num
  // campo de texto da página (a calculadora é não-modal — não pode
  // sequestrar o que a pessoa digita num input/textarea atrás dela).
  const handleKeyRef = useRef<(key: string) => void>(() => {})
  handleKeyRef.current = handleKey

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return
      }

      const k = e.key
      let mapped: string | null = null
      if (k >= '0' && k <= '9') mapped = k
      else if (k === '.' || k === ',') mapped = '.'
      else if (k === '+') mapped = '+'
      else if (k === '-') mapped = '−'
      else if (k === '*') mapped = '×'
      else if (k === '/') mapped = '÷'
      else if (k === 'Enter' || k === '=') mapped = '='
      else if (k === 'Backspace') mapped = '⌫'
      else if (k === 'Delete' || k === 'c' || k === 'C') mapped = 'C'
      else if (k === 'Escape') {
        onClose()
        return
      }

      if (mapped) {
        e.preventDefault()
        handleKeyRef.current(mapped)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  // Prévia da expressão (tokens confirmados) acima do display.
  const expression = tokens
    .map((t) => (typeof t === 'number' ? parseFloat(t.toFixed(10)).toString() : t))
    .join(' ')

  if (!pos) return null

  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-label="Calculadora"
      className="fixed z-40 w-72 select-none rounded-2xl border border-border-light bg-surface-light shadow-2xl dark:border-border-dark dark:bg-surface-dark-elevated"
      style={{ left: pos.x, top: pos.y }}
    >
      <div
        onPointerDown={startDrag}
        className="flex cursor-move items-center justify-between rounded-t-2xl bg-brand-500 px-3 py-2 text-white"
      >
        <span className="flex items-center gap-2 text-sm font-medium">
          <Move size={16} />
          Calculadora
        </span>
        <button
          type="button"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={onClose}
          aria-label="Fechar calculadora"
          className="flex h-7 w-7 items-center justify-center rounded-full transition-colors hover:bg-white/20"
        >
          <X size={18} />
        </button>
      </div>

      <div className="px-3 pt-3">
        <div className="h-4 truncate text-right text-xs text-light-secondary dark:text-dark-secondary">
          {expression}
        </div>
        <div className="truncate text-right text-3xl font-semibold text-light-primary dark:text-dark-primary">
          {display}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2 p-3">
        {KEYS.flat().map((key) => {
          const isOperator = ['÷', '×', '−', '+', '='].includes(key)
          const isFn = key === 'C' || key === '⌫'
          const isEquals = key === '='
          const isZero = key === '0'
          return (
            <button
              key={key}
              type="button"
              onClick={() => handleKey(key)}
              className={[
                'flex h-11 items-center justify-center rounded-xl text-lg font-medium transition-colors',
                isZero ? 'col-span-2' : '',
                isEquals
                  ? 'bg-brand-500 text-white hover:bg-brand-600'
                  : isOperator
                    ? 'bg-brand-500/10 text-brand-500 hover:bg-brand-500/20'
                    : isFn
                      ? 'bg-black/5 text-light-secondary hover:bg-black/10 dark:bg-white/10 dark:text-dark-secondary dark:hover:bg-white/20'
                      : 'bg-black/5 text-light-primary hover:bg-black/10 dark:bg-white/5 dark:text-dark-primary dark:hover:bg-white/10',
              ].join(' ')}
            >
              {key}
            </button>
          )
        })}
      </div>
    </div>
  )
}
