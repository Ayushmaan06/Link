'use client'

import { useState, useEffect } from 'react'
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline'

interface TagFilterProps {
  allTags: string[]
  selectedTags: string[]
  onTagChange: (tags: string[]) => void
  searchQuery: string
  onSearchChange: (query: string) => void
}

export default function TagFilter({ 
  allTags, 
  selectedTags, 
  onTagChange, 
  searchQuery, 
  onSearchChange 
}: TagFilterProps) {
  const [isOpen, setIsOpen] = useState(false)

  const toggleTag = (tag: string) => {
    if (selectedTags.indexOf(tag) !== -1) {
      onTagChange(selectedTags.filter((t: string) => t !== tag))
    } else {
      onTagChange([...selectedTags, tag])
    }
  }

  const clearAllTags = () => {
    onTagChange([])
  }

  return (
    <div className="bg-white p-4 rounded-lg shadow-md mb-6">
      {/* Search */}
      <div className="relative mb-4">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search bookmarks..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Tag Filter */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-gray-700">Filter by Tags</h3>
          {selectedTags.length > 0 && (
            <button
              onClick={clearAllTags}
              className="text-xs text-primary-600 hover:text-primary-700"
            >
              Clear all
            </button>
          )}
        </div>
        
        {allTags.length > 0 ? (
          <>
            <div className="flex flex-wrap gap-2 mb-2">
              {allTags.slice(0, isOpen ? allTags.length : 10).map((tag) => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                    selectedTags.indexOf(tag) !== -1
                      ? 'bg-primary-100 border-primary-300 text-primary-700'
                      : 'bg-gray-100 border-gray-300 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
            
            {allTags.length > 10 && (
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                {isOpen ? 'Show less' : `Show ${allTags.length - 10} more tags`}
              </button>
            )}
          </>
        ) : (
          <p className="text-sm text-gray-500">No tags available</p>
        )}
      </div>

      {/* Active filters */}
      {selectedTags.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500 mb-2">Active filters:</p>
          <div className="flex flex-wrap gap-1">
            {selectedTags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center px-2 py-1 text-xs bg-primary-100 text-primary-700 rounded-full"
              >
                {tag}
                <button
                  onClick={() => toggleTag(tag)}
                  className="ml-1 text-primary-500 hover:text-primary-700"
                >
                  <XMarkIcon className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
