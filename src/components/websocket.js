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
    setSchedule,
    setNextActions,
    setLastExecutedAction,
    setPlayingTime,
    setSystemInfo,
    setModes,
    setNtpAvailable,
    heartBeatTimeoutRef,
    GROUP_NAME,
    HEARTBEAT_TIMEOUT,
    showMessageRef
  ) {
    this.wssUrl = wssUrl;
    this.setConnectionId = setConnectionId;
    this.setIsOnline = setIsOnline;
    this.setLogs = setLogs;
    this.setGpioStates = setGpioStates;
    this.setSequenceState = setSequenceState;
    this.setSequence = setSequence;
    this.setSchedule = setSchedule;
    this.setNextActions = setNextActions;
    this.setLastExecutedAction = setLastExecutedAction;
    this.setPlayingTime = setPlayingTime;
    this.setSystemInfo = setSystemInfo;
    this.setModes = setModes;
    this.setNtpAvailable = setNtpAvailable;
    this.heartBeatTimeoutRef = heartBeatTimeoutRef;
    this.GROUP_NAME = GROUP_NAME;
    this.HEARTBEAT_TIMEOUT = HEARTBEAT_TIMEOUT;
    this.showMessageRef = showMessageRef;
    this.isSwitchingDevice = false; // Track device switching state
    this.client = new WebPubSubClient(this.wssUrl, { autoRejoinGroups: false });
    this.startWebSocket();
  }

  startWebSocket() {
    this.client.on("connected", (event) => {
      console.log("Connected to WebSocket.");
      this.handleConnectionEstablished(event);
      this.sendRequest("controller.heartbeat", "I am here", event.connectionId);
      this.listenHeartBeat();
    });

    this.client.on("reconnected", (event) => {
      console.log("Reconnected to WebSocket.");
      this.handleConnectionEstablished(event);
      this.listenHeartBeat();
    });

    this.client.on("disconnected", () => {
      // Don't cleanup if we're in the middle of switching devices
      if (!this.isSwitchingDevice) {
        this.setIsOnline(false);
        this.setConnectionId(null);
        this.cleanup();
      }
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
        // Only log if it's not a "not connected" error
        if (!error.message || !error.message.includes("not connected")) {
          console.error(`Failed to send request: ${subject}`, error);
        }
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

  async switchDevice(newDeviceName) {
    if (this.GROUP_NAME === newDeviceName) {
      console.log(`Already connected to device: ${newDeviceName}`);
      return; // Already viewing this device
    }

    try {
      // Set flag to prevent cleanup during switch
      this.isSwitchingDevice = true;
      
      // Leave current device group
      console.log(`Switching from group ${this.GROUP_NAME} to ${newDeviceName}`);
      await this.client.leaveGroup(this.GROUP_NAME);

      // Update to new group name
      this.GROUP_NAME = newDeviceName;

      // Join new device group
      await this.client.joinGroup(this.GROUP_NAME);
      
      // Clear old device state
      this.clearDeviceState();
      
      // Restart heartbeat listener for new device
      this.listenHeartBeat();
      
      console.log(`Successfully switched to device: ${newDeviceName}`);
      
      // Wait a moment for the group connection to stabilize, then send requests
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Now send requests
      this.sendRequest("controller.heartbeat", "I am here");
      this.sendRequest("controller.get_system_info", null);
      this.sendRequest("controller.get_current_schedule", null);
      this.sendRequest("controller.get_modes_list", null);
      this.sendRequest("controller.get_gpio_state", null);
      this.sendRequest("controller.get_sequence_state", null);
      this.sendRequest("controller.get_sequence", null);
      this.sendRequest("controller.get_ntp_status", null);
      
      // Clear switching flag
      this.isSwitchingDevice = false;
      
    } catch (error) {
      this.isSwitchingDevice = false;
      console.error("Failed to switch device:", error);
      throw error;
    }
  }

  clearDeviceState() {
    console.log("Clearing device state");
    this.setGpioStates({});
    this.setSequenceState({
      random_actions: false,
      cycle_running: false,
      start_button_enabled: false,
    });
    this.setSequence([]);
    this.setSchedule(null);
    this.setNextActions([]);
    this.setLastExecutedAction(null);
    this.setPlayingTime(null);
    this.setSystemInfo(null);
    this.setModes([]);
    this.setNtpAvailable(null);
    this.setIsOnline(false);
    this.setLogs([]);
  }

  getCurrentDevice() {
    return this.GROUP_NAME;
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
        //console.log(`Countdown: ${countdown}`);
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
    console.log(`Received WebSocket message with subject: ${message.subject} from group: ${eventData["message"]["group"]} and connectionId: ${incomingConnectionId}`);
    switch (message.subject) {
      case "log":
        this.setLogs((prev) => [...prev, message.body]);
        
        // Show popup message if showMessage function is available and message has proper structure
        if (this.showMessageRef && this.showMessageRef.current && message.body && typeof message.body === 'object') {
          const { message: logMessage, level } = message.body;
          
          if (logMessage) {
            // Map log levels to popup types
            let popupType = 'info'; // default type
            if (level === 'warning') {
              popupType = 'warning';
            } else if (level === 'error') {
              popupType = 'error';
            } else if (level === 'info') {
              popupType = 'info';
            }
            
            this.showMessageRef.current(logMessage, popupType);
          }
        }
        break;

      case "heartbeat":
        console.log("Heartbeat received");
        this.setIsOnline(true);
        clearTimeout(this.heartBeatTimeoutRef.current);
        this.listenHeartBeat(); // Restart the countdown
        if (message.body === "Is anyone there?") {
          this.sendRequest("controller.heartbeat", "I am here");
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

      case "current_schedule":
        console.log("Received current_schedule message:", message.body);
        // Force React to detect changes by including a timestamp
        this.setSchedule({
          data: message.body,
          timestamp: Date.now()
        });
        break;

      case "next_actions":
        console.log("Received next_actions message:", message.body);
        this.setNextActions(message.body);
        break;

      case "last_executed_action":
        console.log("Received last_executed_action message:", message.body);
        this.setLastExecutedAction(message.body);
        break;

      case "playing_time":
        this.setPlayingTime(message.body);
        break;

      case "system_info":
        this.setSystemInfo(message.body);
        break;

      case "modes_list":
        console.log("Received modes_list message:", message.body);
        if (message.body && message.body.modes) {
          this.setModes(message.body.modes);
        }
        break;

      case "ntp_status":
        console.log("Received ntp_status message:", message.body);
        if (message.body && message.body.ntp_available !== undefined) {
          this.setNtpAvailable(message.body.ntp_available);
        }
        break;

      default:
        console.warn("Unknown message subject:", message);
    }
  }

  cleanup(skipLeaveGroup = false) {
    if (this.heartBeatTimeoutRef.current) {
      clearInterval(this.heartBeatTimeoutRef.current);
      this.heartBeatTimeoutRef.current = null;
    }
    
    if (this.client) {
      try {
        // Only leave group if not skipping (skip when called during device switch)
        if (!skipLeaveGroup) {
          console.log(`Leaving group: ${this.GROUP_NAME}`);
          this.client.leaveGroup(this.GROUP_NAME).catch(err => {
            // Ignore "not connected" errors as they're expected during cleanup
            if (!err.message || !err.message.includes("not connected")) {
              console.warn("Error leaving group during cleanup:", err);
            }
          });
        }
        
        this.client.stop();
      } catch (error) {
        console.error("Error stopping WebSocket client:", error);
      }
    }
  }

}

export default WebSocketManager;
