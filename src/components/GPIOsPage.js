import React from "react";
import GpioTable from "./GpioTable";

const GPIOsPage = ({ gpioStates, wsClient, connectionId, logs }) => {
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
      
      <div className="logs-section">
        <h3>System Logs</h3>
        <div style={{ position: "relative" }}>
          <textarea
            style={{ 
              width: "100%", 
              height: "300px", 
              backgroundColor: "black", 
              color: "white",
              fontFamily: "monospace",
              padding: "10px"
            }}
            value={logs.join("\n")}
            readOnly
          />
        </div>
      </div>
    </div>
  );
};

export default GPIOsPage;