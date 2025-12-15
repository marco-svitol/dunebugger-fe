import React, { useState, useRef, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { useTranslation } from '../contexts/TranslationContext';
import { useTranslatedText } from '../hooks/useTranslation';
import ProfileModal from './ProfileModal';
import TranslationConfig from './TranslationConfig';
import './UserDropdown.css';

const UserDropdown = ({ availableDevices = [], selectedDevice = "" }) => {
  const { loginWithRedirect, logout, isAuthenticated, user } = useAuth0();
  const { isTranslationEnabled, toggleTranslation } = useTranslation();
  
  // Translation hooks for dropdown menu items
  const { translatedText: yourProfileText } = useTranslatedText("Your Profile");
  const { translatedText: languageText } = useTranslatedText("Language");
  const { translatedText: signOutText } = useTranslatedText("Sign Out");
  const { translatedText: signInText } = useTranslatedText("Sign In");
  const { translatedText: englishText } = useTranslatedText("English");
  const { translatedText: italianoText } = useTranslatedText("Italiano");
  const [isOpen, setIsOpen] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showTranslationConfig, setShowTranslationConfig] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleProfileClick = () => {
    setShowProfileModal(true);
    setIsOpen(false);
  };

  const handleLanguageToggle = () => {
    toggleTranslation();
    setIsOpen(false);
  };

  const handleLanguageConfigClick = () => {
    setShowTranslationConfig(true);
    setIsOpen(false);
  };

  const handleAuthClick = () => {
    if (isAuthenticated) {
      logout();
    } else {
      loginWithRedirect();
    }
    setIsOpen(false);
  };

  const getUserDisplayName = () => {
    if (!user) return 'User';
    return user.name || user.nickname || user.email || 'User';
  };

  const getUserInitials = () => {
    if (!user) return 'U';
    const name = getUserDisplayName();
    return name.split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <>
      <div className="user-dropdown" ref={dropdownRef}>
        <button 
          className={`user-dropdown-trigger ${isOpen ? 'open' : ''}`}
          onClick={() => setIsOpen(!isOpen)}
        >
          {isAuthenticated && user?.picture ? (
            <img 
              src={user.picture} 
              alt={getUserDisplayName()}
              className="user-avatar"
            />
          ) : (
            <div className="user-initials">
              {isAuthenticated ? getUserInitials() : '👤'}
            </div>
          )}
          <span className="dropdown-arrow">▼</span>
        </button>

        {isOpen && (
          <div className="user-dropdown-menu">
            {isAuthenticated && (
              <>
                <div className="dropdown-header">
                  <div className="user-info">
                    {user?.picture ? (
                      <img 
                        src={user.picture} 
                        alt={getUserDisplayName()}
                        className="user-avatar-large"
                      />
                    ) : (
                      <div className="user-initials-large">
                        {getUserInitials()}
                      </div>
                    )}
                    <div className="user-details">
                      <div className="user-name">{getUserDisplayName()}</div>
                      <div className="user-email">{user?.email}</div>
                    </div>
                  </div>
                </div>

                <div className="dropdown-divider"></div>

                <button 
                  className="dropdown-item"
                  onClick={handleProfileClick}
                >
                  <span className="dropdown-icon">👤</span>
                  {yourProfileText}
                </button>

                <div className="dropdown-divider"></div>
              </>
            )}

            <button 
              className="dropdown-item"
              onClick={handleLanguageToggle}
            >
              <span className="dropdown-icon">🌐</span>
              {languageText}: {isTranslationEnabled ? italianoText : englishText}
            </button>

            <div className="dropdown-divider"></div>

            <button 
              className="dropdown-item auth-item"
              onClick={handleAuthClick}
            >
              <span className="dropdown-icon">
                {isAuthenticated ? '🚪' : '🔑'}
              </span>
              {isAuthenticated ? signOutText : signInText}
            </button>
          </div>
        )}
      </div>

      <ProfileModal 
        isOpen={showProfileModal}
        availableDevices={availableDevices}
        selectedDevice={selectedDevice}
        onClose={() => setShowProfileModal(false)}
      />

      <TranslationConfig
        isOpen={showTranslationConfig}
        onClose={() => setShowTranslationConfig(false)}
      />
    </>
  );
};

export default UserDropdown;