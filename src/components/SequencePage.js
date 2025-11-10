import React, { useState, useEffect } from "react";
import SequenceTimeline from "./SequenceTimeline";
import "./SequencePage.css";

const SequencePage = ({ 
  sequence, 
  playingTime, 
  wsClient, 
  connectionId 
}) => {
  const [sequenceText, setSequenceText] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [saveStatus, setSaveStatus] = useState("");

  // Convert sequence object to readable text format
  const sequenceToText = (seq) => {
    if (!seq || !seq.sequence || seq.sequence.length === 0) {
      return `# No sequence data loaded yet
# Waiting for sequence data from WebSocket...
# 
# Format: time | command | action | parameter
# 
# Examples:
# 0.0   | switch | relay1     | on
# 5.0   | audio  | playmusic  | background.mp3
# 10.0  | switch | relay1     | off
# 15.0  | audio  | playsfx    | explosion.wav
# 20.0  | audio  | fadeout    | 
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
    text += "# Format: time | command | action | parameter\n";
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
      
      text += `${time} | ${command} | ${action} | ${parameter}\n`;
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

      const parts = trimmed.split('|').map(part => part.trim());
      
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
        parameter: parts[3] || ""
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

  // Update text when sequence changes
  useEffect(() => {
    if (!isEditing) {
      setSequenceText(sequenceToText(sequence));
    }
  }, [sequence, isEditing]);

  // Initialize text on first load
  useEffect(() => {
    if (sequence && sequence.sequence && sequence.sequence.length > 0 && !sequenceText) {
      console.log("SequencePage: Loading sequence data from WebSocket:", sequence);
      setSequenceText(sequenceToText(sequence));
    }
  }, [sequence, sequenceText]);

  const handleTextChange = (e) => {
    setSequenceText(e.target.value);
  };

  const handleSave = () => {
    try {
      setSaveStatus("Validating...");
      const newSequence = textToSequence(sequenceText);
      
      setSaveStatus("Uploading...");
      
      if (wsClient) {
        // Send the new sequence to the server
        // You may need to implement this command on the server side
        wsClient.sendRequest("upload_sequence", JSON.stringify(newSequence), connectionId);
        setSaveStatus("Sequence uploaded successfully!");
      } else {
        setSaveStatus("No WebSocket connection - sequence validated but not uploaded");
      }
      
      console.log("New sequence:", newSequence);
      setIsEditing(false);
      
      // Clear status after 3 seconds
      setTimeout(() => setSaveStatus(""), 3000);
    } catch (error) {
      console.error("Error parsing sequence:", error);
      setSaveStatus(`Error: ${error.message}`);
      // Keep error message longer
      setTimeout(() => setSaveStatus(""), 5000);
    }
  };

  const handleCancel = () => {
    setSequenceText(sequenceToText(sequence));
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
              <span className="data-status loaded">✓ Data Loaded</span>
            ) : (
              <span className="data-status waiting">⏳ Waiting for WebSocket data...</span>
            )}
          </div>
          <div className="editor-controls">
            {!isEditing ? (
              <button 
                className="edit-button"
                onClick={() => setIsEditing(true)}
                disabled={!sequence || !sequence.sequence || sequence.sequence.length === 0}
              >
                Edit
              </button>
            ) : (
              <>
                <button 
                  className="save-button"
                  onClick={handleSave}
                  disabled={!sequenceText.trim()}
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
                WebSocket Events: {sequence.sequence.length} | 
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
                💡 Tip: Use # for comments. Format: time | command | action | parameter<br/>
                ⌨️ Ctrl+S to save, Esc to cancel
              </small>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SequencePage;