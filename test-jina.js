// Test script for Jina AI API integration
// Run this with: node test-jina.js

const testUrl = 'https://en.wikipedia.org/wiki/Artificial_intelligence'
const apiKey = 'jina_ce996178ed6343b0b0a44e35d34d5df9ZAlE66CjZFVQn5_x6K8j6RmrgVZr'

async function testJinaAPI() {
  console.log('Testing Jina AI API with URL:', testUrl)
  
  try {
    // Test without encoding first (the free endpoint)
    console.log('\n--- Testing free endpoint ---')
    const freeResponse = await fetch(`https://r.jina.ai/${testUrl}`, {
      method: 'GET',
      headers: {
        'Accept': 'text/plain',
        'User-Agent': 'LinkSaver/1.0'
      }
    })
    
    console.log('Free endpoint status:', freeResponse.status)
    if (freeResponse.ok) {
      const freeSummary = await freeResponse.text()
      console.log('Free summary length:', freeSummary.length)
      console.log('Free summary preview:', freeSummary.substring(0, 200) + '...')
    } else {
      console.log('Free endpoint error:', await freeResponse.text())
    }
    
    // Test with API key using different format
    console.log('\n--- Testing with API key ---')
    const authResponse = await fetch(`https://r.jina.ai/${testUrl}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'text/plain',
        'User-Agent': 'LinkSaver/1.0'
      }
    })
    
    console.log('Auth response status:', authResponse.status)
    if (authResponse.ok) {
      const authSummary = await authResponse.text()
      console.log('Auth summary length:', authSummary.length)
      console.log('Auth summary preview:', authSummary.substring(0, 200) + '...')
    } else {
      console.log('Auth error response:', await authResponse.text())
    }
    
  } catch (error) {
    console.error('Error:', error.message)
  }
}

testJinaAPI()
