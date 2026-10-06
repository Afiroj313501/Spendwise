import { asyncHandler } from '../../utils/asyncHandler'
import * as service from './budgets.service'
import type { MonthQuery } from './budgets.schemas'

export const list = asyncHandler(async (req, res) => {
  const { month } = res.locals.query as MonthQuery
  res.json(await service.list(req.user!.id, month))
})

export const save = asyncHandler(async (req, res) => {
  res.json(await service.save(req.user!.id, req.body))
})

export const remove = asyncHandler(async (req, res) => {
  await service.remove(req.user!.id, String(req.params.id))
  res.status(204).send()
})

export const copy = asyncHandler(async (req, res) => {
  res.json(await service.copyMonth(req.user!.id, req.body))
})