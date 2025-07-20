import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/middleware'
import { generateSummary } from '@/lib/utils'

// Add runtime config for Vercel
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = requireAuth(request)
    const bookmarkId = params.id

    // Verify bookmark belongs to user
    const bookmark = await prisma.bookmark.findFirst({
      where: {
        id: bookmarkId,
        userId: user.userId
      }
    })

    if (!bookmark) {
      return NextResponse.json(
        { error: 'Bookmark not found' },
        { status: 404 }
      )
    }

    // Generate new summary
    const summary = await generateSummary(bookmark.url)

    // Update bookmark with new summary
    const updatedBookmark = await prisma.bookmark.update({
      where: { id: bookmarkId },
      data: { summary }
    })

    // Return bookmark (tags are already arrays)
    return NextResponse.json({ 
      bookmark: updatedBookmark,
      message: 'Summary updated successfully'
    })
  } catch (error) {
    console.error('Update summary error:', error)
    return NextResponse.json(
      { error: 'Failed to update summary' },
      { status: 500 }
    )
  }
}
