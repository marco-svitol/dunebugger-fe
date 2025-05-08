import { WebPubSubClient } from "@azure/web-pubsub-client";

class WebSocketManager {
  constructor(
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
  ) {
    this.wssUrl = wssUrl;
    this.setConnectionId = setConnectionId;
    this.setIsOnline = setIsOnline;
    this.setLogs = setLogs;
    this.setGpioStates = setGpioStates;
    this.setSequenceState = setSequenceState;
    this.setSequence = setSequence;
    this.setPlayingTime = setPlayingTime;
    this.heartBeatTimeoutRef = heartBeatTimeoutRef;
    this.GROUP_NAME = GROUP_NAME;
    this.HEARTBEAT_TIMEOUT = HEARTBEAT_TIMEOUT;
    this.client = new WebPubSubClient(this.wssUrl, { autoRejoinGroups: true });
    this.startWebSocket();
  }

  startWebSocket() {
    this.client.on("connected", (event) => {
      console.log("Connected to WebSocket.");
      this.handleConnectionEstablished(event);
      this.sendRequest("heartbeat", "I am here", event.connectionId);
      this.listenHeartBeat();
    });

    this.client.on("reconnected", (event) => {
      console.log("Reconnected to WebSocket.");
      this.handleConnectionEstablished(event);
      this.listenHeartBeat();
    });

    this.client.on("disconnected", () => {
      this.setIsOnline(false);
      this.setConnectionId(null);
      this.cleanup();
    });

    this.client.on("group-message", (message) => {
      this.handleIncomingMessage(message);
    });

    this.client.on("error", (error) => {
      console.error("WebSocket error:", error);
    });

    this.client.start();
  }

  handleConnectionEstablished(event) {
    this.setConnectionId(event.connectionId);
    sessionStorage.setItem("connectionId", event.connectionId);
    this.joinGroup();
  }

  async sendRequest(subject, body, connectionId = null) {
    if (this.client) {
      try {
        await this.client.sendToGroup(
          this.GROUP_NAME,
          {
            subject: subject,
            body: body,
            connectionId: connectionId || sessionStorage.getItem("connectionId"),
          },
          "json",
          { noEcho: true }
        );
      } catch (error) {
        console.error(`Failed to send request: ${subject}`, error);
      }
    }
  }

  async joinGroup() {
    try {
      await this.client.joinGroup(this.GROUP_NAME);
    } catch (error) {
      console.error("Failed to join group:", error);
    }
  }

  listenHeartBeat() {

    // Clear any existing interval to avoid multiple intervals running
    if (this.heartBeatTimeoutRef.current) {
      clearInterval(this.heartBeatTimeoutRef.current);
    }

    // Initialize countdown
    let countdown = this.HEARTBEAT_TIMEOUT / 1000;

    // Set up a recurring interval to check the heartbeat
    this.heartBeatTimeoutRef.current = setInterval(() => {
      if (countdown <= 0) {
        console.log("Heartbeat timeout");
        this.setIsOnline(false); // Set online status to false if no heartbeat is received
        clearInterval(this.heartBeatTimeoutRef.current);
      } else {
        console.log(`Countdown: ${countdown}`);
        countdown -= 1;
      }
    }, 1000);
  }

  handleIncomingMessage(eventData) {
    const message = eventData.message.data;
    const incomingConnectionId = eventData.message.data.destination;
    const storedConnectionId = sessionStorage.getItem("connectionId");

    // Ignore messages not meant for this connection
    if (incomingConnectionId !== "broadcast" && incomingConnectionId !== storedConnectionId) {
      return;
    }

    // Handle different message subjects
    switch (message.subject) {
      case "log":
        this.setLogs((prev) => [...prev, message.body]);
        break;

      case "heartbeat":
        console.log("Heartbeat received");
        this.setIsOnline(true);
        clearTimeout(this.heartBeatTimeoutRef.current);
        this.listenHeartBeat(); // Restart the countdown
        if (message.body === "Is anyone there?") {
          this.sendRequest("heartbeat", "I am here");
        }
        break;

      case "gpio_state":
        this.setGpioStates(message.body);
        break;

      case "sequence_state":
        this.setSequenceState(message.body);
        break;

      case "sequence":
        this.setSequence(message.body);
        break;

      case "playing_time":
        this.setPlayingTime(message.body);
        break;

      default:
        console.warn("Unknown message subject:", message);
    }
  }

  cleanup() {
    if (this.heartBeatTimeoutRef.current) {
      clearInterval(this.heartBeatTimeoutRef.current);
      this.heartBeatTimeoutRef.current = null;
    }
  }

}

export default WebSocketManager;
