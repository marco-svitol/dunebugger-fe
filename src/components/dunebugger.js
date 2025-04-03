import { useEffect, useState, useRef, useCallback } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import "./dunebugger.css"; // Import the CSS file
import Profile from "./Profile";
import { startWebSocket } from "./websocket";
import { startPingPong } from "./pingpong";
import GpioTable from "./GpioTable";
import SequenceSwitches from "./SequenceSwitches";
import SequenceTimeline from "./SequenceTimeline";

const GROUP_NAME = "velasquez";

export default function SmartDunebugger() {
  const { loginWithRedirect, logout, isAuthenticated, user } = useAuth0();
  const [client, setClient] = useState(null);
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
  const pongTimeoutRef = useRef(null);

  const sendRequest = useCallback(async (type, body) => {
    if (client) {
      try {
        await client.sendToGroup(
          GROUP_NAME,
          {
            type: type,
            body: body,
            connectionId: connectionId,
          },
          "json",
          { noEcho: true }
        );
        // console.log(`Sent request: ${type} with body: ${body}`);
      } catch (error) {
        console.error(`Failed to send request: ${type}`, error);
      }
    }
  }, [client, connectionId]);

  const handleIncomingMessage = useCallback((eventData) => {
    const message = eventData.message.data;
    const incomingConnectionId = eventData.message.data.destination;
    const storedConnectionId = sessionStorage.getItem("connectionId");
    if (incomingConnectionId !== "broadcast" && (incomingConnectionId !== storedConnectionId)) {
      // console.log("Ignoring message for another destination:", eventData.message.data);
      return;
    }
    switch (message.type) {
      case "log":
        setLogs((prev) => [...prev, message.body]);
        break;
      case "ping":
        setIsOnline(true);
        clearTimeout(pongTimeoutRef.current);
        break;
      case "gpio_state":
        setGpioStates(message.body);
        break;
      case "sequence_state":
        setSequenceState(message.body);
        break;
      case "sequence":
        setSequence(message.body);
        break;
      case "playing_time":
        setPlayingTime(message.body);
        break;
      default:
        console.warn("Unknown message type:", message);
    }
  }, [setLogs, setIsOnline, pongTimeoutRef, setGpioStates, setSequenceState, setSequence]);

  useEffect(() => {
    if (wssUrl) {
      const webSocketClient = startWebSocket(
        wssUrl,
        setConnectionId,
        // setIsConnected,
        setIsOnline,
        handleIncomingMessage,
        pongTimeoutRef,
        GROUP_NAME,
        startPingPong
      );
      setClient(webSocketClient);
    }
  // }, [wssUrl, setIsConnected, handleIncomingMessage]);
  }, [wssUrl, handleIncomingMessage]);
  // not working
  //this is a custom hook that will scroll to the bottom of the logs textarea
  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs]);

  useEffect(() => {
    if (isOnline && client) {
      const fetchStates = async () => {
        await sendRequest("request_gpio_state", "null"); // Request GPIO state
        await sendRequest("request_sequence_state", "null"); // Request sequence state
        await sendRequest("request_sequence", "main"); // Request sequence
      };

      fetchStates();
    }
  }, [isOnline, client, sendRequest]);
  
  const toggleOverlay = () => {
    setIsOverlayOpen((prev) => !prev);
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
              Logout {user?.name}
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
              client={client}
              GROUP_NAME={GROUP_NAME}
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
        <div className="overlay">
          <div className="overlay-content">
            <button className="close-button" onClick={toggleOverlay}>
              ✖
            </button>
            <div className="sequence-controls">
              <SequenceSwitches
                sequenceState={sequenceState || { random_actions: false, cycle_running: false, start_button_enabled: false }}
                client={client}
                GROUP_NAME={GROUP_NAME}
                connectionId={connectionId}
              />
            </div>
            <div className="commands">
              <button onClick={() => sendRequest("command", "so")}>Set off state</button>
              <button onClick={() => sendRequest("command", "sb")}>Set standby state</button>
              <button onClick={() => sendRequest("request_gpio_state", "null")}>Show Status</button>
              <button onClick={() => sendRequest("request_sequence", "main")}>Show Main Sequence</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
