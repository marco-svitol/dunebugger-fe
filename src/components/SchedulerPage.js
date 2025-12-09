import React, { useState, useEffect } from "react";
import "./SchedulerPage.css";

const SchedulerPage = ({ 
  schedule,
  nextActions,
  lastExecutedAction,
  wsClient, 
  connectionId,
  showMessage,
  groupName,
  isOnline
}) => {
  const [scheduleText, setScheduleText] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [saveStatus, setSaveStatus] = useState("");
  const [lastSavedText, setLastSavedText] = useState("");

  // Reset component state when device (groupName) changes
  useEffect(() => {
    console.log("SchedulerPage: groupName changed, resetting state:", groupName);
    setScheduleText("");
    setIsEditing(false);
    setSaveStatus("");
    setLastSavedText("");
  }, [groupName]);

  // Handle schedule data when received from WebSocket
  useEffect(() => {
    console.log("SchedulerPage: schedule prop changed:", schedule, "type:", typeof schedule);
    if (schedule) {
      let scheduleString = schedule;
      
      // Handle different data types
      if (typeof schedule === 'object') {
        scheduleString = JSON.stringify(schedule, null, 2);
      } else if (typeof schedule !== 'string') {
        scheduleString = String(schedule);
      }
      
      console.log("SchedulerPage: Setting schedule text:", scheduleString);
      setScheduleText(scheduleString);
      setLastSavedText(scheduleString);
      setSaveStatus("Schedule loaded from device");
      setTimeout(() => setSaveStatus(""), 3000);
    }
  }, [schedule]);

  // Default schedule template
  const getDefaultScheduleTemplate = () => {
    return `# Configurazione del programma settimanale per DuneBugger
# Formato: HH:MM azione
# Azioni disponibili: 
# - acceso            : in StandBy pronto per essere avviato tramite pulsante
# - acceso_silenzioso : come sopra, ma l'audio è spento o molto basso per non disturbare le celebrazioni)
# - spento            : completamente spento, non risponde al pulsante di avvio
#
# Devono essere specificati programmi per tutti i giorni della settimana
# I giorni sono indicati tra parentesi quadre: [lunedì], [martedì], [mercoledì], [giovedì], [venerdì], [sabato], [domenica]
# Esempio di programma settimanale:
[domenica]
8:00 acceso
...
21:30 spento
...
[sabato]
8:00 acceso
...
20:00 spento

# Fine della configurazione del programma settimanale


# I giorni speciali possono essere aggiunti qui sotto
# Devono essere specificati con la data completa tra parentesi quadre: [DD-MM-YYYY]
# Le azioni seguono lo stesso formato di sopra
# Le date speciali sovrascrivono il programma settimanale per quel giorno specifico

# Esempio date speciali:
[24-12-2025]
8:00 acceso
23:30 acceso_silenzioso
[25-12-2025]
1:30 spento
7:00 acceso
...
`;
  };





  const handleTextChange = (e) => {
    setScheduleText(e.target.value);
  };

  const handleSave = () => {
    setSaveStatus("Uploading schedule...");
    
    if (wsClient && isOnline) {
      // Escape the text content with \n for newlines
      const escapedText = scheduleText.replace(/\n/g, '\\n');
      
      // Send the schedule content using scheduler.set command
      wsClient.sendRequest("scheduler.update_schedule", scheduleText, connectionId);
      
      // Show popup message
      if (showMessage) {
        showMessage("Schedule upload command sent to DuneBugger device", "info");
      }
      
      setSaveStatus("Schedule uploaded successfully!");
    } else {
      setSaveStatus("No WebSocket connection - schedule not uploaded");
    }
    
    console.log("Sent schedule content:", scheduleText);
    
    // Save the current text as the last saved version
    setLastSavedText(scheduleText);
    setIsEditing(false);
    
    // Clear status after 3 seconds
    setTimeout(() => setSaveStatus(""), 3000);
  };

  const handleCancel = () => {
    // Revert to last saved text, or default template if no saves have been made
    const textToRevert = lastSavedText || getDefaultScheduleTemplate();
    setScheduleText(textToRevert);
    setIsEditing(false);
    setSaveStatus("");
  };

  const handleKeyDown = (e) => {
    if (isEditing && e.ctrlKey && e.key === 's') {
      e.preventDefault();
      if (isOnline) {
        handleSave();
      }
    }
    if (isEditing && e.key === 'Escape') {
      handleCancel();
    }
  };

  // Load next actions from device
  const loadNextActions = () => {
    if (wsClient && isOnline) {
      wsClient.sendRequest("scheduler.get_next_actions", "null", connectionId);
      if (showMessage) {
        showMessage("Next actions request sent", "info");
      }
    }
  };

  // Load last executed action from device
  const loadLastExecutedAction = () => {
    if (wsClient && isOnline) {
      wsClient.sendRequest("scheduler.get_last_executed_action", "null", connectionId);
      if (showMessage) {
        showMessage("Last executed action request sent", "info");
      }
    }
  };

  // Load next actions and last executed action when component mounts or device changes
  useEffect(() => {
    if (wsClient && isOnline) {
      loadNextActions();
      loadLastExecutedAction();
    }
  }, [wsClient, isOnline, groupName]);

  // Initialize with template if no data (and no schedule prop is available)
  useEffect(() => {
    console.log("SchedulerPage: template check - scheduleText:", !!scheduleText, "lastSavedText:", !!lastSavedText, "schedule prop:", !!schedule);
    if (!scheduleText && !lastSavedText && !schedule) {
      console.log("SchedulerPage: Setting default template");
      setScheduleText(getDefaultScheduleTemplate());
    }
  }, [scheduleText, lastSavedText, schedule]);

  return (
    <div className="scheduler-page">
      <h2>Scheduler</h2>
      
      {/* Next Actions Section */}
      <div className="next-actions-section">
        <div className="next-actions-header">
          <h3>Next Scheduled Actions</h3>
          <button 
            className="refresh-next-actions-button"
            onClick={loadNextActions}
            disabled={!isOnline}
            title="Refresh next actions"
          >
            🔄 Refresh
          </button>
        </div>
        <div className="next-actions-content">
          {nextActions && nextActions.length > 0 ? (
            <div className="actions-grid">
              {nextActions.slice(0, 3).map((action, index) => (
                <div key={index} className="action-card">
                  <div className="action-datetime">
                    <div className="action-date">{action.date}</div>
                    <div className="action-time">{action.time}</div>
                  </div>
                  <div className="action-details">
                    <div className="action-name">{action.action}</div>
                    <div className="action-description">{action.description}</div>
                  </div>
                  <div className="action-commands">
                    {action.commands && action.commands.length > 0 && (
                      <div className="commands-list">
                        {action.commands.join(', ')}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-actions">
              <span className="waiting-message">⏳ Loading next actions...</span>
            </div>
          )}
        </div>
      </div>
      
      {/* Last Executed Action Section */}
      <div className="last-executed-section">
        <div className="last-executed-header">
          <h3>Last Executed Action</h3>
          <button 
            className="refresh-last-executed-button"
            onClick={loadLastExecutedAction}
            disabled={!isOnline}
            title="Refresh last executed action"
          >
            🔄 Refresh
          </button>
        </div>
        <div className="last-executed-content">
          {lastExecutedAction ? (
            lastExecutedAction.executed ? (
              <div className="executed-action-card">
                <div className="action-datetime">
                  <div className="action-date">{lastExecutedAction.date}</div>
                  <div className="action-time">{lastExecutedAction.time}</div>
                </div>
                <div className="action-details">
                  <div className="action-name">{lastExecutedAction.action}</div>
                  <div className="action-description">{lastExecutedAction.description}</div>
                </div>
                <div className="action-commands">
                  {lastExecutedAction.commands && lastExecutedAction.commands.length > 0 && (
                    <div className="commands-list">
                      {lastExecutedAction.commands.join(', ')}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="no-execution">
                <span className="no-execution-message">💭 {lastExecutedAction.message}</span>
              </div>
            )
          ) : (
            <div className="loading-execution">
              <span className="waiting-message">⏳ Loading last executed action...</span>
            </div>
          )}
        </div>
      </div>
      
      <div className="scheduler-text-section">
        <div className="text-editor-header">
          <div className="header-left">
            <h3>Weekly Schedule Editor</h3>
            {lastSavedText ? (
              <span className="data-status loaded">✓ Schedule Loaded</span>
            ) : (
              <span className="data-status waiting">⏳ Waiting for data...</span>
            )}
          </div>
          <div className="editor-controls">
            {!isEditing ? (
              <>
                <button 
                  className="edit-button"
                  onClick={() => setIsEditing(true)}
                  disabled={!isOnline}
                >
                  Edit
                </button>
                <button 
                  className="reset-button"
                  onClick={() => {
                    if (wsClient && isOnline) {
                      wsClient.sendRequest("scheduler.refresh", "null", connectionId);
                      setSaveStatus("Refresh command sent");
                      if (showMessage) {
                        showMessage("Schedule refresh command sent", "info");
                      }
                    } else {
                      setSaveStatus("No connection - cannot refresh");
                    }
                    setTimeout(() => setSaveStatus(""), 3000);
                  }}
                  disabled={!isOnline}
                  title="Refresh schedule from device"
                >
                  Reset
                </button>
              </>
            ) : (
              <>
                <button 
                  className="save-button"
                  onClick={handleSave}
                  disabled={!scheduleText.trim() || !isOnline}
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
          className={`schedule-text-editor ${isEditing ? 'editing' : 'readonly'}`}
          value={scheduleText}
          onChange={handleTextChange}
          onKeyDown={handleKeyDown}
          readOnly={!isEditing}
          placeholder="Loading schedule from device..."
          rows={20}
        />
        
        <div className="editor-footer">
          <div className="text-stats">
            Lines: {scheduleText.split('\n').length} | 
            Characters: {scheduleText.length} | 
            Schedule Events: {scheduleText.split('\n').filter(line => 
              line.trim() && 
              !line.trim().startsWith('#') && 
              !line.trim().startsWith('[') && 
              !line.trim().startsWith('Fine') &&
              line.includes(':')
            ).length}
          </div>
          {isEditing && (
            <div className="editor-help">
              <small>
                💡 Format: [day] or [DD-MM-YYYY] followed by HH:MM action<br/>
                ⌨️ Ctrl+S to save, Esc to cancel
                {!isOnline && <><br/>⚠️ Save disabled - no connection</>}
              </small>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SchedulerPage;