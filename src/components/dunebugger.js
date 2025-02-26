import { useEffect, useState, useRef, useCallback } from "react";
import { WebPubSubClient } from "@azure/web-pubsub-client";
import { useAuth0 } from "@auth0/auth0-react";
import "./dunebugger.css"; // Import the CSS file

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
        await client.sendToGroup(GROUP_NAME, {
          type: "ping",
          source: "client",
          destination: "controller",
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

    switch (message.type) {
      case "log":
        setLogs((prev) => [...prev, message.body]);
        break;
      case "ping":
        if (message.body === "pong") {
          setIsOnline(true);
          clearTimeout(pongTimeoutRef.current);
        }
        break;
      case "state":
        setGpioStates(message.body);
        break;
      case "gpio_update":
        setGpioStates((prev) => ({ ...prev, [message.gpio]: message.value }));
        break;
      default:
        console.warn("Unknown message type:", message);
    }
  }, [client]);

  const handleShowStatus = async () => {
    if (client) {
      try {
        await client.sendToGroup(GROUP_NAME, {
          type: "command",
          body: "s",
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
      {/* <h3>Connection ID</h3>
      <p>{connectionId}</p> */}
      <h3>Commands</h3>
      <button onClick={() => client.sendToGroup(GROUP_NAME, { type: "command", body: "er" }, "json")}>Enable random actions</button>
      <button onClick={() => client.sendToGroup(GROUP_NAME, { type: "command", body: "dr" }, "json")}>Disable random acions</button>
      <button onClick={() => client.sendToGroup(GROUP_NAME, { type: "command", body: "c" }, "json")}>Cycle start</button>
      <button onClick={() => client.sendToGroup(GROUP_NAME, { type: "command", body: "cs" }, "json")}>Cycle stop</button>
      <button onClick={() => client.sendToGroup(GROUP_NAME, { type: "command", body: "so" }, "json")}>Set off state</button>
      <button onClick={() => client.sendToGroup(GROUP_NAME, { type: "command", body: "sb" }, "json")}>Set standby state</button>
      <button onClick={() => client.sendToGroup(GROUP_NAME, { type: "command", body: "h" }, "json")}>Help</button>
      <button onClick={handleShowStatus}>Show Status</button>
      <ul>
        {Object.entries(gpioStates).map(([gpio, value]) => (
          <li key={gpio}>{gpio}: {value}</li>
        ))}
      </ul>
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
