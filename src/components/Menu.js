import React from "react";
import "./Menu.css";
import { FaTimes } from "react-icons/fa";

const Menu = ({ isOpen, onClose, onNavigate, currentPage, isMobile }) => {
  const handleClickOutside = (e) => {
    // Close menu when clicking outside only in non-mobile view
    if (!isMobile && e.target.classList.contains("menu-overlay")) {
      onClose();
    }
  };

  return (
    <div 
      className={`menu-overlay ${isOpen ? "open" : ""}`} 
      onClick={handleClickOutside}
    >
      <div className={`menu-container ${isOpen ? "open" : ""}`}>
        <div className="menu-header">
          <h2>Dunebugger</h2>
          {isMobile && (
            <button className="close-menu" onClick={onClose}>
              <FaTimes />
            </button>
          )}
        </div>
        <div className="menu-items">
          <button 
            className={`menu-item ${currentPage === "main" ? "active" : ""}`} 
            onClick={() => onNavigate("main")}
          >
            Main
          </button>
          <button 
            className={`menu-item ${currentPage === "sequence" ? "active" : ""}`} 
            onClick={() => onNavigate("sequence")}
          >
            Sequence
          </button>
          <button 
            className={`menu-item ${currentPage === "gpios" ? "active" : ""}`} 
            onClick={() => onNavigate("gpios")}
          >
            Switches
          </button>
          <button 
            className={`menu-item ${currentPage === "scheduler" ? "active" : ""}`} 
            onClick={() => onNavigate("scheduler")}
          >
            Scheduler
          </button>
          <button 
            className={`menu-item ${currentPage === "analytics" ? "active" : ""}`} 
            onClick={() => onNavigate("analytics")}
          >
            Analytics
          </button>
          <button 
            className={`menu-item ${currentPage === "system" ? "active" : ""}`} 
            onClick={() => onNavigate("system")}
          >
            System
          </button>
        </div>
      </div>
    </div>
  );
};

export default Menu;