import { asyncHandler } from '../../utils/asyncHandler'
import * as service from './analytics.service'
import type { SummaryQuery } from './analytics.schemas'

export const summary = asyncHandler(async (req, res) => {
  const { month } = res.locals.query as SummaryQuery
  res.json(await service.getSummary(req.user!.id, month))
})