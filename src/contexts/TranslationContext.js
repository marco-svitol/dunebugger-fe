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
      
      // Update cache (the translation service will handle localStorage persistence)
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
      'Off',
      'Standby',
      'Main',
      'Sequence', 
      'Switches',
      'Switch Control',
      'Scheduler',
      'Analytics',
      'System',
      'Refresh',
      'Edit',
      'Save',
      'Cancel',
      'Reset',
      'Cycle not running',
      'Physical Start Button Enabled',
      'Random Actions Enabled',
      'Your Profile',
      'Language',
      'Sign Out',
      'Sign In',
      'English',
      'Italiano',
      'User Details',
      'Display Name',
      'First Name',
      'Last Name',
      'Email',
      'Email Verified',
      'Last Login',
      'Verified',
      'Unverified',
      'Available Devices',
      'No devices available',
      'Selected',
      'Available',
      'User Permissions',
      'Cycle Control',
      'Sequence Management',
      'Switches Control',
      'Scheduler Management',
      'Language API Setup',
      'Language Preference',
      'Translation Settings',
      'Configure translation service API keys for better reliability and quality.',
      'Open Translation Settings',
      'admin',
      'view',
      'Connected to DuneBugger Portal',
      'Start command sent to DuneBugger device',
      'Stop command sent to DuneBugger device',
      'Set to Off state command sent',
      'Set to Standby state command sent',
      'GPIO states refresh request sent',
      'System info refresh request sent',
      'Sequence data refresh request sent',
      'No events to display',
      'Sequence Text Editor',
      'Uploading...',
      'Sequence uploaded successfully!',
      'Sequence upload command sent to DuneBugger device',
      'No WebSocket connection - sequence not uploaded',
      'Sequence reload request sent',
      'This is the main control page for your device monitoring and control.',
      'Use the menu to navigate between different sections.',
      'Refresh system information',
      'Refresh GPIO states',
      'Refresh sequence data',
      'Reload sequence from device',
      'Next Scheduled Actions',
      '🔄 Refresh',
      'Refresh next actions',
      'Refresh last executed action',
      '⏳ Loading next actions...',
      'Last Executed Action',
      '⏳ Loading last executed action...',
      'Weekly Schedule Editor',
      '✓ Schedule Loaded',
      '⏳ Waiting for data...',
      'Refresh schedule from device',
      'Lines',
      'Characters',
      'Schedule Events',
      '💡 Format: [day] or [DD-MM-YYYY] followed by HH:MM action',
      '⌨️ Ctrl+S to save, Esc to cancel',
      '⚠️ Save disabled - no connection',
      'Uploading schedule...',
      'Schedule uploaded successfully!',
      'Schedule upload command sent to DuneBugger device',
      'No WebSocket connection - schedule not uploaded',
      'Next actions request sent',
      'Last executed action request sent',
      'Refresh command sent',
      'Schedule refresh command sent',
      'No connection - cannot refresh',
      'Loading schedule from device...',
      'System Information',
      'Device ID',
      'Last Updated',
      'System information not available. Waiting for data from device...',
      'Dunebugger Components',
      'Version',
      'Hardware Information',
      'Device',
      'Model',
      'Revision',
      'CPU',
      'Architecture',
      'Cores',
      'Temperature',
      'Not available',
      'Load',
      'Memory',
      'Total',
      'Used',
      'Usage',
      'Storage',
      'Operating System',
      'Name',
      'Kernel',
      'Boot Time',
      'Network Information',
      'General',
      'Hostname',
      'Default Route',
      'DNS Servers',
      'Internet',
      'Reachable',
      'Not Reachable',
      'Gateway Latency',
      'Network Interfaces',
      'Type',
      'MAC',
      'IPv4',
      'IPv6',
      'Not assigned',
      'Speed',
      'SSID',
      'Signal',
      'Physical Location',
      'Address',
      'Description',
      'System Logs',
      'No logs available',
      'Unknown',
      'Invalid date',
      'Pin',
      'Label',
      'Mode',
      'State',
      'Switch',
      'No GPIO data available',
      '✓ Sequence Loaded',
      '⏳ Waiting for data from the device...',
      '▶️ Sequence Running',
      'Switch to'
    ];

    if (isTranslationEnabled) {
      setIsTranslating(true);
      try {
        const newTranslations = new Map();
        for (const text of commonTexts) {
          if (!translatedTexts.has(text)) {
            const translated = await translationService.translate(text);
            newTranslations.set(text, translated);
          }
        }
        
        // Batch update the state
        if (newTranslations.size > 0) {
          setTranslatedTexts(prev => {
            const updated = new Map(prev);
            newTranslations.forEach((value, key) => updated.set(key, value));
            return updated;
          });
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