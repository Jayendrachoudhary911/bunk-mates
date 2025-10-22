import React, { createContext, useState, useEffect } from 'react';

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      // Simulate fetching user data from an API or local storage
      const userData = await getUserFromStorage();
      setUser(userData);
      setLoading(false);
    };

    fetchUser();
  }, []);

  const getUserFromStorage = () => {
    try {
      const userData = localStorage.getItem('bunkmateuser');
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Failed to get user from storage:', error);
      return null;
    }
  };

  const value = {
    user,
    loading,
    setUser,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export const useUser = () => {
  const context = React.useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

export default UserContext;