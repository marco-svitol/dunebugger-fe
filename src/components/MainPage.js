import React, { useState, useEffect } from "react";
import "./MainPage.css";
import { useTranslatedText } from "../hooks/useTranslation";

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
  
  // Translation hooks
  const { translatedText: startText } = useTranslatedText("Start");
  const { translatedText: stopText } = useTranslatedText("Stop");
  const { translatedText: cycleNotRunningText } = useTranslatedText("Cycle not running");
  const { translatedText: startMessageText } = useTranslatedText("Start command sent to DuneBugger device");
  const { translatedText: stopMessageText } = useTranslatedText("Stop command sent to DuneBugger device");
  const { translatedText: mainInfoText } = useTranslatedText("This is the main control page for your device monitoring and control.");
  const { translatedText: navigationInfoText } = useTranslatedText("Use the menu to navigate between different sections.");

  // Handler for Start button (sends "c" command)
  const handleStart = () => {
    if (wsClient) {
      wsClient.sendRequest("core.dunebugger_set", "sequence play main.seq", connectionId);
      if (showMessage) {
        showMessage(startMessageText, "info");
      }
    }
  };
  
  // Handler for Stop button (sends "cs" command)
  const handleStop = () => {
    if (wsClient) {
      wsClient.sendRequest("core.dunebugger_set", "sequence stop", connectionId);
      if (showMessage) {
        showMessage(stopMessageText, "info");
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
        setCycleStatus(cycleNotRunningText);
        setProgress(0);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [lastPlayingTimeUpdate, cycleNotRunningText]);

  // Determine if cycle is running based on cycle status text
  const isCycleRunning = !cycleStatus.includes("Cycle not running") && !cycleStatus.includes(cycleNotRunningText);

  return (
    <div className="main-page">
      <div className="dashboard-content">
        <div className="control-buttons">
          <button 
            className="start-button" 
            onClick={handleStart}
            disabled={isCycleRunning}
          >
            {startText}
          </button>
          <button 
            className="stop-button" 
            onClick={handleStop}
            disabled={!isCycleRunning}
          >
            {stopText}
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
              <div className="cycle-status">{cycleNotRunningText}</div>
            )}
          </div>
        </div>
        <div className="dashboard-info">
          <p>{mainInfoText}</p>
          <p>{navigationInfoText}</p>
        </div>
      </div>
    </div>
  );
};

export default MainPage;