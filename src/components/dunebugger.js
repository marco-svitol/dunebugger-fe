import { useEffect, useState, useRef } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import "./dunebugger.css"; // Import the CSS file
import { useTranslatedText } from "../hooks/useTranslation";
import Profile from "./Profile";
import DeviceSelector from "./DeviceSelector";
import WebSocketManager from "./websocket";
import Menu from "./Menu"; // Import the new Menu component
import MainPage from "./MainPage";
import SequencePage from "./SequencePage";
import GPIOsPage from "./GPIOsPage";
import SchedulerPage from "./SchedulerPage";
import AnalyticsPage from "./AnalyticsPage";
import SystemPage from "./SystemPage";
import ActionBar from "./ActionBar"; // Import the ActionBar component
import MessagesContainer from "./MessagesContainer"; // Import the MessagesContainer component
import UserDropdown from "./UserDropdown"; // Import the UserDropdown component

const HEARTBEAT_TIMEOUT = 65000; // 65 seconds

// Functions to handle device selection persistence
const getStoredDeviceSelection = () => {
  try {
    const stored = localStorage.getItem('dunebugger-selectedDevice');
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.warn('Failed to load stored device selection:', error);
    return null;
  }
};

const saveDeviceSelection = (device) => {
  try {
    localStorage.setItem('dunebugger-selectedDevice', JSON.stringify(device));
  } catch (error) {
    console.warn('Failed to save device selection:', error);
  }
};

