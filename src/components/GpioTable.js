import React, { useState, useEffect } from "react";
import "./GpioTable.css"; // Optional: Add a CSS file for table-specific styles if needed.

// Define initial column visibility
const initialColumns = {
  pin: true,
  label: true,
  mode: true,
  state: true,
  switch: true,
};

// Function to get initial visible columns from localStorage or use defaults
const getInitialVisibleColumns = () => {
  const storedVisibleColumns = localStorage.getItem("gpioTableVisibleColumns");
  if (storedVisibleColumns) {
    return JSON.parse(storedVisibleColumns);
  }
  return initialColumns;
};

function GpioTable({ gpioStates, wsClient, connectionId, groupName }) {
  const [sortedData, setSortedData] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [visibleColumns, setVisibleColumns] = useState(getInitialVisibleColumns());

  // Reset sorting and data when device (groupName) changes
  useEffect(() => {
    setSortedData([]);
    setSortConfig({ key: null, direction: "asc" });
    // Note: We keep visibleColumns as they are user preferences
  }, [groupName]);

  // Update sortedData whenever gpioStates changes
  useEffect(() => {
    if (Array.isArray(gpioStates)) {
      setSortedData(gpioStates);
    }
  }, [gpioStates]);

  // Update localStorage whenever visibleColumns changes
  useEffect(() => {
    localStorage.setItem("gpioTableVisibleColumns", JSON.stringify(visibleColumns));
  }, [visibleColumns]);

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
    const command = `sw ${gpio.pin} ${newSwitchState.toLowerCase()}`;

    // Send the command to the group
    if (wsClient) {
      wsClient.sendRequest(
        "core.dunebugger_set",
        command,
        connectionId,
      );
    }

    // Update the local state
    setSortedData((prevData) =>
      prevData.map((gpio, i) =>
        i === index ? { ...gpio, switch: newSwitchState } : gpio
      )
    );
  };

  const handleColumnVisibilityChange = (columnName) => {
    setVisibleColumns((prev) => ({
      ...prev,
      [columnName]: !prev[columnName],
    }));
  };

  return (
    <div className="table-container">
      <div className="column-selectors">
        {Object.keys(initialColumns).map((columnName) => (
          <label key={columnName} style={{ marginRight: "10px" }}>
            <input
              type="checkbox"
              checked={visibleColumns[columnName]}
              onChange={() => handleColumnVisibilityChange(columnName)}
            />
            {columnName.charAt(0).toUpperCase() + columnName.slice(1)}
          </label>
        ))}
      </div>
      {sortedData.length === 0 ? (
        <p>No GPIO data available</p>
      ) : (
        <table>
          <thead>
            <tr>
              {visibleColumns.pin && (
                <th className={`sortable ${sortConfig.key === "pin" ? sortConfig.direction : ""}`} onClick={() => handleSort("pin")}>
                  Pin
                </th>
              )}
              {visibleColumns.label && (
                <th className={`sortable ${sortConfig.key === "label" ? sortConfig.direction : ""}`} onClick={() => handleSort("label")}>
                  Label
                </th>
              )}
              {visibleColumns.mode && (
                <th className={`sortable ${sortConfig.key === "mode" ? sortConfig.direction : ""}`} onClick={() => handleSort("mode")}>
                  Mode
                </th>
              )}
              {visibleColumns.state && (
                <th className={`sortable ${sortConfig.key === "state" ? sortConfig.direction : ""}`} onClick={() => handleSort("state")}>
                  State
                </th>
              )}
              {visibleColumns.switch && (
                <th className={`sortable ${sortConfig.key === "switch" ? sortConfig.direction : ""}`} onClick={() => handleSort("switch")}>
                  Switch
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {sortedData.map((gpio, index) => (
              <tr key={index}>
                {visibleColumns.pin && <td>{gpio.pin}</td>}
                {visibleColumns.label && <td>{gpio.label}</td>}
                {visibleColumns.mode && <td>{gpio.mode}</td>}
                {visibleColumns.state && <td>{gpio.state}</td>}
                {visibleColumns.switch && (
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
                )}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default GpioTable;