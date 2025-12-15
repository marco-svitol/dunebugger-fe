import React, { useState } from 'react';
import { useTranslation } from '../contexts/TranslationContext';
import TranslationConfig from './TranslationConfig';
import './LanguageToggle.css';

const LanguageToggle = () => {
  const { isTranslationEnabled, toggleTranslation, isTranslating } = useTranslation();
  const [showConfig, setShowConfig] = useState(false);

  return (
    <>
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
        <button
          onClick={() => setShowConfig(true)}
          className="config-button"
          title="Translation Settings"
        >
          ⚙️
        </button>
      </div>
      
      <TranslationConfig
        isOpen={showConfig}
        onClose={() => setShowConfig(false)}
      />
    </>
  );
};

export default LanguageToggle;