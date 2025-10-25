import { useEffect, useState, useRef, useCallback } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import "./dunebugger.css"; // Import the CSS file
import Profile from "./Profile";
import WebSocketManager from "./websocket";
import Menu from "./Menu"; // Import the new Menu component
import MainPage from "./MainPage";
import SequencePage from "./SequencePage";
import GPIOsPage from "./GPIOsPage";
import SchedulerPage from "./SchedulerPage";
import AnalyticsPage from "./AnalyticsPage";
import ActionBar from "./ActionBar"; // Import the ActionBar component

const GROUP_NAME = "velasquez";
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
  const [playingTime, setPlayingTime] = useState(null); // Initialize as null to indicate no time is playing
  const [logs, setLogs] = useState([]);
  const [connectionId, setConnectionId] = useState(null);
  const [wssUrl, setWssUrl] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState("main");
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const heartBeatTimeoutRef = useRef(null);
  const logsEndRef = useRef(null);
  // Add new state variables for schedule and scheduleNext
  const [schedule, setSchedule] = useState({
    daily: [],
    weekly: {
      monday: [],
      tuesday: [],
      wednesday: [],
      thursday: [],
      friday: [],
      saturday: [],
      sunday: []
    },
    onetime: []
  });
  const [scheduleNext, setScheduleNext] = useState(null);
  const [availableStates, setAvailableStates] = useState([]);

  // Get page title for the header
  const getPageTitle = () => {
    switch (currentPage) {
      case "main": return "Main";
      case "sequence": return "Sequence";
      case "gpios": return "GPIOs";
      case "scheduler": return "Scheduler";
      case "analytics": return "Analytics";
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

  useEffect(() => {
    if (wssUrl) {
      const webSocketClient = new WebSocketManager(
        wssUrl,
        setConnectionId,
        setIsOnline,
        setLogs,
        setGpioStates,
        setSequenceState,
        setSequence,
        setPlayingTime,
        heartBeatTimeoutRef,
        GROUP_NAME,
        HEARTBEAT_TIMEOUT,
        setSchedule,
        setScheduleNext
      );
      setWSClient(webSocketClient);
    }
  }, [wssUrl]);

  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs]);

  useEffect(() => {
    if (isOnline && wsClient) {
      const fetchStates = async () => {
        await wsClient.sendRequest("refresh", "null"); // Request GPIO state
        // Also request schedule data
        await wsClient.sendRequest("get_schedule", "null");
      };

      fetchStates();
    }
  }, [isOnline, wsClient]);

  const toggleMenu = () => {
    setIsMenuOpen((prev) => !prev);
  };

  const handleNavigate = (page) => {
    setCurrentPage(page);
    if (isMobile) {
      setIsMenuOpen(false); // Close menu on mobile after navigation
    }
  };

  // Render the current page based on the navigation state
  const renderCurrentPage = () => {
    switch (currentPage) {
      case "main":
        return <MainPage 
          wsClient={wsClient} 
          connectionId={connectionId} 
          sequence={sequence} 
          playingTime={playingTime}
          sequenceState={sequenceState}
        />;
      case "sequence":
        return (
          <SequencePage
            sequence={sequence}
            playingTime={playingTime}
            sequenceState={sequenceState}
            wsClient={wsClient}
            connectionId={connectionId}
          />
        );
      case "gpios":
        return (
          <GPIOsPage
            gpioStates={gpioStates}
            logs={logs}
            wsClient={wsClient}
            connectionId={connectionId}
          />
        );
      case "scheduler":
        return (
          <SchedulerPage 
            schedule={schedule}
            scheduleNext={scheduleNext}
            wsClient={wsClient}
            connectionId={connectionId}
            isOnline={isOnline}
            availableStates={availableStates}
          />
        );
      case "analytics":
        return <AnalyticsPage />;
      default:
        return <MainPage wsClient={wsClient} connectionId={connectionId} />;
    }
  };

  // Fetch available states when online
  useEffect(() => {
    if (isOnline && wsClient) {
      wsClient.sendRequest("get_states", "null");
    }
  }, [isOnline, wsClient]);

  // Add handler for states response
  useEffect(() => {
    const handleStatesResponse = (e) => {
      if (e && e.data && e.data.subject === "states") {
        try {
          const data = JSON.parse(e.data.body);
          if (data && data.states) {
            setAvailableStates(data.states);
          }
        } catch (error) {
          console.error("Error parsing states data:", error);
        }
      }
    };

    // Add event listener for the custom event
    window.addEventListener("states_response", handleStatesResponse);

    return () => {
      window.removeEventListener("states_response", handleStatesResponse);
    };
  }, []);

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
          <span className={`hub-status ${connectionId ? "connected" : "disconnected"}`}>
            message hub: {connectionId ? "connected" : "disconnected"}
          </span>
        </div>

        {/* Right Section */}
        <div className="header-right">
          <div className="status-container">
            <span className={`status-circle ${isOnline ? "online" : "offline"}`}></span>
            <span className="group-status">
              {GROUP_NAME} {isOnline ? "online" : "offline"}
            </span>
          </div>
          {!isAuthenticated ? (
            <button className="auth-button" onClick={loginWithRedirect}>
              Sign In
            </button>
          ) : (
            <button className="auth-button" onClick={logout}>
              Sign Out
            </button>
          )}
          <Profile setWssUrl={setWssUrl} />
        </div>
      </header>

      {/* Action Bar */}
      <ActionBar 
        currentPage={currentPage} 
        wsClient={wsClient} 
        connectionId={connectionId} 
        sequenceState={sequenceState}
        isOnline={isOnline}
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
          {renderCurrentPage()}
        </div>
      </div>
    </div>
  );
}
