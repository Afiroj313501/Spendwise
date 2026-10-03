import { asyncHandler } from '../../utils/asyncHandler'
import * as service from './transactions.service'
import type { ListQuery } from './transactions.schemas'

export const list = asyncHandler(async (req, res) => {
  res.json(await service.list(req.user!.id, res.locals.query as ListQuery))
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