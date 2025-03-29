import React from "react";

/**
 * TimelineAxis:
 * Renders vertical markers every 10 seconds,
 * and a thicker line plus a minute label at each 60-second mark.
 */
export default function TimelineAxis({ totalTime, zoomFactor }) {
  // Compute marker positions for every 10 seconds
  const markers = Array.from({ length: Math.ceil(totalTime / 10) + 1 }, (_, i) => i * 10);

  return (
    <div className="timeline-axis">
      {markers.map((time) => {
        const leftPercent = (time / totalTime) * zoomFactor;
        const isMinute = time % 60 === 0; // minute mark
        return (
          <div
            key={time}
            className={`timeline-marker ${isMinute ? "timeline-marker-large" : "timeline-marker-small"}`}
            style={{
              left: `${leftPercent}%`,
            }}
          >
            {isMinute && <span className="timeline-minute">{time / 60}m</span>}
            {!isMinute && time !== 0 && <span className="timeline-second">{time}s</span>}
          </div>
        );
      })}
    </div>
  );
}