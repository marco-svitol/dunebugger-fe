import React, { useState, useEffect } from "react";
import "./GpioTable.css"; // Optional: Add a CSS file for table-specific styles if needed.

function GpioTable({ gpioStates, client, GROUP_NAME, connectionId }) {
  const [sortedData, setSortedData] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

  // Update sortedData whenever gpioStates changes
  useEffect(() => {
    if (Array.isArray(gpioStates)) {
      setSortedData(gpioStates);
    }
  }, [gpioStates]);

  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }

    const sorted = [...sortedData].sort((a, b) => {
      if (a[key] < b[key]) return direction === "asc" ? -1 : 1;
      if (a[key] > b[key]) return direction === "asc" ? 1 : -1;
      return 0;
    });

    setSortedData(sorted);
    setSortConfig({ key, direction });
  };

  const handleSwitchToggle = (index) => {
    const gpio = sortedData[index];
    const newSwitchState = gpio.switch === "ON" ? "OFF" : "ON";
    const command = `#${gpio.pin} ${newSwitchState.toLowerCase()}`;

    // Send the command to the group
    if (client) {
      client.sendToGroup(
        GROUP_NAME,
        {
          type: "command",
          body: command,
          connectionId: connectionId,
        },
        "json"
      );
    }

    // Update the local state
    setSortedData((prevData) =>
      prevData.map((gpio, i) =>
        i === index ? { ...gpio, switch: newSwitchState } : gpio
      )
    );
  };

  return (
    <div className="table-container">
      {sortedData.length === 0 ? (
        <p>No GPIO data available</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th className={`sortable ${sortConfig.key === "pin" ? sortConfig.direction : ""}`} onClick={() => handleSort("pin")}>
                Pin
              </th>
              <th className={`sortable ${sortConfig.key === "label" ? sortConfig.direction : ""}`} onClick={() => handleSort("label")}>
                Label
              </th>
              <th className={`sortable ${sortConfig.key === "mode" ? sortConfig.direction : ""}`} onClick={() => handleSort("mode")}>
                Mode
              </th>
              <th className={`sortable ${sortConfig.key === "state" ? sortConfig.direction : ""}`} onClick={() => handleSort("state")}>
                State
              </th>
              <th className={`sortable ${sortConfig.key === "switch" ? sortConfig.direction : ""}`} onClick={() => handleSort("switch")}>
                Switch
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedData.map((gpio, index) => (
              <tr key={index}>
                <td>{gpio.pin}</td>
                <td>{gpio.label}</td>
                <td>{gpio.mode}</td>
                <td>{gpio.state}</td>
                <td>
                  <button
                    onClick={() => handleSwitchToggle(index)}
                    disabled={gpio.mode !== "OUTPUT"}
                    style={{
                      backgroundColor: gpio.mode !== "OUTPUT" ? "lightgrey" : gpio.switch === "ON" ? "green" : "grey",
                      color: "white",
                      border: "none",
                      padding: "5px 10px",
                      cursor: gpio.mode !== "OUTPUT" ? "not-allowed" : "pointer",
                    }}
                  >
                    {gpio.switch}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default GpioTable;