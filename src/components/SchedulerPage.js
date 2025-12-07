import React from "react";
import "./SchedulerPage.css";

const SchedulerPage = ({ groupName }) => {
  // Note: Scheduler page currently has no state to reset,
  // but groupName prop is added for future use
  return (
    <div className="scheduler-page">
      <h2>Scheduler</h2>
      <div className="scheduler-content">
        <p>Scheduler functionality coming soon...</p>
        <div className="placeholder-content">
          <div className="scheduler-card">
            <h3>Schedule Management</h3>
            <p>This section will allow you to create and manage scheduled tasks.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SchedulerPage;