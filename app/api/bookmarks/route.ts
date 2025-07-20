import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/middleware'
import { fetchURLMetadata, generateSummary, isValidURL } from '@/lib/utils'

// Add runtime config for Vercel
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const createBookmarkSchema = z.object({
  url: z.string().url('Invalid URL'),
  tags: z.array(z.string()).optional().default([])
})

export async function GET(request: NextRequest) {
  try {
    const user = requireAuth(request)
    
    const bookmarks = await prisma.bookmark.findMany({
      where: { userId: user.userId },
      orderBy: { order: 'asc' }
    })

    // No need to parse tags - they're already arrays in PostgreSQL
    return NextResponse.json({ bookmarks })
  } catch (error) {
    console.error('Get bookmarks error:', error)
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = requireAuth(request)
    const body = await request.json()
    const { url, tags } = createBookmarkSchema.parse(body)

    if (!isValidURL(url)) {
      return NextResponse.json(
        { error: 'Invalid URL' },
        { status: 400 }
      )
    }

    // Check if bookmark already exists for this user
    const existingBookmark = await prisma.bookmark.findFirst({
      where: {
        userId: user.userId,
        url: url
      }
    })

    if (existingBookmark) {
      return NextResponse.json(
        { error: 'Bookmark already exists' },
        { status: 400 }
      )
    }

    // Fetch metadata and generate summary
    const [metadata, summary] = await Promise.all([
      fetchURLMetadata(url),
      generateSummary(url)
    ])

    // Get the highest order value for proper ordering
    const lastBookmark = await prisma.bookmark.findFirst({
      where: { userId: user.userId },
      orderBy: { order: 'desc' }
    })

    const newOrder = (lastBookmark?.order || 0) + 1

    // Create bookmark
    const bookmark = await prisma.bookmark.create({
      data: {
        title: metadata.title,
        url: url,
        favicon: metadata.favicon,
        summary: summary,
        tags: tags, // Store as PostgreSQL array
        order: newOrder,
        userId: user.userId
      }
    })

    // Return bookmark (tags are already arrays)
    return NextResponse.json({ bookmark }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error('Create bookmark error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
