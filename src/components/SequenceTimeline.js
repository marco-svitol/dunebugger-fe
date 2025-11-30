import React, { useState } from "react";
import "./SequenceTimeline.css";
import { FaMusic, FaWaveSquare } from "react-icons/fa";

function SequenceTimeline({ sequence, playingTime }) {
  const [tooltip, setTooltip] = useState({ visible: false, text: "", x: 0, y: 0 });

  if (!sequence || !sequence.sequence || sequence.sequence.length === 0) {
    return (
      <div className="timeline-container">
        <p>No events to display</p>
      </div>
    );
  }

  const totalTime = Math.max(...sequence.sequence.map((ev) => parseFloat(ev.time)));
  const zoomFactor = 100;

  // Group events by "switch" actions
  const switchEvents = sequence.sequence.filter((ev) => ev.command === "switch");
  const audioEvents = sequence.sequence.filter((ev) => ev.command === "audio");
  const dmxEvents = sequence.sequence.filter((ev) => ev.command === "dmx");

  const tracks = switchEvents.reduce((acc, ev) => {
    acc[ev.action] = acc[ev.action] || [];
    acc[ev.action].push(ev);
    return acc;
  }, {});

  // Group DMX events by channel number
  const dmxTracks = dmxEvents.reduce((acc, ev) => {
    const channelMatch = ev.parameter.match(/^(\d+)/);
    const channel = channelMatch ? parseInt(channelMatch[1]) : 0;
    const key = `DMX ${channel}`;
    acc[key] = acc[key] || [];
    acc[key].push(ev);
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

  // Helper function to parse DMX parameters
  const parseDmxParameter = (parameter) => {
    const parts = parameter.split(' ');
    const channel = parseInt(parts[0]);
    const colorOrDimmer = parts[1];
    const duration = parts[2] ? parseFloat(parts[2]) : 2; // Default 2 seconds
    return { channel, colorOrDimmer, duration };
  };

  // Helper function to convert color names to hex
  const getColorHex = (colorName) => {
    const colorMap = {
      'red': '#ff4444',
      'green': '#44ff44',
      'blue': '#4444ff',
      'yellow': '#ffff44',
      'purple': '#ff44ff',
      'cyan': '#44ffff',
      'white': '#ffffff',
      'orange': '#ffa544',
      'pink': '#ff69b4',
      'lime': '#32cd32'
    };
    return colorMap[colorName?.toLowerCase()] || '#808080'; // Default grey
  };

  // Helper function to convert dimmer value to percentage
  const dimmerToPercentage = (dimmer) => {
    return Math.round(parseFloat(dimmer) * 100);
  };

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

  const renderTrackLabels = (tracks, dmxTracks) => {
    return (
      <div className="track-labels">
        <div key="audio" className="track-label">Audio</div>
        {Object.keys(tracks).map((action, idx) => (
          <div key={idx} className="track-label">
            {action}
          </div>
        ))}
        {Object.keys(dmxTracks).sort((a, b) => {
          const channelA = parseInt(a.split(' ')[1]);
          const channelB = parseInt(b.split(' ')[1]);
          return channelA - channelB;
        }).map((channel, idx) => (
          <div key={`dmx-${idx}`} className="track-label">
            {channel}
          </div>
        ))}
      </div>
    );
  };

  const renderDmxTracks = (dmxTracks) => {
    const sortedChannels = Object.keys(dmxTracks).sort((a, b) => {
      const channelA = parseInt(a.split(' ')[1]);
      const channelB = parseInt(b.split(' ')[1]);
      return channelA - channelB;
    });

    return sortedChannels.map((channel, trackIndex) => {
      const events = dmxTracks[channel];
      const segments = [];

      events.forEach((ev) => {
        const startTime = parseFloat(ev.time);
        const { colorOrDimmer, duration } = parseDmxParameter(ev.parameter);
        
        let segmentDuration;
        let segmentColor = '#808080'; // Default grey
        let tooltipText = `${channel}: ${ev.action}`;

        // Determine segment duration and color based on command
        if (ev.action === 'set') {
          segmentDuration = 1; // Fixed 1 second
          segmentColor = getColorHex(colorOrDimmer);
          tooltipText += ` ${colorOrDimmer} at ${ev.time}s`;
        } else if (ev.action === 'fade') {
          segmentDuration = duration;
          segmentColor = getColorHex(colorOrDimmer);
          tooltipText += ` to ${colorOrDimmer} over ${duration}s at ${ev.time}s`;
        } else if (ev.action === 'dimmer') {
          segmentDuration = 1; // Fixed 1 second
          const percentage = dimmerToPercentage(colorOrDimmer);
          tooltipText += ` to ${percentage}% at ${ev.time}s`;
        } else if (ev.action === 'fade_dimmer') {
          segmentDuration = duration;
          const percentage = dimmerToPercentage(colorOrDimmer);
          tooltipText += ` to ${percentage}% over ${duration}s at ${ev.time}s`;
        }

        const endTime = Math.min(startTime + segmentDuration, totalTime);
        segments.push({ 
          start: startTime, 
          end: endTime, 
          color: segmentColor,
          tooltip: tooltipText
        });
      });

      return (
        <div key={trackIndex} className="track">
          <div className="track-timeline">
            {segments.map((segment, idx) => (
              <div
                key={idx}
                className="track-segment"
                style={{
                  left: `${(segment.start / totalTime) * zoomFactor}%`,
                  width: `${((segment.end - segment.start) / totalTime) * zoomFactor}%`,
                  backgroundColor: segment.color,
                }}
                onMouseEnter={(e) =>
                  setTooltip({
                    visible: true,
                    text: segment.tooltip,
                    x: e.clientX,
                    y: e.clientY,
                  })
                }
                onMouseLeave={() => setTooltip({ visible: false, text: "", x: 0, y: 0 })}
                onTouchStart={(e) =>
                  setTooltip({
                    visible: true,
                    text: segment.tooltip,
                    x: e.touches[0].clientX,
                    y: e.touches[0].clientY,
                  })
                }
                onTouchEnd={() => setTooltip({ visible: false, text: "", x: 0, y: 0 })}
              />
            ))}
          </div>
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
                onMouseEnter={(e) =>
                  setTooltip({
                    visible: true,
                    text: `${action}: ${segment.start}s - ${segment.end}s`,
                    x: e.clientX,
                    y: e.clientY,
                  })
                }
                onMouseLeave={() => setTooltip({ visible: false, text: "", x: 0, y: 0 })}
                onTouchStart={(e) =>
                  setTooltip({
                    visible: true,
                    text: `${action}: ${segment.start}s - ${segment.end}s`,
                    x: e.touches[0].clientX,
                    y: e.touches[0].clientY,
                  })
                }
                onTouchEnd={() => setTooltip({ visible: false, text: "", x: 0, y: 0 })}
              />
            ))}
          </div>
        </div>
      );
    });
  };

    // Calculate position for playing time marker
  const playingTimePosition = playingTime !== undefined ? 
    `${(playingTime / totalTime) * zoomFactor}%` : null;

  return (
    <div className="timeline-container">
      <div className="timeline-wrapper">

        {/* Track Labels */}
        <div className="labels-column">
          {renderTrackLabels(tracks, dmxTracks)}
        </div>

        {/* Tracks */}
        <div className="tracks-column">
          {/* Audio Track */}
          <div className="audio-track">
            <div className="track-timeline">{renderAudioIcons(audioEvents)}</div>
          </div>

          {/* Switch Tracks */}
          {renderTracks(tracks)}

          {/* DMX Tracks */}
          {renderDmxTracks(dmxTracks)}

          {/* Playing Time Marker */}
          {playingTimePosition && (
            <div 
              className="playing-time-marker" 
              style={{ left: playingTimePosition }}
            />
          )}

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