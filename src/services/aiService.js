export const AI_CONFIG = {
  provider: 'gemini',
  model: 'gemini-2.0-flash',
  apiKey: import.meta.env.VITE_GEMINI_API_KEY,
}

const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${AI_CONFIG.model}:generateContent?key=${AI_CONFIG.apiKey}`

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'

export const callAI = async (
  userMessage,
  systemPrompt = '',
  chatHistory = [],
  maxTokens = 800
) => {
  try {
    if(AI_CONFIG.provider === 'gemini') {
      const contents = chatHistory
        .filter(m => m.role === 'user' || 
                     m.role === 'ai')
        .map(m => ({
          role: m.role === 'user' ? 'user' : 'model',
          parts: [{ text: m.content }]
        }))
      
      contents.push({
        role: 'user',
        parts: [{ text: userMessage }]
      })

      const response = await fetch(GEMINI_URL, {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({
          system_instruction: systemPrompt
            ? { parts: [{ text: systemPrompt }] }
            : undefined,
          contents,
          generationConfig: {
            temperature: 0.9,
            maxOutputTokens: maxTokens
          }
        })
      })
      
      const data = await response.json()
      if(data.error) throw new Error(data.error.message)
      return data.candidates?.[0]
        ?.content?.parts?.[0]?.text ||
        'No response'
    }

    if(AI_CONFIG.provider === 'groq') {
      const messages = []
      if(systemPrompt) {
        messages.push({
          role: 'system',
          content: systemPrompt
        })
      }
      chatHistory
        .filter(m => m.role === 'user' || 
                     m.role === 'ai')
        .forEach(m => messages.push({
          role: m.role === 'user'
            ? 'user' : 'assistant',
          content: m.content
        }))
      messages.push({
        role: 'user',
        content: userMessage
      })

      const response = await fetch(GROQ_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${
            import.meta.env.VITE_GROQ_API_KEY
          }`
        },
        body: JSON.stringify({
          model: AI_CONFIG.model,
          messages,
          max_tokens: maxTokens,
          temperature: 0.9
        })
      })
      const data = await response.json()
      return data.choices?.[0]
        ?.message?.content || 'No response'
    }

  } catch(err) {
    console.error('[DoraLink AI Error]:', err)
    throw err
  }
}
