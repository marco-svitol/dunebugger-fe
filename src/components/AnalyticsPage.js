import React from "react";

const AnalyticsPage = ({ groupName }) => {
  // Note: Analytics page currently has no state to reset,
  // but groupName prop is added for future use
  return (
    <div className="analytics-page">
      <h2>Analytics</h2>
      
      <div className="analytics-content">
        <p>This section will contain analytics and data visualization for your device.</p>
        <div className="placeholder-content">
          <div className="analytics-card">
            <h3>Device Performance</h3>
            <p>Analytics content coming soon...</p>
          </div>
          
          <div className="analytics-card">
            <h3>Status History</h3>
            <p>Analytics content coming soon...</p>
          </div>
          
          <div className="analytics-card">
            <h3>Events Summary</h3>
            <p>Analytics content coming soon...</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;