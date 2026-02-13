import React, { useState, useEffect } from "react";
import SequenceTimeline from "./SequenceTimeline";
import "./SequencePage.css";
import { useTranslatedText } from "../hooks/useTranslation";

const SequencePage = ({ 
  sequence, 
  playingTime, 
  wsClient, 
  connectionId,
  sequenceState,
  showMessage,
  groupName
}) => {
  const [sequenceText, setSequenceText] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [saveStatus, setSaveStatus] = useState("");
  const [lastSavedText, setLastSavedText] = useState("");
  const [lastPlayingTimeUpdate, setLastPlayingTimeUpdate] = useState(Date.now());
  const [cycleStatus, setCycleStatus] = useState("Cycle not running");

  // Translation hooks
  const { translatedText: sequenceTitle } = useTranslatedText("Sequence");
  const { translatedText: refreshText } = useTranslatedText("Refresh");
  const { translatedText: refreshMessageText } = useTranslatedText("Sequence data refresh request sent");
  const { translatedText: refreshTitleText } = useTranslatedText("Refresh sequence data");
  const { translatedText: editorTitleText } = useTranslatedText("Sequence Text Editor");
  const { translatedText: editText } = useTranslatedText("Edit");
  const { translatedText: saveText } = useTranslatedText("Save");
  const { translatedText: cancelText } = useTranslatedText("Cancel");
  const { translatedText: resetText } = useTranslatedText("Reset");
  const { translatedText: uploadingText } = useTranslatedText("Uploading...");
  const { translatedText: uploadSuccessText } = useTranslatedText("Sequence uploaded successfully!");
  const { translatedText: uploadMessageText } = useTranslatedText("Sequence upload command sent to DuneBugger device");
  const { translatedText: noConnectionText } = useTranslatedText("No WebSocket connection - sequence not uploaded");
  const { translatedText: reloadMessageText } = useTranslatedText("Sequence reload request sent");
  const { translatedText: reloadTitleText } = useTranslatedText("Reload sequence from device");
  const { translatedText: waitingPlaceholderText } = useTranslatedText("Waiting for sequence data from WebSocket...");
  const { translatedText: customContentText } = useTranslatedText("Custom Content");
  const { translatedText: webSocketEventsText } = useTranslatedText("WebSocket Events");
  const { translatedText: textLinesText } = useTranslatedText("Text Lines");
  const { translatedText: editableEventsText } = useTranslatedText("Editable Events");
  const { translatedText: linesText } = useTranslatedText("Lines");
  const { translatedText: charactersText } = useTranslatedText("Characters");
  const { translatedText: statusWaitingText } = useTranslatedText("Status: Waiting for data...");
  const { translatedText: tipText } = useTranslatedText("💡 Tip: Use # for comments. Format: time command action parameter");
  const { translatedText: shortcutText } = useTranslatedText("⌨️ Ctrl+S to save, Esc to cancel");
  const { translatedText: runningWarningText } = useTranslatedText("⚠️ Save disabled - sequence is currently running");
  const { translatedText: sequenceLoadedText } = useTranslatedText("✓ Sequence Loaded");
  const { translatedText: waitingWebSocketText } = useTranslatedText("⏳ Waiting for data from the device...");
  const { translatedText: sequenceRunningText } = useTranslatedText("▶️ Sequence Running");
  const { translatedText: startText } = useTranslatedText("Start");
  const { translatedText: stopText } = useTranslatedText("Stop");
  const { translatedText: physicalStartButtonText } = useTranslatedText("Physical Start Button Enabled");
  const { translatedText: randomActionsText } = useTranslatedText("Random Actions Enabled");
  const { translatedText: startMessageText } = useTranslatedText("Start command sent to DuneBugger device");
  const { translatedText: stopMessageText } = useTranslatedText("Stop command sent to DuneBugger device");
  const { translatedText: controlsText } = useTranslatedText("Sequence Controls");

  // Reset component state when device (groupName) changes
  useEffect(() => {
    setSequenceText("");
    setIsEditing(false);
    setSaveStatus("");
    setLastSavedText("");
    setLastPlayingTimeUpdate(Date.now());
    setCycleStatus("Cycle not running");
  }, [groupName]);

  // Calculate total sequence length
  const getTotalCycleLength = () => {
    if (!sequence || !sequence.sequence || sequence.sequence.length === 0) return 0;
    return Math.max(...sequence.sequence.map((ev) => parseFloat(ev.time)));
  };

  // Update cycle status based on playing time
  useEffect(() => {
    if (playingTime > 0 && playingTime !== undefined && playingTime !== null) {
      setLastPlayingTimeUpdate(Date.now());
      const cycleLength = getTotalCycleLength();
      const countdown = cycleLength - playingTime;
      setCycleStatus(`${countdown.toFixed(1)}s remaining`);
    }
  }, [playingTime, sequence]);

  // Check for timeout on playing time updates
  useEffect(() => {
    const interval = setInterval(() => {
      if (Date.now() - lastPlayingTimeUpdate > 15000) {
        setCycleStatus("Cycle not running");
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [lastPlayingTimeUpdate]);

  // Determine if sequence is currently running
  const isSequenceRunning = sequenceState?.cycle_running || (playingTime > 0 && playingTime !== undefined && playingTime !== null);
  const isCycleRunning = !cycleStatus.includes("Cycle not running");

  // Handler for Start button
  const handleStart = () => {
    if (wsClient && connectionId) {
      wsClient.sendRequest("core.dunebugger_set", "sequence play main.seq", connectionId);
      if (showMessage) {
        showMessage(startMessageText, "info");
      }
    }
  };
  
  // Handler for Stop button
  const handleStop = () => {
    if (wsClient && connectionId) {
      wsClient.sendRequest("core.dunebugger_set", "sequence stop", connectionId);
      if (showMessage) {
        showMessage(stopMessageText, "info");
      }
    }
  };

  // Convert sequence object to readable text format
  const sequenceToText = (seq) => {
    if (!seq || !seq.sequence || seq.sequence.length === 0) {
      return `# No sequence data loaded yet
# Waiting for sequence data from WebSocket...
# 
# Format: time command action parameter
# 
# Examples:
# 0.0   switch relay1     on
# 5.0   audio  playmusic  background.mp3
# 10.0  switch relay1     off
# 15.0  audio  playsfx    explosion.wav
# 20.0  audio  fadeout    
# 
# Commands available:
# - switch: Control relays/switches (actions: relay1, relay2, etc.)
# - audio:  Control audio playback (actions: playmusic, playsfx, fadeout)
# 
# Parameters:
# - switch: "on" or "off"
# - playmusic/playsfx: filename
# - fadeout: (empty parameter)
`;
    }

    // Calculate total sequence time for the header
    const totalTime = Math.max(...seq.sequence.map((ev) => parseFloat(ev.time)));
    const eventCount = seq.sequence.length;

    let text = `# Loaded Sequence Data (${eventCount} events, ${totalTime}s total)\n`;
    text += "# Format: time command action parameter\n";
    text += "# Lines starting with # are comments\n\n";

    // Sort events by time
    const sortedEvents = [...seq.sequence].sort((a, b) => parseFloat(a.time) - parseFloat(b.time));

    // Find the maximum widths for alignment
    const maxTimeWidth = Math.max(4, ...sortedEvents.map(e => e.time.toString().length));
    const maxCommandWidth = Math.max(7, ...sortedEvents.map(e => e.command.length));
    const maxActionWidth = Math.max(6, ...sortedEvents.map(e => e.action.length));

    sortedEvents.forEach(event => {
      const time = event.time.toString().padEnd(maxTimeWidth);
      const command = event.command.padEnd(maxCommandWidth);
      const action = event.action.padEnd(maxActionWidth);
      const parameter = event.parameter || "";
      
      text += `${time} ${command} ${action} ${parameter}\n`;
    });

    return text;
  };



  // Update text when sequence changes (only if no custom content has been saved)
  useEffect(() => {
    if (!isEditing && !lastSavedText) {
      setSequenceText(sequenceToText(sequence));
    }
  }, [sequence, isEditing, lastSavedText]);

  // Initialize text on first load (only if no saved content exists)
  useEffect(() => {
    if (sequence && sequence.sequence && sequence.sequence.length > 0 && !sequenceText && !lastSavedText) {
      console.log("SequencePage: Loading sequence data from WebSocket:", sequence);
      setSequenceText(sequenceToText(sequence));
    }
  }, [sequence, sequenceText, lastSavedText]);

  // Handle sequence running state changes for save status
  useEffect(() => {
    if (isSequenceRunning && isEditing) {
      // If sequence plays while editing, just show warning but keep editing
      setSaveStatus("Save disabled - sequence is running. You can save when it stops.");
    } else if (!isSequenceRunning && isEditing && saveStatus.includes("Save disabled")) {
      // If sequence stops while editing, clear the warning
      setSaveStatus("Sequence stopped - you can now save your changes.");
      setTimeout(() => setSaveStatus(""), 3000);
    }
  }, [isSequenceRunning, isEditing, saveStatus]);

  const handleTextChange = (e) => {
    setSequenceText(e.target.value);
  };

  const handleSave = () => {
    setSaveStatus(uploadingText);
    
    if (wsClient) {
      // Escape the text content with \n for newlines
      const escapedText = sequenceText.replace(/\n/g, '\\n');
      
      // Send the text content using the "us" command (no validation, send as-is)
      wsClient.sendRequest("core.dunebugger_set", `sequence upload main.seq ${escapedText}`, connectionId);
      
      // Show popup message
      if (showMessage) {
        showMessage(uploadMessageText, "info");
      }
      
      setSaveStatus(uploadSuccessText);
    } else {
      setSaveStatus(noConnectionText);
    }
    
    console.log("Sent text content:", sequenceText);
    
    // Save the current text as the last saved version
    setLastSavedText(sequenceText);
    setIsEditing(false);
    
    // Clear status after 3 seconds
    setTimeout(() => setSaveStatus(""), 3000);
  };

  const handleCancel = () => {
    // Revert to last saved text, or original sequence if no saves have been made
    const textToRevert = lastSavedText || sequenceToText(sequence);
    setSequenceText(textToRevert);
    setIsEditing(false);
    setSaveStatus("");
  };

  const handleKeyDown = (e) => {
    if (isEditing && e.ctrlKey && e.key === 's') {
      e.preventDefault();
      handleSave();
    }
    if (isEditing && e.key === 'Escape') {
      handleCancel();
    }
  };

  const handleRefresh = async (showPopup = true) => {
    if (wsClient && connectionId) {
      try {
        await wsClient.sendRequest("core.refresh_sequence", "null");
        if (showMessage && showPopup) {
          showMessage(refreshMessageText, "info");
        }
      } catch (error) {
        console.error("Failed to send sequence refresh request:", error);
      }
    }
  };

  // Auto-refresh when component mounts and when connectionId changes (device switch)
  React.useEffect(() => {
    handleRefresh(false);
  }, [connectionId]);

  return (
    <div className="sequence-page">
      <div className="sequence-header">
        <div className="sequence-header-top">
          <h2>{sequenceTitle}</h2>
          <button 
            className="refresh-button" 
            onClick={handleRefresh}
            disabled={!wsClient || !connectionId}
            title={refreshTitleText}
          >
            <span className="refresh-icon">🔄</span>
            {refreshText}
          </button>
        </div>
      </div>

      {/* Sequence Controls Box */}
      <div className="sequence-controls-box">
        <h3>{controlsText}</h3>
        <div className="controls-content">
          <div className="start-stop-buttons">
            <button 
              className="start-button" 
              onClick={handleStart} 
              disabled={!wsClient || !connectionId || isCycleRunning}
            >
              {startText}
            </button>
            <button 
              className="stop-button" 
              onClick={handleStop} 
              disabled={!wsClient || !connectionId || !isCycleRunning}
            >
              {stopText}
            </button>
          </div>
          <div className="sequence-switches">
            <div className="switch-container">
              <label>{physicalStartButtonText}</label>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={sequenceState?.start_button_enabled || false}
                  onChange={() => {
                    if (wsClient && connectionId) {
                      wsClient.sendRequest(
                        "core.dunebugger_set",
                        sequenceState?.start_button_enabled ? "start_button disable" : "start_button enable",
                        connectionId
                      );
                    }
                  }}
                  disabled={!wsClient || !connectionId}
                />
                <span className="slider"></span>
              </label>
            </div>
            <div className="switch-container">
              <label>{randomActionsText}</label>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={sequenceState?.random_actions || false}
                  onChange={() => {
                    if (wsClient && connectionId) {
                      wsClient.sendRequest(
                        "core.dunebugger_set",
                        sequenceState?.random_actions ? "random_actions disable" : "random_actions enable",
                        connectionId
                      );
                    }
                  }}
                  disabled={!wsClient || !connectionId}
                />
                <span className="slider"></span>
              </label>
            </div>
          </div>
        </div>
      </div>
      
      <div className="timeline-section">
        <SequenceTimeline sequence={sequence || []} playingTime={playingTime || 0} />
      </div>

      <div className="sequence-text-section">
        <div className="text-editor-header">
          <div className="header-left">
            <h3>{editorTitleText}</h3>
            {sequence && sequence.sequence && sequence.sequence.length > 0 ? (
              isSequenceRunning ? (
                <span className="data-status running">{sequenceRunningText}</span>
              ) : (
                <span className="data-status loaded">{sequenceLoadedText}</span>
              )
            ) : (
              <span className="data-status waiting">{waitingWebSocketText}</span>
            )}
          </div>
          <div className="editor-controls">
            {!isEditing ? (
              <>
                <button 
                  className="edit-button"
                  onClick={() => setIsEditing(true)}
                  disabled={!sequence || !sequence.sequence || sequence.sequence.length === 0 || isSequenceRunning}
                >
                  {editText}
                </button>
                <button 
                  className="revert-button"
                  onClick={() => {
                    if (wsClient && connectionId) {
                      wsClient.sendRequest("core.get_sequence", "main");
                      setSaveStatus(reloadMessageText);
                      setTimeout(() => setSaveStatus(""), 3000);
                      if (showMessage) {
                        showMessage(reloadMessageText, "info");
                      }
                    }
                    setLastSavedText("");
                  }}
                  disabled={!wsClient || !connectionId}
                  title={reloadTitleText}
                >
                  {resetText}
                </button>
              </>
            ) : (
              <>
                <button 
                  className="save-button"
                  onClick={handleSave}
                  disabled={!sequenceText.trim() || isSequenceRunning}
                >
                  {saveText}
                </button>
                <button 
                  className="cancel-button"
                  onClick={handleCancel}
                >
                  {cancelText}
                </button>
              </>
            )}
          </div>
        </div>
        
        {saveStatus && (
          <div className={`save-status ${saveStatus.startsWith('Error') ? 'error' : 'success'}`}>
            {saveStatus}
          </div>
        )}
        
        <textarea
          className={`sequence-text-editor ${isEditing ? 'editing' : 'readonly'}`}
          value={sequenceText}
          onChange={handleTextChange}
          onKeyDown={handleKeyDown}
          readOnly={!isEditing}
          placeholder={waitingPlaceholderText}
          rows={15}
        />
        
        <div className="editor-footer">
          <div className="text-stats">
            {sequence && sequence.sequence && sequence.sequence.length > 0 ? (
              <>
                {lastSavedText ? `${customContentText} | ` : `${webSocketEventsText}: ${sequence.sequence.length} | `}
                {textLinesText}: {sequenceText.split('\n').length} | 
                {editableEventsText}: {sequenceText.split('\n').filter(line => line.trim() && !line.trim().startsWith('#')).length}
              </>
            ) : (
              <>
                {linesText}: {sequenceText.split('\n').length} | 
                {charactersText}: {sequenceText.length} | 
                {statusWaitingText}
              </>
            )}
          </div>
          {isEditing && (
            <div className="editor-help">
              <small>
                {tipText}<br/>
                {shortcutText}
                {isSequenceRunning && <><br/>{runningWarningText}</>}
              </small>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SequencePage;