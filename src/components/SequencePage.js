import React, { useState, useEffect } from "react";
import SequenceTimeline from "./SequenceTimeline";
import "./SequencePage.css";

const SequencePage = ({ 
  sequence, 
  playingTime, 
  wsClient, 
  connectionId,
  sequenceState,
  showMessage
}) => {
  const [sequenceText, setSequenceText] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [saveStatus, setSaveStatus] = useState("");
  const [lastSavedText, setLastSavedText] = useState("");

  // Determine if sequence is currently running
  const isSequenceRunning = sequenceState?.cycle_running || (playingTime > 0 && playingTime !== undefined && playingTime !== null);

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

  // Parse text back to sequence object
  const textToSequence = (text) => {
    const lines = text.split('\n');
    const events = [];
    const errors = [];

    lines.forEach((line, lineNumber) => {
      const trimmed = line.trim();
      // Skip empty lines and comments
      if (!trimmed || trimmed.startsWith('#')) return;

      const parts = trimmed.split(/\s+/);
      
      if (parts.length < 3) {
        errors.push(`Line ${lineNumber + 1}: Invalid format - need at least time, command, and action`);
        return;
      }

      const timeValue = parseFloat(parts[0]);
      if (isNaN(timeValue) || timeValue < 0) {
        errors.push(`Line ${lineNumber + 1}: Invalid time value "${parts[0]}" - must be a positive number`);
        return;
      }

      const command = parts[1].toLowerCase();
      const validCommands = ['switch', 'audio'];
      if (!validCommands.includes(command)) {
        errors.push(`Line ${lineNumber + 1}: Invalid command "${parts[1]}" - must be one of: ${validCommands.join(', ')}`);
        return;
      }

      const event = {
        time: parts[0],
        command: parts[1],
        action: parts[2],
        parameter: parts.length > 3 ? parts.slice(3).join(' ') : ""
      };

      // Additional validation based on command type
      if (command === 'switch') {
        const param = event.parameter.toLowerCase();
        if (param !== 'on' && param !== 'off') {
          errors.push(`Line ${lineNumber + 1}: Switch command requires parameter to be "on" or "off", got "${event.parameter}"`);
          return;
        }
      }

      events.push(event);
    });

    if (errors.length > 0) {
      throw new Error(`Parsing errors found:\n${errors.join('\n')}`);
    }

    return { sequence: events };
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
      // If sequence starts while editing, just show warning but keep editing
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
    setSaveStatus("Uploading...");
    
    if (wsClient) {
      // Escape the text content with \n for newlines
      const escapedText = sequenceText.replace(/\n/g, '\\n');
      
      // Send the text content using the "us" command (no validation, send as-is)
      wsClient.sendRequest("dunebugger_set", `us main.seq ${escapedText}`, connectionId);
      
      // Show popup message
      if (showMessage) {
        showMessage("Sequence upload command sent to DuneBugger device", "info");
      }
      
      setSaveStatus("Sequence uploaded successfully!");
    } else {
      setSaveStatus("No WebSocket connection - sequence not uploaded");
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

  return (
    <div className="sequence-page">
      <h2>Sequence Timeline</h2>
      
      <div className="timeline-section">
        <SequenceTimeline sequence={sequence || []} playingTime={playingTime || 0} />
      </div>

      <div className="sequence-text-section">
        <div className="text-editor-header">
          <div className="header-left">
            <h3>Sequence Text Editor</h3>
            {sequence && sequence.sequence && sequence.sequence.length > 0 ? (
              isSequenceRunning ? (
                <span className="data-status running">▶️ Sequence Running</span>
              ) : (
                <span className="data-status loaded">✓ Data Loaded</span>
              )
            ) : (
              <span className="data-status waiting">⏳ Waiting for WebSocket data...</span>
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
                  Edit
                </button>
                <button 
                  className="revert-button"
                  onClick={() => {
                    setSequenceText(sequenceToText(sequence));
                    setLastSavedText("");
                    setSaveStatus("Synced with timeline data");
                    setTimeout(() => setSaveStatus(""), 3000);
                  }}
                  disabled={!sequence || !sequence.sequence || sequence.sequence.length === 0}
                  title="Reset text editor content with sequence timeline data"
                >
                  Reset
                </button>
              </>
            ) : (
              <>
                <button 
                  className="save-button"
                  onClick={handleSave}
                  disabled={!sequenceText.trim() || isSequenceRunning}
                >
                  Save
                </button>
                <button 
                  className="cancel-button"
                  onClick={handleCancel}
                >
                  Cancel
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
          placeholder="Waiting for sequence data from WebSocket..."
          rows={15}
        />
        
        <div className="editor-footer">
          <div className="text-stats">
            {sequence && sequence.sequence && sequence.sequence.length > 0 ? (
              <>
                {lastSavedText ? "Custom Content | " : "WebSocket Events: " + sequence.sequence.length + " | "}
                Text Lines: {sequenceText.split('\n').length} | 
                Editable Events: {sequenceText.split('\n').filter(line => line.trim() && !line.trim().startsWith('#')).length}
              </>
            ) : (
              <>
                Lines: {sequenceText.split('\n').length} | 
                Characters: {sequenceText.length} | 
                Status: Waiting for data...
              </>
            )}
          </div>
          {isEditing && (
            <div className="editor-help">
              <small>
                💡 Tip: Use # for comments. Format: time command action parameter<br/>
                ⌨️ Ctrl+S to save, Esc to cancel
                {isSequenceRunning && <><br/>⚠️ Save disabled - sequence is currently running</>}
              </small>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SequencePage;