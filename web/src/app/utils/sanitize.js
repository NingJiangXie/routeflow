/**
 * Security utilities for XSS prevention and input sanitization.
 * All user-controlled data should be sanitized before rendering or sending to APIs.
 */

/** HTML entity map for escaping special characters */
const HTML_ENTITIES = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
  '`': '&#x60;',
  '=': '&#x3D;',
};

/** Regex pattern for potentially dangerous characters */
const DANGEROUS_CHARS_REGEX = /[&<>"'`=/]/g;

/**
 * Escapes HTML special characters to prevent XSS attacks.
 * Use this when rendering user-controlled content in HTML contexts.
 * @param {string} str - The string to escape
 * @returns {string} The escaped string
 */
export function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str).replace(DANGEROUS_CHARS_REGEX, (char) => HTML_ENTITIES[char] || char);
}

/**
 * Sanitizes a string by removing or encoding dangerous characters.
 * @param {string} input - The input to sanitize
 * @param {object} options - Sanitization options
 * @param {boolean} options.allowNewlines - Whether to preserve newlines (default: true)
 * @param {number} options.maxLength - Maximum allowed length
 * @returns {string} The sanitized string
 */
export function sanitizeInput(input, options = {}) {
  const { allowNewlines = true, maxLength = 10000 } = options;

  if (input === null || input === undefined) return '';

  let sanitized = String(input);

  // Remove null bytes and other control characters (except newlines if allowed)
  // eslint-disable-next-line no-control-regex
  sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

  // Optionally preserve newlines
  if (!allowNewlines) {
    sanitized = sanitized.replace(/[\r\n]/g, '');
  }

  // Truncate to max length
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }

  return sanitized;
}

/**
 * Sanitizes a URL to prevent javascript: and data: protocol attacks.
 * @param {string} url - The URL to sanitize
 * @returns {string|null} The sanitized URL or null if invalid
 */
export function sanitizeUrl(url) {
  if (url === null || url === undefined) return null;

  const trimmed = String(url).trim().toLowerCase();

  // Block dangerous protocols
  if (
    trimmed.startsWith('javascript:') ||
    trimmed.startsWith('data:') ||
    trimmed.startsWith('vbscript:') ||
    trimmed.startsWith('file:')
  ) {
    return null;
  }

  return String(url);
}

/**
 * Sanitizes a Git command argument to prevent command injection.
 * @param {string} input - The input to sanitize
 * @returns {string} The sanitized string
 */
export function sanitizeGitInput(input) {
  if (input === null || input === undefined) return '';

  return String(input)
    // eslint-disable-next-line no-control-regex
    .replace(/[\x00-\x1F]/g, '') // Remove control characters
    .replace(/[;&|`$(){}[\]<>\\]/g, '') // Remove shell metacharacters
    .trim()
    .substring(0, 500); // Limit length
}

/**
 * Validates that a string contains only safe characters for algorithm names.
 * @param {string} input - The input to validate
 * @returns {boolean} Whether the input is safe
 */
export function isValidAlgorithmName(input) {
  if (input === null || input === undefined) return false;
  return /^[a-zA-Z0-9_-]+$/.test(String(input)) && String(input).length <= 50;
}

/**
 * Validates that a string contains only safe characters for language names.
 * @param {string} input - The input to validate
 * @returns {boolean} Whether the input is safe
 */
export function isValidLanguageName(input) {
  if (input === null || input === undefined) return false;
  return /^[a-zA-Z0-9_+-]+$/.test(String(input)) && String(input).length <= 20;
}

/**
 * Strips all HTML tags from a string.
 * @param {string} input - The input to strip
 * @returns {string} The stripped string
 */
export function stripHtml(input) {
  if (input === null || input === undefined) return '';
  return String(input).replace(/<[^>]*>/g, '');
}

/**
 * Creates a sanitized copy of a chat message.
 * @param {object} message - The message object
 * @returns {object} The sanitized message
 */
export function sanitizeMessage(message) {
  if (!message || typeof message !== 'object') {
    return { role: 'user', content: '' };
  }

  return {
    role: ['system', 'user', 'assistant'].includes(message.role) ? message.role : 'user',
    content: sanitizeInput(message.content, { maxLength: 10000 }),
  };
}

/**
 * Creates a sanitized workspace payload.
 * @param {object} workspace - The workspace object
 * @returns {object} The sanitized workspace
 */
export function sanitizeWorkspace(workspace) {
  if (!workspace || typeof workspace !== 'object') {
    return { version: 1, maps: [], runs: [], presets: [] };
  }

  return {
    version: Number.isFinite(workspace.version) ? Math.min(Math.max(workspace.version, 1), 100) : 1,
    maps: Array.isArray(workspace.maps) ? workspace.maps.slice(0, 50) : [],
    runs: Array.isArray(workspace.runs) ? workspace.runs.slice(0, 100) : [],
    presets: Array.isArray(workspace.presets) ? workspace.presets.slice(0, 20) : [],
    updated_at: workspace.updated_at || null,
  };
}

/**
 * Security check utility that logs potential security issues.
 * @param {string} context - Where the check was performed
 * @param {string} input - The input being checked
 * @param {string} reason - Why the check failed
 */
export function securityLog(context, input, reason) {
  console.warn(`[Security] ${context}: ${reason}`, {
    input: input?.substring?.(0, 100) ?? input,
    timestamp: new Date().toISOString(),
  });
}
