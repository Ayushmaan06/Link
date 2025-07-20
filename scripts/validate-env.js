#!/usr/bin/env node
// Validate required environment variables for build
const requiredEnvVars = [
  'DATABASE_URL',
  'JWT_SECRET'
]

const optionalEnvVars = [
  'NEXTAUTH_SECRET',
  'JINA_API_KEY',
  'GROQ_API_KEY',
  'NEXTAUTH_URL'
]

console.log('🔍 Validating environment variables...')

let hasErrors = false

// Check required variables
requiredEnvVars.forEach(varName => {
  if (!process.env[varName]) {
    console.error(`❌ Missing required environment variable: ${varName}`)
    hasErrors = true
  } else {
    console.log(`✅ ${varName} is set`)
  }
})

// Check optional variables (warnings only)
optionalEnvVars.forEach(varName => {
  if (!process.env[varName]) {
    console.warn(`⚠️  Optional environment variable not set: ${varName}`)
  } else {
    console.log(`✅ ${varName} is set`)
  }
})

// In Vercel build environment, be more strict
if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
  if (!process.env.NEXTAUTH_SECRET) {
    console.error(`❌ NEXTAUTH_SECRET is required in production`)
    hasErrors = true
  }
}

if (hasErrors) {
  console.error('\n💥 Build validation failed. Please set all required environment variables.')
  process.exit(1)
}

console.log('\n✨ Environment validation passed!')
