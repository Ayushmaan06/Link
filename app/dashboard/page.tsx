'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'

import AddBookmarkForm from '@/components/AddBookmarkForm'
import BookmarkCard from '@/components/BookmarkCard'
import TagFilter from '@/components/TagFilter'
import ThemeToggle from '@/components/ThemeToggle'
import { Bookmark } from '@/types'

export default function DashboardPage() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([])
  const [filteredBookmarks, setFilteredBookmarks] = useState<Bookmark[]>([])
  const [allTags, setAllTags] = useState<string[]>([])
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<{ email: string } | null>(null)
  const router = useRouter()

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Load bookmarks and check authentication
  useEffect(() => {
    loadBookmarks()
  }, [])

  // Filter bookmarks based on search and tags
  useEffect(() => {
    let filtered = bookmarks

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter((bookmark: Bookmark) =>
        bookmark.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        bookmark.url.toLowerCase().includes(searchQuery.toLowerCase()) ||
        bookmark.summary?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Filter by selected tags
    if (selectedTags.length > 0) {
      filtered = filtered.filter((bookmark: Bookmark) =>
        selectedTags.some((tag: string) => bookmark.tags.indexOf(tag) !== -1)
      )
    }

    setFilteredBookmarks(filtered)
  }, [bookmarks, searchQuery, selectedTags])

  // Extract all unique tags
  useEffect(() => {
    const tags = new Set<string>()
    bookmarks.forEach((bookmark: Bookmark) => {
      bookmark.tags.forEach((tag: string) => tags.add(tag))
    })
    setAllTags(Array.from(tags).sort())
  }, [bookmarks])

  const loadBookmarks = async () => {
    try {
      const response = await fetch('/api/bookmarks')
      
      if (response.status === 401) {
        router.push('/login')
        return
      }

      if (!response.ok) {
        throw new Error('Failed to load bookmarks')
      }

      const data = await response.json()
      setBookmarks(data.bookmarks || [])
    } catch (error) {
      console.error('Error loading bookmarks:', error)
      // Check if it's an auth error and redirect
      router.push('/login')
    } finally {
      setLoading(false)
    }
  }

  const addBookmark = async (url: string, tags: string[]) => {
    try {
      const response = await fetch('/api/bookmarks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url, tags }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to add bookmark')
      }

      const data = await response.json()
      setBookmarks((prev: Bookmark[]) => [...prev, data.bookmark])
    } catch (error) {
      console.error('Error adding bookmark:', error)
      alert(error instanceof Error ? error.message : 'Failed to add bookmark')
    }
  }

  const updateBookmark = async (id: string, updateData: { title?: string; tags?: string[] }) => {
    try {
      const response = await fetch(`/api/bookmarks/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      })

      if (!response.ok) {
        throw new Error('Failed to update bookmark')
      }

      const data = await response.json()
      setBookmarks((prev: Bookmark[]) => prev.map((bookmark: Bookmark) => 
        bookmark.id === id ? data.bookmark : bookmark
      ))
    } catch (error) {
      console.error('Error updating bookmark:', error)
    }
  }

  const deleteBookmark = async (id: string) => {
    if (!confirm('Are you sure you want to delete this bookmark?')) {
      return
    }

    try {
      const response = await fetch(`/api/bookmarks/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete bookmark')
      }

      setBookmarks((prev: Bookmark[]) => prev.filter((bookmark: Bookmark) => bookmark.id !== id))
    } catch (error) {
      console.error('Error deleting bookmark:', error)
    }
  }

  const updateBookmarkSummary = (id: string, summary: string) => {
    setBookmarks((prev: Bookmark[]) => prev.map((bookmark: Bookmark) => 
      bookmark.id === id ? { ...bookmark, summary } : bookmark
    ))
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = filteredBookmarks.findIndex((bookmark: Bookmark) => bookmark.id === active.id)
      const newIndex = filteredBookmarks.findIndex((bookmark: Bookmark) => bookmark.id === over.id)

      const newOrder = arrayMove(filteredBookmarks, oldIndex, newIndex)
      setFilteredBookmarks(newOrder)

      // Update order in database
      try {
        await fetch('/api/bookmarks/reorder', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            bookmarkIds: newOrder.map((bookmark: Bookmark) => bookmark.id)
          }),
        })

        // Update the main bookmarks array to reflect the new order
        setBookmarks((prev: Bookmark[]) => {
          const updated = [...prev]
          const reorderedIds = newOrder.map((b: Bookmark) => b.id)
          return updated.sort((a, b) => {
            const aIndex = reorderedIds.indexOf(a.id)
            const bIndex = reorderedIds.indexOf(b.id)
            if (aIndex === -1) return 1
            if (bIndex === -1) return -1
            return aIndex - bIndex
          })
        })
      } catch (error) {
        console.error('Error reordering bookmarks:', error)
        // Revert on error
        setFilteredBookmarks(filteredBookmarks)
      }
    }
  }

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      router.push('/login')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Link Saver Dashboard
            </h1>
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <button
                onClick={logout}
                className="btn-secondary"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AddBookmarkForm onAdd={addBookmark} />
        
        <TagFilter
          allTags={allTags}
          selectedTags={selectedTags}
          onTagChange={setSelectedTags}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />

        {/* Bookmarks Grid */}
        <div className="space-y-6">
          {filteredBookmarks.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400 text-lg">
                {bookmarks.length === 0 
                  ? "No bookmarks yet. Add your first one above!" 
                  : "No bookmarks match your current filters."
                }
              </p>
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={filteredBookmarks.map(b => b.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {filteredBookmarks.map((bookmark) => (
                    <BookmarkCard
                      key={bookmark.id}
                      bookmark={bookmark}
                      onDelete={deleteBookmark}
                      onUpdate={updateBookmark}
                      onSummaryUpdate={updateBookmarkSummary}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </div>
      </main>
    </div>
  )
}
