import React, { useState, useRef, useEffect } from 'react';
import translationService from '../services/translationService';
import './TranslationConfig.css';

const TranslationConfig = ({ isOpen, onClose }) => {
  const modalRef = useRef(null);
  const [selectedProvider, setSelectedProvider] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [status, setStatus] = useState('');
  const [cacheStats, setCacheStats] = useState({ count: 0, storageSize: 0, storageSizeFormatted: '0 B' });

  const providers = [
    { id: 'google', name: 'Google Translate API', free: '100K chars/month', url: 'https://console.cloud.google.com/' },
    { id: 'microsoft', name: 'Microsoft Translator', free: '2M chars/month', url: 'https://portal.azure.com/' },
    { id: 'deepl', name: 'DeepL API', free: '500K chars/month', url: 'https://www.deepl.com/pro-api' }
  ];

  const handleSaveApiKey = () => {
    if (!selectedProvider || !apiKey.trim()) {
      setStatus('Please select a provider and enter an API key');
      return;
    }

    try {
      translationService.configureApiKey(selectedProvider, apiKey.trim());
      setStatus(`✅ ${providers.find(p => p.id === selectedProvider)?.name} configured successfully!`);
      setApiKey('');
      setTimeout(() => {
        setStatus('');
        onClose();
      }, 2000);
    } catch (error) {
      setStatus(`❌ Error: ${error.message}`);
    }
  };

  const handleTestTranslation = async () => {
    if (!selectedProvider || !apiKey.trim()) {
      setStatus('Please configure an API key first');
      return;
    }

    setStatus('Testing translation...');
    try {
      // Temporarily configure the API key for testing
      translationService.configureApiKey(selectedProvider, apiKey.trim());
      const result = await translationService.translate('Hello, this is a test');
      setStatus(`✅ Test successful! Translation: "${result}"`);
    } catch (error) {
      setStatus(`❌ Test failed: ${error.message}`);
    }
  };

  const getCurrentProviderInfo = () => {
    const current = translationService.getCurrentProvider();
    const providers = translationService.getProviders();
    return { current, providers };
  };

  const updateCacheStats = () => {
    setCacheStats(translationService.getCacheStats());
  };

  const handleClearCache = () => {
    translationService.clearCache();
    updateCacheStats();
    setStatus('✅ Cache cleared successfully');
    setTimeout(() => setStatus(''), 3000);
  };

  const handleExportCache = () => {
    const success = translationService.exportCache();
    if (success) {
      setStatus('✅ Cache exported successfully');
    } else {
      setStatus('❌ Failed to export cache');
    }
    setTimeout(() => setStatus(''), 3000);
  };

  const handleImportCache = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    translationService.importCache(file).then(result => {
      if (result.success) {
        setStatus(`✅ Imported ${result.count} translations successfully`);
        updateCacheStats();
      } else {
        setStatus(`❌ Import failed: ${result.error}`);
      }
      setTimeout(() => setStatus(''), 3000);
    });

    // Reset file input
    event.target.value = '';
  };

  // Update cache stats when component opens
  React.useEffect(() => {
    if (isOpen) {
      updateCacheStats();
    }
  }, [isOpen]);

  // Handle click outside modal and keyboard events
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const { current: currentProvider, providers: availableProviders } = getCurrentProviderInfo();

  const handleOverlayClick = (event) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="translation-config-overlay" onClick={handleOverlayClick}>
      <div className="translation-config-modal" ref={modalRef}>
        <div className="config-header">
          <h3>🌐 Translation Service Configuration</h3>
          <button 
            className="close-btn" 
            onClick={onClose}
            type="button"
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        <div className="config-content">
          <div className="current-status">
            <h4>Current Status</h4>
            <p><strong>Active Provider:</strong> {currentProvider}</p>
            <p><strong>Available Providers:</strong> {availableProviders.join(', ')}</p>
            <p><strong>Cached Translations:</strong> {cacheStats.count} ({cacheStats.storageSizeFormatted})</p>
            <p><strong>Persistent Storage:</strong> ✅ Enabled (survives browser restart)</p>
          </div>

          <div className="cache-management">
            <h4>💾 Cache Management</h4>
            <div className="cache-buttons">
              <button onClick={updateCacheStats} className="cache-btn">
                🔄 Refresh Stats
              </button>
              <button onClick={handleExportCache} className="cache-btn">
                📤 Export Cache
              </button>
              <label className="cache-btn file-input-label">
                📥 Import Cache
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportCache}
                  style={{ display: 'none' }}
                />
              </label>
              <button onClick={handleClearCache} className="cache-btn danger">
                🗑️ Clear Cache
              </button>
            </div>
          </div>

          <div className="provider-selection">
            <h4>Configure Premium API (Optional)</h4>
            <p>For better reliability and higher quality translations:</p>
            
            {providers.map(provider => (
              <div key={provider.id} className="provider-option">
                <label className="provider-label">
                  <input
                    type="radio"
                    name="provider"
                    value={provider.id}
                    checked={selectedProvider === provider.id}
                    onChange={(e) => setSelectedProvider(e.target.value)}
                  />
                  <div className="provider-info">
                    <strong>{provider.name}</strong>
                    <span className="free-tier">Free: {provider.free}</span>
                    <a href={provider.url} target="_blank" rel="noopener noreferrer" className="signup-link">
                      Create Account →
                    </a>
                  </div>
                </label>
              </div>
            ))}
          </div>

          {selectedProvider && (
            <div className="api-key-input">
              <h4>Enter API Key for {providers.find(p => p.id === selectedProvider)?.name}</h4>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Paste your API key here..."
                className="api-key-field"
              />
              <div className="config-buttons">
                <button onClick={handleTestTranslation} className="test-btn">
                  Test Translation
                </button>
                <button onClick={handleSaveApiKey} className="save-btn">
                  Save Configuration
                </button>
              </div>
            </div>
          )}

          {status && (
            <div className={`config-status ${status.startsWith('❌') ? 'error' : 'success'}`}>
              {status}
            </div>
          )}

          <div className="config-info">
            <h4>ℹ️ Information</h4>
            <ul>
              <li><strong>Current setup:</strong> Uses free LibreTranslate service (no API key needed)</li>
              <li><strong>Premium APIs:</strong> More reliable and higher quality translations</li>
              <li><strong>Fallback:</strong> If premium API fails, falls back to free services</li>
              <li><strong>Persistent Cache:</strong> Translations saved in browser storage (survives restart)</li>
              <li><strong>Privacy:</strong> All data stored locally in your browser only</li>
              <li><strong>Backup:</strong> Export/import cache for backup or sharing</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TranslationConfig;