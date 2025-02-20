import { useEffect, useState, useRef, useCallback } from "react";
import { WebPubSubClient } from "@azure/web-pubsub-client";
import "./dunebugger.css"; // Import the CSS file

const WEBSOCKET_URL = process.env.REACT_APP_WSS_URL;
const GROUP_NAME = "velasquez";
const PING_INTERVAL = 5000; // 5 seconds
const PONG_TIMEOUT = 10000; // 10 seconds

export default function SmartDunebugger() {
  const [client, setClient] = useState(null);
  const [isOnline, setIsOnline] = useState(false);
  const [gpioStates, setGpioStates] = useState({});
  const [logs, setLogs] = useState([]);
  const [connectionId, setConnectionId] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [logsVisible, setLogsVisible] = useState(true);
  const logsEndRef = useRef(null);
  const pongTimeoutRef = useRef(null);

  useEffect(() => {
    if (!WEBSOCKET_URL) {
      console.error("WebSocket URL is not defined in environment variables");
      return;
    }

    const webPubSubClient = new WebPubSubClient(WEBSOCKET_URL, { autoRejoinGroups: true });

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

  const startPingPong = (client) => {
    const sendPing = async () => {
      try {
        await client.sendToGroup(GROUP_NAME, {
          type: "ping",
          source: "client",
          destination: "controller",
        }, "json", { noEcho: true });
        console.log("Sending alive ping");

        pongTimeoutRef.current = setTimeout(() => {
          setIsOnline(false);
          console.log("Pong response not received, marking as offline");
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

  return (
    <div>
      <h2 className={isConnected ? "connected" : "disconnected"}>Smart Dunebugger</h2>
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