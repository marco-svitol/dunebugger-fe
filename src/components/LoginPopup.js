import React, { useState, useEffect } from 'react';
import './LoginPopup.css';

const LoginPopup = ({ message, type = 'success', onClose }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Auto-remove after 5 seconds (same as demo-app)
    const timer = setTimeout(() => {
      handleClose();
    }, 5000);

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
    </div>
  );
};

export default LoginPopup;