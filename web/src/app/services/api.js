import { sanitizeInput, sanitizeMessage, sanitizeWorkspace } from '../utils/sanitize';

const API_BASE_URL = 'http://127.0.0.1:8000';

export const API_ERROR_TYPES = {
  NETWORK: 'network',
  TIMEOUT: 'timeout',
  UNAUTHORIZED: 'unauthorized',
  FORBIDDEN: 'forbidden',
  NOT_FOUND: 'not_found',
  SERVER: 'server',
  VALIDATION: 'validation',
  RATE_LIMITED: 'rate_limited',
  UNKNOWN: 'unknown',
};

export class ApiError extends Error {
  constructor(message, type = API_ERROR_TYPES.UNKNOWN, status = null, details = null) {
    super(message);
    this.name = 'ApiError';
    this.type = type;
    this.status = status;
    this.details = details;
  }
}

function getErrorTypeFromStatus(status) {
  switch (status) {
    case 400:
    case 422:
      return API_ERROR_TYPES.VALIDATION;
    case 401:
      return API_ERROR_TYPES.UNAUTHORIZED;
    case 403:
      return API_ERROR_TYPES.FORBIDDEN;
    case 404:
      return API_ERROR_TYPES.NOT_FOUND;
    case 429:
      return API_ERROR_TYPES.RATE_LIMITED;
    case 500:
    case 502:
    case 503:
    case 504:
      return API_ERROR_TYPES.SERVER;
    default:
      return status >= 400 ? API_ERROR_TYPES.UNKNOWN : API_ERROR_TYPES.UNKNOWN;
  }
}

function generateRequestId() {
  if (crypto?.randomUUID) {
    return crypto.randomUUID();
  }
  return `req-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
}

async function request(endpoint, options = {}) {
  const {
    method = 'GET',
    headers = {},
    body,
    timeout = 30000,
    ...rest
  } = options;

  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  const requestId = generateRequestId();

  try {
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'X-Request-ID': requestId,
        ...headers,
      },
      body: body !== undefined ? (typeof body === 'string' ? body : JSON.stringify(body)) : undefined,
      signal: controller.signal,
      ...rest,
    });

    clearTimeout(timeoutId);

    const contentType = response.headers.get('content-type');
    let data;
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    if (!response.ok) {
      const errorType = getErrorTypeFromStatus(response.status);
      const message = data?.detail || data?.message || `Request failed with status ${response.status}`;
      const error = new ApiError(message, errorType, response.status, data);
      error.requestId = response.headers.get('x-request-id') || requestId;
      if (response.status === 429) {
        error.retryAfter = response.headers.get('retry-after')
          ? parseInt(response.headers.get('retry-after'), 10)
          : 60;
      }
      throw error;
    }

    return data;
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof ApiError) {
      throw error;
    }

    if (error.name === 'AbortError') {
      throw new ApiError('Request timed out', API_ERROR_TYPES.TIMEOUT);
    }

    if (error.message === 'Failed to fetch' || error.message.includes('NetworkError')) {
      throw new ApiError('Network error - please check your connection', API_ERROR_TYPES.NETWORK);
    }

    throw new ApiError(error.message, API_ERROR_TYPES.UNKNOWN);
  }
}

function sanitizeChatMessages(messages) {
  if (!Array.isArray(messages)) return [];
  return messages.map(sanitizeMessage);
}

export const api = {
  get: (endpoint, options) => request(endpoint, { ...options, method: 'GET' }),
  post: (endpoint, body, options) => request(endpoint, { ...options, method: 'POST', body }),
  put: (endpoint, body, options) => request(endpoint, { ...options, method: 'PUT', body }),
  delete: (endpoint, options) => request(endpoint, { ...options, method: 'DELETE' }),
  request,

  chat: (messages, options = {}) => {
    const sanitized = sanitizeChatMessages(messages);
    return api.post('/api/chat', {
      messages: sanitized,
      ...options,
    });
  },

  testApi: (config) => {
    const safeConfig = {
      ...config,
      api_key: config.api_key ? sanitizeInput(config.api_key, { maxLength: 200, allowNewlines: false }) : undefined,
      model: config.model ? sanitizeInput(config.model, { maxLength: 100, allowNewlines: false }) : undefined,
      base_url: config.base_url ? sanitizeInput(config.base_url, { maxLength: 500, allowNewlines: false }) : undefined,
      provider: config.provider || 'openai',
    };
    return api.post('/api/test-api', safeConfig);
  },

  saveConfig: (config) => {
    const safeConfig = {
      ...config,
      api_key: config.api_key ? sanitizeInput(config.api_key, { maxLength: 200, allowNewlines: false }) : undefined,
    };
    return api.post('/api/save-config', safeConfig);
  },

  getConfig: () => api.get('/api/get-config'),

  generateCode: (algorithm, language, options = {}) => {
    const safeAlgorithm = sanitizeInput(algorithm, { maxLength: 50, allowNewlines: false });
    const safeLanguage = sanitizeInput(language, { maxLength: 20, allowNewlines: false });
    return api.post('/api/generate-code', {
      algorithm: safeAlgorithm,
      language: safeLanguage,
      ...options,
    });
  },

  getAlgorithms: () => api.get('/api/algorithms'),

  optimizeCode: (algorithm, goal, requirements = '', options = {}) => {
    return api.post('/api/optimize-code', {
      algorithm: sanitizeInput(algorithm, { maxLength: 50, allowNewlines: false }),
      goal: sanitizeInput(goal, { maxLength: 50, allowNewlines: false }),
      requirements: sanitizeInput(requirements, { maxLength: 2000 }),
      ...options,
    });
  },

  compareAlgorithms: () => api.get('/api/compare-algorithms'),

  getWorkspace: () => api.get('/api/workspace'),

  saveWorkspace: (workspace) => {
    const safe = sanitizeWorkspace(workspace);
    return api.post('/api/workspace', safe);
  },

  gitExecute: (command, repoPath = '.') => {
    return api.post('/api/git/execute', {
      command: sanitizeInput(command, { maxLength: 500 }),
      repo_path: sanitizeInput(repoPath, { maxLength: 500, allowNewlines: false }),
    });
  },

  API_BASE_URL,
  API_ERROR_TYPES,
  ApiError,
};

export default api;
