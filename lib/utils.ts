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

export const generateSummary = async (url: string): Promise<string> => {
  try {
    // Using Jina AI free endpoint
    const response = await fetch('https://r.jina.ai/' + encodeURIComponent(url), {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'LinkSaver/1.0'
      }
    })
    
    if (!response.ok) {
      throw new Error(`Jina AI API error: ${response.status}`)
    }
    
    const data = await response.json()
    
    // Extract content and generate a summary
    let content = data.content || data.text || ''
    
    if (content.length > 500) {
      // Simple summarization - take first 500 characters and add ellipsis
      content = content.substring(0, 500).trim() + '...'
    }
    
    return content || 'No summary available'
  } catch (error) {
    console.error('Error generating summary:', error)
    return 'Summary generation failed'
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
