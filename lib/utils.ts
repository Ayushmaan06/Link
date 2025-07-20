import { load } from 'cheerio'
import Groq from 'groq-sdk'

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
    // Check rate limiting (keeping this for safety)
    if (!checkRateLimit()) {
      console.warn('Rate limit reached for content fetching')
      return 'Summary temporarily unavailable due to rate limiting.'
    }
    
    // Update rate limit tracker
    rateLimitTracker.lastRequestTime = Date.now()
    rateLimitTracker.requestCount++
    
    // Step 1: Fetch content using Jina AI
    const jinaApiKey = process.env.JINA_API_KEY
    const groqApiKey = process.env.GROQ_API_KEY
    
    if (!groqApiKey) {
      console.error('GROQ_API_KEY not configured')
      return 'Summary service not configured.'
    }
    
    console.log('Fetching content from:', url)
    
    // Use Jina AI to fetch content - ensure proper URL handling
    let jinaUrl = `https://r.jina.ai/${url}`
    
    // Handle URLs that might need special formatting
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      jinaUrl = `https://r.jina.ai/https://${url}`
    }
    
    const jinaResponse = await fetch(jinaUrl, {
      method: 'GET',
      headers: {
        ...(jinaApiKey && { 'Authorization': `Bearer ${jinaApiKey}` }),
        'Accept': 'text/plain',
        'User-Agent': 'LinkSaver/1.0'
      }
    })
    
    if (!jinaResponse.ok) {
      const errorText = await jinaResponse.text()
      console.error(`Jina AI API error: ${jinaResponse.status} - ${errorText}`)
      console.error('Request URL was:', jinaUrl)
      return 'Summary temporarily unavailable.'
    }
    
    let rawContent = await jinaResponse.text()
    console.log('Raw content length:', rawContent.length)
    
    // Clean up the content - remove metadata headers
    const contentStart = rawContent.indexOf('Markdown Content:')
    if (contentStart !== -1) {
      rawContent = rawContent.substring(contentStart + 'Markdown Content:'.length).trim()
    }
    
    // Remove markdown formatting and clean up
    rawContent = rawContent
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold markdown
      .replace(/\*(.*?)\*/g, '$1')     // Remove italic markdown
      .replace(/#{1,6}\s/g, '')        // Remove markdown headers
      .replace(/\[(.*?)\]\(.*?\)/g, '$1') // Convert links to text
      .replace(/\n\s*\n/g, '\n')       // Remove multiple newlines
      .trim()
    
    // If content is too short, return fallback
    if (rawContent.length < 200) {
      return 'Content too short to summarize.'
    }
    
    // Truncate content for Groq (keep it reasonable for API limits)
    if (rawContent.length > 4000) {
      rawContent = rawContent.substring(0, 4000) + '...'
    }
    
    console.log('Cleaned content length:', rawContent.length)
    
    // Step 2: Use Groq to create a concise summary
    const groq = new Groq({
      apiKey: groqApiKey
    })
    
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that creates concise, informative summaries. Create a 1-2 sentence summary that captures the main essence and key points of the content. Be clear, direct, and informative.'
        },
        {
          role: 'user',
          content: `Please summarize this content in 1-2 clear, informative sentences:\n\n${rawContent}`
        }
      ],
      model: 'gemma2-9b-it',
      temperature: 0.3,
      max_tokens: 150,
      top_p: 0.9,
    })
    
    const summary = completion.choices[0]?.message?.content?.trim()
    
    if (!summary || summary.length < 20) {
      return 'Unable to generate summary for this content.'
    }
    
    console.log('Generated summary:', summary)
    return summary
    
  } catch (error) {
    console.error('Error generating summary:', error)
    
    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes('rate limit') || error.message.includes('429')) {
        return 'Summary temporarily unavailable due to rate limiting.'
      }
      if (error.message.includes('authentication') || error.message.includes('401')) {
        return 'Summary service authentication error.'
      }
    }
    
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
