import React, { useState, useEffect } from 'react';
import './LoginPopup.css';

const LoginPopup = ({ message, type = 'success', onClose }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Auto-remove after 3.75 seconds (75% of original time)
    const timer = setTimeout(() => {
      handleClose();
    }, 3750);

    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    if (onClose) {
      setTimeout(onClose, 300); // Wait for animation to complete
    }
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className={`message message-${type}`}>
      {message}
      <button className="message-close" onClick={handleClose}>
        ×
      </button>
      <div className="message-progress-bar">
        <div className="message-progress-fill"></div>
      </div>
    </div>
  );
};

export default LoginPopup;