import React, { useState, useRef, useEffect } from "react";
import "./DeviceSelector.css";

/**
 * DeviceSelector Component
 * 
 * Displays a dropdown to select from available devices when user.devices 
 * contains device names (e.g., "device1" or "device1,device2,device3").
 * 
 * - If no devices: renders nothing
 * - If one or more devices: displays as clickable dropdown
 * 
 * @param {string[]} availableDevices - Array of device names parsed from ws_group_name
 * @param {string} selectedDevice - Currently selected device name
 * @param {function} onDeviceChange - Callback when user selects a different device
 */
const DeviceSelector = ({ availableDevices, selectedDevice, onDeviceChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Function to capitalize first letter of device name
  const formatDeviceName = (deviceName) => {
    if (!deviceName) return deviceName;
    return deviceName.charAt(0).toUpperCase() + deviceName.slice(1);
  };

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

  const handleDeviceSelect = (device) => {
    onDeviceChange(device);
    setIsOpen(false);
  };

  // Don't render if no devices available
  if (!availableDevices || availableDevices.length === 0) {
    return null;
  }

  return (
    <div className="device-selector" ref={dropdownRef}>
      <button
        className="device-selector-button"
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <span className="selected-device">{formatDeviceName(selectedDevice)}</span>
        <span className={`dropdown-arrow ${isOpen ? 'open' : ''}`}>▼</span>
      </button>
      
      {isOpen && (
        <div className="device-dropdown">
          {availableDevices.map((device, index) => (
            <button
              key={index}
              className={`device-option ${device === selectedDevice ? 'selected' : ''}`}
              onClick={() => handleDeviceSelect(device)}
            >
              {formatDeviceName(device)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default DeviceSelector;