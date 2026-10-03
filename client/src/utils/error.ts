import { ApiError } from '../services/api'

export function errorMessage(err: unknown) {
  if (err instanceof ApiError) return err.details?.[0]?.message ?? err.message
  return 'Cannot reach the server'
}