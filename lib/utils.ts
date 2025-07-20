import { load } from 'cheerio'

export interface URLMetadata {
  title: string
  favicon: string | null
  description?: string
}

// Use Node.js built-in fetch for server-side requests
const fetchWithTimeout = async (url: string, timeout = 10000) => {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)
  
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    })
    clearTimeout(timeoutId)
    return response
  } catch (error) {
    clearTimeout(timeoutId)
    throw error
  }
}

export const fetchURLMetadata = async (url: string): Promise<URLMetadata> => {
  try {
    const response = await fetchWithTimeout(url)
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const html = await response.text()
    const $ = load(html)
    
    // Get title
    let title = $('title').text().trim()
    if (!title) {
      title = $('meta[property="og:title"]').attr('content') || url
    }
    
    // Get favicon
    let favicon: string | null = null
    
    // Try different favicon approaches
    const faviconSelectors = [
      'link[rel="icon"]',
      'link[rel="shortcut icon"]',
      'link[rel="apple-touch-icon"]',
      'link[rel="icon"][type="image/x-icon"]'
    ]
    
    for (const selector of faviconSelectors) {
      const faviconElement = $(selector).first()
      if (faviconElement.length) {
        const href = faviconElement.attr('href')
        if (href) {
          favicon = new URL(href, url).href
          break
        }
      }
    }
    
    // Fallback to /favicon.ico
    if (!favicon) {
      try {
        const baseUrl = new URL(url)
        const faviconUrl = `${baseUrl.protocol}//${baseUrl.host}/favicon.ico`
        const faviconResponse = await fetch(faviconUrl, { method: 'HEAD' })
        if (faviconResponse.ok) {
          favicon = faviconUrl
        }
      } catch (error) {
        // Ignore favicon errors
      }
    }
    
    // Get description
    const description = $('meta[name="description"]').attr('content') ||
                       $('meta[property="og:description"]').attr('content') ||
                       undefined
    
    return {
      title: title || url,
      favicon,
      description
    }
  } catch (error) {
    console.error('Error fetching URL metadata:', error)
    return {
      title: url,
      favicon: null
    }
  }
}

// Simple in-memory rate limiting tracker
const rateLimitTracker = {
  lastRequestTime: 0,
  requestCount: 0,
  windowStart: 0
}

const RATE_LIMIT_WINDOW = 60 * 60 * 1000 // 1 hour in milliseconds
const MAX_REQUESTS_PER_HOUR = 50 // Conservative limit (API allows ~60)

const checkRateLimit = (): boolean => {
  const now = Date.now()
  
  // Reset window if it's been more than an hour
  if (now - rateLimitTracker.windowStart > RATE_LIMIT_WINDOW) {
    rateLimitTracker.windowStart = now
    rateLimitTracker.requestCount = 0
  }
  
  // Check if we're under the limit
  if (rateLimitTracker.requestCount >= MAX_REQUESTS_PER_HOUR) {
    return false
  }
  
  // Add some spacing between requests (minimum 2 seconds)
  if (now - rateLimitTracker.lastRequestTime < 2000) {
    return false
  }
  
  return true
}

export const generateSummary = async (url: string): Promise<string> => {
  try {
    // Check rate limiting (keeping this for safety even with API key)
    if (!checkRateLimit()) {
      console.warn('Rate limit reached for Jina AI API')
      return 'Summary temporarily unavailable due to rate limiting.'
    }
    
    // Update rate limit tracker
    rateLimitTracker.lastRequestTime = Date.now()
    rateLimitTracker.requestCount++
    
    const apiKey = process.env.JINA_API_KEY
    
    if (!apiKey) {
      console.warn('JINA_API_KEY not configured, falling back to public endpoint')
      // Fallback to public endpoint if no API key
      const response = await fetchWithTimeout(`https://r.jina.ai/${url}`, 15000)
      
      if (!response.ok) {
        throw new Error(`Jina AI public API error: ${response.status}`)
      }
      
      let summary = await response.text()
      summary = summary.trim()
      
      if (summary.length > 800) {
        const breakPoint = summary.lastIndexOf('.', 800) || summary.lastIndexOf(' ', 800)
        summary = summary.substring(0, breakPoint > 0 ? breakPoint + 1 : 800).trim() + '...'
      }
      
      return summary || 'No summary available'
    }
    
    // Use authenticated Jina AI Reader API with the correct endpoint format
    const jinaResponse = await fetch(`https://r.jina.ai/${url}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'text/plain',
        'User-Agent': 'LinkSaver/1.0'
      }
    })
    
    if (!jinaResponse.ok) {
      // Handle specific status codes
      if (jinaResponse.status === 429) {
        console.warn('Jina AI API rate limit exceeded')
        return 'Summary temporarily unavailable due to rate limiting.'
      } else if (jinaResponse.status === 401) {
        console.warn('Jina AI API authentication failed')
        return 'Summary temporarily unavailable due to authentication error.'
      } else if (jinaResponse.status >= 500) {
        console.warn('Jina AI API server error')
        return 'Summary temporarily unavailable.'
      }
      throw new Error(`Jina AI API error: ${jinaResponse.status}`)
    }
    
    // The API returns plain text with metadata
    let summary = await jinaResponse.text()
    
    // Clean up the summary - remove metadata headers
    const contentStart = summary.indexOf('Markdown Content:')
    if (contentStart !== -1) {
      summary = summary.substring(contentStart + 'Markdown Content:'.length).trim()
    }
    
    // Remove common markdown formatting for better readability
    summary = summary
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold markdown
      .replace(/\*(.*?)\*/g, '$1')     // Remove italic markdown
      .replace(/#{1,6}\s/g, '')        // Remove markdown headers
      .replace(/\[(.*?)\]\(.*?\)/g, '$1') // Convert links to text
      .trim()
    
    // If summary is too short or generic, return fallback
    if (summary.length < 100 || summary.toLowerCase().includes('error') || summary.toLowerCase().includes('not found')) {
      return 'Summary not available for this URL.'
    }
    
    // Trim the summary if it's too long (keeping it reasonable for UI)
    if (summary.length > 800) {
      // Find a good breaking point near 800 characters
      const breakPoint = summary.lastIndexOf('.', 800) || summary.lastIndexOf(' ', 800)
      summary = summary.substring(0, breakPoint > 0 ? breakPoint + 1 : 800).trim() + '...'
    }
    
    return summary || 'No summary available'
  } catch (error) {
    console.error('Error generating summary:', error)
    // Fallback message as suggested in the instructions
    return 'Summary temporarily unavailable.'
  }
}

export const isValidURL = (string: string): boolean => {
  try {
    new URL(string)
    return true
  } catch (_) {
    return false
  }
}
