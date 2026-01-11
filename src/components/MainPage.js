import React, { useState, useEffect } from "react";
import "./MainPage.css";
import { useTranslatedText } from "../hooks/useTranslation";

const MainPage = ({ wsClient, connectionId, sequence, playingTime, sequenceState, showMessage, groupName, nextActions, modes: modesProp, isOnline, mainPageSystemInfo, ntpAvailable, analyticsMetrics }) => {
  const [cycleStatus, setCycleStatus] = useState("Cycle not running");
  const [lastPlayingTimeUpdate, setLastPlayingTimeUpdate] = useState(Date.now());
  const [progress, setProgress] = useState(0);
  const [totalCycleLength, setTotalCycleLength] = useState(0);
  const [modes, setModes] = useState([]);
  const [connectionType, setConnectionType] = useState("internet"); // "internet" or "lan"
  const [lanIp, setLanIp] = useState("192.168.1.100");

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
    if (mainPageSystemInfo) {
      // Parse system info to extract connection type and IP
      if (mainPageSystemInfo.connectionType) {
        setConnectionType(mainPageSystemInfo.connectionType);
      }
      if (mainPageSystemInfo.ip) {
        setLanIp(mainPageSystemInfo.ip);
      }
    }
  }, [mainPageSystemInfo]);
  // Request data on mount and when connection is established
  useEffect(() => {
    if (wsClient && connectionId && isOnline) {
      // Request modes list
      wsClient.sendRequest("core.frontend_command", "get_modes_list", connectionId);
      
      // Request next scheduled actions
      wsClient.sendRequest("scheduler.get_next_actions", "null", connectionId);
      
      // Request ntp status
      wsClient.sendRequest("controller.ntp_status", "null", connectionId);
      
      // Request analytics metrics
      wsClient.sendRequest("core.analytics_command", "get_metrics", connectionId);
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

  // Process timestamps into hourly buckets for the chart (last 3 days)
  const processTimestampsForChart = (timestamps) => {
    // Get start of 3 days ago at 00:00
    const now = new Date();
    const threeDaysAgo = new Date(now);
    threeDaysAgo.setDate(now.getDate() - 2); // 2 days ago plus today = 3 days
    threeDaysAgo.setHours(0, 0, 0, 0);
    
    // Generate all hourly slots from 3 days ago to now
    const hourlySlots = [];
    const currentHour = new Date(threeDaysAgo);
    
    while (currentHour <= now) {
      const dateKey = currentHour.toISOString();
      hourlySlots.push({
        timestamp: new Date(currentHour),
        count: 0,
        label: currentHour.getHours().toString().padStart(2, '0') + ':00',
        dayLabel: currentHour.toLocaleDateString('en-US', { weekday: 'short' })
      });
      currentHour.setHours(currentHour.getHours() + 1);
    }
    
    // Fill in actual counts from timestamps
    if (timestamps && timestamps.length > 0) {
      timestamps.forEach(timestamp => {
        try {
          // Parse timestamp format: "DD/MM/YYYY HH:MM:SS"
          const [datePart, timePart] = timestamp.split(' ');
          const [day, month, year] = datePart.split('/');
          const [hour] = timePart.split(':');
          
          const timestampDate = new Date(year, month - 1, day, parseInt(hour), 0, 0);
          
          // Find matching slot
          if (timestampDate >= threeDaysAgo && timestampDate <= now) {
            const slotIndex = hourlySlots.findIndex(slot => {
              return slot.timestamp.getTime() === timestampDate.getTime();
            });
            
            if (slotIndex !== -1) {
              hourlySlots[slotIndex].count++;
            }
          }
        } catch (error) {
          console.warn('Failed to parse timestamp:', timestamp);
        }
      });
    }
    
    return hourlySlots;
  };

  const chartData = analyticsMetrics ? processTimestampsForChart(analyticsMetrics.timestamps) : [];
  const maxCount = chartData.length > 0 ? Math.max(...chartData.map(d => d.count), 1) : 1;

  // Calculate execution counts for different time periods
  const calculateTimePeriodCounts = (timestamps) => {
    if (!timestamps || timestamps.length === 0) {
      return {
        allTime: 0,
        monthToDate: 0,
        weekToDate: 0,
        threeDays: 0,
        today: 0
      };
    }

    const now = new Date();
    
    // Start of today
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);
    
    // Start of 3 days ago
    const threeDaysAgo = new Date(now);
    threeDaysAgo.setDate(now.getDate() - 2);
    threeDaysAgo.setHours(0, 0, 0, 0);
    
    // Start of current week (Monday)
    const currentDay = now.getDay();
    const diff = currentDay === 0 ? -6 : 1 - currentDay;
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() + diff);
    startOfWeek.setHours(0, 0, 0, 0);
    
    // Start of current month
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    
    let todayCount = 0;
    let threeDaysCount = 0;
    let weekToDateCount = 0;
    let monthToDateCount = 0;
    
    timestamps.forEach(timestamp => {
      try {
        const [datePart, timePart] = timestamp.split(' ');
        const [day, month, year] = datePart.split('/');
        const [hour, minute, second] = timePart.split(':');
        
        const timestampDate = new Date(year, month - 1, day, parseInt(hour), parseInt(minute), parseInt(second));
        
        if (timestampDate >= startOfToday) todayCount++;
        if (timestampDate >= threeDaysAgo) threeDaysCount++;
        if (timestampDate >= startOfWeek) weekToDateCount++;
        if (timestampDate >= startOfMonth) monthToDateCount++;
      } catch (error) {
        console.warn('Failed to parse timestamp:', timestamp);
      }
    });
    
    return {
      allTime: timestamps.length,
      monthToDate: monthToDateCount,
      weekToDate: weekToDateCount,
      threeDays: threeDaysCount,
      today: todayCount
    };
  };

  const timePeriodCounts = analyticsMetrics ? calculateTimePeriodCounts(analyticsMetrics.timestamps) : {
    allTime: 0,
    monthToDate: 0,
    weekToDate: 0,
    threeDays: 0,
    today: 0
  };

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
          ) : !analyticsMetrics ? (
            <div className="waiting-data">{waitingForDataText}</div>
          ) : (
            <div className="analytics-content">
              <div className="analytics-stats-grid">
                <div className="analytics-stat primary-stat">
                  <div className="stat-label">Total Executions</div>
                  <div className="stat-value">{timePeriodCounts.allTime}</div>
                </div>
                <div className="analytics-stat">
                  <div className="stat-label">Month to Date</div>
                  <div className="stat-value">{timePeriodCounts.monthToDate}</div>
                </div>
                <div className="analytics-stat">
                  <div className="stat-label">Week to Date</div>
                  <div className="stat-value">{timePeriodCounts.weekToDate}</div>
                </div>
                <div className="analytics-stat">
                  <div className="stat-label">Last 3 Days</div>
                  <div className="stat-value">{timePeriodCounts.threeDays}</div>
                </div>
                <div className="analytics-stat">
                  <div className="stat-label">Today</div>
                  <div className="stat-value">{timePeriodCounts.today}</div>
                </div>
              </div>
              <div className="analytics-chart">
                <div className="chart-title">Last 3 Days Activity</div>
                {chartData.length > 0 ? (
                  <div className="execution-timeline-chart">
                    <div className="chart-y-axis">
                      <div className="y-axis-label">{maxCount}</div>
                      <div className="y-axis-label">{Math.floor(maxCount * 0.75)}</div>
                      <div className="y-axis-label">{Math.floor(maxCount * 0.5)}</div>
                      <div className="y-axis-label">{Math.floor(maxCount * 0.25)}</div>
                      <div className="y-axis-label">0</div>
                    </div>
                    <div className="chart-area">
                      <div className="line-chart-container">
                        <svg className="line-chart-svg" viewBox="0 0 1000 250" preserveAspectRatio="none">
                          {/* Grid lines */}
                          <line x1="0" y1="0" x2="1000" y2="0" className="grid-line" />
                          <line x1="0" y1="62.5" x2="1000" y2="62.5" className="grid-line" />
                          <line x1="0" y1="125" x2="1000" y2="125" className="grid-line" />
                          <line x1="0" y1="187.5" x2="1000" y2="187.5" className="grid-line" />
                          <line x1="0" y1="250" x2="1000" y2="250" className="grid-line" />
                          
                          {/* Line path */}
                          <path
                            d={chartData.map((point, index) => {
                              const x = (index / (chartData.length - 1)) * 1000;
                              const y = 250 - (point.count / maxCount) * 250;
                              return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
                            }).join(' ')}
                            className="line-path"
                            fill="none"
                          />
                          
                          {/* Area under line */}
                          <path
                            d={`${chartData.map((point, index) => {
                              const x = (index / (chartData.length - 1)) * 1000;
                              const y = 250 - (point.count / maxCount) * 250;
                              return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
                            }).join(' ')} L 1000 250 L 0 250 Z`}
                            className="line-area"
                          />
                          
                          {/* Data points */}
                          {chartData.map((point, index) => {
                            const x = (index / (chartData.length - 1)) * 1000;
                            const y = 250 - (point.count / maxCount) * 250;
                            return (
                              <circle
                                key={index}
                                cx={x}
                                cy={y}
                                r="4"
                                className="data-point"
                                data-count={point.count}
                              >
                                <title>{`${point.dayLabel} ${point.label}: ${point.count} execution${point.count !== 1 ? 's' : ''}`}</title>
                              </circle>
                            );
                          })}
                        </svg>
                      </div>
                      <div className="chart-x-axis">
                        {chartData.map((point, index) => {
                          // Show label every 12 hours or at day boundaries
                          const showLabel = index === 0 || point.label === '00:00' || index % 12 === 0 || index === chartData.length - 1;
                          return (
                            <div key={index} className="x-axis-tick">
                              {showLabel && (
                                <div className="x-axis-label">
                                  <div className="hour-label">{point.label}</div>
                                  {point.label === '00:00' && <div className="day-label">{point.dayLabel}</div>}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="no-data">No execution history available</div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 4. SYSTEM SECTION */}
        <div className="section mainpage-system-section">
          <h2>{systemText}</h2>
          <div className="mainpage-system-content">
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
              {!isOnline || ntpAvailable === null ? (
                <span className="system-value">{waitingForDataText}</span>
              ) : (
                <span className={`system-value ${ntpAvailable ? 'status-ok' : 'status-warning'}`}>
                  {ntpAvailable ? "Yes ✓" : "No ✗"}
                </span>
              )}
            </div>
            {isOnline && ntpAvailable === false && (
              <div className="system-warning">
                ⚠️ Scheduler is disabled. DuneBugger needs manual intervention to switch between modes.
              </div>
            )}
          </div>
        </div>

        {/* 5. SCHEDULER SECTION */}
        <div className={`section scheduler-section ${isOnline && ntpAvailable === false ? 'scheduler-disabled' : ''}`}>
          <h2>{schedulerText}</h2>
          <div className="mainpage-scheduler-content">
            <h3>{nextActionText}</h3>
            {!isOnline ? (
              <div className="waiting-data">{waitingForDataText}</div>
            ) : nextActions && nextActions.length > 0 ? (
              <div className="next-action-card">
                <div className="mainpage-action-datetime">
                  <div className="mainpage-action-date">{nextActions[0].date}</div>
                  <div className="mainpage-action-time">{nextActions[0].time}</div>
                </div>
                <div className="mainpage-action-details">
                  <div className="mainpage-action-name">{nextActions[0].action}</div>
                  <div className="mainpage-action-description">{nextActions[0].description}</div>
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