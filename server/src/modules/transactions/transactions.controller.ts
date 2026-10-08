import { asyncHandler } from '../../utils/asyncHandler'
import * as service from './transactions.service'
import type { ExportQuery, ListQuery } from './transactions.schemas'

export const list = asyncHandler(async (req, res) => {
  res.json(await service.list(req.user!.id, res.locals.query as ListQuery))
})

export const exportCsv = asyncHandler(async (req, res) => {
  const csv = await service.exportCsv(req.user!.id, res.locals.query as ExportQuery)
  res.setHeader('Content-Type', 'text/csv; charset=utf-8')
  res.setHeader('Content-Disposition', 'attachment; filename="spendwise-transactions.csv"')
  res.setHeader('Cache-Control', 'no-store')
  res.send(csv)
})

export const getOne = asyncHandler(async (req, res) => {
  res.json(await service.getOne(req.user!.id, String(req.params.id)))
})

export const create = asyncHandler(async (req, res) => {
  res.status(201).json(await service.create(req.user!.id, req.body))
})

export const update = asyncHandler(async (req, res) => {
  res.json(await service.update(req.user!.id, String(req.params.id), req.body))
})

export const remove = asyncHandler(async (req, res) => {
  await service.remove(req.user!.id, String(req.params.id))
  res.status(204).send()
})