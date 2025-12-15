import React, { createContext, useContext, useState, useEffect } from 'react';
import translationService from '../services/translationService';

const TranslationContext = createContext();

/**
 * Translation Provider Component
 * Provides translation functionality throughout the app
 */
export const TranslationProvider = ({ children }) => {
  const [isTranslationEnabled, setIsTranslationEnabled] = useState(false);
  const [translatedTexts, setTranslatedTexts] = useState(new Map());
  const [isTranslating, setIsTranslating] = useState(false);

  // Load translation preference from localStorage
  useEffect(() => {
    const savedPreference = localStorage.getItem('translationEnabled');
    if (savedPreference !== null) {
      setIsTranslationEnabled(JSON.parse(savedPreference));
    }
  }, []);

  // Save translation preference to localStorage
  useEffect(() => {
    localStorage.setItem('translationEnabled', JSON.stringify(isTranslationEnabled));
  }, [isTranslationEnabled]);

  /**
   * Toggle translation on/off
   */
  const toggleTranslation = () => {
    setIsTranslationEnabled(prev => !prev);
  };

  /**
   * Translate text if translation is enabled
   * @param {string} text - Text to translate
   * @param {string} key - Optional key for caching (defaults to text)
   * @returns {Promise<string>} - Translated or original text
   */
  const translate = async (text, key = null) => {
    if (!isTranslationEnabled || !text || typeof text !== 'string') {
      return text;
    }

    const cacheKey = key || text;

    // Check if translation is already cached
    if (translatedTexts.has(cacheKey)) {
      return translatedTexts.get(cacheKey);
    }

    try {
      setIsTranslating(true);
      const translatedText = await translationService.translate(text);
      
      // Update cache
      setTranslatedTexts(prev => new Map(prev).set(cacheKey, translatedText));
      
      return translatedText;
    } catch (error) {
      console.warn('Translation failed:', error);
      return text;
    } finally {
      setIsTranslating(false);
    }
  };

  /**
   * Get translated text synchronously from cache
   * @param {string} text - Text to get translation for
   * @param {string} key - Optional key for caching (defaults to text)
   * @returns {string} - Translated text if available in cache, otherwise original text
   */
  const getTranslation = (text, key = null) => {
    if (!isTranslationEnabled || !text) {
      return text;
    }

    const cacheKey = key || text;
    return translatedTexts.get(cacheKey) || text;
  };

  /**
   * Preload translations for common texts
   */
  const preloadCommonTranslations = async () => {
    const commonTexts = [
      'Start',
      'Stop',
      'Main',
      'Sequence', 
      'Switches',
      'Scheduler',
      'Analytics',
      'System',
      'Refresh',
      'Cycle not running',
      'Connected to DuneBugger Portal',
      'Start command sent to DuneBugger device',
      'Stop command sent to DuneBugger device',
      'GPIO states refresh request sent',
      'System info refresh request sent',
      'This is the main control page for your device monitoring and control.',
      'Use the menu to navigate between different sections.',
      'Refresh system information',
      'Refresh GPIO states'
    ];

    if (isTranslationEnabled) {
      setIsTranslating(true);
      try {
        for (const text of commonTexts) {
          if (!translatedTexts.has(text)) {
            const translated = await translationService.translate(text);
            setTranslatedTexts(prev => new Map(prev).set(text, translated));
          }
        }
      } catch (error) {
        console.warn('Failed to preload translations:', error);
      } finally {
        setIsTranslating(false);
      }
    }
  };

  // Preload translations when translation is enabled
  useEffect(() => {
    if (isTranslationEnabled) {
      preloadCommonTranslations();
    }
  }, [isTranslationEnabled]);

  /**
   * Clear translation cache
   */
  const clearTranslationCache = () => {
    setTranslatedTexts(new Map());
    translationService.clearCache();
  };

  const value = {
    isTranslationEnabled,
    isTranslating,
    toggleTranslation,
    translate,
    getTranslation,
    clearTranslationCache,
    preloadCommonTranslations
  };

  return (
    <TranslationContext.Provider value={value}>
      {children}
    </TranslationContext.Provider>
  );
};

/**
 * Hook to use translation context
 */
export const useTranslation = () => {
  const context = useContext(TranslationContext);
  if (!context) {
    throw new Error('useTranslation must be used within a TranslationProvider');
  }
  return context;
};

export default TranslationContext;