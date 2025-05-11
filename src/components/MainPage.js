import React from "react";
import "./MainPage.css";

const MainPage = ({ wsClient, connectionId }) => {
  // Get GROUP_NAME from the parent component via props or use a constant if needed
  const GROUP_NAME = "velasquez"; // This should ideally come from props
  
  // Handler for Start button (sends "c" command)
  const handleStart = () => {
    if (wsClient) {
      wsClient.sendRequest("dunebugger_set", "c", connectionId);
    }
  };
  
  // Handler for Stop button (sends "cs" command)
  const handleStop = () => {
    if (wsClient) {
      wsClient.sendRequest("dunebugger_set", "cs", connectionId);
    }
  };

  return (
    <div className="main-page">
      <h2>Connected to {GROUP_NAME}</h2>
      <div className="dashboard-content">
        <div className="control-buttons">
          <button 
            className="start-button" 
            onClick={handleStart}
          >
            Start
          </button>
          <button 
            className="stop-button" 
            onClick={handleStop}
          >
            Stop
          </button>
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