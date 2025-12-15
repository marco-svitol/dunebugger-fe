import React from 'react';
import { useTranslation } from '../contexts/TranslationContext';
import './LanguageToggle.css';

const LanguageToggle = () => {
  const { isTranslationEnabled, toggleTranslation, isTranslating } = useTranslation();

  return (
    <div className="language-toggle">
      <button
        onClick={toggleTranslation}
        className={`language-button ${isTranslationEnabled ? 'active' : ''}`}
        disabled={isTranslating}
        title={isTranslationEnabled ? 'Switch to English' : 'Switch to Italian'}
      >
        {isTranslating ? (
          <span className="loading">⟳</span>
        ) : (
          <span className="language-text">
            {isTranslationEnabled ? 'IT' : 'EN'}
          </span>
        )}
      </button>
    </div>
  );
};

export default LanguageToggle;