import { useEffect, useState, useRef, useCallback } from "react";
import { WebPubSubClient } from "@azure/web-pubsub-client";
import { useAuth0 } from "@auth0/auth0-react";
import "./dunebugger.css"; // Import the CSS file
import GpioTable from "./GpioTable";

const GROUP_NAME = "velasquez";
const PING_INTERVAL = 15000; // 5 seconds
const PONG_TIMEOUT = 30000; // 10 seconds

const Profile = ({ setWssUrl }) => {
  const { user, isAuthenticated, isLoading } = useAuth0();

  useEffect(() => {
    if (isAuthenticated && user.wss_url) {
      setWssUrl(user.wss_url);
    }
  }, [isAuthenticated, user, setWssUrl]);

  if (isLoading) {
    return <div>Loading ...</div>;
  }

  return (
    isAuthenticated && (
      <div>
        {/* <img src={user.picture} alt={user.name} /> */}
        <p>{user.name}</p>
        {/* <p>{user.nickname}</p> */}
        {/* <p>{user.email}</p> */}
      </div>
    )
  );
};

export default function SmartDunebugger() {
  const { loginWithRedirect, logout, isAuthenticated } = useAuth0();
  const [client, setClient] = useState(null);
  const [isOnline, setIsOnline] = useState(false);
  const [gpioStates, setGpioStates] = useState({});
  const [logs, setLogs] = useState([]);
  const [connectionId, setConnectionId] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [logsVisible, setLogsVisible] = useState(true);
  const [wssUrl, setWssUrl] = useState(null);
  const logsEndRef = useRef(null);
  const pongTimeoutRef = useRef(null);

  useEffect(() => {
    if (wssUrl) {
      startWebSocket(wssUrl);
    }
  }, [wssUrl]);

  // not working
  //this is a custom hook that will scroll to the bottom of the logs textarea
  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs]);

  const startWebSocket = (wssUrl) => {
    const webPubSubClient = new WebPubSubClient(wssUrl, { autoRejoinGroups: true });

    webPubSubClient.on("connected", (event) => {
      console.log("Connected to Web PubSub with ID:", event.connectionId);
      setConnectionId(event.connectionId);
      sessionStorage.setItem("connectionId", event.connectionId);
      setIsConnected(true);
      joinGroup(webPubSubClient);
      startPingPong(webPubSubClient);
    });

    webPubSubClient.on("disconnected", (event) => {
      console.log("WebSocket disconnected:", event);
      setIsConnected(false);
      setIsOnline(false);
      setConnectionId(null);
      clearTimeout(pongTimeoutRef.current);
    });

    webPubSubClient.on("group-message", (message) => {
      console.log("Received message:", message);
      handleIncomingMessage(message);
    });

    webPubSubClient.start();
    setClient(webPubSubClient);

    return () => {
      webPubSubClient.stop();
      clearTimeout(pongTimeoutRef.current);
    };
  };

  const joinGroup = async (client) => {
    try {
      await client.joinGroup(GROUP_NAME);
      console.log(`Joined group: ${GROUP_NAME}`);
    } catch (error) {
      console.error("Failed to join group:", error);
    }
  };

  const startPingPong = (client) => {
    const sendPing = async () => {
      try {
        const storedConnectionId = sessionStorage.getItem("connectionId");
        await client.sendToGroup(GROUP_NAME, {
          type: "ping",
          source: "client",
          destination: "controller",
          connectionId: storedConnectionId,
        }, "json", { noEcho: true });
        //console.log("Sending alive ping");

        pongTimeoutRef.current = setTimeout(() => {
          setIsOnline(false);
          //console.log("Pong response not received, marking as offline");
        }, PONG_TIMEOUT);
      } catch (error) {
        console.error("Failed to send alive ping:", error);
      }
    };

    sendPing();
    const pingInterval = setInterval(sendPing, PING_INTERVAL);

    return () => clearInterval(pingInterval);
  };

  const handleIncomingMessage = useCallback((eventData) => {
    const message = eventData.message.data;
    const incomingConnectionId = eventData.message.data.destination;
    const storedConnectionId = sessionStorage.getItem("connectionId");
    if (incomingConnectionId && (incomingConnectionId !== storedConnectionId)) {
      console.log("Ignoring message from another connection:", eventData.message.data);
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
      case "state":
        setGpioStates(message.body);
        break;
      case "gpio_update":
        setGpioStates((prev) => ({ ...prev, [message.gpio]: message.state }));
        break;
      default:
        console.warn("Unknown message type:", message);
    }
  }, [client, connectionId]);

  const handleShowStatus = async () => {
    if (client) {
      try {
        await client.sendToGroup(GROUP_NAME, {
          type: "request_initial_state",
          body: "null",
          connectionId: client._connectionId, // Include connectionId
        }, "json", { noEcho: true });
        console.log("Sent show status command");
      } catch (error) {
        console.error("Failed to send show status command:", error);
      }
    }
  };

  const handleLogin = async () => {
    await loginWithRedirect();
  };

  const handleLogout = () => {
    localStorage.removeItem("wss_url");
    const encodedReturnTo = encodeURIComponent(`${window.location.origin}`);
    const logoutUrl = `https://dunebugger.eu.auth0.com/v2/logout?client_id=${process.env.REACT_APP_AUTH0_CLIENT_ID}&returnTo=${encodedReturnTo}`;
    logout({ returnTo: window.location.origin, client_id: process.env.REACT_APP_AUTH0_CLIENT_ID });
  };

  return (
    <div>
      <h2 className={isConnected ? "connected" : "disconnected"}>Smart Dunebugger</h2>
      <p>Device Status: 
        <span className={`status-circle ${isOnline ? "online" : "offline"}`}></span>
        {isOnline ? "Online" : "Offline"}
      </p>
      {!isAuthenticated ? (
        <button onClick={handleLogin}>Login</button>
      ) : (
        <button onClick={handleLogout}>Logout</button>
      )}
      <Profile setWssUrl={setWssUrl} />
      <h3>GPIO States</h3>
      <GpioTable 
        gpioStates={gpioStates || []} 
        client={client}
        GROUP_NAME={GROUP_NAME}
        connectionId={connectionId}
      />
      <h3>Commands</h3>
      <button onClick={() => client.sendToGroup(GROUP_NAME, { type: "command", body: "er", connectionId: connectionId }, "json")}>Enable random actions</button>
      <button onClick={() => client.sendToGroup(GROUP_NAME, { type: "command", body: "dr", connectionId: connectionId }, "json")}>Disable random acions</button>
      <button onClick={() => client.sendToGroup(GROUP_NAME, { type: "command", body: "c", connectionId: connectionId }, "json")}>Cycle start</button>
      <button onClick={() => client.sendToGroup(GROUP_NAME, { type: "command", body: "cs", connectionId: connectionId }, "json")}>Cycle stop</button>
      <button onClick={() => client.sendToGroup(GROUP_NAME, { type: "command", body: "so", connectionId: connectionId }, "json")}>Set off state</button>
      <button onClick={() => client.sendToGroup(GROUP_NAME, { type: "command", body: "sb", connectionId: connectionId }, "json")}>Set standby state</button>
      <button onClick={() => client.sendToGroup(GROUP_NAME, { type: "command", body: "h", connectionId: connectionId }, "json")}>Help</button>
      <button onClick={handleShowStatus}>Show Status</button>
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
  );
}
