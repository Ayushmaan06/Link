import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

// Add runtime config for Vercel
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required')
})

// Lazy load dependencies to avoid build issues
async function getAuthDependencies() {
  try {
    const { prisma } = await import('@/lib/prisma')
    const { comparePassword, generateToken } = await import('@/lib/auth')
    return { prisma, comparePassword, generateToken }
  } catch (error) {
    console.error('Failed to load auth dependencies:', error)
    throw new Error('Authentication service unavailable')
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = loginSchema.parse(body)

    // Load dependencies dynamically
    const { prisma, comparePassword, generateToken } = await getAuthDependencies()

    // Find user
    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Verify password
    const isValidPassword = await comparePassword(password, user.password)
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Generate token
    const token = generateToken({
      userId: user.id,
      email: user.email
    })

    // Set cookie and return response
    const response = NextResponse.json({
      message: 'Login successful',
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

    console.error('Login error:', error)
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
