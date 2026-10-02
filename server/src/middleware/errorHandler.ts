import type { ErrorRequestHandler, RequestHandler } from 'express'
import { AppError } from '../utils/AppError'

export const notFound: RequestHandler = (_req, res) => {
  res.status(404).json({ message: 'Route not found' })
}

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof AppError) {
    res.status(err.status).json({ message: err.message, details: err.details })
    return
  }
  console.error(err)
  res.status(500).json({ message: 'Something went wrong' })
}