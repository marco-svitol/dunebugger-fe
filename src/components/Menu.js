import React from "react";
import "./Menu.css";
import { FaTimes } from "react-icons/fa";
import { useTranslatedText } from "../hooks/useTranslation";

const Menu = ({ isOpen, onClose, onNavigate, currentPage, isMobile }) => {
  // Translation hooks
  const { translatedText: mainText } = useTranslatedText("Main");
  const { translatedText: sequenceText } = useTranslatedText("Sequence");
  const { translatedText: switchesText } = useTranslatedText("Switches");
  const { translatedText: schedulerText } = useTranslatedText("Scheduler");
  const { translatedText: analyticsText } = useTranslatedText("Analytics");
  const { translatedText: systemText } = useTranslatedText("System");

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
            {mainText}
          </button>
          <button 
            className={`menu-item ${currentPage === "sequence" ? "active" : ""}`} 
            onClick={() => onNavigate("sequence")}
          >
            {sequenceText}
          </button>
          <button 
            className={`menu-item ${currentPage === "gpios" ? "active" : ""}`} 
            onClick={() => onNavigate("gpios")}
          >
            {switchesText}
          </button>
          <button 
            className={`menu-item ${currentPage === "scheduler" ? "active" : ""}`} 
            onClick={() => onNavigate("scheduler")}
          >
            {schedulerText}
          </button>
          <button 
            className={`menu-item ${currentPage === "analytics" ? "active" : ""}`} 
            onClick={() => onNavigate("analytics")}
          >
            {analyticsText}
          </button>
          <button 
            className={`menu-item ${currentPage === "system" ? "active" : ""}`} 
            onClick={() => onNavigate("system")}
          >
            {systemText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Menu;