export interface Bookmark {
  id: string
  title: string
  url: string
  favicon: string | null
  summary: string | null
  tags: string[] // PostgreSQL array
  order: number
  createdAt: string
  updatedAt: string
  userId: string
}

export interface User {
  id: string
  email: string
  createdAt: string
  updatedAt: string
}

export interface BookmarkCreateInput {
  url: string
  tags?: string[]
}

export interface BookmarkUpdateInput {
  title?: string
  tags?: string[]
}
