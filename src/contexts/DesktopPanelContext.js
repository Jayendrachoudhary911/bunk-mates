// src/contexts/DesktopPanelContext.js
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

const DesktopPanelContext = createContext(null);

export const DesktopPanelProvider = ({ children }) => {
  // activePanel can be: null | "profile" | "settings" | "notifications" | "trips" | "notes" | "todos" | "chatProfile" | "groupInfo" | "help"
  const [activePanel, setActivePanel] = useState(null);
  const [panelData, setPanelData] = useState(null);

  const openPanel = useCallback((panelName, data = null) => {
    setActivePanel(panelName);
    setPanelData(data);
  }, []);

  const closePanel = useCallback(() => {
    setActivePanel(null);
    setPanelData(null);
  }, []);

  const togglePanel = useCallback((panelName, data = null) => {
    setActivePanel((prev) => {
      if (prev === panelName) {
        setPanelData(null);
        return null;
      }
      setPanelData(data);
      return panelName;
    });
  }, []);

  // Keyboard accessibility: Escape key closes the active panel
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && activePanel !== null) {
        closePanel();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activePanel, closePanel]);

  const value = {
    activePanel,
    panelData,
    openPanel,
    closePanel,
    togglePanel,
  };

  return (
    <DesktopPanelContext.Provider value={value}>
      {children}
    </DesktopPanelContext.Provider>
  );
};

export const useDesktopPanel = () => {
  const context = useContext(DesktopPanelContext);
  if (!context) {
    throw new Error("useDesktopPanel must be used within a DesktopPanelProvider");
  }
  return context;
};

export default DesktopPanelContext;
