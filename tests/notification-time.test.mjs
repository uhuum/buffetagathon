import test from 'node:test'
import assert from 'node:assert/strict'
import { localDate, weekendRange, festaStart, reminderDue, reminderWindow } from '../lib/notification-time.ts'

for (const date of ['2026-09-28', '2026-09-29', '2026-09-30', '2026-10-01', '2026-10-02', '2026-10-03', '2026-10-04']) {
  test(`fim de semana correto em ${date}`, () => {
    assert.deepEqual(weekendRange(new Date(`${date}T15:00Z`)), { start: '2026-10-02', end: '2026-10-04' })
  })
}
test('virada de ano', () => assert.deepEqual(weekendRange(new Date('2026-12-31T15:00Z')), { start: '2027-01-01', end: '2027-01-03' }))
test('domingo à noite ainda pertence ao fim de semana atual em São Paulo', () => {
  const now = new Date('2026-10-05T01:00Z')
  assert.equal(localDate(now), '2026-10-04')
  assert.deepEqual(weekendRange(now), { start: '2026-10-02', end: '2026-10-04' })
})
for (const [date, time, iso] of [
  ['2026-10-03', '19:00', '2026-10-03T22:00:00.000Z'],
  ['2026-10-03', '13:30', '2026-10-03T16:30:00.000Z'],
  ['2026-10-04', '00:30:00', '2026-10-04T03:30:00.000Z'],
  ['2026-10-04', '9:07', '2026-10-04T12:07:00.000Z'],
]) test(`fuso horário e minutos para ${time}`, () => assert.equal(festaStart(date, time).toISOString(), iso))
for (const [date, time] of [['2026-02-30', '13:00'], ['2026-10-04', '24:00'], ['2026-10-04', '13:60'], ['2026-10-04', 'x']]) {
  test(`horário inválido ${date} ${time}`, () => assert.equal(festaStart(date, time), null))
}
test('não envia antes de uma hora; aceita somente atraso curto', () => {
  const start = festaStart('2026-10-03', '13:30')
  for (const [now, expected] of [
    ['2026-10-03T15:29:59Z', false], ['2026-10-03T15:30:00Z', true],
    ['2026-10-03T15:34:59Z', true], ['2026-10-03T15:35:00Z', false],
    ['2026-10-03T16:30:00Z', false], ['2026-10-03T12:30:00Z', false],
  ]) assert.equal(reminderDue(start, new Date(now)), expected, now)
})
test('festa após meia-noite consultada no dia correto', () => {
  const now = new Date('2026-10-04T02:30:00Z') // 23h30 em São Paulo
  assert.equal(reminderDue(festaStart('2026-10-04', '00:30'), now), true)
  assert.deepEqual(reminderWindow(now), { start: '2026-10-04', end: '2026-10-04' })
  assert.deepEqual(reminderWindow(new Date('2026-10-04T02:00:00Z')), { start: '2026-10-03', end: '2026-10-04' })
})
