import React, { useState, useEffect } from "react";
import "./MainPage.css";

const MainPage = ({ wsClient, connectionId, sequence, playingTime, sequenceState, showMessage, groupName }) => {
  const [cycleStatus, setCycleStatus] = useState("Cycle not running");
  const [lastPlayingTimeUpdate, setLastPlayingTimeUpdate] = useState(Date.now());
  const [progress, setProgress] = useState(0);
  const [totalCycleLength, setTotalCycleLength] = useState(0);

  // Reset component state when device (groupName) changes
  useEffect(() => {
    setCycleStatus("Cycle not running");
    setLastPlayingTimeUpdate(Date.now());
    setProgress(0);
    setTotalCycleLength(0);
  }, [groupName]);
  
  // Handler for Start button (sends "c" command)
  const handleStart = () => {
    if (wsClient) {
      wsClient.sendRequest("dunebugger_set", "c", connectionId);
      if (showMessage) {
        showMessage("Start command sent to DuneBugger device", "info");
      }
    }
  };
  
  // Handler for Stop button (sends "cs" command)
  const handleStop = () => {
    if (wsClient) {
      wsClient.sendRequest("dunebugger_set", "cs", connectionId);
      if (showMessage) {
        showMessage("Stop command sent to DuneBugger device", "info");
      }
    }
  };

  // Calculate total sequence length
  const getTotalCycleLength = () => {
    if (!sequence || !sequence.sequence || sequence.sequence.length === 0) return 0;
    return Math.max(...sequence.sequence.map((ev) => parseFloat(ev.time)));
  };

  // Update cycle status based on playing time
  useEffect(() => {
    if (playingTime > 0 && playingTime !== undefined && playingTime !== null) {
      setLastPlayingTimeUpdate(Date.now());
      const cycleLength = getTotalCycleLength();
      setTotalCycleLength(cycleLength);
      
      const countdown = cycleLength - playingTime;
      const progressPercentage = (playingTime / cycleLength) * 100;
      
      setProgress(progressPercentage);
      setCycleStatus(`${countdown.toFixed(1)}s remaining`);
    }
  }, [playingTime, sequence]);

  // Check for timeout on playing time updates
  useEffect(() => {
    const interval = setInterval(() => {
      if (Date.now() - lastPlayingTimeUpdate > 15000) { // 10 seconds timeout
        setCycleStatus("Cycle not running");
        setProgress(0);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [lastPlayingTimeUpdate]);

  // Determine if cycle is running based on cycle status text
  const isCycleRunning = !cycleStatus.includes("Cycle not running");

  return (
    <div className="main-page">
      <div className="dashboard-content">
        <div className="control-buttons">
          <button 
            className="start-button" 
            onClick={handleStart}
            disabled={isCycleRunning}
          >
            Start
          </button>
          <button 
            className="stop-button" 
            onClick={handleStop}
            disabled={!isCycleRunning}
          >
            Stop
          </button>
          <div className="cycle-status-container">
            {isCycleRunning ? (
              <>
                <div className="progress-bar-container">
                  <div 
                    className="progress-bar-fill" 
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                <div className="cycle-status">{cycleStatus}</div>
              </>
            ) : (
              <div className="cycle-status">Cycle not running</div>
            )}
          </div>
        </div>
        <div className="dashboard-info">
          <p>This is the main control page for your device monitoring and control.</p>
          <p>Use the menu to navigate between different sections.</p>
        </div>
      </div>
    </div>
  );
};

export default MainPage;