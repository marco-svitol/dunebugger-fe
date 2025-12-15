import { useState, useEffect } from 'react';
import { useTranslation } from '../contexts/TranslationContext';

/**
 * Custom hook for translating text
 * @param {string} text - Text to translate
 * @param {string} key - Optional cache key (defaults to text)
 * @returns {string} - Translated text or original text
 */
export const useTranslatedText = (text, key = null) => {
  const { isTranslationEnabled, translate, getTranslation } = useTranslation();
  const [translatedText, setTranslatedText] = useState(text);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isTranslationEnabled) {
      setTranslatedText(text);
      return;
    }

    // First, check if translation is already cached
    const cachedTranslation = getTranslation(text, key);
    if (cachedTranslation !== text) {
      setTranslatedText(cachedTranslation);
      return;
    }

    // If not cached, translate it
    if (text && typeof text === 'string' && text.trim()) {
      setIsLoading(true);
      translate(text, key)
        .then(translated => {
          setTranslatedText(translated);
        })
        .catch(error => {
          console.warn('Translation hook error:', error);
          setTranslatedText(text);
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setTranslatedText(text);
    }
  }, [text, key, isTranslationEnabled, translate, getTranslation]);

  return { translatedText, isLoading };
};

/**
 * Custom hook for translating multiple texts
 * @param {string[]} texts - Array of texts to translate
 * @returns {object} - Object with translatedTexts array and isLoading state
 */
export const useTranslatedTexts = (texts) => {
  const { isTranslationEnabled, translate } = useTranslation();
  const [translatedTexts, setTranslatedTexts] = useState(texts);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isTranslationEnabled || !Array.isArray(texts)) {
      setTranslatedTexts(texts);
      return;
    }

    const translateTexts = async () => {
      setIsLoading(true);
      try {
        const translations = await Promise.all(
          texts.map(text => translate(text))
        );
        setTranslatedTexts(translations);
      } catch (error) {
        console.warn('Batch translation error:', error);
        setTranslatedTexts(texts);
      } finally {
        setIsLoading(false);
      }
    };

    translateTexts();
  }, [texts, isTranslationEnabled, translate]);

  return { translatedTexts, isLoading };
};

/**
 * Simple component for translating text inline
 * @param {object} props - Component props
 * @param {string} props.text - Text to translate
 * @param {string} props.cacheKey - Optional cache key
 * @param {React.ComponentType} props.as - Component to render as (default: span)
 * @param {object} props.rest - Other props to pass to the component
 */
export const T = ({ text, cacheKey, as: Component = 'span', ...rest }) => {
  const { translatedText } = useTranslatedText(text, cacheKey);
  
  return <Component {...rest}>{translatedText}</Component>;
};