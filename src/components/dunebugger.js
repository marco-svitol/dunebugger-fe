import { useEffect, useState } from "react";

const WEBSOCKET_URL = process.env.REACT_APP_WSS_URL;
const DEVICE_ID = "raspberry123";
const GROUP_NAME = "velasquez";

export default function RaspberryMonitor() {
  const [ws, setWs] = useState(null);
  const [isOnline, setIsOnline] = useState(false);
  const [gpioStates, setGpioStates] = useState({});
  const [logs, setLogs] = useState([]);
  const [connectionId, setConnectionId] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const reconnectInterval = 5000;  // 5 seconds retry interval
    const maxRetries = 5;
    let retryCount = 0;

    console.log("WebSocket supported:", "WebSocket" in window);

    if (!WEBSOCKET_URL) {
      console.error("WebSocket URL is not defined in environment variables");
      return;
    }

    const connectWebSocket = () => {
      console.log("Connecting to WebSocket:", WEBSOCKET_URL);
      const socket = new WebSocket(WEBSOCKET_URL, 'json.webpubsub.azure.v1');
    
      socket.onerror = (error) => {
        console.error("WebSocket error:", error);
      };

      socket.onopen = () => {
        console.log("Connected to WebSocket");
        setWs(socket);
        setIsConnected(true);
        joinGroup(socket);
        retryCount = 0;  // Reset retry count after successful connection
      };

      socket.onmessage = (event) => {
        const message = JSON.parse(event.data);
        console.log("Received message:", message);
      
        switch (message.type) {
          case "connection_id":
            setConnectionId(message.id);
            break;
          case "device_online":
            if (message.device_id === DEVICE_ID) {
              setIsOnline(true);
              requestInitialState(socket);
            }
            break;
          case "initial_state":
            setGpioStates(message.gpio_states);
            setLogs(message.logs);
            break;
          case "gpio_update":
            setGpioStates((prev) => ({ ...prev, [message.gpio]: message.value }));
            break;
          case "message":
            setLogs((prev) => [message.data, ...prev]);
            break;
          default:
            console.warn("Unknown message type:", message);
        }
      };

      socket.onclose = (event) => {
        console.log("WebSocket disconnected", event.code, event.reason);
        setIsConnected(false);
        setIsOnline(false);
        setConnectionId(null);

        if (retryCount < maxRetries) {
          console.log(`Retrying connection in ${reconnectInterval / 1000} seconds...`);
          setTimeout(() => {
            retryCount++;
            connectWebSocket();
          }, reconnectInterval);
        } else {
          console.error("Max retries reached. Could not reconnect.");
        }
      };
    };

    connectWebSocket();
    return () => {
      // Cleanup on unmount
      if (ws) {
        ws.close();
      }
    };

  }, []);

  const joinGroup = (socket) => {
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: "joinGroup", group: GROUP_NAME }));
      console.log(`Joined group: ${GROUP_NAME}`);
    }
  };

  const requestInitialState = (socket) => {
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: "request_initial_state", device_id: DEVICE_ID }));
    }
  };

  return (
    <div>
      <h2>Raspberry Monitor</h2>
      <p>WebSocket Status: {isConnected ? "Connected" : "Disconnected"}</p>
      <p>Connection ID: {connectionId || "N/A"}</p>
      <p>Device Status: {isOnline ? "Online" : "Offline"}</p>
      <h3>GPIO States</h3>
      <ul>
        {Object.entries(gpioStates).map(([gpio, value]) => (
          <li key={gpio}>{gpio}: {value}</li>
        ))}
      </ul>
      <h3>Logs</h3>
      <ul>
        {logs.map((log, index) => (
          <li key={index}>{log}</li>
        ))}
      </ul>
    </div>
  );
}
