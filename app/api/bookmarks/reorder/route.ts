import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/middleware'

const reorderSchema = z.object({
  bookmarkIds: z.array(z.string())
})

export async function PUT(request: NextRequest) {
  try {
    const user = requireAuth(request)
    const body = await request.json()
    const { bookmarkIds } = reorderSchema.parse(body)

    // Verify all bookmarks belong to the user
    const bookmarks = await prisma.bookmark.findMany({
      where: {
        id: { in: bookmarkIds },
        userId: user.userId
      }
    })

    if (bookmarks.length !== bookmarkIds.length) {
      return NextResponse.json(
        { error: 'Some bookmarks not found' },
        { status: 404 }
      )
    }

    // Update order for each bookmark
    const updatePromises = bookmarkIds.map((id: string, index: number) => 
      prisma.bookmark.update({
        where: { id },
        data: { order: index }
      })
    )

    await Promise.all(updatePromises)

    return NextResponse.json({ message: 'Bookmarks reordered successfully' })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error('Reorder bookmarks error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
