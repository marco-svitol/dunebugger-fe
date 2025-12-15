import React from "react";
import GpioTable from "./GpioTable";
import "./GPIOsPage.css";
import { useTranslatedText } from "../hooks/useTranslation";

const GPIOsPage = ({ gpioStates, wsClient, connectionId, groupName, showMessage }) => {
  // Translation hooks
  const { translatedText: switchControlText } = useTranslatedText("Switch Control");
  const { translatedText: refreshMessageText } = useTranslatedText("GPIO states refresh request sent");
  const { translatedText: refreshButtonText } = useTranslatedText("Refresh GPIO states");
  const { translatedText: refreshText } = useTranslatedText("Refresh");
  // Note: GPIOs page doesn't have local state to reset,
  // it relies on gpioStates prop which is reset in parent component
  
  const handleRefresh = async (showPopup = true) => {
    if (wsClient && connectionId) {
      try {
        await wsClient.sendRequest("core.refresh_gpios", "null");
        if (showMessage && showPopup) {
          showMessage(refreshMessageText, "info");
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
          <h2>{switchControlText}</h2>
          <button 
            className="refresh-button" 
            onClick={handleRefresh}
            disabled={!wsClient || !connectionId}
            title={refreshButtonText}
          >
            <span className="refresh-icon">🔄</span>
            {refreshText}
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