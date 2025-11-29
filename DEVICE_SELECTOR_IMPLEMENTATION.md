# Device Selector Implementation

## Overview
Enhanced the Dunebugger frontend to support multiple devices per user account. The `user.devices` field can now contain multiple device names separated by commas, and users can switch between devices using a dropdown in the header.

## Changes Made

### 1. New Component: DeviceSelector
- **File**: `src/components/DeviceSelector.js`
- **Purpose**: Renders a dropdown for device selection when multiple devices are available
- **Features**:
  - Shows plain text for single device
  - Dropdown with clickable options for multiple devices
  - Click-outside-to-close functionality
  - Keyboard accessible (ARIA attributes)
  - Responsive design for mobile

### 2. Enhanced Profile Component
- **File**: `src/components/Profile.js`
- **Changes**:
  - Parses comma-separated `user.devices` into device array
  - Sets available devices and default selection
  - Added new props for device management

### 3. Updated Main Component
- **File**: `src/components/dunebugger.js`
- **Changes**:
  - Added state for `availableDevices` and `selectedDevice`
  - Added `handleDeviceChange` function
  - Enhanced WebSocket connection management with proper cleanup
  - Replaced fixed group text with DeviceSelector component
  - Updated Profile component props

### 4. Enhanced WebSocket Manager
- **File**: `src/components/websocket.js`
- **Changes**:
  - Improved cleanup method to properly disconnect WebSocket client
  - Added error handling for client disconnection

### 5. Styling
- **File**: `src/components/DeviceSelector.css`
- **Features**:
  - Clean, modern dropdown design
  - Hover and focus states
  - Mobile responsive
  - Consistent with existing app theme

## Usage

### Auth0 Configuration
The `user.devices` field should contain device names:
- Single device: `"device1"`
- Multiple devices: `"device1,device2,device3"`

### User Experience
1. **No devices**: Shows "No device associated with this account" warning
2. **Single device**: Displays device name as plain text
3. **Multiple devices**: Shows dropdown button with current device + arrow
4. **Device switching**: Clicking dropdown shows all available devices
5. **Connection handling**: WebSocket automatically reconnects when switching devices

## Technical Details

### State Management
- `availableDevices`: Array of parsed device names from Auth0
- `selectedDevice`: Currently active device
- `groupName`: Used for WebSocket connection (synced with selectedDevice)

### WebSocket Handling
- Connection automatically recreated when `groupName` changes
- Previous connections properly cleaned up to prevent memory leaks
- Connection state reset during device switches

### Error Handling
- Graceful handling of malformed device lists
- WebSocket cleanup errors caught and logged
- Dropdown closes properly on outside clicks

## Mobile Support
- Responsive design with smaller fonts and padding
- Touch-friendly dropdown options
- Text truncation for long device names