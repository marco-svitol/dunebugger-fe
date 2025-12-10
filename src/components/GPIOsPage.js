import React from "react";
import GpioTable from "./GpioTable";
import "./GPIOsPage.css";

const GPIOsPage = ({ gpioStates, wsClient, connectionId, groupName, showMessage }) => {
  // Note: GPIOs page doesn't have local state to reset,
  // it relies on gpioStates prop which is reset in parent component
  
  const handleRefresh = async (showPopup = true) => {
    if (wsClient && connectionId) {
      try {
        await wsClient.sendRequest("core.refresh_gpios", "null");
        if (showMessage && showPopup) {
          showMessage("GPIO states refresh request sent", "info");
        }
      } catch (error) {
        console.error("Failed to send GPIO refresh request:", error);
      }
    }
  };

  // Auto-refresh when component mounts and when connectionId changes (device switch)
  React.useEffect(() => {
    handleRefresh(false);
  }, [connectionId]);
  
  return (
    <div className="gpios-page">
      <div className="gpios-header">
        <div className="gpios-header-top">
          <h2>GPIOs Status and Control</h2>
          <button 
            className="refresh-button" 
            onClick={handleRefresh}
            disabled={!wsClient || !connectionId}
            title="Refresh GPIO states"
          >
            <span className="refresh-icon">🔄</span>
            Refresh
          </button>
        </div>
      </div>
      
      <div className="gpio-table-section">
        <GpioTable
          gpioStates={gpioStates || []}
          wsClient={wsClient}
          connectionId={connectionId}
          groupName={groupName}
        />
      </div>
    </div>
  );
};

export default GPIOsPage;