import { api, ApiError, API_ERROR_TYPES } from './api.js';

const LOCAL_FALLBACK = 'chat.noApiKey';

export async function sendChatMessage({ apiConfig, messages }) {
  if (!apiConfig.apiKey) {
    return LOCAL_FALLBACK;
  }

  try {
    const data = await api.post('/api/chat', {
      provider: apiConfig.provider || 'openai',
      model: apiConfig.model || 'gpt-4o-mini',
      api_key: apiConfig.apiKey,
      base_url: apiConfig.baseUrl || undefined,
      messages: [
        { role: 'system', content: '你是路径规划算法与机器人仿真专家，请用中文回答。' },
        ...messages.map(message => ({
          role: message.role === 'assistant' ? 'assistant' : 'user',
          content: message.content,
        })),
      ],
    });
    return data.response || data.detail || 'No valid response received.';
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.type === API_ERROR_TYPES.NETWORK) {
        return `chat.error.backendNetwork`;
      }
      if (error.type === API_ERROR_TYPES.SERVER) {
        return `chat.error.backendServer: ${error.message}`;
      }
      return `chat.error.backend: ${error.message}`;
    }
    return `chat.error.generic: ${error.message}`;
  }
}

export async function generateCode({ apiConfig, algorithm, language = 'python' }) {
  if (!apiConfig.apiKey) {
    return LOCAL_FALLBACK;
  }

  const data = await api.post('/api/generate-code', {
    provider: apiConfig.provider || 'openai',
    model: apiConfig.model || 'gpt-4o-mini',
    api_key: apiConfig.apiKey,
    base_url: apiConfig.baseUrl || undefined,
    algorithm,
    language,
  });
  return data.code || data.response || data.detail || '';
}
