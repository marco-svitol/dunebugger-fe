import { useEffect, useState, useRef, useCallback } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import "./dunebugger.css"; // Import the CSS file
import Profile from "./Profile";
import WebSocketManager from "./websocket";
import GpioTable from "./GpioTable";
import SequenceSwitches from "./SequenceSwitches";
import SequenceTimeline from "./SequenceTimeline";

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
  const [playingTime, setPlayingTime] = useState(0);
  const [logs, setLogs] = useState([]);
  const [connectionId, setConnectionId] = useState(null);
  const [gpioVisible, setGpioVisible] = useState(false);
  const [logsVisible, setLogsVisible] = useState(false);
  const [wssUrl, setWssUrl] = useState(null);
  const [isOverlayOpen, setIsOverlayOpen] = useState(false);
  const logsEndRef = useRef(null);
  const heartBeatTimeoutRef = useRef(null);
  const overlayRef = useRef(null);

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
        HEARTBEAT_TIMEOUT
      );
      setWSClient(webSocketClient);
    }
  }, [wssUrl]);

  // not working
  //this is a custom hook that will scroll to the bottom of the logs textarea
  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs]);

  useEffect(() => {
    if (isOnline && wsClient) {
      const fetchStates = async () => {
        await wsClient.sendRequest("refresh", "null"); // Request GPIO state
      };

      fetchStates();
    }
  }, [isOnline, wsClient]);

  const toggleOverlay = () => {
    setIsOverlayOpen((prev) => !prev);
  };

  // Handle clicking outside the overlay to close it
  const handleOverlayClick = (event) => {
    // Check if the click was on the overlay background (not its content)
    if (overlayRef.current && event.target === overlayRef.current) {
      setIsOverlayOpen(false);
    }
  };

  return (
    <div className="smart-dunebugger">
      {/* Header Bar */}
      <header className={`header-bar ${isOnline ? "online" : "offline"}`}>
        {/* Left Section */}
        <div className="header-left">
          <button className="hamburger-button" onClick={toggleOverlay}>
            ☰
          </button>
          <h1>Smart Dunebugger</h1>
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
              Login
            </button>
          ) : (
            <button className="auth-button" onClick={logout}>
              Logout 
              {/* {user?.name} */}
            </button>
          )}
          <Profile setWssUrl={setWssUrl} />
        </div>
      </header>

      {/* Main Content */}
      <div className="content">
        <div className="right-section">
          <SequenceTimeline sequence={sequence || []} playingTime={playingTime || 0} />
          <h3>
            GPIO States
            <button onClick={() => setGpioVisible(!gpioVisible)}>
              {gpioVisible ? "-" : "+"}
            </button>
          </h3>
          {gpioVisible && (
            <GpioTable
              gpioStates={gpioStates || []}
              wsClient={wsClient}
              connectionId={connectionId}
            />
          )}
          <h3>
            Logs
            <button onClick={() => setLogsVisible(!logsVisible)}>
              {logsVisible ? "-" : "+"}
            </button>
          </h3>
          {logsVisible && (
            <div style={{ position: "relative" }}>
              <textarea
                style={{ width: "100%", height: "200px", backgroundColor: "black", color: "white" }}
                value={logs.join("\n")}
                readOnly
              />
              <div ref={logsEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* Overlay */}
      {isOverlayOpen && (
        <div className="overlay" ref={overlayRef} onClick={handleOverlayClick}>
          <div className="overlay-content">
            <div className="sequence-controls">
              <SequenceSwitches
                sequenceState={sequenceState || { random_actions: false, cycle_running: false, start_button_enabled: false }}
                wsClient={wsClient}
                connectionId={connectionId}
              />
            </div>
            <div className="commands">
              <button className="refresh-button" onClick={() => wsClient.sendRequest("refresh", "null")}>Refresh</button>
              <button onClick={() => wsClient.sendRequest("dunebugger_set", "so")}>Off state</button>
              <button onClick={() => wsClient.sendRequest("dunebugger_set", "sb")}>Standby state</button>
              <button>Upload Sequence</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
