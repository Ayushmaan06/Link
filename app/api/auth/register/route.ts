import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

// Add runtime config for Vercel
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters')
})

// Lazy load dependencies to avoid build issues
async function getAuthDependencies() {
  try {
    const { prisma } = await import('@/lib/prisma')
    const { hashPassword, generateToken } = await import('@/lib/auth')
    return { prisma, hashPassword, generateToken }
  } catch (error) {
    console.error('Failed to load auth dependencies:', error)
    throw new Error('Authentication service unavailable')
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = registerSchema.parse(body)

    // Load dependencies dynamically
    const { prisma, hashPassword, generateToken } = await getAuthDependencies()

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 400 }
      )
    }

    // Hash password and create user
    const hashedPassword = await hashPassword(password)
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword
      }
    })

    // Generate token
    const token = generateToken({
      userId: user.id,
      email: user.email
    })

    // Set cookie and return response
    const response = NextResponse.json({
      message: 'User created successfully',
      user: {
        id: user.id,
        email: user.email
      }
    })

    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    })

    return response
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error('Registration error:', error)
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
