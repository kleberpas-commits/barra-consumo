import { expect, test } from 'claude-code/testing'

const BAND = {
  plugin: 'barra-consumo',
  component: 'AbovePrompt',
  requestId: 'band',
  props: {
    hasSurvey: false,
    isWorking: false,
    maxRows: 10,
    bodyColumns: 100,
  },
} as any

const LIMITS = [
  { kind: 'seven_day', percentUsed: 82, resetsAt: '2099-01-01T00:00:00Z' },
  { kind: 'five_hour', percentUsed: 24 },
]

test('a faixa mostra as duas janelas, 5h antes da semana, em todas as superfícies', async ($, on) => {
  on('state.get', () => ({ value: { value: LIMITS, version: 1 } }))
  on('clock.now', () => ({ value: Date.parse('2098-12-30T12:00:00Z') }))
  on('ui.render', ($, e) => {
    const { Text } = $.ui.resolve(e)

    return <Text>engine</Text>
  })

  for (const surface of ['terminal', 'desktop'] as const) {
    const ui = await $.ui.mount({ ...BAND, surface })

    expect((await ui.find({ type: 'Text', text: /24%/ }))?.text).toBe(' 24%')
    expect((await ui.find({ type: 'Text', text: /82%/ }))?.text).toBe(' 82%')
    expect(await ui.find({ type: 'Text', text: /reinicia em 1d 12h/ })).toBeTruthy()
    expect(await ui.find({ type: 'Text', text: /Sessão 5h/ })).toBeTruthy()
    expect(await ui.find({ type: 'Text', text: /Semana/ })).toBeTruthy()
    await ui.unmount()
  }
})

test('sem dados do plano (conta de API) a faixa fica em branco', async ($, on) => {
  on('state.get', () => ({ value: { value: [], version: 1 } }))
  on('ui.render', ($, e) => {
    const { Text } = $.ui.resolve(e)

    return <Text>engine</Text>
  })

  const ui = await $.ui.mount({ ...BAND, surface: 'terminal' })

  expect(await ui.find({ type: 'Text', text: /%/ })).toBeFalsy()
  expect((await ui.find({ type: 'Text', text: /engine/ }))?.text).toBe('engine')
  await ui.unmount()
})
