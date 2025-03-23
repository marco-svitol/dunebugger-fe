export const startPingPong = (client, GROUP_NAME, setIsOnline, pongTimeoutRef) => {
  const PING_INTERVAL = 15000; // 15 seconds
  const PONG_TIMEOUT = 30000; // 30 seconds

  const sendPing = async () => {
    try {
      const storedConnectionId = sessionStorage.getItem("connectionId");
      await client.sendToGroup(
        GROUP_NAME,
        {
          type: "ping",
          source: "client",
          destination: "controller",
          connectionId: storedConnectionId,
        },
        "json",
        { noEcho: true }
      );

      pongTimeoutRef.current = setTimeout(() => {
        setIsOnline(false);
      }, PONG_TIMEOUT);
    } catch (error) {
      console.error("Failed to send alive ping:", error);
    }
  };

  sendPing();
  const pingInterval = setInterval(sendPing, PING_INTERVAL);

  return () => clearInterval(pingInterval);
};