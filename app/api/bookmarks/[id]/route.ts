import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/middleware'

const updateBookmarkSchema = z.object({
  title: z.string().optional(),
  tags: z.array(z.string()).optional()
})

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = requireAuth(request)
    const body = await request.json()
    const updateData = updateBookmarkSchema.parse(body)

    // Check if bookmark exists and belongs to user
    const bookmark = await prisma.bookmark.findFirst({
      where: {
        id: params.id,
        userId: user.userId
      }
    })

    if (!bookmark) {
      return NextResponse.json(
        { error: 'Bookmark not found' },
        { status: 404 }
      )
    }

    // Update bookmark
    const updatedBookmark = await prisma.bookmark.update({
      where: { id: params.id },
      data: updateData
    })

    // Return bookmark (tags are already arrays)
    return NextResponse.json({ bookmark: updatedBookmark })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error('Update bookmark error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = requireAuth(request)

    // Check if bookmark exists and belongs to user
    const bookmark = await prisma.bookmark.findFirst({
      where: {
        id: params.id,
        userId: user.userId
      }
    })

    if (!bookmark) {
      return NextResponse.json(
        { error: 'Bookmark not found' },
        { status: 404 }
      )
    }

    // Delete bookmark
    await prisma.bookmark.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'Bookmark deleted successfully' })
  } catch (error) {
    console.error('Delete bookmark error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
