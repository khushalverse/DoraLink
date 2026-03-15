import { getActiveConfig } from './aiConfig'
import { buildSystemPrompt } from './aiPersonality'

const searchWeb = async (query) => {
  try {
    const response = await fetch(
      'https://api.tavily.com/search',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${
            import.meta.env.VITE_TAVILY_API_KEY
          }`
        },
        body: JSON.stringify({
          query: query,
          max_results: 3,
          search_depth: 'basic'
        })
      }
    )
    const data = await response.json()
    if(data.results) {
      return data.results.map(r => 
        `${r.title}: ${r.content}`
      ).join('\n\n')
    }
    return null
  } catch(err) {
    console.error('Tavily error:', err)
    return null
  }
}

const callGemini = async (
  userMessage, 
  systemPrompt, 
  chatHistory, 
  config
) => {
  const apiKey = config.customKey || config.apiKey
  const url = `${config.baseUrl}/${config.model}:generateContent?key=${apiKey}`
  
  const contents = chatHistory
    .filter(m => m.role === 'user' || m.role === 'ai')
    .map(m => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }]
    }))
  contents.push({ 
    role: 'user', 
    parts: [{ text: userMessage }] 
  })

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_instruction: systemPrompt 
        ? { parts: [{ text: systemPrompt }] } 
        : undefined,
      contents,
      generationConfig: {
        temperature: 0.9,
        maxOutputTokens: config.maxTokens
      }
    })
  })

  const data = await response.json()
  if(data.error) throw new Error(data.error.message)
  return data.candidates?.[0]?.content?.parts?.[0]?.text 
    || 'No response'
}

const callGroq = async (
  userMessage,
  systemPrompt,
  chatHistory,
  config
) => {
  const apiKey = config.customKey || config.apiKey
  const url = `${config.baseUrl}/chat/completions`

  const messages = []
  if(systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt })
  }
  chatHistory
    .filter(m => m.role === 'user' || m.role === 'ai')
    .forEach(m => messages.push({
      role: m.role === 'user' ? 'user' : 'assistant',
      content: m.content
    }))
  messages.push({ role: 'user', content: userMessage })

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: config.model,
      messages,
      max_tokens: config.maxTokens,
      temperature: 0.9
    })
  })

  const data = await response.json()
  if(data.error) throw new Error(data.error.message)
  return data.choices?.[0]?.message?.content || 'No response'
}

const needsSearch = (message) => {
  const msg = message.toLowerCase()
  
  // DEFINITELY needs search - realtime data
  const realtimePatterns = [
    // News
    'latest news', 'aaj ki news', 'breaking',
    'current news', 'abhi kya hua',
    // Sports
    'ipl', 'cricket score', 'match result',
    'who won', 'live score',
    // Weather  
    'weather', 'mausam', 'temperature',
    'barish', 'aaj kitni garmi',
    // Prices
    'price today', 'aaj ka rate',
    'stock price', 'share price',
    'petrol price', 'gold rate',
    'dollar rate', 'bitcoin',
    // Current events
    'election result', 'who is current',
    'abhi kaun hai', 'latest update',
    // Specific time queries
    'aaj ka', 'today\'s', 'right now',
    'is waqt', 'abhi abhi'
  ]
  
  // NEVER needs search - AI can answer
  const noSearchPatterns = [
    // Math/calculations
    'calculate', 'solve', 'what is',
    'kitna hoga', 'formula',
    // General knowledge (historical)
    'who invented', 'kisne banaya',
    'history of', 'explain',
    'what is', 'define', 'meaning',
    // Personal/app related
    'who made you', 'kisne banaya tumhe',
    'doralink', 'habit', 'calculator',
    'meri habit', 'mera naam',
    // Concepts
    'how does', 'kaise kaam karta',
    'difference between', 'vs',
    'better option', 'suggest'
  ]

  // First check if it clearly doesnt need search
  const definitelyNoSearch = noSearchPatterns.some(
    p => msg.includes(p)
  )
  if(definitelyNoSearch) return false

  // Then check if it needs realtime data
  const definitelyNeedsSearch = realtimePatterns.some(
    p => msg.includes(p)
  )
  if(definitelyNeedsSearch) return true

  // For date/time - only if asking current
  const dateTimePatterns = [
    'aaj kya date', 'what date today',
    'aaj konsa din', 'what day today',
    'abhi kya time', 'current time',
    'aaj ka date', "today's date"
  ]
  if(dateTimePatterns.some(p => msg.includes(p))) {
    return false // We have date in system prompt!
  }

  // Default = no search (save credits!)
  return false
}

export const callAI = async (
  userMessage,
  systemPrompt = '',
  chatHistory = [],
  maxTokens = null
) => {
  const config = getActiveConfig()
  if(maxTokens) config.maxTokens = maxTokens

  const shouldSearch = needsSearch(userMessage)

  let enhancedMessage = userMessage
  
  if(shouldSearch) {
    console.log('🔍 Tavily search triggered')
    const searchResults = await searchWeb(userMessage)
    if(searchResults) {
      enhancedMessage = `${userMessage}

[Web Search Results - Use this for accurate answer]:
${searchResults}

Answer based on above search results.`
    }
  }

  try {
    if(config.provider === 'gemini') {
      return await callGemini(
        enhancedMessage,
        systemPrompt,
        chatHistory,
        config
      )
    }
    if(config.provider === 'groq') {
      return await callGroq(
        enhancedMessage,
        systemPrompt,
        chatHistory,
        config
      )
    }
    throw new Error('Unknown provider')
  } catch(err) {
    console.error('[DoraLink AI Error]:', err)
    throw err
  }
}

// Export for settings page use
export { buildSystemPrompt, getActiveConfig }
