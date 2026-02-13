import React, { useState, useEffect } from "react";
import { useTranslatedText } from "../hooks/useTranslation";
import "./AnalyticsPage.css";

const AnalyticsPage = ({ groupName, analyticsMetrics, isOnline }) => {
  const [selectedPeriod, setSelectedPeriod] = useState("all");
  
  const { translatedText: waitingForDataText } = useTranslatedText("⏳ Waiting for data...");
  const { translatedText: analyticsText } = useTranslatedText("Analytics");
  
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

  // Process timestamps into hourly buckets based on selected period
  const processTimestampsForChart = (timestamps, period) => {
    if (!timestamps || timestamps.length === 0) return [];
    
    const now = new Date();
    let startDate;
    
    switch (period) {
      case "all":
        // Find the earliest timestamp
        const earliestTimestamp = timestamps.reduce((earliest, current) => {
          try {
            const [datePart] = current.split(' ');
            const [day, month, year] = datePart.split('/');
            const date = new Date(year, month - 1, day, 0, 0, 0);
            return !earliest || date < earliest ? date : earliest;
          } catch {
            return earliest;
          }
        }, null);
        startDate = earliestTimestamp || new Date(now.getFullYear(), 0, 1);
        break;
      case "month":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
        break;
      case "week":
        const currentDay = now.getDay();
        const diff = currentDay === 0 ? -6 : 1 - currentDay;
        startDate = new Date(now);
        startDate.setDate(now.getDate() + diff);
        startDate.setHours(0, 0, 0, 0);
        break;
      case "threeDays":
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 2);
        startDate.setHours(0, 0, 0, 0);
        break;
      case "today":
        startDate = new Date(now);
        startDate.setHours(0, 0, 0, 0);
        break;
      default:
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 2);
        startDate.setHours(0, 0, 0, 0);
    }
    
    // Generate all hourly slots
    const hourlySlots = [];
    const currentHour = new Date(startDate);
    
    while (currentHour <= now) {
      hourlySlots.push({
        timestamp: new Date(currentHour),
        count: 0,
        label: currentHour.getHours().toString().padStart(2, '0') + ':00',
        dayLabel: currentHour.toLocaleDateString('en-US', { weekday: 'short' }),
        fullDate: currentHour.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      });
      currentHour.setHours(currentHour.getHours() + 1);
    }
    
    // Fill in actual counts from timestamps
    timestamps.forEach(timestamp => {
      try {
        const [datePart, timePart] = timestamp.split(' ');
        const [day, month, year] = datePart.split('/');
        const [hour] = timePart.split(':');
        
        const timestampDate = new Date(year, month - 1, day, parseInt(hour), 0, 0);
        
        if (timestampDate >= startDate && timestampDate <= now) {
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
    
    return hourlySlots;
  };

  const timePeriodCounts = analyticsMetrics ? calculateTimePeriodCounts(analyticsMetrics.timestamps) : {
    allTime: 0,
    monthToDate: 0,
    weekToDate: 0,
    threeDays: 0,
    today: 0
  };

  const chartData = analyticsMetrics ? processTimestampsForChart(analyticsMetrics.timestamps, selectedPeriod) : [];
  const maxCount = chartData.length > 0 ? Math.max(...chartData.map(d => d.count), 1) : 1;

  const getPeriodTitle = () => {
    switch (selectedPeriod) {
      case "all": return "All Time Activity";
      case "month": return "Month-to-Date Activity";
      case "week": return "Week-to-Date Activity";
      case "threeDays": return "Last 3 Days Activity";
      case "today": return "Today's Activity";
      default: return "Activity";
    }
  };

  return (
    <div className="analytics-page">
      <div className="analytics-header">
        <div className="analytics-header-top">
          <h2>{analyticsText}</h2>
        </div>
      </div>

      <div className="analytics-page-content">
        
        {!isOnline ? (
          <div className="waiting-data">{waitingForDataText}</div>
        ) : !analyticsMetrics ? (
          <div className="waiting-data">{waitingForDataText}</div>
        ) : (
          <>
            {/* Statistics Section */}
            <div className="analytics-stats-section">
              <div className="analytics-stats-grid-page">
                <button 
                  className={`analytics-stat-clickable primary-stat ${selectedPeriod === 'all' ? 'active' : ''}`}
                  onClick={() => setSelectedPeriod('all')}
                >
                  <div className="stat-label">Total Executions</div>
                  <div className="stat-value">{timePeriodCounts.allTime}</div>
                </button>
                <button 
                  className={`analytics-stat-clickable ${selectedPeriod === 'month' ? 'active' : ''}`}
                  onClick={() => setSelectedPeriod('month')}
                >
                  <div className="stat-label">Month to Date</div>
                  <div className="stat-value">{timePeriodCounts.monthToDate}</div>
                </button>
                <button 
                  className={`analytics-stat-clickable ${selectedPeriod === 'week' ? 'active' : ''}`}
                  onClick={() => setSelectedPeriod('week')}
                >
                  <div className="stat-label">Week to Date</div>
                  <div className="stat-value">{timePeriodCounts.weekToDate}</div>
                </button>
                <button 
                  className={`analytics-stat-clickable ${selectedPeriod === 'threeDays' ? 'active' : ''}`}
                  onClick={() => setSelectedPeriod('threeDays')}
                >
                  <div className="stat-label">Last 3 Days</div>
                  <div className="stat-value">{timePeriodCounts.threeDays}</div>
                </button>
                <button 
                  className={`analytics-stat-clickable ${selectedPeriod === 'today' ? 'active' : ''}`}
                  onClick={() => setSelectedPeriod('today')}
                >
                  <div className="stat-label">Today</div>
                  <div className="stat-value">{timePeriodCounts.today}</div>
                </button>
              </div>
            </div>

            {/* Chart Section */}
            <div className="analytics-chart-section">
              <div className="chart-title">{getPeriodTitle()}</div>
              {chartData.length > 0 ? (
                <div className="execution-timeline-chart-page">
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
                        {chartData.length > 1 && (
                          <path
                            d={chartData.map((point, index) => {
                              const x = (index / (chartData.length - 1)) * 1000;
                              const y = 250 - (point.count / maxCount) * 250;
                              return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
                            }).join(' ')}
                            className="line-path"
                            fill="none"
                          />
                        )}
                        
                        {/* Area under line */}
                        {chartData.length > 1 && (
                          <path
                            d={`${chartData.map((point, index) => {
                              const x = (index / (chartData.length - 1)) * 1000;
                              const y = 250 - (point.count / maxCount) * 250;
                              return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
                            }).join(' ')} L 1000 250 L 0 250 Z`}
                            className="line-area"
                          />
                        )}
                        
                        {/* Data points */}
                        {chartData.map((point, index) => {
                          const x = chartData.length > 1 ? (index / (chartData.length - 1)) * 1000 : 500;
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
                              <title>{`${point.fullDate} ${point.label}: ${point.count} execution${point.count !== 1 ? 's' : ''}`}</title>
                            </circle>
                          );
                        })}
                      </svg>
                    </div>
                    <div className="chart-x-axis">
                      {chartData.map((point, index) => {
                        // Show labels strategically based on period and data length
                        const showLabel = 
                          index === 0 || 
                          index === chartData.length - 1 ||
                          (chartData.length <= 24 && index % 4 === 0) ||
                          (chartData.length > 24 && chartData.length <= 72 && index % 12 === 0) ||
                          (chartData.length > 72 && point.label === '00:00');
                        
                        return (
                          <div key={index} className="x-axis-tick">
                            {showLabel && (
                              <div className="x-axis-label">
                                <div className="hour-label">{point.label}</div>
                                {(point.label === '00:00' || index === 0 || index === chartData.length - 1) && (
                                  <div className="day-label">{point.fullDate}</div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="no-data">No data available for this period</div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AnalyticsPage;