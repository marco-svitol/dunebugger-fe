import React from "react";
import "./SystemPage.css";
import { useTranslation } from "../contexts/TranslationContext";

const SystemPage = ({ systemInfo, logs, wsClient, connectionId, groupName, showMessage }) => {
  // Translation hook and text
  const { getTranslation } = useTranslation();
  
  // Page texts
  const texts = {
    pageTitle: getTranslation("System"),
    refreshButton: getTranslation("Refresh"),
    refreshButtonTitle: getTranslation("Refresh system information"),
    refreshMessageText: getTranslation("System info refresh request sent"),
    deviceIdLabel: getTranslation("Device ID"),
    lastUpdatedLabel: getTranslation("Last Updated"),
    noDataMessage: getTranslation("System information not available. Waiting for data from device..."),
    dunebuggerComponents: getTranslation("Dunebugger Components"),
    versionLabel: getTranslation("Version"),
    hardwareInfo: getTranslation("Hardware Information"),
    deviceLabel: getTranslation("Device"),
    modelLabel: getTranslation("Model"),
    revisionLabel: getTranslation("Revision"),
    cpuLabel: getTranslation("CPU"),
    architectureLabel: getTranslation("Architecture"),
    coresLabel: getTranslation("Cores"),
    temperatureLabel: getTranslation("Temperature"),
    notAvailable: getTranslation("Not available"),
    loadLabel: getTranslation("Load"),
    memoryLabel: getTranslation("Memory"),
    totalLabel: getTranslation("Total"),
    usedLabel: getTranslation("Used"),
    usageLabel: getTranslation("Usage"),
    storageLabel: getTranslation("Storage"),
    operatingSystem: getTranslation("Operating System"),
    nameLabel: getTranslation("Name"),
    versionOsLabel: getTranslation("Version"),
    kernelLabel: getTranslation("Kernel"),
    bootTimeLabel: getTranslation("Boot Time"),
    networkInfo: getTranslation("Network Information"),
    generalLabel: getTranslation("General"),
    hostnameLabel: getTranslation("Hostname"),
    defaultRouteLabel: getTranslation("Default Route"),
    dnsServersLabel: getTranslation("DNS Servers"),
    internetLabel: getTranslation("Internet"),
    reachable: getTranslation("Reachable"),
    notReachable: getTranslation("Not Reachable"),
    gatewayLatencyLabel: getTranslation("Gateway Latency"),
    networkInterfaces: getTranslation("Network Interfaces"),
    typeLabel: getTranslation("Type"),
    macLabel: getTranslation("MAC"),
    ipv4Label: getTranslation("IPv4"),
    ipv6Label: getTranslation("IPv6"),
    notAssigned: getTranslation("Not assigned"),
    speedLabel: getTranslation("Speed"),
    ssidLabel: getTranslation("SSID"),
    signalLabel: getTranslation("Signal"),
    physicalLocation: getTranslation("Physical Location"),
    addressLabel: getTranslation("Address"),
    descriptionLabel: getTranslation("Description"),
    systemLogs: getTranslation("System Logs"),
    noLogsAvailable: getTranslation("No logs available"),
    unknown: getTranslation("Unknown"),
    invalidDate: getTranslation("Invalid date"),
    upToDate: getTranslation("Up to Date"),
    newVersionAvailable: getTranslation("New version available"),
    updateComponents: getTranslation("Update Components"),
    updateConfirmTitle: getTranslation("Confirm Component Update"),
    updateConfirmMessage: getTranslation("⚠️ Component Update Warning\n\nIt is highly recommended that this update is performed while connected locally to the device.\n\nThe update process will most likely cause:\n• A system reset\n• Temporary switching off and on of all relays and connected devices\n• A brief disconnection from the user interface\n\nDo you want to proceed with the update?"),
    updateConfirm: getTranslation("Proceed with Update"),
    updateCancel: getTranslation("Cancel"),
    updateStarted: getTranslation("Component update started")
  };
  // Note: System page doesn't have local state to reset,
  // it relies on systemInfo and logs props which are reset in parent component
  const handleRefresh = async (showPopup = true) => {
    if (wsClient && connectionId) {
      try {
        await wsClient.sendRequest("controller.system_info", "refresh");
        if (showMessage && showPopup) {
          showMessage(texts.refreshMessageText, "info");
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
  
  // Check if any components have updates available
  const hasUpdatesAvailable = () => {
    if (!systemInfo?.system_info?.dunebugger_components) return false;
    return systemInfo.system_info.dunebugger_components.some(
      component => component.last_available_version && 
                   component.version !== component.last_available_version
    );
  };
  
  // Handle component update with confirmation
  const handleUpdateComponents = () => {
    const confirmed = window.confirm(texts.updateConfirmMessage);
    
    if (confirmed && wsClient && connectionId) {
      try {
        wsClient.sendRequest("updater.update", "manual_confirmation");
        if (showMessage) {
          showMessage(texts.updateStarted, "info");
        }
      } catch (error) {
        console.error("Failed to send update request:", error);
      }
    }
  };
  const renderDunebuggerComponents = () => {
    if (!systemInfo?.system_info.dunebugger_components) return null;

    return (
      <div className="system-section">
        <h3>{texts.dunebuggerComponents}</h3>
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
                <p><strong>{texts.versionLabel}:</strong> {component.version}</p>
                {component.last_available_version && component.version !== component.last_available_version && (
                  <p className="version-status update-available">
                    <strong>{texts.newVersionAvailable}:</strong> {component.last_available_version}
                  </p>
                )}
                {component.last_available_version && component.version === component.last_available_version && (
                  <p className="version-status up-to-date">
                    <strong>{texts.upToDate}</strong>
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
        {hasUpdatesAvailable() && (
          <div className="update-button-container">
            <button 
              className="update-components-button"
              onClick={handleUpdateComponents}
              disabled={!wsClient || !connectionId}
              title={texts.updateComponents}
            >
              <span className="update-icon">⬆️</span>
              {texts.updateComponents}
            </button>
          </div>
        )}
      </div>
    );
  };

  const renderHardware = () => {
    if (!systemInfo?.system_info.hardware) return null;

    const { hardware } = systemInfo.system_info;
    return (
      <div className="system-section">
        <h3>{texts.hardwareInfo}</h3>
        <div className="hardware-grid">
          <div className="hardware-card">
            <h4>{texts.deviceLabel}</h4>
            <p><strong>{texts.modelLabel}:</strong> {hardware.model}</p>
            <p><strong>{texts.revisionLabel}:</strong> {hardware.revision}</p>
          </div>
          
          {hardware.cpu && (
            <div className="hardware-card">
              <h4>{texts.cpuLabel}</h4>
              <p><strong>{texts.modelLabel}:</strong> {hardware.cpu.model}</p>
              <p><strong>{texts.architectureLabel}:</strong> {hardware.cpu.architecture}</p>
              <p><strong>{texts.coresLabel}:</strong> {hardware.cpu.cores}</p>
              {hardware.cpu.current_temp_c !== null && (
                <p><strong>{texts.temperatureLabel}:</strong> {hardware.cpu.current_temp_c}°C</p>
              )}
              {hardware.cpu.current_temp_c === null && (
                <p><strong>{texts.temperatureLabel}:</strong> {texts.notAvailable}</p>
              )}
              {hardware.cpu.load && (
                <p><strong>{texts.loadLabel}:</strong> {hardware.cpu.load.map(load => (load * 100).toFixed(1) + '%').join(", ")}</p>
              )}
            </div>
          )}
          
          {hardware.memory && (
            <div className="hardware-card">
              <h4>{texts.memoryLabel}</h4>
              <p><strong>{texts.totalLabel}:</strong> {hardware.memory.total_mb} MB</p>
              <p><strong>{texts.usedLabel}:</strong> {hardware.memory.used_mb} MB</p>
              <p><strong>{texts.usageLabel}:</strong> {((hardware.memory.used_mb / hardware.memory.total_mb) * 100).toFixed(1)}%</p>
            </div>
          )}
          
          {hardware.storage && (
            <div className="hardware-card">
              <h4>{texts.storageLabel}</h4>
              <p><strong>{texts.deviceLabel}:</strong> {hardware.storage.root_device}</p>
              <p><strong>{texts.totalLabel}:</strong> {hardware.storage.total_gb} GB</p>
              <p><strong>{texts.usedLabel}:</strong> {hardware.storage.used_gb} GB</p>
              <p><strong>{texts.usageLabel}:</strong> {((hardware.storage.used_gb / hardware.storage.total_gb) * 100).toFixed(1)}%</p>
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
        <h3>{texts.operatingSystem}</h3>
        <div className="os-card">
          <p><strong>{texts.nameLabel}:</strong> {os.name}</p>
          <p><strong>{texts.versionOsLabel}:</strong> {os.version}</p>
          <p><strong>{texts.kernelLabel}:</strong> {os.kernel}</p>
          <p><strong>{texts.bootTimeLabel}:</strong> {new Date(os.boot_time_utc).toLocaleString()}</p>
        </div>
      </div>
    );
  };

  const renderNetwork = () => {
    if (!systemInfo?.system_info.network) return null;

    const { network } = systemInfo.system_info;
    return (
      <div className="system-section">
        <h3>{texts.networkInfo}</h3>
        <div className="network-info">
          <div className="network-card">
            <h4>{texts.generalLabel}</h4>
            <p><strong>{texts.hostnameLabel}:</strong> {network.hostname}</p>
            {network.connectivity && (
              <>
                <p><strong>{texts.defaultRouteLabel}:</strong> {network.connectivity.default_route}</p>
                <p><strong>{texts.dnsServersLabel}:</strong> {network.connectivity.dns_servers.join(", ")}</p>
                <p><strong>{texts.internetLabel}:</strong> {network.connectivity.internet_reachable ? texts.reachable : texts.notReachable}</p>
                <p><strong>{texts.gatewayLatencyLabel}:</strong> {network.connectivity.latency_ms_to_gateway}ms</p>
              </>
            )}
          </div>
          
          {network.interfaces && (
            <div className="network-interfaces">
              <h4>{texts.networkInterfaces} ({network.interfaces.length})</h4>
              <div className="interfaces-container">
              {network.interfaces.map((iface, index) => (
                <div key={index} className="interface-card">
                  <div className="interface-header">
                    <h5>{iface.name}</h5>
                    <span className={`status-badge ${iface.state}`}>
                      {iface.state}
                    </span>
                  </div>
                  <p><strong>{texts.typeLabel}:</strong> {iface.type}</p>
                  <p><strong>{texts.macLabel}:</strong> {iface.mac}</p>
                  {iface.ip_v4 ? (
                    <p><strong>{texts.ipv4Label}:</strong> {iface.ip_v4}</p>
                  ) : (
                    <p><strong>{texts.ipv4Label}:</strong> <span className="no-data">{texts.notAssigned}</span></p>
                  )}
                  {iface.ip_v6 ? (
                    <p><strong>{texts.ipv6Label}:</strong> {iface.ip_v6}</p>
                  ) : (
                    <p><strong>{texts.ipv6Label}:</strong> <span className="no-data">{texts.notAssigned}</span></p>
                  )}
                  {iface.speed_mbps && <p><strong>{texts.speedLabel}:</strong> {iface.speed_mbps} Mbps</p>}
                  {iface.ssid && <p><strong>{texts.ssidLabel}:</strong> {iface.ssid}</p>}
                  {iface.signal_strength_dbm && <p><strong>{texts.signalLabel}:</strong> {iface.signal_strength_dbm} dBm</p>}
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
        <h3>{texts.physicalLocation}</h3>
        <div className="location-card">
          <p><strong>{texts.addressLabel}:</strong> {location.address}</p>
          <p><strong>{texts.descriptionLabel}:</strong> {location.description}</p>
        </div>
      </div>
    );
  };

  const renderSystemLogs = () => {
    return (
      <div className="system-section">
        <h3>{texts.systemLogs}</h3>
        <div className="logs-container">
          <textarea
            className="logs-textarea"
            value={logs ? logs.join("\n") : texts.noLogsAvailable}
            readOnly
          />
        </div>
      </div>
    );
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return texts.unknown;
    
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
      return texts.invalidDate;
    }
    
    return date.toLocaleString();
  };

  return (
    <div className="system-page">
      <div className="system-header">
        <div className="system-header-top">
          <h2>{texts.pageTitle}</h2>
          <button 
            className="refresh-button" 
            onClick={handleRefresh}
            disabled={!wsClient || !connectionId}
            title={texts.refreshButtonTitle}
          >
            <span className="refresh-icon">🔄</span>
            {texts.refreshButton}
          </button>
        </div>
        {systemInfo && (
          <div className="system-meta">
            <p><strong>{texts.deviceIdLabel}:</strong> {systemInfo.system_info.device_id?.replace(/"/g, '') || systemInfo.system_info.device_id}</p>
            <p><strong>{texts.lastUpdatedLabel}:</strong> {formatTimestamp(systemInfo.system_info.timestamp)}</p>
          </div>
        )}
      </div>

      {!systemInfo ? (
        <div className="no-data-message">
          <p>{texts.noDataMessage}</p>
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