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

export const callAI = async (
  userMessage,
  systemPrompt = '',
  chatHistory = [],
  maxTokens = null
) => {
  const config = getActiveConfig()
  if(maxTokens) config.maxTokens = maxTokens

  // Detect if web search needed
  const searchKeywords = [
    'today', 'aaj', 'current', 'abhi',
    'latest', 'news', 'price', 'weather',
    'score', 'result', 'date', 'time',
    'kya chal raha', 'recent', 'new',
    '2025', '2026', 'live'
  ]
  
  const needsSearch = searchKeywords.some(k => 
    userMessage.toLowerCase().includes(k)
  )

  let enhancedMessage = userMessage
  
  if(needsSearch) {
    const searchResults = await searchWeb(
      userMessage
    )
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
