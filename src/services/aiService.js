import { getActiveConfig } from './aiConfig'
import { buildSystemPrompt } from './aiPersonality'

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
      tools: [{ googleSearch: {} }],
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

  try {
    if(config.provider === 'gemini') {
      return await callGemini(
        userMessage, systemPrompt, chatHistory, config
      )
    }
    if(config.provider === 'groq') {
      return await callGroq(
        userMessage, systemPrompt, chatHistory, config
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
