import { useEffect, useState, useRef, useCallback } from "react";
import { WebPubSubClient } from "@azure/web-pubsub-client";
import "./dunebugger.css"; // Import the CSS file

const WEBSOCKET_URL = process.env.REACT_APP_WSS_URL;
const DEVICE_ID = "raspberry123";
const GROUP_NAME = "velasquez";

export default function RaspberryMonitor() {
  const [client, setClient] = useState(null);
  const [isOnline, setIsOnline] = useState(false);
  const [gpioStates, setGpioStates] = useState({});
  const [logs, setLogs] = useState([]);
  const [connectionId, setConnectionId] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [logsVisible, setLogsVisible] = useState(true);
  const logsEndRef = useRef(null);

  useEffect(() => {
    if (!WEBSOCKET_URL) {
      console.error("WebSocket URL is not defined in environment variables");
      return;
    }

    const webPubSubClient = new WebPubSubClient(WEBSOCKET_URL,  { autoRejoinGroups: true });

    webPubSubClient.on("connected", (event) => {
      console.log("Connected to Web PubSub with ID:", event.connectionId);
      setConnectionId(event.connectionId);
      setIsConnected(true);
      joinGroup(webPubSubClient);
      ping(webPubSubClient);
    });

    webPubSubClient.on("disconnected", (event) => {
      console.log("WebSocket disconnected:", event);
      setIsConnected(false);
      setIsOnline(false);
      setConnectionId(null);
      handleDisconnection(event);
    });

    webPubSubClient.on("group-message", (message) => {
      console.log("Received message:", message);
      handleIncomingMessage(message);
    });

    webPubSubClient.start();
    setClient(webPubSubClient);

    return () => {
      webPubSubClient.stop();
    };
  }, []);

  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs]);

  const joinGroup = async (client) => {
    try {
      await client.joinGroup(GROUP_NAME);
      console.log(`Joined group: ${GROUP_NAME}`);
    } catch (error) {
      console.error("Failed to join group:", error);
    }
  };

  const ping = async (client) => {
    try {
      await client.sendToGroup(GROUP_NAME, {
        type: "ping",
        source: "client",
        destination: "controller",
      },  "json", { noEcho: true });
      console.log("Sending alive ping");
    } catch (error) {
      console.error("Failed to send alive ping:", error);
    }
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
  }, [client]);  // Ensure dependencies are correctly managed

  const handleDisconnection = (event) => {
    console.log("Client disconnected:", event);
    // Add any additional logic you want to handle on disconnection
  };
  
  return (
    <div>
      <h2>Raspberry Monitor</h2>
      <p>WebSocket Status: {isConnected ? "Connected" : "Disconnected"}</p>
      <p>Connection ID: {connectionId || "N/A"}</p>
      <p>Device Status: 
        <span className={`status-circle ${isOnline ? "online" : "offline"}`}></span>
        {isOnline ? "Online" : "Offline"}
      </p>
      <h3>GPIO States</h3>
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
