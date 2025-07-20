import { NextRequest } from 'next/server'
import { verifyToken, JWTPayload } from './auth'

export const getTokenFromRequest = (request: NextRequest): string | null => {
  // Check Authorization header
  const authHeader = request.headers.get('authorization')
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7)
  }

  // Check cookie
  const cookie = request.cookies.get('token')
  if (cookie) {
    return cookie.value
  }

  return null
}

export const getUserFromRequest = (request: NextRequest): JWTPayload | null => {
  const token = getTokenFromRequest(request)
  if (!token) return null
  
  return verifyToken(token)
}

export class AuthError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AuthError'
  }
}

export const requireAuth = (request: NextRequest): JWTPayload => {
  const user = getUserFromRequest(request)
  if (!user) {
    throw new AuthError('Authentication required')
  }
  return user
}
