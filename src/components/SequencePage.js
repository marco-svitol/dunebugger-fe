import React from "react";
import SequenceTimeline from "./SequenceTimeline";

const SequencePage = ({ 
  sequence, 
  playingTime, 
  wsClient, 
  connectionId 
}) => {
  return (
    <div className="sequence-page">
      <h2>Sequence Timeline</h2>
      
      <div className="timeline-section">
        <SequenceTimeline sequence={sequence || []} playingTime={playingTime || 0} />
      </div>
    </div>
  );
};

export default SequencePage;