// TripContext.js
import React, { createContext, useState, useContext } from 'react';

const TripContext = createContext();

export const TripProvider = ({ children }) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [prefillData, setPrefillData] = useState(null);

  const openTripDrawer = (data = null) => {
    setPrefillData(data);
    setIsDrawerOpen(true);
  };

  const closeTripDrawer = () => setIsDrawerOpen(false);

  return (
    <TripContext.Provider value={{ isDrawerOpen, openTripDrawer, closeTripDrawer, prefillData }}>
      {children}
    </TripContext.Provider>
  );
};

export const useTrip = () => useContext(TripContext);