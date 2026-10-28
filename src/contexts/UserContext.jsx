import { createContext, useContext, useState, useEffect } from 'react';
import { auth, firebaseConfig } from '../firebase';
import {
  getAuthUserFromLocalDb,
  saveAuthUserToLocalDb,
  removeAuthUserFromLocalDb,
  listenToDeviceKillSwitch,
} from '../services/qrAuthService';

const UserContext = createContext();

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};

export const UserProvider = ({ children }) => {
  const [user, setUserState] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem("bunkmates_auth_user");
      } catch (e) {}
      const stored = sessionStorage.getItem("bunkmates_auth_user");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          return parsed.value || parsed;
        } catch (e) {
          return null;
        }
      }
    }
    return null;
  });
  const [loading, setLoading] = useState(() => !user);

  useEffect(() => {
    let isMounted = true;
    const apiKey = firebaseConfig?.apiKey || "AIzaSyCP_l2uREbRMcV6aHhB8yZXK7NdGNltxpA";

    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        if (isMounted) setUserState(firebaseUser);
        saveAuthUserToLocalDb(firebaseUser, apiKey).catch(() => {});
      } else {
        // Fallback: check localdb storage (IndexedDB or localStorage)
        const localUser = await getAuthUserFromLocalDb(apiKey);
        if (localUser && isMounted) {
          setUserState(localUser);
        } else if (isMounted) {
          const stored = sessionStorage.getItem("bunkmates_auth_user");
          if (stored) {
            try {
              setUserState(JSON.parse(stored));
            } catch (e) {
              setUserState(null);
            }
          } else {
            setUserState(null);
          }
        }
      }
      if (isMounted) setLoading(false);
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  // Remote Kill-Switch: Listens for session revocation from mobile Linked Devices
  useEffect(() => {
    if (typeof window === "undefined") return;
    const linkedDeviceId = localStorage.getItem("bunkmates_linked_device_id");
    const linkedUid = localStorage.getItem("bunkmates_linked_uid") || user?.uid;

    if (!linkedDeviceId || !linkedUid) return;

    const unsubKillSwitch = listenToDeviceKillSwitch(linkedUid, linkedDeviceId, () => {
      console.warn("[Kill-Switch] Device session terminated remotely from phone.");
      setUserState(null);
      if (typeof window !== "undefined" && window.location.pathname !== "/auth/login") {
        window.location.href = "/auth/login";
      }
    });

    return () => {
      if (unsubKillSwitch) unsubKillSwitch();
    };
  }, [user?.uid]);

  const setUser = (newUser) => {
    setUserState(newUser);
    const apiKey = firebaseConfig?.apiKey || "AIzaSyCP_l2uREbRMcV6aHhB8yZXK7NdGNltxpA";
    if (typeof window !== "undefined") {
      localStorage.removeItem("bunkmates_auth_user");
      if (newUser) {
        sessionStorage.setItem("bunkmates_auth_user", JSON.stringify(newUser));
        saveAuthUserToLocalDb(newUser, apiKey).catch(() => {});
      } else {
        sessionStorage.removeItem("bunkmates_auth_user");
        removeAuthUserFromLocalDb(apiKey).catch(() => {});
      }
    }
  };

  return (
    <UserContext.Provider value={{ user, loading, setUser }}>
      {children}
    </UserContext.Provider>
  );
};