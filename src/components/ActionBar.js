import React, { useState, useEffect, useCallback } from "react";
import "./ActionBar.css";

const ActionBar = ({ currentPage, wsClient, connectionId, sequenceState, isOnline, showMessage, playingTime, sequence, groupName }) => {
  const [lastPlayingTimeUpdate, setLastPlayingTimeUpdate] = useState(Date.now());
  const [cycleStatus, setCycleStatus] = useState("Cycle not running");

  // Reset component state when device (groupName) changes
  useEffect(() => {
    setLastPlayingTimeUpdate(Date.now());
    setCycleStatus("Cycle not running");
  }, [groupName]);

  // Calculate total sequence length
  const getTotalCycleLength = useCallback(() => {
    if (!sequence || !sequence.sequence || sequence.sequence.length === 0) return 0;
    return Math.max(...sequence.sequence.map((ev) => parseFloat(ev.time)));
  }, [sequence]);

  // Update cycle status based on playing time (same logic as MainPage)
  useEffect(() => {
    if (playingTime > 0 && playingTime !== undefined && playingTime !== null) {
      setLastPlayingTimeUpdate(Date.now());
      const cycleLength = getTotalCycleLength();
      const countdown = cycleLength - playingTime;
      setCycleStatus(`${countdown.toFixed(1)}s remaining`);
    }
  }, [playingTime, getTotalCycleLength]);

  // Check for timeout on playing time updates (same logic as MainPage)
  useEffect(() => {
    const interval = setInterval(() => {
      if (Date.now() - lastPlayingTimeUpdate > 15000) { // 15 seconds timeout
        setCycleStatus("Cycle not running");
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [lastPlayingTimeUpdate]);

  // Determine if cycle is running based on cycle status text (same logic as MainPage)
  const isCycleRunning = !cycleStatus.includes("Cycle not running");
  // Handler for Start button (sends "c" command)
  const handleStart = () => {
    if (wsClient && isOnline) {
      wsClient.sendRequest("core.dunebugger_set", "c", connectionId);
      if (showMessage) {
        showMessage("Start command sent to DuneBugger device", "info");
      }
    }
  };
  
  // Handler for Stop button (sends "cs" command)
  const handleStop = () => {
    if (wsClient && isOnline) {
      wsClient.sendRequest("core.dunebugger_set", "cs", connectionId);
      if (showMessage) {
        showMessage("Stop command sent to DuneBugger device", "info");
      }
    }
  };

  // Custom component for Start/Stop buttons to avoid repetition
  const StartStopButtons = () => (
    <div className="start-stop-buttons">
      <button 
        className="start-button" 
        onClick={handleStart} 
        disabled={!isOnline || isCycleRunning}
      >
        Start
      </button>
      <button 
        className="stop-button" 
        onClick={handleStop} 
        disabled={!isOnline || !isCycleRunning}
      >
        Stop
      </button>
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
                  "core.dunebugger_set",
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
                  "core.dunebugger_set",
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
            <StartStopButtons />
          </div>
        );
      case "gpios":
        return (
          <div className="gpios-controls">
            <StartStopButtons />
            <button 
              onClick={() => {
                if (wsClient) {
                  wsClient.sendRequest("core.dunebugger_set", "so");
                  if (showMessage) {
                    showMessage("Set to Off state command sent", "info");
                  }
                }
              }}
              disabled={!isOnline}
            >
              Off
            </button>
            <button 
              onClick={() => {
                if (wsClient) {
                  wsClient.sendRequest("core.dunebugger_set", "sb");
                  if (showMessage) {
                    showMessage("Set to Standby state command sent", "info");
                  }
                }
              }}
              disabled={!isOnline}
            >
              Standby
            </button>
          </div>
        );
      case "scheduler":
        return (
          <div className="scheduler-controls">
            {/* Refresh functionality moved to individual components */}
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