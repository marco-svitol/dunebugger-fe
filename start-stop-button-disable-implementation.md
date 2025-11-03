# Start/Stop Button Disable Logic Implementation

## Summary
Successfully implemented the same start/stop button disable logic used in MainPage across all pages that have these buttons.

## Implementation Details

### Problem
The start and stop buttons in MainPage correctly disable themselves based on cycle state:
- **Start button** disabled when cycle is running
- **Stop button** disabled when cycle is stopped

The same logic needed to be applied to start/stop buttons on SequencePage and GPIOsPage.

### Analysis
After analyzing the codebase:
- **SequencePage**: No direct start/stop buttons - uses ActionBar
- **GpioTable**: No start/stop buttons - uses ActionBar  
- **ActionBar**: Contains the start/stop buttons for sequence and gpios pages

### Solution
Updated `ActionBar.js` to implement the same cycle detection logic as `MainPage.js`:

1. **Added cycle detection logic**:
   - Track `playingTime` updates to determine if cycle is running
   - Use 15-second timeout to detect when cycle stops
   - Calculate cycle status based on remaining time

2. **Updated button disable logic**:
   ```javascript
   // Start button: disabled when offline OR cycle running
   disabled={!isOnline || isCycleRunning}
   
   // Stop button: disabled when offline OR cycle NOT running  
   disabled={!isOnline || !isCycleRunning}
   ```

3. **Added required props**:
   - `playingTime` - to track cycle progress
   - `sequence` - to calculate total cycle length

### Files Modified

#### `/src/components/dunebugger.js`
- Added `playingTime` and `sequence` props to ActionBar component

#### `/src/components/ActionBar.js` 
- Added imports: `useState`, `useEffect`, `useCallback`
- Added state management for cycle detection
- Implemented same cycle detection logic as MainPage
- Updated StartStopButtons component with proper disable logic

### Testing
- App compiles successfully without warnings
- Start/stop buttons now properly disable based on cycle state on all pages:
  - **Sequence page** (via ActionBar)
  - **GPIOs page** (via ActionBar) 
  - **Main page** (existing implementation)

## Result
All start/stop buttons across the application now consistently disable themselves based on the actual cycle running state, providing a uniform user experience.