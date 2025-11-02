import React, { useState, useCallback } from 'react';
import LoginPopup from './LoginPopup';
import './LoginPopup.css';

const MessagesContainer = ({ children }) => {
  const [messages, setMessages] = useState([]);

  const showMessage = useCallback((message, type = 'success') => {
    const id = Date.now() + Math.random();
    const newMessage = { id, message, type };
    
    setMessages(prev => [...prev, newMessage]);
  }, []);

  const removeMessage = useCallback((id) => {
    setMessages(prev => prev.filter(msg => msg.id !== id));
  }, []);

  return (
    <>
      {children({ showMessage })}
      <div className="messages">
        {messages.map(msg => (
          <LoginPopup
            key={msg.id}
            message={msg.message}
            type={msg.type}
            onClose={() => removeMessage(msg.id)}
          />
        ))}
      </div>
    </>
  );
};

export default MessagesContainer;