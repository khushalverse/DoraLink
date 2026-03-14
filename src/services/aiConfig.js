// ============================================
// DEVELOPER CONFIG - Change models here easily
// ============================================

export const AI_PROVIDERS = {
  gemini: {
    name: 'Gemini',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta/models',
    apiKeyEnv: 'VITE_GEMINI_API_KEY',
    models: {
      primary: {
        id: 'gemini-3.1-flash-lite-preview',
        name: 'Gemini 2.5 Flash Lite',
        description: 'Fast, 500 req/day free',
        maxTokens: 800
      },
      secondary: {
        id: 'gemini-2.5-flash',
        name: 'Gemini 2.5 Flash', 
        description: 'Smarter, 20 req/day free',
        maxTokens: 1000
      }
    }
  },
  groq: {
    name: 'Groq',
    baseUrl: 'https://api.groq.com/openai/v1',
    apiKeyEnv: 'VITE_GROQ_API_KEY',
    models: {
      primary: {
        id: 'llama-3.3-70b-versatile',
        name: 'Llama 3.3 70B',
        description: 'Fast, 14400 req/day free',
        maxTokens: 800
      },
      secondary: {
        id: 'mixtral-8x7b-32768',
        name: 'Mixtral 8x7B',
        description: 'Large context window',
        maxTokens: 1000
      }
    }
  }
}

// ============================================
// CHANGE THESE 2 LINES TO SWITCH PROVIDER
// ============================================
export const ACTIVE_PROVIDER = 'gemini'
export const ACTIVE_MODEL = 'primary'
// ============================================

export const getActiveConfig = () => {
  const provider = AI_PROVIDERS[ACTIVE_PROVIDER]
  const model = provider.models[ACTIVE_MODEL]
  return {
    provider: ACTIVE_PROVIDER,
    providerName: provider.name,
    baseUrl: provider.baseUrl,
    apiKey: import.meta.env[provider.apiKeyEnv],
    model: model.id,
    modelName: model.name,
    maxTokens: model.maxTokens,
    // User custom key overrides default
    customKey: localStorage.getItem('doralink_custom_key') || null
  }
}

export const getAllModels = () => {
  const result = []
  Object.entries(AI_PROVIDERS).forEach(([providerKey, provider]) => {
    Object.entries(provider.models).forEach(([tier, model]) => {
      result.push({
        providerKey,
        tier,
        providerName: provider.name,
        ...model,
        requiresKey: providerKey !== 'gemini'
      })
    })
  })
  return result
}
