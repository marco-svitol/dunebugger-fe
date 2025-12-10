import { useEffect, useState, useRef } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import "./dunebugger.css"; // Import the CSS file
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

const HEARTBEAT_TIMEOUT = 65000; // 65 seconds

export default function SmartDunebugger() {
  const { loginWithRedirect, logout, isAuthenticated, user } = useAuth0();
  const [wsClient, setWSClient] = useState(null);
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

  // Debug schedule state changes
  useEffect(() => {
    console.log("Dunebugger: schedule state changed:", schedule);
  }, [schedule]);

  // Debug next actions state changes
  useEffect(() => {
    console.log("Dunebugger: nextActions state changed:", nextActions);
  }, [nextActions]);

  // Debug last executed action state changes
  useEffect(() => {
    console.log("Dunebugger: lastExecutedAction state changed:", lastExecutedAction);
  }, [lastExecutedAction]);
  const [playingTime, setPlayingTime] = useState(null); // Initialize as null to indicate no time is playing
  const [logs, setLogs] = useState([]);
  const [systemInfo, setSystemInfo] = useState(null);
  const [connectionId, setConnectionId] = useState(null);
  const [wssUrl, setWssUrl] = useState(null);
  const [groupName, setGroupName] = useState(""); // Default fallback, will be updated from Auth0
  const [availableDevices, setAvailableDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState("");
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
      case "main": return "Main";
      case "sequence": return "Sequence";
      case "gpios": return "GPIOs";
      case "scheduler": return "Scheduler";
      case "analytics": return "Analytics";
      case "system": return "System";
      default: return "Main";
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
      showMessageRef.current("Connected to DuneBugger Portal", "success");
      setHasShownLoginMessage(true);
    }
  }, [isAuthenticated, hasShownLoginMessage, user]);

  // Reset login message flag when user logs out
  useEffect(() => {
    if (!isAuthenticated) {
      setHasShownLoginMessage(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    let currentClient = null;

    if (wssUrl && groupName) {
      // Cleanup previous connection if exists
      if (wsClient) {
        wsClient.cleanup();
        setWSClient(null);
        setIsOnline(false);
        setConnectionId(null);
      }

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
        heartBeatTimeoutRef,
        groupName,
        HEARTBEAT_TIMEOUT,
        showMessageRef
      );
      
      currentClient = webSocketClient;
      setWSClient(webSocketClient);
    }
    
    // Cleanup function for when component unmounts or dependencies change
    return () => {
      if (currentClient) {
        currentClient.cleanup();
      }
    };
  }, [wssUrl, groupName]);

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

  const handleDeviceChange = (device) => {
    setSelectedDevice(device);
    
    // Reset all state variables to initial values when changing device
    setIsOnline(false);
    setGpioStates({});
    setSequenceState({
      random_actions: false,
      cycle_running: false,
      start_button_enabled: false,
    });
    setSequence([]);
    setSchedule(null);
    setNextActions([]);
    setLastExecutedAction(null);
    setPlayingTime(null);
    setLogs([]);
    setSystemInfo(null);
    setConnectionId(null);
    
    setGroupName(device); // This will trigger WebSocket reconnection via useEffect
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
                  <img src="/Dunebugger_Logo_transparent_2.png" alt="Menu" className="hamburger-logo" />
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
                {!isAuthenticated ? (
                  <button className="auth-button" onClick={loginWithRedirect}>
                    Sign In
                  </button>
                ) : (
                  <button className="auth-button" onClick={logout}>
                    Sign Out
                  </button>
                )}
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
