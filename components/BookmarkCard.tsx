'use client'

import { useState } from 'react'
import { 
  TrashIcon, 
  TagIcon,
  ArrowTopRightOnSquareIcon 
} from '@heroicons/react/24/outline'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Bookmark } from '@/types'

interface BookmarkCardProps {
  bookmark: Bookmark
  onDelete: (id: string) => void
  onUpdate: (id: string, data: { title?: string; tags?: string[] }) => void
}

export default function BookmarkCard({ bookmark, onDelete, onUpdate }: BookmarkCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(bookmark.title)
  const [editTags, setEditTags] = useState(bookmark.tags.join(', '))
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: bookmark.id })

  const style = {
    transform: CSS.Transform.toString(transform),
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
        className="cursor-grab active:cursor-grabbing p-2 bg-gray-50 border-b"
      >
        <div className="flex items-center justify-center">
          <div className="w-6 h-1 bg-gray-300 rounded-full"></div>
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
              <ArrowTopRightOnSquareIcon className="w-6 h-6 text-gray-400" />
            )}
            <a 
              href={bookmark.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-gray-500 hover:text-primary-600 truncate max-w-xs"
            >
              {new URL(bookmark.url).hostname}
            </a>
          </div>
          
          <button
            onClick={() => onDelete(bookmark.id)}
            className="text-gray-400 hover:text-red-600 transition-colors"
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
              className="w-full text-lg font-semibold text-gray-900 border-b border-gray-300 focus:border-primary-500 focus:outline-none"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSave()
                if (e.key === 'Escape') handleCancel()
              }}
            />
          ) : (
            <h3 
              className="text-lg font-semibold text-gray-900 cursor-pointer hover:text-primary-600"
              onClick={() => setIsEditing(true)}
            >
              {bookmark.title}
            </h3>
          )}
        </div>

        {/* Summary */}
        {bookmark.summary && (
          <p className="text-gray-600 text-sm mb-4 line-clamp-3">
            {bookmark.summary}
          </p>
        )}

        {/* Tags */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {isEditing ? (
              <input
                value={editTags}
                onChange={(e) => setEditTags(e.target.value)}
                placeholder="Enter tags separated by commas"
                className="text-sm text-gray-600 border-b border-gray-300 focus:border-primary-500 focus:outline-none"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSave()
                  if (e.key === 'Escape') handleCancel()
                }}
              />
            ) : (
              <>
                <TagIcon className="w-4 h-4 text-gray-400" />
                <div className="flex flex-wrap gap-1">
                  {bookmark.tags.length > 0 ? (
                    bookmark.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
                      >
                        {tag}
                      </span>
                    ))
                  ) : (
                    <span 
                      className="text-gray-400 text-xs cursor-pointer hover:text-primary-600"
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
                className="text-xs bg-gray-300 text-gray-700 px-2 py-1 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          )}
        </div>

        {/* Timestamp */}
        <div className="mt-4 text-xs text-gray-400">
          Added {new Date(bookmark.createdAt).toLocaleDateString()}
        </div>
      </div>
    </div>
  )
}
