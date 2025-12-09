import React from "react";
import "./SystemPage.css";

const SystemPage = ({ systemInfo, logs, wsClient, connectionId, groupName, showMessage }) => {
  // Note: System page doesn't have local state to reset,
  // it relies on systemInfo and logs props which are reset in parent component
  const handleRefresh = async (showPopup = true) => {
    if (wsClient && connectionId) {
      try {
        await wsClient.sendRequest("system_info", "refresh");
        if (showMessage && showPopup) {
          showMessage("System info refresh request sent", "info");
        }
      } catch (error) {
        console.error("Failed to send system info refresh request:", error);
      }
    }
  };

  // Auto-refresh when component mounts and when connectionId changes (device switch)
  React.useEffect(() => {
    handleRefresh(false);
  }, [connectionId]);
  const renderDunebuggerComponents = () => {
    if (!systemInfo?.system_info.dunebugger_components) return null;

    return (
      <div className="system-section">
        <h3>Dunebugger Components</h3>
        <div className="components-grid">
          {systemInfo.system_info.dunebugger_components.map((component, index) => (
            <div key={index} className="component-card">
              <div className="component-header">
                <h4>{component.name}</h4>
                <span className={`status-badge ${component.state}`}>
                  {component.state}
                </span>
              </div>
              <div className="component-details">
                <p><strong>Version:</strong> {component.version}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderHardware = () => {
    if (!systemInfo?.system_info.hardware) return null;

    const { hardware } = systemInfo.system_info;
    return (
      <div className="system-section">
        <h3>Hardware Information</h3>
        <div className="hardware-grid">
          <div className="hardware-card">
            <h4>Device</h4>
            <p><strong>Model:</strong> {hardware.model}</p>
            <p><strong>Revision:</strong> {hardware.revision}</p>
          </div>
          
          {hardware.cpu && (
            <div className="hardware-card">
              <h4>CPU</h4>
              <p><strong>Model:</strong> {hardware.cpu.model}</p>
              <p><strong>Architecture:</strong> {hardware.cpu.architecture}</p>
              <p><strong>Cores:</strong> {hardware.cpu.cores}</p>
              {hardware.cpu.current_temp_c !== null && (
                <p><strong>Temperature:</strong> {hardware.cpu.current_temp_c}°C</p>
              )}
              {hardware.cpu.current_temp_c === null && (
                <p><strong>Temperature:</strong> Not available</p>
              )}
              {hardware.cpu.load && (
                <p><strong>Load:</strong> {hardware.cpu.load.map(load => (load * 100).toFixed(1) + '%').join(", ")}</p>
              )}
            </div>
          )}
          
          {hardware.memory && (
            <div className="hardware-card">
              <h4>Memory</h4>
              <p><strong>Total:</strong> {hardware.memory.total_mb} MB</p>
              <p><strong>Used:</strong> {hardware.memory.used_mb} MB</p>
              <p><strong>Usage:</strong> {((hardware.memory.used_mb / hardware.memory.total_mb) * 100).toFixed(1)}%</p>
            </div>
          )}
          
          {hardware.storage && (
            <div className="hardware-card">
              <h4>Storage</h4>
              <p><strong>Device:</strong> {hardware.storage.root_device}</p>
              <p><strong>Total:</strong> {hardware.storage.total_gb} GB</p>
              <p><strong>Used:</strong> {hardware.storage.used_gb} GB</p>
              <p><strong>Usage:</strong> {((hardware.storage.used_gb / hardware.storage.total_gb) * 100).toFixed(1)}%</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderOS = () => {
    if (!systemInfo?.system_info.os) return null;

    const { os } = systemInfo.system_info;
    return (
      <div className="system-section">
        <h3>Operating System</h3>
        <div className="os-card">
          <p><strong>Name:</strong> {os.name}</p>
          <p><strong>Version:</strong> {os.version}</p>
          <p><strong>Kernel:</strong> {os.kernel}</p>
          <p><strong>Boot Time:</strong> {new Date(os.boot_time_utc).toLocaleString()}</p>
        </div>
      </div>
    );
  };

  const renderNetwork = () => {
    if (!systemInfo?.system_info.network) return null;

    const { network } = systemInfo.system_info;
    return (
      <div className="system-section">
        <h3>Network Information</h3>
        <div className="network-info">
          <div className="network-card">
            <h4>General</h4>
            <p><strong>Hostname:</strong> {network.hostname}</p>
            {network.connectivity && (
              <>
                <p><strong>Default Route:</strong> {network.connectivity.default_route}</p>
                <p><strong>DNS Servers:</strong> {network.connectivity.dns_servers.join(", ")}</p>
                <p><strong>Internet:</strong> {network.connectivity.internet_reachable ? "Reachable" : "Not Reachable"}</p>
                <p><strong>Gateway Latency:</strong> {network.connectivity.latency_ms_to_gateway}ms</p>
              </>
            )}
          </div>
          
          {network.interfaces && (
            <div className="network-interfaces">
              <h4>Network Interfaces ({network.interfaces.length})</h4>
              <div className="interfaces-container">
              {network.interfaces.map((iface, index) => (
                <div key={index} className="interface-card">
                  <div className="interface-header">
                    <h5>{iface.name}</h5>
                    <span className={`status-badge ${iface.state}`}>
                      {iface.state}
                    </span>
                  </div>
                  <p><strong>Type:</strong> {iface.type}</p>
                  <p><strong>MAC:</strong> {iface.mac}</p>
                  {iface.ip_v4 ? (
                    <p><strong>IPv4:</strong> {iface.ip_v4}</p>
                  ) : (
                    <p><strong>IPv4:</strong> <span className="no-data">Not assigned</span></p>
                  )}
                  {iface.ip_v6 ? (
                    <p><strong>IPv6:</strong> {iface.ip_v6}</p>
                  ) : (
                    <p><strong>IPv6:</strong> <span className="no-data">Not assigned</span></p>
                  )}
                  {iface.speed_mbps && <p><strong>Speed:</strong> {iface.speed_mbps} Mbps</p>}
                  {iface.ssid && <p><strong>SSID:</strong> {iface.ssid}</p>}
                  {iface.signal_strength_dbm && <p><strong>Signal:</strong> {iface.signal_strength_dbm} dBm</p>}
                </div>
              ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderLocation = () => {
    if (!systemInfo?.system_info.location) return null;

    const { location } = systemInfo.system_info;
    return (
      <div className="system-section">
        <h3>Physical Location</h3>
        <div className="location-card">
          <p><strong>Address:</strong> {location.address}</p>
          <p><strong>Description:</strong> {location.description}</p>
        </div>
      </div>
    );
  };

  const renderSystemLogs = () => {
    return (
      <div className="system-section">
        <h3>System Logs</h3>
        <div className="logs-container">
          <textarea
            className="logs-textarea"
            value={logs ? logs.join("\n") : "No logs available"}
            readOnly
          />
        </div>
      </div>
    );
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return "Unknown";
    
    // Handle different timestamp formats
    let date;
    if (timestamp.includes('T') && !timestamp.includes('Z') && !timestamp.includes('+')) {
      // Add 'Z' to assume UTC if no timezone is specified (e.g., "2025-11-26T00:27:16")
      date = new Date(timestamp + 'Z');
    } else {
      date = new Date(timestamp);
    }
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return "Invalid date";
    }
    
    return date.toLocaleString();
  };

  return (
    <div className="system-page">
      <div className="system-header">
        <div className="system-header-top">
          <h2>System Information</h2>
          <button 
            className="refresh-button" 
            onClick={handleRefresh}
            disabled={!wsClient || !connectionId}
            title="Refresh system information"
          >
            <span className="refresh-icon">🔄</span>
            Refresh
          </button>
        </div>
        {systemInfo && (
          <div className="system-meta">
            <p><strong>Device ID:</strong> {systemInfo.system_info.device_id?.replace(/"/g, '') || systemInfo.system_info.device_id}</p>
            <p><strong>Last Updated:</strong> {formatTimestamp(systemInfo.system_info.timestamp)}</p>
          </div>
        )}
      </div>

      {!systemInfo ? (
        <div className="no-data-message">
          <p>System information not available. Waiting for data from device...</p>
        </div>
      ) : (
        <div className="system-content">
          {renderDunebuggerComponents()}
          {renderHardware()}
          {renderOS()}
          {renderNetwork()}
          {renderLocation()}
        </div>
      )}
      
      {renderSystemLogs()}
    </div>
  );
};

export default SystemPage;