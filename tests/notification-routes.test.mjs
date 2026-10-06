import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import vm from 'node:vm'
import ts from 'typescript'
import * as time from '../lib/notification-time.ts'
const require = createRequire(import.meta.url)
function load(path, mocks, extras = {}) {
  const source = ts.transpileModule(readFileSync(new URL(`../${path}`, import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText
  const exports = {}
  vm.runInNewContext(source, { exports, require: name => mocks[name] ?? require(name),
    console: { log() {}, error() {} }, Date, Set, Buffer, URLSearchParams, setTimeout, ...extras })
  return exports
}
function harness(path, { now = '2026-10-03T15:30:15Z', fiestas, count = 2, tokenError = null, sendFails = false } = {}) {
  const calls = []
  const rows = new Map()
  const tokens = [{ id: 'token-1', token: 'fake-token-1' }, { id: 'token-2', token: 'fake-token-2' }]
  let pushes = 0
  let secret = 'test-secret'
  const db = {
    from(table) {
      const filters = {}; let op = 'select'; let update
      const q = {
        select(...args) { calls.push([table, 'select', ...args]); return q },
        gte(...args) { calls.push([table, 'gte', ...args]); return q },
        lte(...args) { calls.push([table, 'lte', ...args]); return q },
        or(...args) { calls.push([table, 'or', ...args]); return q },
        eq(key, value) { filters[key] = value; return q },
        is(key, value) { filters[key] = value; return q },
        in(key, value) { filters[key] = value; return q },
        update(value) { op = 'update'; update = value; return q },
        delete() { op = 'delete'; return q },
        async then(resolve) {
          if (table === 'festas') return resolve({ data: fiestas ?? [{ id: 'party-1', data: '2026-10-03', horario: '13:30' }], count, error: null })
          if (table === 'device_tokens') return resolve({ data: tokens, error: tokenError })
          for (const [key, row] of rows) {
            if (filters.token_id.includes(row.token_id) && row.festa_id === filters.festa_id && row.scheduled_start === filters.scheduled_start) {
              if (op === 'delete' && !row.sent_at) rows.delete(key)
              if (op === 'update') Object.assign(row, update)
            }
          }
          resolve({ error: null })
        },
      }; return q
    },
    async rpc(name, params) {
      assert.equal(name, 'claim_festa_reminders')
      const data = []
      for (const token_id of params.p_token_ids) {
        const key = `${params.p_festa_id}:${params.p_scheduled_start}:${token_id}`
        if (!rows.has(key)) { rows.set(key, { token_id, festa_id: params.p_festa_id, scheduled_start: params.p_scheduled_start }); data.push({ token_id }) }
      }
      return { data, error: null }
    },
  }
  class Clock extends Date { constructor(...args) { super(...(args.length ? args : [now])) } static now() { return new Date(now).getTime() } }
  const module = load(path, {
    'next/server': { NextResponse: { json: (body, options) => ({ body, status: options?.status ?? 200 }) } },
    '@/lib/supabase/server': { createServiceClient: () => db },
    '@/lib/notification-time': time,
    '@/lib/fcm-server': { async sendPushNotificationToMany(recipients, title, body, data) {
      pushes++; calls.push(['push', recipients, title, body, data])
      return { sent: sendFails ? 0 : recipients.length, failed: sendFails ? recipients.length : 0, invalidTokens: [],
        deliveries: recipients.map(token => ({ token, success: !sendFails })) }
    } },
  }, { Date: Clock, process: { env: { get CRON_SECRET() { return secret } } } })
  return { calls, rows, tokens, get pushes() { return pushes }, secret(value) { secret = value },
    get: (dry = false) => module.GET({ headers: new Headers({ authorization: `Bearer ${secret}` }), nextUrl: new URL(`https://test.local/${dry ? '?dry_run=true' : ''}`) }) }
}
const reminder = 'app/api/cron/uma-hora-antes/route.ts'
const weekend = 'app/api/cron/agenda-fim-de-semana/route.ts'
test('aviso no horário certo, deduplicado em duas execuções', async () => {
  const h = harness(reminder)
  assert.equal((await h.get()).body.sent, 2)
  assert.equal((await h.get()).body.sent, 0)
  assert.equal(h.pushes, 1)
  const data = h.calls.find(c => c[0] === 'push')[4]
  assert.equal(data.expires_at, '2026-10-03T15:35:00.000Z')
  assert.ok(data.tag.includes('party-1'))
})
test('execuções simultâneas não repetem envios', async () => {
  const h = harness(reminder)
  const results = await Promise.all([h.get(), h.get()])
  assert.equal(results.reduce((n, r) => n + r.body.sent, 0), 2)
  assert.equal(h.pushes, 1)
})
test('falha libera reserva para nova tentativa', async () => {
  const h = harness(reminder, { sendFails: true })
  assert.equal((await h.get()).status, 502)
  assert.equal(h.rows.size, 0)
  await h.get()
  assert.equal(h.pushes, 2)
})
test('não envia às 09h30 UTC para festa às 13h30 de São Paulo', async () => {
  const h = harness(reminder, { now: '2026-10-03T09:30Z' })
  assert.equal((await h.get()).body.sent, 0)
  assert.equal(h.pushes, 0)
})
test('diagnóstico não envia e não reserva', async () => {
  const h = harness(reminder)
  assert.equal((await h.get(true)).body.festas, 1)
  assert.equal(h.rows.size, 0)
  assert.equal(h.pushes, 0)
})
test('segredo ausente nunca autoriza', async () => {
  for (const path of [reminder, weekend]) {
    const h = harness(path); h.secret(undefined)
    assert.equal((await h.get()).status, 401)
  }
})
test('resumo usa contagem exata, sem filtro de conclusão, e convida a conferir a agenda', async () => {
  const h = harness(weekend, { count: 1501 })
  assert.equal((await h.get()).body.festas, 1501)
  const select = h.calls.find(c => c[0] === 'festas' && c[1] === 'select')
  assert.equal(select[3].count, 'exact'); assert.equal(select[3].head, true)
  assert.ok(!h.calls.some(c => c[1] === 'or'))
  const push = h.calls.find(c => c[0] === 'push')
  assert.equal(push[3], 'Esse final de semana tem 1501 festas. Entre e confira!')
})
test('erro na consulta dos dispositivos retorna falha', async () => {
  const h = harness(reminder, { tokenError: { message: 'simulated' } })
  assert.equal((await h.get()).status, 500); assert.equal(h.pushes, 0)
})
test('TTL de FCM e expiração, sem chamar serviço externo', async () => {
  let payload
  const now = Date.now()
  const server = load('lib/fcm-server.ts', {}, {
    process: { env: { FIREBASE_PROJECT_ID: 'test' } },
    fetch: async (_, options) => { payload = JSON.parse(options.body); return { ok: true, json: async () => ({ name: 'fake-message' }) } },
  })
  // Injeta token fictício no cache apenas dentro deste VM.
  const source = readFileSync(new URL('../lib/fcm-server.ts', import.meta.url), 'utf8').replace('let cachedAccessToken: { token: string; expiresAt: number } | null = null', `let cachedAccessToken: { token: string; expiresAt: number } | null = { token: 'fake', expiresAt: ${now + 3600000} }`)
  const exports = {}
  vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, {
    exports, process: { env: { FIREBASE_PROJECT_ID: 'test' } }, Date, Buffer, setTimeout,
    fetch: async (_, options) => { payload = JSON.parse(options.body); return { ok: true, json: async () => ({ name: 'fake-message' }) } },
  })
  const result = await exports.sendPushNotification({ token: 'fake', title: 'test', body: 'test', data: { expires_at: new Date(now + 300000).toISOString(), tag: 'party-1' } })
  assert.equal(result.success, true)
  assert.ok(+payload.message.webpush.headers.TTL <= 300)
  assert.equal(payload.message.android.ttl, `${payload.message.webpush.headers.TTL}s`)
  payload = null
  const expired = await server.sendPushNotification({ token: 'fake', title: 'test', body: 'test', data: { expires_at: new Date(now - 1000).toISOString() } })
  assert.equal(expired.error, 'NOTIFICATION_EXPIRED'); assert.equal(payload, null)
})
