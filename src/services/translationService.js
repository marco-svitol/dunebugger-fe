/**
 * Translation Service
 * Uses MyMemory API for free translation from English to Italian
 */

class TranslationService {
  constructor() {
    this.cache = new Map();
    this.apiUrl = 'https://api.mymemory.translated.net/get';
    this.sourceLanguage = 'en';
    this.targetLanguage = 'it';
  }

  /**
   * Translate text from English to Italian
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

    try {
      const response = await fetch(`${this.apiUrl}?q=${encodeURIComponent(normalizedText)}&langpair=${this.sourceLanguage}|${this.targetLanguage}`);
      
      if (!response.ok) {
        console.warn('Translation API request failed:', response.status);
        return text; // Return original text if translation fails
      }

      const data = await response.json();
      
      if (data.responseStatus === 200 && data.responseData && data.responseData.translatedText) {
        const translatedText = data.responseData.translatedText;
        
        // Cache the translation
        this.cache.set(normalizedText, translatedText);
        
        return translatedText;
      } else {
        console.warn('Translation API returned error:', data);
        return text;
      }
    } catch (error) {
      console.warn('Translation error:', error);
      return text; // Return original text if translation fails
    }
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
   * Clear the translation cache
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * Get cache size
   * @returns {number} - Number of cached translations
   */
  getCacheSize() {
    return this.cache.size;
  }
}

// Create and export a singleton instance
const translationService = new TranslationService();
export default translationService;