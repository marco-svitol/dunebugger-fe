import React from "react";
import "./SequenceSwitches.css"; // Optional: Add a CSS file for switch-specific styles if needed.

function SequenceSwitches({ sequenceState, client, GROUP_NAME, connectionId }) {
  const handleToggle = (key) => {
    let command = "";

    switch (key) {
      case "random_actions":
        command = sequenceState.random_actions ? "dr" : "er"; // Disable or Enable random actions
        break;
      case "cycle_running":
        command = sequenceState.cycle_running ? "cs" : "c"; // Cycle stop or start
        break;
      case "start_button_enabled":
        command = sequenceState.start_button_enabled ? "dsb" : "esb"; // Custom commands for start button
        break;
      default:
        console.warn("Unknown switch key:", key);
        return;
    }

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
  };

  return (
    <div className="sequence-switches">
      <div className="switch-container">
        <label>Cycle</label>
        <label className="switch">
          <input
            type="checkbox"
            checked={sequenceState.cycle_running}
            onChange={() => handleToggle("cycle_running")}
          />
          <span className="slider"></span>
        </label>
      </div>
      <div className="switch-container">
        <label>Start Button</label>
        <label className="switch">
          <input
            type="checkbox"
            checked={sequenceState.start_button_enabled}
            onChange={() => handleToggle("start_button_enabled")}
          />
          <span className="slider"></span>
        </label>
      </div>
      <div className="switch-container">
        <label>Random Actions</label>
        <label className="switch">
          <input
            type="checkbox"
            checked={sequenceState.random_actions}
            onChange={() => handleToggle("random_actions")}
          />
          <span className="slider"></span>
        </label>
      </div>
    </div>
  );
}

export default SequenceSwitches;