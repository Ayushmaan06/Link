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
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md mb-6 border border-gray-200 dark:border-gray-700 transition-colors duration-200">
      {/* Search */}
      <div className="relative mb-4">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
        <input
          type="text"
          placeholder="Search bookmarks..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="input-field pl-10 pr-4"
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Tag Filter */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Filter by Tags</h3>
          {selectedTags.length > 0 && (
            <button
              onClick={clearAllTags}
              className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors duration-200"
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
                  className={`px-3 py-1 text-sm rounded-full border transition-colors duration-200 ${
                    selectedTags.indexOf(tag) !== -1
                      ? 'bg-blue-100 dark:bg-blue-900 border-blue-300 dark:border-blue-600 text-blue-700 dark:text-blue-300'
                      : 'bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
            
            {allTags.length > 10 && (
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors duration-200"
              >
                {isOpen ? 'Show less' : `Show ${allTags.length - 10} more tags`}
              </button>
            )}
          </>
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400">No tags available</p>
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
