import { asyncHandler } from '../../utils/asyncHandler'
import * as service from './categories.service'

export const list = asyncHandler(async (req, res) => {
  res.json(await service.list(req.user!.id))
})

export const create = asyncHandler(async (req, res) => {
  res.status(201).json(await service.create(req.user!.id, req.body))
})

export const remove = asyncHandler(async (req, res) => {
  await service.remove(req.user!.id, String(req.params.id))
  res.status(204).send()
})