import { atom, read, update } from 'claude-code'
import type { Register } from 'claude-code'

import type { Limit } from '../types'

const limits = atom({ plugin: 'barra-consumo', key: 'limits' } as const, [] as Limit[])

const WIDTH = 12

const LABELS: Record<string, string> = {
  five_hour: 'Sessão 5h',
  seven_day: 'Semana',
  spend_limit: 'Gasto'
}

// Ordem fixa: 5h, semana, depois qualquer outra janela.
const ORDER = ['five_hour', 'seven_day']

const sorted = (all: readonly Limit[]): Limit[] =>
  [...all].sort((a, b) => {
    const ia = ORDER.indexOf(a.kind)
    const ib = ORDER.indexOf(b.kind)

    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib)
  })

const bar = (percent: number): string => {
  const clamped = Math.max(0, Math.min(100, percent))
  const filled = Math.round((clamped / 100) * WIDTH)

  return '█'.repeat(filled) + '░'.repeat(WIDTH - filled)
}

const colorOf = (percent: number): string =>
  percent >= 80 ? 'error' : percent >= 50 ? 'warning' : 'success'

const countdown = (resetsAt: string | undefined, now: number): string => {
  if (!resetsAt) return ''

  const diff = Math.floor((Date.parse(resetsAt) - now) / 1000)

  if (Number.isNaN(diff)) return ''
  if (diff <= 0) return ' · reinicia já'

  const d = Math.floor(diff / 86400)
  const h = Math.floor((diff % 86400) / 3600)
  const m = Math.floor((diff % 3600) / 60)

  if (d > 0) return ` · reinicia em ${d}d ${h}h`
  if (h > 0) return ` · reinicia em ${h}h ${String(m).padStart(2, '0')}min`

  return ` · reinicia em ${m}min`
}

const plain = (all: readonly Limit[]): Limit[] =>
  all.map(l => ({ kind: l.kind, percentUsed: l.percentUsed, resetsAt: l.resetsAt }))

export const register: Register = on => {
  // Valor inicial: o que o motor já souber ao abrir/recarregar a sessão.
  on('session.start', async ($, e, next) => {
    try {
      const usage = await $.session.usage()

      if (usage.rateLimits.length > 0) {
        await update($, limits, () => plain(usage.rateLimits))
      }
    } catch {
      // sem leitura ainda: a barra aparece na primeira medição
    }

    return next(e)
  })

  // Atualização: o motor avisa quando uma janela avança um ponto inteiro.
  on('session.measure', async ($, e, next) => {
    if (e.changed.includes('rateLimits')) {
      await update($, limits, () => plain(e.rateLimits))
    }

    return next(e)
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const all = await read($, limits)

    // Cede o lugar a pesquisas de satisfação; sem dados (conta de API), não desenha nada.
    if (e.props.hasSurvey || all.length === 0) {
      return next(e)
    }

    const now = await $.clock.now()
    const { Box, Text } = $.ui.resolve(e)

    return (
      <Box flexDirection="row" gap={2}>
        {sorted(all).map(l => {
          const percent = Math.round(l.percentUsed)

          return (
            <Box key={l.kind} flexDirection="row">
              <Text dimColor>{LABELS[l.kind] ?? l.kind} </Text>
              <Text color={colorOf(l.percentUsed)}>{bar(l.percentUsed)}</Text>
              <Text> {percent}%</Text>
              <Text dimColor>{countdown(l.resetsAt, now)}</Text>
            </Box>
          )
        })}
      </Box>
    )
  })
}
