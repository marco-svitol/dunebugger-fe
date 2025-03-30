import React, { useState } from "react";
import "./SequenceTimeline.css";
import { FaMusic, FaWaveSquare } from "react-icons/fa";

function SequenceTimeline({ sequence }) {
  const [tooltip, setTooltip] = useState({ visible: false, text: "", x: 0, y: 0 });

  if (!sequence || !sequence.sequence || sequence.sequence.length === 0) {
    return (
      <div className="timeline-container">
        <h3>Sequence Timeline</h3>
        <p>No events to display</p>
      </div>
    );
  }

  const totalTime = Math.max(...sequence.sequence.map((ev) => parseFloat(ev.time)));
  const zoomFactor = 100 ;

  // Group events by "switch" actions
  const switchEvents = sequence.sequence.filter((ev) => ev.command === "switch");
  const audioEvents = sequence.sequence.filter((ev) => ev.command === "audio");

  const tracks = switchEvents.reduce((acc, ev) => {
    acc[ev.action] = acc[ev.action] || [];
    acc[ev.action].push(ev);
    return acc;
  }, {});

// Predefined calm, warm, and muted pastel colors for tracks
const trackColors = [
  "#D9D3A3", // Muted yellow
  "#C4B8A5", // Muted tan
  "#D9C4B3", // Muted blush
  "#A3B8D9", // Muted sky blue
  "#A3D9A3", // Muted mint green
  "#D3A3D9", // Muted lilac
  "#B0BEC5", // Muted gray-blue
  "#CFD8DC", // Light gray
  "#B2DFDB", // Soft teal
  "#B3E5FC", // Soft light blue
  "#C8E6C9", // Soft green
  "#FFCCBC", // Soft peach
  "#D7CCC8", // Warm gray
  "#E6A57E", // Muted peach
  "#D4A5A5", // Muted coral
  "#C4A69D", // Muted salmon
  "#E8C4A3", // Muted orange
  "#D9B8A3", // Muted sand
  "#D4B3A3", // Muted apricot
  "#E6D3A3", // Muted goldenrod
  "#A3C4D9", // Muted blue
  "#A3D9C4", // Muted green
  "#C4A3D9", // Muted lavender
  "#D9A3C4", // Muted pink
  "#A3D9D9", // Muted cyan
];

  // Function to get a color for a track
  const getTrackColor = (index) => trackColors[index % trackColors.length];

  const renderAudioIcons = (audioEvents) => {
    return audioEvents.map((ev, idx) => {
      // Adjust position for events at the end of the timeline
      let time = parseFloat(ev.time);
      if (time === totalTime) {
        time = totalTime - 5; // Move back 5 seconds
      }
  
      const position = (time / totalTime) * zoomFactor;
  
      // Normalize action to lowercase for case-insensitive comparison
      const action = ev.action.toLowerCase();
      let Icon;
      let iconColor = "#007bff"; // Default color for icons
      let tooltipText = `${ev.action} at ${ev.time}s`;
  
      if (action === "playmusic") {
        Icon = FaMusic;
      } else if (action === "playsfx") {
        Icon = FaWaveSquare;
        tooltipText += ` (${ev.parameter})`;
      } else if (action === "fadeout") {
        Icon = FaMusic;
        iconColor = "#808080"; // Grey color for fadeout
      }
  
      return (
        <div
          key={idx}
          className="audio-icon"
          style={{
            left: `${position}%`,
            color: iconColor, // Apply the color dynamically
          }}
          onMouseEnter={(e) =>
            setTooltip({
              visible: true,
              text: tooltipText,
              x: e.clientX,
              y: e.clientY,
            })
          }
          onMouseLeave={() => setTooltip({ visible: false, text: "", x: 0, y: 0 })}
          onTouchStart={(e) =>
            setTooltip({
              visible: true,
              text: tooltipText,
              x: e.touches[0].clientX,
              y: e.touches[0].clientY,
            })
          }
          onTouchEnd={() => setTooltip({ visible: false, text: "", x: 0, y: 0 })}
        >
          <Icon />
        </div>
      );
    });
  };

  const renderTracks = (tracks) => {
    return Object.entries(tracks).map(([action, events], trackIndex) => {
      const segments = [];
      let startTime = null;
  
      events.forEach((ev) => {
        // Normalize parameter to lowercase for case-insensitive comparison
        const parameter = ev.parameter.toLowerCase();
  
        if (parameter === "on") {
          startTime = parseFloat(ev.time);
        } else if (parameter === "off" && startTime !== null) {
          const endTime = parseFloat(ev.time);
          segments.push({ start: startTime, end: endTime });
          startTime = null;
        }
      });
  
      // Handle case where "on" exists without a corresponding "off"
      if (startTime !== null) {
        segments.push({ start: startTime, end: totalTime });
      }
  
      const trackColor = getTrackColor(trackIndex);
  
      return (
        <div key={trackIndex} className="track">
          <div className="track-label">{action}</div>
          <div className="track-timeline">
            {segments.map((segment, idx) => (
              <div
                key={idx}
                className="track-segment"
                style={{
                  left: `${(segment.start / totalTime) * zoomFactor}%`,
                  width: `${((segment.end - segment.start) / totalTime) * zoomFactor}%`,
                  backgroundColor: trackColor,
                }}
                title={`${action}: ${segment.start}s - ${segment.end}s`}
              />
            ))}
          </div>
        </div>
      );
    });
  };

  return (
    <div className="timeline-container">
      <h3>Sequence Timeline</h3>
      <div className="timeline-wrapper">
        {/* Audio Track */}
        <div className="audio-track">
          <div className="track-label">Audio</div>
          <div className="track-timeline">{renderAudioIcons(audioEvents)}</div>
        </div>

        {/* Switch Tracks */}
        {renderTracks(tracks)}

        {/* Time Axis */}
        <div className="time-axis">
          {Array.from({ length: Math.ceil(totalTime / 10) + 1 }, (_, i) => {
            const t = i * 10;
            return (
              <div
                key={t}
                className="time-marker"
                style={{ left: `${(t / totalTime) * zoomFactor}%` }}
              >
                {t}s
              </div>
            );
          })}
        </div>
      </div>

      {tooltip.visible && (
        <div
          className="custom-tooltip"
          style={{ top: tooltip.y + 10, left: tooltip.x + 10 }}
        >
          {tooltip.text}
        </div>
      )}
    </div>
  );
}

export default SequenceTimeline;