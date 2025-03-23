import React from "react";
import "./SequenceTimeline.css"; // Add styles for the timeline

function SequenceTimeline({ sequence }) {
  if (!sequence || !sequence.sequence || sequence.sequence.length === 0) {
    return (
      <div className="timeline-container">
        <h3>Sequence Timeline</h3>
        <p>No events to display</p>
      </div>
    );
  }

  return (
    <div className="timeline-container">
      <h3>Sequence Timeline</h3>
      <div className="timeline">
        {sequence.sequence.map((event, index) => (
          <div key={index} className="timeline-event" style={{ left: `${event.time / 3}%` }}>
            <div className="timeline-flag">
              <p className="timeline-time">{event.time}s</p>
              <p className="timeline-command">{event.command}</p>
              <p className="timeline-action">{event.action}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default SequenceTimeline;