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
  config,
  signal = null
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
    signal: signal,
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
  config,
  signal = null
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
    }),
    signal: signal
  })

  const data = await response.json()
  if(data.error) throw new Error(data.error.message)
  return data.choices?.[0]?.message?.content || 'No response'
}

const askAIIfSearchNeeded = async (message) => {
  try {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite-preview:generateContent?key=${apiKey}`
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        contents: [{
          role: 'user',
          parts: [{ text: `You are a decision maker. 
Decide if this query needs real-time web search 
or can be answered from training knowledge.

Query: "${message}"

Rules:
- Need search: current news, prices, scores, 
  weather, recent events, 2025/2026 updates,
  war/conflict updates, stock prices, 
  new product launches, election results,
  anything that changes frequently
- No search: math, definitions, concepts, 
  history, general knowledge, personal questions,
  timeless facts, app-related questions

Reply with ONLY one word: YES or NO` 
          }]
        }],
        generationConfig: {
          temperature: 0,
          maxOutputTokens: 5
        }
      })
    })
    
    const data = await response.json()
    const rawText = data.candidates?.[0]
      ?.content?.parts?.[0]?.text || ''
    const decision = rawText.trim()
      .toUpperCase()
      .includes('YES') ? 'YES' : 'NO'
    
    console.log(`🤔 Search needed? ${decision} for: "${message}"`)
    return decision === 'YES'
    
  } catch(err) {
    console.error('Decision error:', err)
    // Fallback to keyword check if AI fails
    return false
  }
}

export const callAI = async (
  userMessage,
  systemPrompt = '',
  chatHistory = [],
  maxTokens = null,
  signal = null
) => {
  const config = getActiveConfig()
  if(maxTokens) config.maxTokens = maxTokens

  const shouldSearch = await askAIIfSearchNeeded(
    userMessage
  )

  let enhancedMessage = userMessage
  
  if(shouldSearch) {
    console.log('🔍 Tavily search triggered')
    const searchResults = await searchWeb(userMessage)
    if(searchResults) {
      enhancedMessage = `${userMessage}

[Web Search Results]:
${searchResults}

Use above search results to answer accurately.`
    }
  }

  try {
    if(config.provider === 'gemini') {
      return await callGemini(
        enhancedMessage,
        systemPrompt,
        chatHistory,
        config,
        signal
      )
    }
    if(config.provider === 'groq') {
      return await callGroq(
        enhancedMessage,
        systemPrompt,
        chatHistory,
        config,
        signal
      )
    }
    throw new Error('Unknown provider')
  } catch(err) {
    if(err.name === 'AbortError') {
      return ''
    }
    console.error('[DoraLink AI Error]:', err)
    throw err
  }
}

// Export for settings page use
export { buildSystemPrompt, getActiveConfig }
