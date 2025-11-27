import React from "react";
import GpioTable from "./GpioTable";

const GPIOsPage = ({ gpioStates, wsClient, connectionId }) => {
  return (
    <div className="gpios-page">
      <h2>GPIOs Status and Control</h2>
      
      <div className="gpio-table-section">
        <GpioTable
          gpioStates={gpioStates || []}
          wsClient={wsClient}
          connectionId={connectionId}
        />
      </div>
    </div>
  );
};

export default GPIOsPage;