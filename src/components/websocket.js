import { WebPubSubClient } from "@azure/web-pubsub-client";

export const startWebSocket = (wssUrl, setConnectionId, setIsConnected, setIsOnline, handleIncomingMessage, pongTimeoutRef, GROUP_NAME, startPingPong) => {
  const webPubSubClient = new WebPubSubClient(wssUrl, { autoRejoinGroups: true });

  webPubSubClient.on("connected", (event) => {
    console.log("Connected to Web PubSub with ID:", event.connectionId);
    setConnectionId(event.connectionId);
    sessionStorage.setItem("connectionId", event.connectionId);
    setIsConnected(true);
    joinGroup(webPubSubClient, GROUP_NAME);
    startPingPong(webPubSubClient, GROUP_NAME, setIsOnline, pongTimeoutRef);
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

  return webPubSubClient;
};

export const joinGroup = async (client, GROUP_NAME) => {
  try {
    await client.joinGroup(GROUP_NAME);
    console.log(`Joined group: ${GROUP_NAME}`);
  } catch (error) {
    console.error("Failed to join group:", error);
  }
};