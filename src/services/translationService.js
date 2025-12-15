/**
 * Translation Service
 * Uses LibreTranslate API for free translation from English to Italian
 * Fallback providers: Google Translate (unofficial), Microsoft Translator
 */

class TranslationService {
  constructor() {
    this.cache = new Map();
    this.sourceLanguage = 'en';
    this.targetLanguage = 'it';
    this.cacheKey = 'dunebugger_translations';
    
    // Load cached translations from localStorage on initialization
    this.loadCacheFromStorage();
    
    // Multiple translation providers for reliability
    this.providers = [
      {
        name: 'LibreTranslate',
        url: 'https://libretranslate.de/translate',
        method: 'POST'
      },
      {
        name: 'LibreTranslate-Backup', 
        url: 'https://translate.argosopentech.com/translate',
        method: 'POST'
      },
      {
        name: 'Lingva', // Unofficial Google Translate
        url: 'https://lingva.ml/api/v1',
        method: 'GET'
      }
    ];
    
    this.currentProviderIndex = 0;
  }

  /**
   * Load cached translations from localStorage
   */
  loadCacheFromStorage() {
    try {
      const storedCache = localStorage.getItem(this.cacheKey);
      if (storedCache) {
        const parsedCache = JSON.parse(storedCache);
        // Convert back to Map
        this.cache = new Map(Object.entries(parsedCache));
        console.log(`Loaded ${this.cache.size} translations from persistent cache`);
      }
    } catch (error) {
      console.warn('Failed to load translation cache from localStorage:', error);
      this.cache = new Map();
    }
  }

  /**
   * Save cached translations to localStorage
   */
  saveCacheToStorage() {
    try {
      // Convert Map to plain object for JSON storage
      const cacheObject = Object.fromEntries(this.cache);
      localStorage.setItem(this.cacheKey, JSON.stringify(cacheObject));
    } catch (error) {
      console.warn('Failed to save translation cache to localStorage:', error);
      
      // If localStorage is full, try to clean up old entries
      if (error.name === 'QuotaExceededError') {
        this.cleanupOldCacheEntries();
      }
    }
  }

  /**
   * Clean up old cache entries if storage is full
   */
  cleanupOldCacheEntries() {
    try {
      // Keep only the most recently used 50% of translations
      const cacheArray = Array.from(this.cache.entries());
      const keepCount = Math.floor(cacheArray.length / 2);
      
      // Keep the first half (assuming more recent entries are more likely to be reused)
      this.cache = new Map(cacheArray.slice(0, keepCount));
      
      // Try to save again
      this.saveCacheToStorage();
      console.log(`Cleaned up cache, keeping ${keepCount} translations`);
    } catch (error) {
      console.warn('Failed to cleanup cache:', error);
      // As last resort, clear the cache
      this.cache.clear();
      localStorage.removeItem(this.cacheKey);
    }
  }

