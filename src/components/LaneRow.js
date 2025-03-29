import React from "react";

/**
 * LaneRow:
 * Renders a label on the left and the lane of events on the right.
 */
export default function LaneRow({ switchName, events, totalTime, zoomFactor, rowIndex }) {
  return (
    <div className="lane-row" style={{ top: `${40 + rowIndex * 40}px` }}>
      {/* Lane Label */}
      <div className="lane-label">
        {switchName}
      </div>

      {/* Horizontal line + events */}
      <div className="lane-lane">
        <div className="lane-events">
          {events.map((event, index) => (
            <div
              key={index}
              className={`timeline-event-circle ${
                event.parameter === "on" ? "event-on" : "event-off"
              }`}
              style={{
                left: `${(event.time / totalTime) * zoomFactor}%`,
              }}
              title={`${switchName} - ${event.time}s`}
            >
              <div className="tooltip">
                {switchName} - {event.time}s
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}