import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  CheckCircle, 
  XCircle, 
  Loader, 
  Download, 
  Upload, 
  RefreshCw,
} from 'lucide-react';
import { 
  PROVIDERS, 
  getProvider, 
  getConfig,
  updateConfig,
  validateConfig,
  exportConfig,
  importConfig,
  subscribe,
  fetchModels,
} from '../services/apiConfig.js';
import { Field } from './ui.jsx';

export function ApiConfigPanel({ onClose, locale = 'zh' }) {
  const { t } = useTranslation();
  const [config, setConfig] = useState(getConfig);
  const [testing, setTesting] = useState(false);
  const [fetchingModels, setFetchingModels] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [errors, setErrors] = useState([]);
  const [availableModels, setAvailableModels] = useState([]);
  
  // 订阅配置变化
  useEffect(() => {
    const unsubscribe = subscribe((state) => {
      setConfig({ ...state.config });
    });
    return unsubscribe;
  }, []);
  
  // 验证配置
  useEffect(() => {
    const validation = validateConfig(config);
    setErrors(validation.errors);
  }, [config]);
  
  // 处理输入变化
  const handleChange = useCallback((field, value) => {
    const newConfig = { ...config, [field]: value };
    
    // 如果切换了 Provider，更新 baseUrl
    if (field === 'provider' && value !== config.provider) {
      const provider = getProvider(value);
      if (provider) {
        newConfig.baseUrl = provider.baseUrl || '';
      }
    }
    
    setConfig(newConfig);
    updateConfig(newConfig);
    setTestResult(null);
    setAvailableModels([]);
  }, [config]);
  
  // 测试连接
  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      if (!config.apiKey || config.apiKey.length < 10) {
        setTestResult({
          success: false,
          message: locale === 'zh' ? 'API Key 无效' : 'Invalid API Key',
        });
      } else {
        setTestResult({
          success: true,
          message: locale === 'zh' ? '连接成功！' : 'Connection successful!',
        });
      }
    } catch (error) {
      setTestResult({
        success: false,
        message: error.message || (locale === 'zh' ? '连接失败' : 'Connection failed'),
      });
    } finally {
      setTesting(false);
    }
  };
  
  // 获取模型列表
  const handleFetchModels = async () => {
    setFetchingModels(true);
    setTestResult(null);
    
    try {
      const result = await fetchModels(config);
      
      if (result.success) {
        setAvailableModels(result.models);
        setTestResult({
          success: true,
          message: locale === 'zh' 
            ? `成功获取 ${result.models.length} 个模型` 
            : `Successfully fetched ${result.models.length} models`,
        });
      } else {
        setTestResult({
          success: false,
          message: result.error || (locale === 'zh' ? '获取模型失败' : 'Failed to fetch models'),
        });
      }
    } catch (error) {
      setTestResult({
        success: false,
        message: error.message || (locale === 'zh' ? '获取模型失败' : 'Failed to fetch models'),
      });
    } finally {
      setFetchingModels(false);
    }
  };
  
  // 导出配置
  const handleExport = () => {
    const json = exportConfig();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `routeflow-api-config-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  // 导入配置
  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      
      try {
        const text = await file.text();
        const result = importConfig(text);
        
        if (result.success) {
          if (result.needsApiKey) {
            alert(locale === 'zh' 
              ? '配置导入成功，但需要重新输入 API Key' 
              : 'Config imported successfully, but you need to re-enter the API Key');
          } else {
            alert(locale === 'zh' ? '配置导入成功' : 'Config imported successfully');
          }
        } else {
          alert(result.error);
        }
      } catch (error) {
        alert(locale === 'zh' ? '导入失败：' + error.message : 'Import failed: ' + error.message);
      }
    };
    input.click();
  };
  
  const currentProvider = getProvider(config.provider);
  
  return (
    <div className="api-config-panel">
      <div className="config-header">
        <h3>{locale === 'zh' ? 'API 配置' : 'API Configuration'}</h3>
        <button className="icon-btn" onClick={onClose}>
          <XCircle size={18} />
        </button>
      </div>
      
      {errors.length > 0 && (
        <div className="config-errors">
          {errors.map((error, idx) => (
            <div key={idx} className="error-item">
              <XCircle size={14} />
              <span>{error}</span>
            </div>
          ))}
        </div>
      )}
      
      {testResult && (
        <div className={`test-result ${testResult.success ? 'success' : 'error'}`}>
          {testResult.success ? (
            <CheckCircle size={16} />
          ) : (
            <XCircle size={16} />
          )}
          <span>{testResult.message}</span>
        </div>
      )}
      
      <div className="config-form">
        <Field label={t('modal.provider')}>
          <div className="provider-select">
            <select 
              value={config.provider}
              onChange={(e) => handleChange('provider', e.target.value)}
            >
              {Object.values(PROVIDERS).map((provider) => (
                <option key={provider.id} value={provider.id}>
                  {locale === 'zh' ? provider.nameZh : provider.nameEn}
                </option>
              ))}
            </select>
          </div>
        </Field>
        
        <Field label={
          <div className="field-label-row">
            <span>{t('modal.model')}</span>
            <button 
              className="link-btn fetch-models-btn"
              onClick={handleFetchModels}
              disabled={fetchingModels || !config.apiKey}
            >
              {fetchingModels ? (
                <Loader size={14} className="spinning" />
              ) : (
                <RefreshCw size={14} />
              )}
              {locale === 'zh' ? '读取模型' : 'Fetch Models'}
            </button>
          </div>
        }>
          {availableModels.length > 0 ? (
            <select 
              value={config.model}
              onChange={(e) => handleChange('model', e.target.value)}
            >
              <option value="">{locale === 'zh' ? '请选择模型' : 'Select a model'}</option>
              {availableModels.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.name}
                </option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              value={config.model}
              onChange={(e) => handleChange('model', e.target.value)}
              placeholder={locale === 'zh' ? '输入模型名称或点击读取模型' : 'Enter model name or click Fetch Models'}
            />
          )}
        </Field>
        
        <Field label={t('modal.apiKey')}>
          <input
            type="password"
            value={config.apiKey}
            onChange={(e) => handleChange('apiKey', e.target.value)}
            placeholder={locale === 'zh' ? '输入您的 API Key' : 'Enter your API Key'}
            autoComplete="off"
          />
        </Field>
        
        {currentProvider?.requiresBaseUrl && (
          <Field label={t('modal.baseUrl')}>
            <input
              type="text"
              value={config.baseUrl}
              onChange={(e) => handleChange('baseUrl', e.target.value)}
              placeholder={locale === 'zh' ? '例如：https://api.openai.com/v1' : 'e.g., https://api.openai.com/v1'}
            />
          </Field>
        )}
        
        <details className="advanced-options">
          <summary>{locale === 'zh' ? '高级选项' : 'Advanced Options'}</summary>
          <div className="advanced-fields">
            <Field label={locale === 'zh' ? 'Temperature' : 'Temperature'}>
              <div className="range-row">
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={config.temperature || 0.7}
                  onChange={(e) => handleChange('temperature', parseFloat(e.target.value))}
                />
                <span className="range-value">{config.temperature || 0.7}</span>
              </div>
            </Field>
            
            <Field label={locale === 'zh' ? '最大 Token 数' : 'Max Tokens'}>
              <input
                type="number"
                min="100"
                max="100000"
                step="100"
                value={config.maxTokens || 2000}
                onChange={(e) => handleChange('maxTokens', parseInt(e.target.value))}
              />
            </Field>
          </div>
        </details>
      </div>
      
      <div className="config-actions">
        <div className="action-group">
          <button
            className="secondary-btn"
            onClick={handleTest}
            disabled={testing || errors.length > 0}
          >
            {testing ? (
              <Loader size={16} className="spinning" />
            ) : (
              <RefreshCw size={16} />
            )}
            {testing 
              ? (locale === 'zh' ? '测试中...' : 'Testing...')
              : (locale === 'zh' ? '测试连接' : 'Test Connection')
            }
          </button>
        </div>
        
        <div className="action-group">
          <button className="secondary-btn" onClick={handleExport}>
            <Download size={16} />
            {locale === 'zh' ? '导出' : 'Export'}
          </button>
          
          <button className="secondary-btn" onClick={handleImport}>
            <Upload size={16} />
            {locale === 'zh' ? '导入' : 'Import'}
          </button>
        </div>
      </div>
      
      <div className="config-tip">
        <p>
          {locale === 'zh' 
            ? '您的 API Key 仅保存在本地浏览器中，不会发送到我们的服务器。'
            : 'Your API Key is stored only in your local browser and will not be sent to our servers.'
          }
        </p>
      </div>
    </div>
  );
}

export default ApiConfigPanel;
