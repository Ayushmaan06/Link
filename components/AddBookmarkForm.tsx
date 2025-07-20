'use client'

import { useState } from 'react'
import { PlusIcon } from '@heroicons/react/24/outline'

interface AddBookmarkFormProps {
  onAdd: (url: string, tags: string[]) => Promise<void>
}

export default function AddBookmarkForm({ onAdd }: AddBookmarkFormProps) {
  const [url, setUrl] = useState('')
  const [tags, setTags] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!url.trim()) return

    setLoading(true)
    try {
      const tagList = tags.split(',').map((tag: string) => tag.trim()).filter((tag: string) => tag)
      await onAdd(url, tagList)
      setUrl('')
      setTags('')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md mb-6">
      <div className="flex flex-col space-y-4">
        <div>
          <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-2">
            URL
          </label>
          <input
            type="url"
            id="url"
            placeholder="https://example.com"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="input-field"
            required
          />
        </div>
        
        <div>
          <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-2">
            Tags (comma separated)
          </label>
          <input
            type="text"
            id="tags"
            placeholder="javascript, tutorial, web development"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            className="input-field"
          />
        </div>
        
        <button
          type="submit"
          disabled={loading || !url.trim()}
          className="btn-primary flex items-center justify-center space-x-2"
        >
          <PlusIcon className="h-5 w-5" />
          <span>{loading ? 'Adding...' : 'Add Bookmark'}</span>
        </button>
      </div>
    </form>
  )
}
