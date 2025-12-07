import React from "react";
import GpioTable from "./GpioTable";

const GPIOsPage = ({ gpioStates, wsClient, connectionId, groupName }) => {
  // Note: GPIOs page doesn't have local state to reset,
  // it relies on gpioStates prop which is reset in parent component
  return (
    <div className="gpios-page">
      <h2>GPIOs Status and Control</h2>
      
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