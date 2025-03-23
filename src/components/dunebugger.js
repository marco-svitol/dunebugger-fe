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
  const [isOnline, setIsOnline] = useState(false);
  const [gpioStates, setGpioStates] = useState({});
  const [sequenceState, setSequenceState] = useState({
    random_actions: false,
    cycle_running: false,
    start_button_enabled: false,
  });
  const [sequence, setSequence] = useState([]);
  const [logs, setLogs] = useState([]);
  const [connectionId, setConnectionId] = useState(null);
  // const [isConnected, setIsConnected] = useState(false);
  const [logsVisible, setLogsVisible] = useState(false);
  const [wssUrl, setWssUrl] = useState(null);
  const [isFooterExpanded, setIsFooterExpanded] = useState(false);
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

  const toggleFooter = () => {
    setIsFooterExpanded((prev) => !prev);
  };

  return (
    <div className="smart-dunebugger">
      {/* Header Bar */}
      <header className={`header-bar ${isOnline ? "connected" : "disconnected"}`}>
        <h1>Smart Dunebugger</h1>
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
      </header>

      {/* Main Content */}
      <div className="content">
        <div className="right-section">
          <h3>Sequence Timeline</h3>
          <SequenceTimeline sequence={sequence || []} />
          <h3>GPIO States</h3>
          <GpioTable
            gpioStates={gpioStates || []}
            client={client}
            GROUP_NAME={GROUP_NAME}
            connectionId={connectionId}
          />
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

      {/* Footer */}
      <footer className={`bottom-bar ${isFooterExpanded ? "expanded" : "collapsed"}`}>
        <div className="footer-toggle" onClick={toggleFooter}></div>
        {isFooterExpanded && (
          <>
            <div className="sequence-controls">
              <h3>Sequence Controls</h3>
              <SequenceSwitches
                sequenceState={sequenceState || { random_actions: false, cycle_running: false, start_button_enabled: false }}
                client={client}
                GROUP_NAME={GROUP_NAME}
                connectionId={connectionId}
              />
            </div>
            <div className="commands">
              <h3>Commands</h3>
              <button onClick={() => sendRequest("command", "so")}>Set off state</button>
              <button onClick={() => sendRequest("command", "sb")}>Set standby state</button>
              <button onClick={() => sendRequest("request_gpio_state", "null")}>Show Status</button>
              <button onClick={() => sendRequest("request_sequence", "main")}>Show Main Sequence</button>
            </div>
          </>
        )}
      </footer>
    </div>
  );
}
