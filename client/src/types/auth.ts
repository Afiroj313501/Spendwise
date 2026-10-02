export type User = {
  id: string
  name: string
  email: string
  currency: string
}

export type AuthResponse = {
  user: User
  accessToken: string
}