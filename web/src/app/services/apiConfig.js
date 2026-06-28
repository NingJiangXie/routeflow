/**
 * API Configuration Management Service
 * 统一管理 AI API 配置，支持多种 Provider 和配置验证
 */

const STORAGE_KEY = 'routeflow_api_config';

// 支持的 Provider 列表及其配置
export const PROVIDERS = {
  openai: {
    id: 'openai',
    name: 'OpenAI',
    nameZh: 'OpenAI',
    nameEn: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
    requiresBaseUrl: false,
  },
  deepseek: {
    id: 'deepseek',
    name: 'DeepSeek',
    nameZh: 'DeepSeek',
    nameEn: 'DeepSeek',
    baseUrl: 'https://api.deepseek.com/v1',
    requiresBaseUrl: false,
  },
  azure: {
    id: 'azure',
    name: 'Azure OpenAI',
    nameZh: 'Azure OpenAI',
    nameEn: 'Azure OpenAI',
    baseUrl: '',
    requiresBaseUrl: true,
  },
  anthropic: {
    id: 'anthropic',
    name: 'Anthropic',
    nameZh: 'Anthropic',
    nameEn: 'Anthropic',
    baseUrl: 'https://api.anthropic.com/v1',
    requiresBaseUrl: false,
  },
  custom: {
    id: 'custom',
    name: 'Custom API',
    nameZh: '自定义 API',
    nameEn: 'Custom API',
    baseUrl: '',
    requiresBaseUrl: true,
  },
};

// 默认配置
export const DEFAULT_CONFIG = {
  provider: 'openai',
  model: '',
  apiKey: '',
  baseUrl: '',
  temperature: 0.7,
  maxTokens: 2000,
  timeout: 30000,
};

// 配置状态
let configState = {
  config: { ...DEFAULT_CONFIG },
  isConnected: false,
  lastTestAt: null,
  lastError: null,
};

// 监听器列表
const listeners = new Set();

// 触发更新
function notifyListeners() {
  listeners.forEach(listener => listener(configState));
}

// 加载配置
export function loadConfig() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      configState.config = { ...DEFAULT_CONFIG, ...parsed };
    }
  } catch (error) {
    console.error('Failed to load API config:', error);
  }
  return configState.config;
}

// 保存配置
export function saveConfig(config) {
  try {
    const safeConfig = {
      ...config,
      apiKey: config.apiKey || '',
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(safeConfig));
    configState.config = safeConfig;
    notifyListeners();
    return true;
  } catch (error) {
    console.error('Failed to save API config:', error);
    return false;
  }
}

// 获取配置
export function getConfig() {
  return { ...configState.config };
}

// 获取 Provider 信息
export function getProvider(providerId) {
  return PROVIDERS[providerId] || PROVIDERS.custom;
}

// 获取 Provider 列表
export function getProviderList() {
  return Object.values(PROVIDERS);
}

// 获取当前 Provider 的 Model 列表
export function getModelList(providerId) {
  const provider = PROVIDERS[providerId];
  return provider ? (provider.models || []) : [];
}

// 从 API 获取模型列表
export async function fetchModels(config) {
  const provider = PROVIDERS[config.provider];
  const baseUrl = config.baseUrl || (provider ? provider.baseUrl : '');
  
  if (!baseUrl || !config.apiKey) {
    return { success: false, models: [], error: '缺少配置信息' };
  }
  
  try {
    const url = `${baseUrl}/models`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      return { success: false, models: [], error: `请求失败: ${response.status}` };
    }
    
    const data = await response.json();
    const models = (data.data || []).map((m) => ({
      id: m.id,
      name: m.id,
    }));
    
    return { success: true, models };
  } catch (error) {
    return { success: false, models: [], error: error.message };
  }
}

// 获取完整的 API 配置（包含默认值）
export function getFullConfig() {
  const config = getConfig();
  const provider = PROVIDERS[config.provider];
  
  return {
    ...config,
    baseUrl: config.baseUrl || (provider ? provider.baseUrl : ''),
  };
}

// 更新配置
export function updateConfig(updates) {
  const newConfig = { ...configState.config, ...updates };
  
  // 如果切换了 Provider，重置 baseUrl
  if (updates.provider && updates.provider !== configState.config.provider) {
    const newProvider = PROVIDERS[updates.provider];
    if (newProvider) {
      newConfig.baseUrl = updates.baseUrl !== undefined ? updates.baseUrl : newProvider.baseUrl;
    }
  }
  
  return saveConfig(newConfig);
}

// 验证配置
export function validateConfig(config) {
  const errors = [];
  
  if (!config.apiKey || config.apiKey.trim() === '') {
    errors.push('API Key 不能为空');
  } else if (config.apiKey.length < 10) {
    errors.push('API Key 格式不正确');
  }
  
  if (!config.model || config.model.trim() === '') {
    errors.push('请选择或输入模型');
  }
  
  if (PROVIDERS[config.provider]?.requiresBaseUrl) {
    if (!config.baseUrl || config.baseUrl.trim() === '') {
      errors.push('Base URL 不能为空');
    } else if (!config.baseUrl.startsWith('http')) {
      errors.push('Base URL 必须以 http:// 或 https:// 开头');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

// 导出配置
export function exportConfig() {
  const config = getConfig();
  return JSON.stringify({
    version: 1,
    exportedAt: new Date().toISOString(),
    config: {
      provider: config.provider,
      model: config.model,
      baseUrl: config.baseUrl,
      // 不导出 API Key
      hasApiKey: !!config.apiKey,
    },
  }, null, 2);
}

// 导入配置
export function importConfig(jsonString) {
  try {
    const data = JSON.parse(jsonString);
    if (data.version !== 1 || !data.config) {
      return { success: false, error: '配置文件格式不正确' };
    }
    
    const { provider, model, baseUrl } = data.config;
    
    if (!PROVIDERS[provider]) {
      return { success: false, error: '不支持的 Provider' };
    }
    
    updateConfig({ provider, model, baseUrl });
    
    return {
      success: true,
      message: '配置导入成功',
      needsApiKey: data.config.hasApiKey,
    };
  } catch (error) {
    return { success: false, error: '配置文件格式错误' };
  }
}

// 订阅配置变化
export function subscribe(listener) {
  listeners.add(listener);
  // 立即调用一次，返回当前状态
  listener(configState);
  
  // 返回取消订阅函数
  return () => {
    listeners.delete(listener);
  };
}

// 获取配置状态
export function getConfigState() {
  return { ...configState };
}

// 初始化
loadConfig();

export default {
  PROVIDERS,
  DEFAULT_CONFIG,
  loadConfig,
  saveConfig,
  getConfig,
  getProvider,
  getProviderList,
  getModelList,
  fetchModels,
  getFullConfig,
  updateConfig,
  validateConfig,
  exportConfig,
  importConfig,
  subscribe,
  getConfigState,
};
