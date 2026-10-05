import { asyncHandler } from '../../utils/asyncHandler'
import * as service from './analytics.service'
import type { CashflowQuery, SummaryQuery } from './analytics.schemas'

export const summary = asyncHandler(async (req, res) => {
  const { month } = res.locals.query as SummaryQuery
  res.json(await service.getSummary(req.user!.id, month))
})

export const cashflow = asyncHandler(async (req, res) => {
  const { month, months } = res.locals.query as CashflowQuery
  res.json(await service.getCashflow(req.user!.id, month, months))
})

export const breakdown = asyncHandler(async (req, res) => {
  const { month } = res.locals.query as SummaryQuery
  res.json(await service.getBreakdown(req.user!.id, month))
})