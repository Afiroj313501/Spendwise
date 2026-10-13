import { beforeAll, describe, expect, it } from 'vitest'
import { addTransaction, bearer, categoryId, createUser, http, prisma } from '../helpers'
import type { TestUser } from '../helpers'

let alice: TestUser
let bob: TestUser
let aliceFood: string
let txId: string
let budgetId: string
let goalId: string

const asBob = () => ({ Authorization: bearer(bob.token) })

beforeAll(async () => {
  alice = await createUser('Alice')
  bob = await createUser('Bob')

  aliceFood = await categoryId(alice, 'Food & Dining')
  txId = (
    await addTransaction(alice, {
      amount: '100',
      type: 'EXPENSE',
      date: '2025-03-10',
      description: 'Alice lunch',
      categoryId: aliceFood,
    })
  ).id

  budgetId = (
    await http()
      .put('/api/budgets')
      .set('Authorization', bearer(alice.token))
      .send({ categoryId: aliceFood, month: '2025-03', amount: '500' })
  ).body.id
  goalId = (
    await http()
      .post('/api/goals')
      .set('Authorization', bearer(alice.token))
      .send({ name: 'Alice goal', targetAmount: '1000', savedAmount: '200' })
  ).body.id
})

describe("a user cannot reach another user's transactions", () => {
  it('cannot read, edit or delete them, and nothing changes', async () => {
    expect((await http().get(`/api/transactions/${txId}`).set(asBob())).status).toBe(404)
    expect((await http().patch(`/api/transactions/${txId}`).set(asBob()).send({ amount: '1' })).status).toBe(404)
    expect((await http().delete(`/api/transactions/${txId}`).set(asBob())).status).toBe(404)

    const row = await prisma.transaction.findUniqueOrThrow({ where: { id: txId } })
    expect(row.amount.toFixed(2)).toBe('100.00')
  })

  it('does not see them in lists, search or exports', async () => {
    const list = await http().get('/api/transactions?search=lunch').set(asBob())
    expect(list.body.meta.total).toBe(0)

    const csv = await http().get('/api/transactions/export').set(asBob())
    expect(csv.text.replace(/^\uFEFF/, '').trimEnd()).toBe('Date,Type,Category,Description,Amount')
  })

  it('cannot attach a transaction to their category', async () => {
    const res = await http()
      .post('/api/transactions')
      .set(asBob())
      .send({ amount: '10', type: 'EXPENSE', date: '2025-03-10', categoryId: aliceFood })
    expect(res.status).toBe(400)
  })
})

describe("a user cannot reach another user's categories, budgets or goals", () => {
  it('cannot delete their category', async () => {
    expect((await http().delete(`/api/categories/${aliceFood}`).set(asBob())).status).toBe(404)
    expect(await prisma.category.count({ where: { id: aliceFood } })).toBe(1)
  })

  it('cannot create, see or delete their budgets', async () => {
    const create = await http()
      .put('/api/budgets')
      .set(asBob())
      .send({ categoryId: aliceFood, month: '2025-03', amount: '1' })
    expect(create.status).toBe(400)
    expect((await http().get('/api/budgets?month=2025-03').set(asBob())).body.budgets).toEqual([])
    expect((await http().delete(`/api/budgets/${budgetId}`).set(asBob())).status).toBe(404)
    expect(await prisma.budget.count({ where: { id: budgetId } })).toBe(1)
  })

  it('cannot see, change, fund or delete their goals', async () => {
    expect((await http().get('/api/goals').set(asBob())).body).toEqual([])
    expect((await http().patch(`/api/goals/${goalId}`).set(asBob()).send({ name: 'Hacked' })).status).toBe(404)
    expect((await http().post(`/api/goals/${goalId}/funds`).set(asBob()).send({ amount: '10', action: 'add' })).status).toBe(404)
    expect((await http().post(`/api/goals/${goalId}/funds`).set(asBob()).send({ amount: '10', action: 'withdraw' })).status).toBe(404)
    expect((await http().delete(`/api/goals/${goalId}`).set(asBob())).status).toBe(404)

    const goal = await prisma.savingsGoal.findUniqueOrThrow({ where: { id: goalId } })
    expect(goal.name).toBe('Alice goal')
    expect(goal.savedAmount.toFixed(2)).toBe('200.00')
  })
})

describe('analytics only include your own data', () => {
  it('shows a new user zeros', async () => {
    const summary = await http().get('/api/analytics/summary?month=2025-03').set(asBob())
    expect(summary.body.expense.current).toBe('0.00')
    expect(summary.body.balance.current).toBe('0.00')

    const breakdown = await http().get('/api/analytics/breakdown?month=2025-03').set(asBob())
    expect(breakdown.body.items).toEqual([])

    const report = await http().get('/api/analytics/report?month=2025-03').set(asBob())
    expect(report.body.transactionCount).toBe(0)
  })
})

describe('every protected route requires login', () => {
  it.each([
    ['get', '/api/auth/me'],
    ['get', '/api/categories'],
    ['get', '/api/transactions'],
    ['get', '/api/transactions/export'],
    ['post', '/api/transactions'],
    ['get', '/api/budgets?month=2025-03'],
    ['get', '/api/goals'],
    ['get', '/api/analytics/summary?month=2025-03'],
    ['get', '/api/analytics/cashflow?month=2025-03'],
    ['get', '/api/analytics/breakdown?month=2025-03'],
    ['get', '/api/analytics/report?month=2025-03'],
  ] as const)('%s %s', async (method, path) => {
    expect((await http()[method](path)).status).toBe(401)
  })
})
