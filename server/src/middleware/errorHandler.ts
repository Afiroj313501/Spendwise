import type { ErrorRequestHandler, RequestHandler } from 'express'
import { AppError } from '../utils/AppError'

export const notFound: RequestHandler = (_req, res) => {
  res.status(404).json({ message: 'Route not found' })
}

type HttpError = Error & { type?: string }

export const errorHandler: ErrorRequestHandler = (err: HttpError, req, res, _next) => {
  if (err instanceof AppError) {
    res.status(err.status).json({ message: err.message, details: err.details })
    return
  }
  if (err.type === 'entity.parse.failed') {
    res.status(400).json({ message: 'Invalid JSON in request body' })
    return
  }
  if (err.type === 'entity.too.large') {
    res.status(413).json({ message: 'Request body is too large' })
    return
  }

  console.error(`${req.method} ${req.originalUrl}`, err)
  res.status(500).json({ message: 'Something went wrong' })
}