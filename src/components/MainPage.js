import React, { useState, useEffect } from "react";
import "./MainPage.css";
import { useTranslatedText } from "../hooks/useTranslation";

const MainPage = ({ wsClient, connectionId, sequence, playingTime, sequenceState, showMessage, groupName, nextActions, modes: modesProp, isOnline, systemInfo }) => {
  const [cycleStatus, setCycleStatus] = useState("Cycle not running");
  const [lastPlayingTimeUpdate, setLastPlayingTimeUpdate] = useState(Date.now());
  const [progress, setProgress] = useState(0);
  const [totalCycleLength, setTotalCycleLength] = useState(0);
  const [modes, setModes] = useState([]);
  const [connectionType, setConnectionType] = useState("internet"); // "internet" or "lan"
  const [lanIp, setLanIp] = useState("192.168.1.100");
  const [ntpAvailable, setNtpAvailable] = useState(true);

  // Reset component state when device (groupName) changes
  useEffect(() => {
    setCycleStatus("Cycle not running");
    setLastPlayingTimeUpdate(Date.now());
    setProgress(0);
    setTotalCycleLength(0);
    setModes([]);
  }, [groupName]);
  
  // Translation hooks
  const { translatedText: cycleNotRunningText } = useTranslatedText("Cycle not running");
  const { translatedText: modesText } = useTranslatedText("Modes");
  const { translatedText: sequenceText } = useTranslatedText("Sequence");
  const { translatedText: analyticsText } = useTranslatedText("Analytics");
  const { translatedText: systemText } = useTranslatedText("System");
  const { translatedText: schedulerText } = useTranslatedText("Scheduler");
  const { translatedText: nextActionText } = useTranslatedText("Next Scheduled Action");
  const { translatedText: waitingForDataText } = useTranslatedText("⏳ Waiting for data...");

  // Update modes when modesProp changes
  useEffect(() => {
    if (modesProp && modesProp.length > 0) {
      setModes(modesProp);
    }
  }, [modesProp]);

  // Update system info when systemInfo changes
  useEffect(() => {
    if (systemInfo) {
      // Parse system info to extract connection type, IP, and NTP status
      // This is placeholder logic - adjust based on actual systemInfo structure
      if (systemInfo.connectionType) {
        setConnectionType(systemInfo.connectionType);
      }
      if (systemInfo.ip) {
        setLanIp(systemInfo.ip);
      }
      if (systemInfo.ntpAvailable !== undefined) {
        setNtpAvailable(systemInfo.ntpAvailable);
      }
    }
  }, [systemInfo]);

  // Request data on mount and when connection is established
  useEffect(() => {
    if (wsClient && connectionId && isOnline) {
      // Request modes list
      wsClient.sendRequest("core.frontend_command", "get_modes_list", connectionId);
      
      // Request next scheduled actions
      wsClient.sendRequest("scheduler.get_next_actions", "null", connectionId);
      
      // Request system info
      wsClient.sendRequest("controller.system_info", "refresh", connectionId);
    }
  }, [wsClient, connectionId, isOnline, groupName]);

  // Handler for mode button click
  const handleModeClick = (modeName) => {
    if (wsClient) {
      wsClient.sendRequest("core.dunebugger_set", `mode execute ${modeName}`, connectionId);
      if (showMessage) {
        showMessage(`Mode ${modeName} command sent`, "info");
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
      if (Date.now() - lastPlayingTimeUpdate > 15000) {
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
        
        {/* 1. MODES SECTION */}
        <div className="section modes-section">
          <h2>{modesText}</h2>
          {!isOnline ? (
            <div className="waiting-data">{waitingForDataText}</div>
          ) : modes.length === 0 ? (
            <div className="waiting-data">{waitingForDataText}</div>
          ) : (
            <div className="modes-grid">
              {modes.map((mode, index) => (
                <div key={index} className="mode-card">
                  <button 
                    className="mode-button"
                    onClick={() => handleModeClick(mode.name)}
                  >
                    {mode.name}
                  </button>
                  <p className="mode-description">{mode.desc}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 2. SEQUENCE SECTION */}
        <div className="section sequence-section">
          <h2>{sequenceText}</h2>
          {!isOnline ? (
            <div className="waiting-data">{waitingForDataText}</div>
          ) : (
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
          )}
        </div>

        {/* 3. ANALYTICS SECTION */}
        <div className="section analytics-section">
          <h2>{analyticsText}</h2>
          {!isOnline ? (
            <div className="waiting-data">{waitingForDataText}</div>
          ) : (
            <div className="analytics-content">
              <div className="analytics-stat">
                <div className="stat-label">Total Executions</div>
                <div className="stat-value">1,247</div>
              </div>
              <div className="analytics-chart">
                <div className="chart-title">Executions Distribution</div>
                <div className="simple-bar-chart">
                  <div className="bar-item">
                    <div className="bar-label">Mon</div>
                    <div className="bar-container">
                      <div className="bar-fill" style={{ height: "70%" }}></div>
                    </div>
                    <div className="bar-value">140</div>
                  </div>
                  <div className="bar-item">
                    <div className="bar-label">Tue</div>
                    <div className="bar-container">
                      <div className="bar-fill" style={{ height: "85%" }}></div>
                    </div>
                    <div className="bar-value">170</div>
                  </div>
                  <div className="bar-item">
                    <div className="bar-label">Wed</div>
                    <div className="bar-container">
                      <div className="bar-fill" style={{ height: "60%" }}></div>
                    </div>
                    <div className="bar-value">120</div>
                  </div>
                  <div className="bar-item">
                    <div className="bar-label">Thu</div>
                    <div className="bar-container">
                      <div className="bar-fill" style={{ height: "90%" }}></div>
                    </div>
                    <div className="bar-value">180</div>
                  </div>
                  <div className="bar-item">
                    <div className="bar-label">Fri</div>
                    <div className="bar-container">
                      <div className="bar-fill" style={{ height: "95%" }}></div>
                    </div>
                    <div className="bar-value">190</div>
                  </div>
                  <div className="bar-item">
                    <div className="bar-label">Sat</div>
                    <div className="bar-container">
                      <div className="bar-fill" style={{ height: "100%" }}></div>
                    </div>
                    <div className="bar-value">200</div>
                  </div>
                  <div className="bar-item">
                    <div className="bar-label">Sun</div>
                    <div className="bar-container">
                      <div className="bar-fill" style={{ height: "75%" }}></div>
                    </div>
                    <div className="bar-value">150</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 4. SYSTEM SECTION */}
        <div className="section system-section">
          <h2>{systemText}</h2>
          <div className="system-content">
            <div className="system-item">
              <span className="system-label">Connection Type:</span>
              <span className="system-value">{connectionType === "internet" ? "Internet" : "LAN"}</span>
            </div>
            {connectionType === "lan" && (
              <div className="system-item">
                <span className="system-label">DuneBugger IP:</span>
                <span className="system-value">{lanIp}</span>
              </div>
            )}
            <div className="system-item">
              <span className="system-label">Time Sync Available:</span>
              {!isOnline ? (
                <span className="system-value">{waitingForDataText}</span>
              ) : (
                <span className={`system-value ${ntpAvailable ? 'status-ok' : 'status-warning'}`}>
                  {ntpAvailable ? "Yes ✓" : "No ✗"}
                </span>
              )}
            </div>
            {isOnline && !ntpAvailable && (
              <div className="system-warning">
                ⚠️ Scheduler is disabled. DuneBugger needs manual intervention to switch between modes.
              </div>
            )}
          </div>
        </div>

        {/* 5. SCHEDULER SECTION */}
        <div className="section scheduler-section">
          <h2>{schedulerText}</h2>
          <div className="scheduler-content">
            <h3>{nextActionText}</h3>
            {!isOnline ? (
              <div className="waiting-data">{waitingForDataText}</div>
            ) : nextActions && nextActions.length > 0 ? (
              <div className="next-action-card">
                <div className="action-datetime">
                  <div className="action-date">{nextActions[0].date}</div>
                  <div className="action-time">{nextActions[0].time}</div>
                </div>
                <div className="action-details">
                  <div className="action-name">{nextActions[0].action}</div>
                  <div className="action-description">{nextActions[0].description}</div>
                </div>
              </div>
            ) : (
              <div className="no-action">No scheduled actions available</div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default MainPage;