export default function SmartDunebugger() {
  const { isAuthenticated, user } = useAuth0();
  const [wsClient, setWSClient] = useState(null);
  
  // Translation hooks
  const { translatedText: connectedMessageText } = useTranslatedText("Connected to DuneBugger Portal");
  const { translatedText: mainPageTitle } = useTranslatedText("Main");
  const { translatedText: sequencePageTitle } = useTranslatedText("Sequence");
  const { translatedText: switchesPageTitle } = useTranslatedText("Switches");
  const { translatedText: schedulerPageTitle } = useTranslatedText("Scheduler");
  const { translatedText: analyticsPageTitle } = useTranslatedText("Analytics");
  const { translatedText: systemPageTitle } = useTranslatedText("System");
  
  const [isOnline, setIsOnline] = useState(false); // Device connection state
  const [gpioStates, setGpioStates] = useState({});
  const [sequenceState, setSequenceState] = useState({
    random_actions: false,
    cycle_running: false,
    start_button_enabled: false,
  });
  const [sequence, setSequence] = useState([]);
  const [schedule, setSchedule] = useState(null);
  const [nextActions, setNextActions] = useState([]);
  const [lastExecutedAction, setLastExecutedAction] = useState(null);
  const [modes, setModes] = useState([]);

  const [playingTime, setPlayingTime] = useState(null); // Initialize as null to indicate no time is playing
  const [logs, setLogs] = useState([]);
  const [systemInfo, setSystemInfo] = useState(null);
  const [ntpAvailable, setNtpAvailable] = useState(null);
  const [connectionId, setConnectionId] = useState(null);
  const [wssUrl, setWssUrl] = useState(null);
  const [groupName, setGroupName] = useState(""); // Default fallback, will be updated from Auth0
  const [availableDevices, setAvailableDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState(() => getStoredDeviceSelection() || "");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState("main");
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [hasShownLoginMessage, setHasShownLoginMessage] = useState(false);
  const showMessageRef = useRef(null);
  const heartBeatTimeoutRef = useRef(null);
  const logsEndRef = useRef(null);

  // Get page title for the header
  const getPageTitle = () => {
    switch (currentPage) {
      case "main": return mainPageTitle;
      case "sequence": return sequencePageTitle;
      case "gpios": return switchesPageTitle;
      case "scheduler": return schedulerPageTitle;
      case "analytics": return analyticsPageTitle;
      case "system": return systemPageTitle;
      default: return mainPageTitle;
    }
  };

  // Handle window resize to detect mobile view
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Show login success message when user authenticates
  useEffect(() => {
    if (isAuthenticated && !hasShownLoginMessage && user && showMessageRef.current) {
      showMessageRef.current(connectedMessageText, "success");
      setHasShownLoginMessage(true);
    }
  }, [isAuthenticated, hasShownLoginMessage, user, connectedMessageText]);

  // Restore device selection when devices become available
  useEffect(() => {
    const storedDevice = getStoredDeviceSelection();
    if (storedDevice && availableDevices.length > 0) {
      // Check if the stored device is still available
      if (availableDevices.includes(storedDevice)) {
        if (selectedDevice !== storedDevice) {
          setSelectedDevice(storedDevice);
          setGroupName(storedDevice);
        }
      } else {
        // Stored device no longer available, clear it
        localStorage.removeItem('dunebugger-selectedDevice');
        setSelectedDevice("");
      }
    }
  }, [availableDevices, selectedDevice]);

  // Reset login message flag when user logs out
  useEffect(() => {
    if (!isAuthenticated) {
      setHasShownLoginMessage(false);
    }
  }, [isAuthenticated]);

  // Initialize WebSocket connection once when wssUrl is available
  useEffect(() => {
    let currentClient = null;

    if (wssUrl && !wsClient) {
      // Only create a new WebSocketManager if we don't have one yet
      const webSocketClient = new WebSocketManager(
        wssUrl,
        setConnectionId,
        setIsOnline,
        setLogs,
        setGpioStates,
        setSequenceState,
        setSequence,
        setSchedule,
        setNextActions,
        setLastExecutedAction,
        setPlayingTime,
        setSystemInfo,
        setModes,
        setNtpAvailable,
        heartBeatTimeoutRef,
        selectedDevice || groupName, // Use selectedDevice if available
        HEARTBEAT_TIMEOUT,
        showMessageRef
      );
      
      currentClient = webSocketClient;
      setWSClient(webSocketClient);
      
      // Set the initial groupName
      if (selectedDevice && selectedDevice !== groupName) {
        setGroupName(selectedDevice);
      }
    }
    
    // Cleanup function for when component unmounts
    return () => {
      if (currentClient) {
        currentClient.cleanup();
      }
    };
  }, [wssUrl]); // Only depend on wssUrl, not groupName

  // Handle device switching using the switchDevice method
  useEffect(() => {
    if (wsClient && selectedDevice && selectedDevice !== groupName) {
      console.log(`Switching device from ${groupName} to ${selectedDevice}`);
      
      // Reset ntpAvailable to default state when switching devices
      setNtpAvailable(null);
      
      wsClient.switchDevice(selectedDevice)
        .then(() => {
          setGroupName(selectedDevice);
          console.log(`Device switch complete: ${selectedDevice}`);
        })
        .catch((error) => {
          console.error("Failed to switch device:", error);
          if (showMessageRef.current) {
            showMessageRef.current("Failed to switch device", "error");
          }
        });
    }
  }, [selectedDevice, wsClient]);

  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs]);

  useEffect(() => {
    if (isOnline && wsClient) {
      const fetchStates = async () => {
        // Send appropriate refresh command based on current page
        if (currentPage === "scheduler") {
          await wsClient.sendRequest("scheduler.refresh", "null");
          await wsClient.sendRequest("controller.ntp_status", "null");
        } else if (currentPage === "sequence") {
          await wsClient.sendRequest("core.refresh_sequence", "null");
        } else if (currentPage === "system") {
          await wsClient.sendRequest("controller.system_info", "null");
        } else if (currentPage === "gpios") {
          await wsClient.sendRequest("core.refresh_gpios", "null");
        } else if (currentPage === "main") {
          await wsClient.sendRequest("core.refresh_sequence", "null");
        }
        // Note: analytics page doesn't need refresh as it doesn't use real-time data
      };

      fetchStates();
    }
  }, [isOnline, wsClient, currentPage]);

  const toggleMenu = () => {
    setIsMenuOpen((prev) => !prev);
  };

  const handleNavigate = (page) => {
    setCurrentPage(page);
    if (isMobile) {
      setIsMenuOpen(false); // Close menu on mobile after navigation
    }
  };

  const handleDeviceChange = async (device) => {
    // Only proceed if a different device is actually selected
    if (device === selectedDevice || device === groupName) {
      return; // No change needed, avoid unnecessary reconnection
    }

    // Check if wsClient exists
    if (!wsClient) {
      console.error("WebSocket client not initialized");
      return;
    }

    try {
      // Use the WebSocketManager's switchDevice method instead of recreating the connection
      await wsClient.switchDevice(device);
      
      // Update state after successful device switch
      // Note: We DON'T update groupName here to avoid triggering the useEffect
      // The wsClient already switched groups internally
      setSelectedDevice(device);
      saveDeviceSelection(device); // Persist device selection
      
      if (showMessageRef.current) {
        showMessageRef.current(`Switched to device: ${device}`, "success");
      }
    } catch (error) {
      console.error("Failed to switch device:", error);
      if (showMessageRef.current) {
        showMessageRef.current(`Failed to switch to device: ${device}`, "error");
      }
    }
  };

  // Render the current page based on the navigation state
  const renderCurrentPage = (showMessage) => {
    switch (currentPage) {
      case "main":
        return <MainPage 
          wsClient={wsClient} 
          connectionId={connectionId} 
          sequence={sequence} 
          playingTime={playingTime}
          sequenceState={sequenceState}
          showMessage={showMessage}
          groupName={groupName}
          nextActions={nextActions}
          modes={modes}
          isOnline={isOnline}
          systemInfo={systemInfo}
          ntpAvailable={ntpAvailable}
        />;
      case "sequence":
        return (
          <SequencePage
            sequence={sequence}
            playingTime={playingTime}
            sequenceState={sequenceState}
            wsClient={wsClient}
            connectionId={connectionId}
            showMessage={showMessage}
            groupName={groupName}
          />
        );
      case "gpios":
        return (
          <GPIOsPage
            gpioStates={gpioStates}
            wsClient={wsClient}
            connectionId={connectionId}
            groupName={groupName}
            showMessage={showMessage}
          />
        );
      case "scheduler":
        return (
          <SchedulerPage 
            schedule={schedule}
            nextActions={nextActions}
            lastExecutedAction={lastExecutedAction}
            wsClient={wsClient}
            connectionId={connectionId}
            showMessage={showMessage}
            groupName={groupName}
            isOnline={isOnline}
            ntpAvailable={ntpAvailable}
          />
        );
      case "analytics":
        return <AnalyticsPage groupName={groupName} />;
      case "system":
        return <SystemPage systemInfo={systemInfo} logs={logs} wsClient={wsClient} connectionId={connectionId} groupName={groupName} showMessage={showMessage} />;
      default:
        return <MainPage wsClient={wsClient} connectionId={connectionId} groupName={groupName} />;
    }
  };

  return (
    <MessagesContainer>
      {({ showMessage }) => {
        // Store the showMessage function in ref for use in useEffect
        showMessageRef.current = showMessage;
        
        return (
          <div className="smart-dunebugger">
            {/* Header Bar */}
            <header className={`header-bar ${isOnline ? "online" : "offline"}`}>
              {/* Left Section */}
              <div className="header-left">
                <button className="hamburger-button" onClick={toggleMenu}>
                  <img src="/Dunebugger_Logo_transparent_1.png" alt="Menu" className="hamburger-logo" />
                </button>
                <h1>Dunebugger - {getPageTitle()}</h1>
                <span className={`hub-status-circle ${connectionId ? "connected" : "disconnected"}`}></span>
                <span className={`status-circle ${isOnline ? "online" : "offline"}`}></span>
                <span className="hub-status-text">
                  {isOnline ? "online" : "offline"}
                </span>
              </div>

              {/* Right Section */}
              <div className="header-right">
                <div className="status-container">
                  <DeviceSelector 
                    availableDevices={availableDevices}
                    selectedDevice={selectedDevice}
                    onDeviceChange={handleDeviceChange}
                  />
                </div>
                <Profile 
                  setWssUrl={setWssUrl} 
                  setGroupName={setGroupName}
                  setAvailableDevices={setAvailableDevices}
                  setSelectedDevice={setSelectedDevice}
                />
                <UserDropdown 
                  availableDevices={availableDevices}
                  selectedDevice={selectedDevice}
                />
              </div>
            </header>

            {/* Action Bar */}
            <ActionBar 
              currentPage={currentPage} 
              wsClient={wsClient} 
              connectionId={connectionId} 
              sequenceState={sequenceState}
              isOnline={isOnline}
              showMessage={showMessage}
              playingTime={playingTime}
              sequence={sequence}
              groupName={groupName}
            />

            {/* Navigation Menu */}
            <Menu
              isOpen={isMenuOpen}
              onClose={() => setIsMenuOpen(false)}
              onNavigate={handleNavigate}
              currentPage={currentPage}
              isMobile={isMobile}
            />

            {/* Main Content */}
            <div className="content">
              <div className="right-section">
                {renderCurrentPage(showMessage)}
              </div>
            </div>
          </div>
        );
      }}
    </MessagesContainer>
  );
}
