import React, { useState, useRef, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { useTranslation } from '../contexts/TranslationContext';
import { useTranslatedText } from '../hooks/useTranslation';
import TranslationConfig from './TranslationConfig';
import './ProfileModal.css';

const ProfileModal = ({ isOpen, onClose, availableDevices = [], selectedDevice = "" }) => {
  const { user } = useAuth0();
  const { isTranslationEnabled, toggleTranslation } = useTranslation();
  const [showTranslationConfig, setShowTranslationConfig] = useState(false);
  const modalRef = useRef(null);

  // Translation hooks for ProfileModal
  const { translatedText: yourProfileText } = useTranslatedText("Your Profile");
  const { translatedText: userDetailsText } = useTranslatedText("User Details");
  const { translatedText: displayNameText } = useTranslatedText("Display Name");
  const { translatedText: firstNameText } = useTranslatedText("First Name");
  const { translatedText: lastNameText } = useTranslatedText("Last Name");
  const { translatedText: emailText } = useTranslatedText("Email");
  const { translatedText: emailVerifiedText } = useTranslatedText("Email Verified");
  const { translatedText: lastLoginText } = useTranslatedText("Last Login");
  const { translatedText: verifiedText } = useTranslatedText("Verified");
  const { translatedText: unverifiedText } = useTranslatedText("Unverified");
  const { translatedText: availableDevicesText } = useTranslatedText("Available Devices");
  const { translatedText: noDevicesAvailableText } = useTranslatedText("No devices available");
  const { translatedText: selectedText } = useTranslatedText("Selected");
  const { translatedText: availableText } = useTranslatedText("Available");
  const { translatedText: userPermissionsText } = useTranslatedText("User Permissions");
  const { translatedText: cycleControlText } = useTranslatedText("Cycle Control");
  const { translatedText: sequenceManagementText } = useTranslatedText("Sequence Management");
  const { translatedText: switchesControlText } = useTranslatedText("Switches Control");
  const { translatedText: schedulerManagementText } = useTranslatedText("Scheduler Management");
  const { translatedText: languageApiSetupText } = useTranslatedText("Language API Setup");
  const { translatedText: languagePreferenceText } = useTranslatedText("Language Preference");
  const { translatedText: englishText } = useTranslatedText("English");
  const { translatedText: italianoText } = useTranslatedText("Italiano");
  const { translatedText: translationSettingsText } = useTranslatedText("Translation Settings");
  const { translatedText: configureTranslationText } = useTranslatedText("Configure translation service API keys for better reliability and quality.");
  const { translatedText: openTranslationSettingsText } = useTranslatedText("Open Translation Settings");
  const { translatedText: adminText } = useTranslatedText("admin");
  const { translatedText: viewText } = useTranslatedText("view");

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

  if (!isOpen || !user) return null;

  const handleOverlayClick = (event) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  // Extract user permissions from Auth0 user object (similar to Profile.js)
  const getUserPermissions = () => {
    // Get permissions directly from user.permissions like Profile.js gets user.devices
    // permissions is an array of strings - if mentioned = "w", if not mentioned = "ro"
    const userPermissions = user.admin_rights_items || [];
    
    // Helper function to get permission level for a specific feature
    const getPermissionLevel = (feature) => {
      return userPermissions.includes(feature) ? 'w' : 'ro';
    };
    
    const permissions = {
      cycle: getPermissionLevel('cycle'),
      sequence: getPermissionLevel('sequence'),
      switches: getPermissionLevel('switches'),
      scheduler: getPermissionLevel('scheduler'),
      languageApi: getPermissionLevel('language_api'),
      // Convert to boolean for backward compatibility
      runStopCycle: getPermissionLevel('cycle') === 'w',
      modifySequence: getPermissionLevel('sequence') === 'w',
      modifySwitches: getPermissionLevel('switches') === 'w',
      modifyScheduler: getPermissionLevel('scheduler') === 'w',
      languageApiSetup: getPermissionLevel('language_api') === 'w'
    };
    return permissions;
  };

  // Use devices from the main application (revert to working approach)
  const deviceList = availableDevices.map(device => ({
    id: device,
    name: device,
    type: 'DuneBugger Device',
    status: device === selectedDevice ? selectedText : availableText
  }));

  const permissions = getUserPermissions();

  const getUserDisplayName = () => {
    return user.name || user.nickname || 'Unknown User';
  };

  const getUserDetails = () => {
    return {
      firstName: user.given_name || 'N/A',
      lastName: user.family_name || 'N/A',
      email: user.email || 'N/A',
      emailVerified: user.email_verified || false,
      lastLogin: user.updated_at ? new Date(user.updated_at).toLocaleDateString() : 'N/A',
      userId: user.sub || 'N/A'
    };
  };

  const userDetails = getUserDetails();

  return (
    <>
      <div className="profile-modal-overlay" onClick={handleOverlayClick}>
        <div className="profile-modal" ref={modalRef}>
          <div className="modal-header">
            <h2>👤 {yourProfileText}</h2>
            <button className="close-btn" onClick={onClose}>✕</button>
          </div>

          <div className="modal-content">
            {/* User Details Section */}
            <div className="profile-section">
              <h3>📋 {userDetailsText}</h3>
              <div className="user-details-grid">
                <div className="detail-item">
                  <label>{displayNameText}:</label>
                  <span>{getUserDisplayName()}</span>
                </div>
                <div className="detail-item">
                  <label>{firstNameText}:</label>
                  <span>{userDetails.firstName}</span>
                </div>
                <div className="detail-item">
                  <label>{lastNameText}:</label>
                  <span>{userDetails.lastName}</span>
                </div>
                <div className="detail-item">
                  <label>{emailText}:</label>
                  <span className="email-text">{userDetails.email}</span>
                </div>
                <div className="detail-item">
                  <label>{emailVerifiedText}:</label>
                  <span className={`status ${userDetails.emailVerified ? 'verified' : 'unverified'}`}>
                    {userDetails.emailVerified ? `✅ ${verifiedText}` : `❌ ${unverifiedText}`}
                  </span>
                </div>
                <div className="detail-item">
                  <label>{lastLoginText}:</label>
                  <span>{userDetails.lastLogin}</span>
                </div>
              </div>
            </div>

            {/* Available Devices Section */}
            <div className="profile-section">
              <h3>🔧 {availableDevicesText}</h3>
              <div className="devices-list">
                {deviceList.length > 0 ? (
                  deviceList.map(device => (
                    <div key={device.id} className="device-item">
                      <div className="device-info">
                        <div className="device-name">{device.name}</div>
                        <div className="device-type">{device.type}</div>
                      </div>
                      <div className="device-status">
                        <span className={`status-indicator ${device.status === 'Selected' ? 'selected' : 'available'}`}></span>
                        {device.status}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="no-devices">
                    <span className="no-devices-icon">📱</span>
                    <p>{noDevicesAvailableText}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Permissions Section */}
            <div className="profile-section">
              <h3>🛡️ {userPermissionsText}</h3>
              <div className="permissions-grid">
                <div className="permission-item">
                  <span className={`permission-status ${permissions.cycle === 'w' ? 'granted' : permissions.cycle === 'ro' ? 'readonly' : 'denied'}`}>
                    {permissions.cycle === 'w' ? '✅' : permissions.cycle === 'ro' ? '👁️' : '❌'}
                  </span>
                  <span>{cycleControlText} ({permissions.cycle === 'w' ? adminText : viewText})</span>
                </div>
                <div className="permission-item">
                  <span className={`permission-status ${permissions.sequence === 'w' ? 'granted' : permissions.sequence === 'ro' ? 'readonly' : 'denied'}`}>
                    {permissions.sequence === 'w' ? '✅' : permissions.sequence === 'ro' ? '👁️' : '❌'}
                  </span>
                  <span>{sequenceManagementText} ({permissions.sequence === 'w' ? adminText : viewText})</span>
                </div>
                <div className="permission-item">
                  <span className={`permission-status ${permissions.switches === 'w' ? 'granted' : permissions.switches === 'ro' ? 'readonly' : 'denied'}`}>
                    {permissions.switches === 'w' ? '✅' : permissions.switches === 'ro' ? '👁️' : '❌'}
                  </span>
                  <span>{switchesControlText} ({permissions.switches === 'w' ? adminText : viewText})</span>
                </div>
                <div className="permission-item">
                  <span className={`permission-status ${permissions.scheduler === 'w' ? 'granted' : permissions.scheduler === 'ro' ? 'readonly' : 'denied'}`}>
                    {permissions.scheduler === 'w' ? '✅' : permissions.scheduler === 'ro' ? '👁️' : '❌'}
                  </span>
                  <span>{schedulerManagementText} ({permissions.scheduler === 'w' ? adminText : viewText})</span>
                </div>
                <div className="permission-item">
                  <span className={`permission-status ${permissions.languageApi === 'w' ? 'granted' : permissions.languageApi === 'ro' ? 'readonly' : 'denied'}`}>
                    {permissions.languageApi === 'w' ? '✅' : permissions.languageApi === 'ro' ? '👁️' : '❌'}
                  </span>
                  <span>{languageApiSetupText} ({permissions.languageApi === 'w' ? adminText : viewText})</span>
                </div>
              </div>
            </div>

            {/* Language Preference Section */}
            <div className="profile-section">
              <h3>🌐 {languagePreferenceText}</h3>
              <div className="language-controls">
                <button 
                  className={`lang-btn ${!isTranslationEnabled ? 'active' : ''}`}
                  onClick={() => !isTranslationEnabled || toggleTranslation()}
                >
                  🇺🇸 {englishText}
                </button>
                <button 
                  className={`lang-btn ${isTranslationEnabled ? 'active' : ''}`}
                  onClick={() => isTranslationEnabled || toggleTranslation()}
                >
                  🇮🇹 {italianoText}
                </button>
              </div>
            </div>

            {/* Language API Setup Section */}
            {permissions.languageApiSetup && (
              <div className="profile-section">
                <h3>⚙️ {translationSettingsText}</h3>
                <p className="section-description">
                  {configureTranslationText}
                </p>
                <button 
                  className="config-btn"
                  onClick={() => setShowTranslationConfig(true)}
                >
                  <span>🔧</span>
                  {openTranslationSettingsText}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <TranslationConfig
        isOpen={showTranslationConfig}
        onClose={() => setShowTranslationConfig(false)}
      />
    </>
  );
};

export default ProfileModal;