  /**
   * Translate text using LibreTranslate API
   */
  async translateWithLibre(text, providerUrl) {
    const response = await fetch(providerUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: text,
        source: this.sourceLanguage,
        target: this.targetLanguage
      })
    });

    if (!response.ok) {
      throw new Error(`LibreTranslate API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.translatedText) {
      return data.translatedText;
    } else {
      throw new Error('Invalid response from LibreTranslate');
    }
  }

  /**
   * Translate text using Lingva API (unofficial Google Translate)
   */
  async translateWithLingva(text) {
    const response = await fetch(`https://lingva.ml/api/v1/${this.sourceLanguage}/${this.targetLanguage}/${encodeURIComponent(text)}`);
    
    if (!response.ok) {
      throw new Error(`Lingva API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.translation) {
      return data.translation;
    } else {
      throw new Error('Invalid response from Lingva');
    }
  }

  /**
   * Translate text from English to Italian with multiple provider fallback
   * @param {string} text - Text to translate
   * @returns {Promise<string>} - Translated text
   */
  async translate(text) {
    if (!text || typeof text !== 'string') {
      return text;
    }

    // Remove extra spaces and normalize
    const normalizedText = text.trim();
    
    if (!normalizedText) {
      return text;
    }

    // Check cache first
    if (this.cache.has(normalizedText)) {
      return this.cache.get(normalizedText);
    }

    // Try each provider until one succeeds
    for (let i = 0; i < this.providers.length; i++) {
      const providerIndex = (this.currentProviderIndex + i) % this.providers.length;
      const provider = this.providers[providerIndex];
      
      try {
        let translatedText;
        
        if (provider.name.includes('LibreTranslate')) {
          translatedText = await this.translateWithLibre(normalizedText, provider.url);
        } else if (provider.name === 'Lingva') {
          translatedText = await this.translateWithLingva(normalizedText);
        } else if (provider.name === 'Google Translate' && provider.apiKey) {
          translatedText = await this.translateWithGoogle(normalizedText, provider.apiKey);
        } else if (provider.name === 'Microsoft Translator' && provider.apiKey) {
          translatedText = await this.translateWithMicrosoft(normalizedText, provider.apiKey);
        } else if (provider.name === 'DeepL' && provider.apiKey) {
          translatedText = await this.translateWithDeepL(normalizedText, provider.apiKey);
        }
        
        if (translatedText && translatedText.trim()) {
          // Cache the translation in memory and localStorage
          this.cache.set(normalizedText, translatedText);
          this.saveCacheToStorage();
          
          // Update current provider if this one worked
          this.currentProviderIndex = providerIndex;
          
          return translatedText;
        }
      } catch (error) {
        console.warn(`Translation failed with ${provider.name}:`, error.message);
        // Continue to next provider
      }
    }

    // If all providers fail, return original text
    console.warn('All translation providers failed for text:', normalizedText);
    return text;
  }

  /**
   * Translate multiple texts in batch
   * @param {string[]} texts - Array of texts to translate
   * @returns {Promise<string[]>} - Array of translated texts
   */
  async translateBatch(texts) {
    if (!Array.isArray(texts)) {
      return texts;
    }

    const promises = texts.map(text => this.translate(text));
    return Promise.all(promises);
  }

  /**
   * Configure API key for premium services (Google, Microsoft, DeepL)
   * @param {string} provider - 'google', 'microsoft', or 'deepl'
   * @param {string} apiKey - API key for the service
   */
  configureApiKey(provider, apiKey) {
    if (!apiKey || !apiKey.trim()) {
      console.warn('Invalid API key provided');
      return;
    }

    const premiumProviders = {
      google: {
        name: 'Google Translate',
        url: 'https://translation.googleapis.com/language/translate/v2',
        method: 'POST'
      },
      microsoft: {
        name: 'Microsoft Translator', 
        url: 'https://api.cognitive.microsofttranslator.com/translate',
        method: 'POST'
      },
      deepl: {
        name: 'DeepL',
        url: 'https://api-free.deepl.com/v2/translate',
        method: 'POST'
      }
    };

    if (premiumProviders[provider]) {
      // Add API key and insert premium provider at the beginning
      const premiumProvider = {
        ...premiumProviders[provider],
        apiKey: apiKey
      };
      
      // Remove any existing instance of this provider
      this.providers = this.providers.filter(p => !p.name.toLowerCase().includes(provider));
      
      // Insert at the beginning for priority
      this.providers.unshift(premiumProvider);
      
      console.log(`Configured ${premiumProvider.name} API key - will be used as primary translation service`);
    } else {
      console.warn('Unsupported provider. Use: google, microsoft, or deepl');
    }
  }

  /**
   * Translate using Google Translate API
   */
  async translateWithGoogle(text, apiKey) {
    const response = await fetch(`https://translation.googleapis.com/language/translate/v2?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: text,
        source: this.sourceLanguage,
        target: this.targetLanguage
      })
    });

    if (!response.ok) {
      throw new Error(`Google Translate API error: ${response.status}`);
    }

    const data = await response.json();
    return data.data.translations[0].translatedText;
  }

  /**
   * Translate using Microsoft Translator API  
   */
  async translateWithMicrosoft(text, apiKey) {
    const response = await fetch(`https://api.cognitive.microsofttranslator.com/translate?api-version=3.0&to=${this.targetLanguage}`, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([{ text: text }])
    });

    if (!response.ok) {
      throw new Error(`Microsoft Translator API error: ${response.status}`);
    }

    const data = await response.json();
    return data[0].translations[0].text;
  }

  /**
   * Translate using DeepL API
   */
  async translateWithDeepL(text, apiKey) {
    const response = await fetch('https://api-free.deepl.com/v2/translate', {
      method: 'POST',
      headers: {
        'Authorization': `DeepL-Auth-Key ${apiKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        text: text,
        source_lang: this.sourceLanguage.toUpperCase(),
        target_lang: this.targetLanguage.toUpperCase()
      })
    });

    if (!response.ok) {
      throw new Error(`DeepL API error: ${response.status}`);
    }

    const data = await response.json();
    return data.translations[0].text;
  }

  /**
   * Clear the translation cache (both memory and localStorage)
   */
  clearCache() {
    this.cache.clear();
    try {
      localStorage.removeItem(this.cacheKey);
      console.log('Translation cache cleared from memory and localStorage');
    } catch (error) {
      console.warn('Failed to clear cache from localStorage:', error);
    }
  }

  /**
   * Get cache size
   * @returns {number} - Number of cached translations
   */
  getCacheSize() {
    return this.cache.size;
  }

  /**
   * Get current provider information
   */
  getCurrentProvider() {
    return this.providers[this.currentProviderIndex]?.name || 'None';
  }

  /**
   * Get list of available providers
   */
  getProviders() {
    return this.providers.map(p => p.name);
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    try {
      const cacheString = localStorage.getItem(this.cacheKey);
      const storageSize = cacheString ? new Blob([cacheString]).size : 0;
      
      return {
        count: this.cache.size,
        storageSize: storageSize,
        storageSizeFormatted: this.formatBytes(storageSize)
      };
    } catch (error) {
      return {
        count: this.cache.size,
        storageSize: 0,
        storageSizeFormatted: '0 B'
      };
    }
  }

  /**
   * Format bytes to human readable format
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  /**
   * Export cache data for backup
   */
  exportCache() {
    try {
      const cacheObject = Object.fromEntries(this.cache);
      const dataStr = JSON.stringify(cacheObject, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      
      // Create download link
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `dunebugger-translations-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      return true;
    } catch (error) {
      console.error('Failed to export cache:', error);
      return false;
    }
  }

  /**
   * Import cache data from backup
   */
  async importCache(file) {
    try {
      const text = await file.text();
      const cacheObject = JSON.parse(text);
      
      // Validate the data structure
      if (typeof cacheObject !== 'object' || cacheObject === null) {
        throw new Error('Invalid cache file format');
      }
      
      // Merge with existing cache
      const importedCache = new Map(Object.entries(cacheObject));
      for (const [key, value] of importedCache) {
        this.cache.set(key, value);
      }
      
      // Save to localStorage
      this.saveCacheToStorage();
      
      console.log(`Imported ${importedCache.size} translations`);
      return { success: true, count: importedCache.size };
    } catch (error) {
      console.error('Failed to import cache:', error);
      return { success: false, error: error.message };
    }
  }
}

// Create and export a singleton instance
const translationService = new TranslationService();
export default translationService;