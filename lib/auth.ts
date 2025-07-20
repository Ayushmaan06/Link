import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'

// Validate JWT_SECRET at runtime
const getJWTSecret = () => {
  const secret = process.env.JWT_SECRET
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is required')
  }
  return secret
}

export interface JWTPayload {
  userId: string
  email: string
}

export const hashPassword = async (password: string): Promise<string> => {
  return await bcrypt.hash(password, 12)
}

export const comparePassword = async (password: string, hashedPassword: string): Promise<boolean> => {
  return await bcrypt.compare(password, hashedPassword)
}

export const generateToken = (payload: JWTPayload): string => {
  const secret = getJWTSecret()
  return jwt.sign(payload, secret, { expiresIn: '7d' })
}

export const verifyToken = (token: string): JWTPayload | null => {
  try {
    const secret = getJWTSecret()
    return jwt.verify(token, secret) as JWTPayload
  } catch (error) {
    return null
  }
}
