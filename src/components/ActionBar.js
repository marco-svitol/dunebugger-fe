import React from "react";
import "./ActionBar.css";

const ActionBar = ({ currentPage, wsClient, connectionId, sequenceState, isOnline }) => {
  // Handler for Start button (sends "c" command)
  const handleStart = () => {
    if (wsClient && isOnline) {
      wsClient.sendRequest("dunebugger_set", "c", connectionId);
    }
  };
  
  // Handler for Stop button (sends "cs" command)
  const handleStop = () => {
    if (wsClient && isOnline) {
      wsClient.sendRequest("dunebugger_set", "cs", connectionId);
    }
  };

  // Custom component for Start/Stop buttons to avoid repetition
  const StartStopButtons = () => (
    <div className="start-stop-buttons">
      <button className="start-button" onClick={handleStart} disabled={!isOnline}>Start</button>
      <button className="stop-button" onClick={handleStop} disabled={!isOnline}>Stop</button>
    </div>
  );

  // Custom component for modified sequence switches without Cycle
  const ModifiedSwitches = () => (
    <div className="sequence-switches">
      <div className="switch-container">
        <label>Physical Start Button Enabled</label>
        <label className="switch">
          <input
            type="checkbox"
            checked={sequenceState?.start_button_enabled || false}
            onChange={() => {
              if (wsClient && isOnline) {
                wsClient.sendRequest(
                  "dunebugger_set",
                  sequenceState?.start_button_enabled ? "dsb" : "esb",
                  connectionId
                );
              }
            }}
            disabled={!isOnline}
          />
          <span className="slider"></span>
        </label>
      </div>
      <div className="switch-container">
        <label>Random Actions Enabled</label>
        <label className="switch">
          <input
            type="checkbox"
            checked={sequenceState?.random_actions || false}
            onChange={() => {
              if (wsClient && isOnline) {
                wsClient.sendRequest(
                  "dunebugger_set",
                  sequenceState?.random_actions ? "dr" : "er",
                  connectionId
                );
              }
            }}
            disabled={!isOnline}
          />
          <span className="slider"></span>
        </label>
      </div>
    </div>
  );

  // Render different controls based on the current page
  const renderControls = () => {
    switch (currentPage) {
      case "main":
        return (
          <div className="main-controls">
            <ModifiedSwitches />
          </div>
        );
      case "sequence":
        return (
          <div className="sequence-controls">
            <button 
              className="refresh-button" 
              onClick={() => wsClient && wsClient.sendRequest("refresh", "null")}
              disabled={!isOnline}
            >
              Refresh
            </button>
            <StartStopButtons />
            <button disabled={!isOnline}>Upload Sequence</button>
          </div>
        );
      case "gpios":
        return (
          <div className="gpios-controls">
            <button 
              className="refresh-button" 
              onClick={() => wsClient && wsClient.sendRequest("refresh", "null")}
              disabled={!isOnline}
            >
              Refresh
            </button>
            <StartStopButtons />
            <button 
              onClick={() => wsClient && wsClient.sendRequest("dunebugger_set", "so")}
              disabled={!isOnline}
            >
              Off state
            </button>
            <button 
              onClick={() => wsClient && wsClient.sendRequest("dunebugger_set", "sb")}
              disabled={!isOnline}
            >
              Standby state
            </button>
          </div>
        );
      case "scheduler":
        return (
          <div className="scheduler-controls">
            <button 
              className="refresh-button" 
              onClick={() => wsClient && wsClient.sendRequest("refresh", "null")}
              disabled={!isOnline}
            >
              Refresh
            </button>
            <button 
              disabled={!isOnline}
              className="add-schedule-button"
            >
              Add Schedule
            </button>
          </div>
        );
      case "analytics":
        return (
          <div className="analytics-controls">
            {/* No controls for analytics page yet */}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className={`action-bar ${isOnline ? "online" : "offline"}`}>
      <div className="action-bar-content">
        {renderControls()}
      </div>
    </div>
  );
};

export default ActionBar;