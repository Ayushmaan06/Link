'use client'

import { useState } from 'react'
import { 
  TrashIcon, 
  TagIcon,
  ArrowTopRightOnSquareIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline'
import { useSortable } from '@dnd-kit/sortable'
import { Bookmark } from '@/types'

interface BookmarkCardProps {
  bookmark: Bookmark
  onDelete: (id: string) => void
  onUpdate: (id: string, data: { title?: string; tags?: string[] }) => void
  onSummaryUpdate?: (id: string, summary: string) => void
}

export default function BookmarkCard({ bookmark, onDelete, onUpdate, onSummaryUpdate }: BookmarkCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(bookmark.title)
  const [editTags, setEditTags] = useState(bookmark.tags.join(', '))
  const [isRefreshingSummary, setIsRefreshingSummary] = useState(false)
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: bookmark.id })

  const style = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const handleSave = async () => {
    const tags = editTags.split(',').map((tag: string) => tag.trim()).filter((tag: string) => tag)
    await onUpdate(bookmark.id, {
      title: editTitle !== bookmark.title ? editTitle : undefined,
      tags: JSON.stringify(tags) !== JSON.stringify(bookmark.tags) ? tags : undefined
    })
    setIsEditing(false)
  }

  const handleCancel = () => {
    setEditTitle(bookmark.title)
    setEditTags(bookmark.tags.join(', '))
    setIsEditing(false)
  }

  const handleRefreshSummary = async () => {
    if (isRefreshingSummary) return
    
    setIsRefreshingSummary(true)
    try {
      const response = await fetch(`/api/bookmarks/${bookmark.id}/summary`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        if (onSummaryUpdate) {
          onSummaryUpdate(bookmark.id, data.bookmark.summary)
        }
      } else {
        console.error('Failed to refresh summary')
      }
    } catch (error) {
      console.error('Error refreshing summary:', error)
    } finally {
      setIsRefreshingSummary(false)
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className="card hover:shadow-lg transition-shadow duration-200"
    >
      {/* Drag handle */}
      <div 
        {...listeners}
        className="cursor-grab active:cursor-grabbing p-2 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600 transition-colors duration-200"
      >
        <div className="flex items-center justify-center">
          <div className="w-6 h-1 bg-gray-300 dark:bg-gray-500 rounded-full"></div>
        </div>
      </div>

      <div className="p-6">
        {/* Favicon and URL */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-3">
            {bookmark.favicon ? (
              <img 
                src={bookmark.favicon} 
                alt="" 
                className="w-6 h-6 rounded"
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                }}
              />
            ) : (
              <ArrowTopRightOnSquareIcon className="w-6 h-6 text-gray-400 dark:text-gray-500" />
            )}
            <a 
              href={bookmark.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 truncate max-w-xs transition-colors duration-200"
            >
              {new URL(bookmark.url).hostname}
            </a>
          </div>
          
          <button
            onClick={() => onDelete(bookmark.id)}
            className="text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 transition-colors"
          >
            <TrashIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Title */}
        <div className="mb-3">
          {isEditing ? (
            <input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="w-full text-lg font-semibold text-gray-900 dark:text-gray-100 bg-transparent border-b border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:outline-none"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSave()
                if (e.key === 'Escape') handleCancel()
              }}
            />
          ) : (
            <h3 
              className="text-lg font-semibold text-gray-900 dark:text-gray-100 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200"
              onClick={() => setIsEditing(true)}
            >
              {bookmark.title}
            </h3>
          )}
        </div>

        {/* Summary */}
        {bookmark.summary && (
          <div className="mb-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                                <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                  {bookmark.summary}
                </p>
                {(bookmark.summary.includes('temporarily unavailable') || 
                  bookmark.summary.includes('not available') ||
                  bookmark.summary.includes('not configured') ||
                  bookmark.summary.includes('authentication error')) && (
                  <span className="text-xs text-amber-600 italic mt-1 block">
                    AI summary service issue - try refreshing
                  </span>
                )}
              </div>
              {(bookmark.summary.includes('temporarily unavailable') || 
                bookmark.summary.includes('not available') ||
                bookmark.summary.includes('not configured') ||
                bookmark.summary.includes('authentication error')) && (
                <button
                  onClick={handleRefreshSummary}
                  disabled={isRefreshingSummary}
                  className="ml-2 text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors disabled:opacity-50 flex-shrink-0"
                  title="Refresh summary"
                >
                  <ArrowPathIcon className={`w-4 h-4 ${isRefreshingSummary ? 'animate-spin' : ''}`} />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Tags */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {isEditing ? (
              <input
                value={editTags}
                onChange={(e) => setEditTags(e.target.value)}
                placeholder="Enter tags separated by commas"
                className="text-sm text-gray-600 dark:text-gray-300 bg-transparent border-b border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:outline-none"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSave()
                  if (e.key === 'Escape') handleCancel()
                }}
              />
            ) : (
              <>
                <TagIcon className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                <div className="flex flex-wrap gap-1">
                  {bookmark.tags.length > 0 ? (
                    bookmark.tags.map((tag, index) => (
                      <span
                        key={index}
                                                className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs rounded-full"
                      >
                        {tag}
                      </span>
                    ))
                  ) : (
                    <span 
                      className="text-gray-400 dark:text-gray-500 text-xs cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200"
                      onClick={() => setIsEditing(true)}
                    >
                      Add tags
                    </span>
                  )}
                </div>
              </>
            )}
          </div>
          
          {isEditing && (
            <div className="flex space-x-2">
              <button
                onClick={handleSave}
                className="text-xs bg-primary-600 text-white px-2 py-1 rounded hover:bg-primary-700"
              >
                Save
              </button>
              <button
                onClick={handleCancel}
                className="text-xs bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 px-2 py-1 rounded hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors duration-200"
              >
                Cancel
              </button>
            </div>
          )}
        </div>

        {/* Timestamp */}
        <div className="mt-4 text-xs text-gray-400 dark:text-gray-500">
          Added {new Date(bookmark.createdAt).toLocaleDateString()}
        </div>
      </div>
    </div>
  )
}
