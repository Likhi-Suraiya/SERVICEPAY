// src/context/AuthContext.jsx
// Staff-only auth context for the BLIL Lift Service project.
// No partner / balance / order logic — just user, menu, login, logout,
// and a 25-minute inactivity timeout.

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  useCallback,
} from "react";

const AuthContext = createContext(null);
const SESSION_TIMEOUT = 25 * 60 * 1000; // 25 minutes

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(undefined); // undefined = not loaded yet, null = logged out
  const [menuData, setMenuData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const timeoutRef = useRef(null);
  const lastActivityRef = useRef(Date.now());

  //======================= Session timeout =======================

  const resetSessionTimeout = useCallback(() => {
    lastActivityRef.current = Date.now();
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => handleSessionTimeout(), SESSION_TIMEOUT);
    // keep the stored activity time fresh too
    const storage = localStorage.getItem("user") ? localStorage : sessionStorage;
    storage.setItem("lastActivity", Date.now().toString());
  }, []);

  const handleSessionTimeout = useCallback(() => {
    if (window.showToast) {
      window.showToast(
        "Session expired due to inactivity. Please login again.",
        "warning"
      );
    }
    logout();
    if (window.navigateToLogin) window.navigateToLogin();
  }, []);

  const trackUserActivity = useCallback(() => {
    resetSessionTimeout();
  }, [resetSessionTimeout]);

  // Attach activity listeners only while logged in
  useEffect(() => {
    if (!user) return;

    const events = [
      "mousedown",
      "mousemove",
      "keypress",
      "scroll",
      "touchstart",
      "click",
    ];
    events.forEach((e) => document.addEventListener(e, trackUserActivity, true));
    resetSessionTimeout();

    return () => {
      events.forEach((e) =>
        document.removeEventListener(e, trackUserActivity, true)
      );
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [user, trackUserActivity, resetSessionTimeout]);

  //======================= Load saved session on startup =======================

  const loadAuthData = useCallback(() => {
    try {
      const storage = localStorage.getItem("user") ? localStorage : sessionStorage;
      const storedUser = storage.getItem("user");
      const storedMenu = storage.getItem("menu");
      const lastActivity = storage.getItem("lastActivity");

      // Expire the session if the saved activity is too old
      if (lastActivity && Date.now() - parseInt(lastActivity) > SESSION_TIMEOUT) {
        logout();
        return;
      }

      if (storedUser) {
        setUser(JSON.parse(storedUser));
      } else {
        setUser(null);
      }
      setMenuData(storedMenu ? JSON.parse(storedMenu) : []);
    } catch (err) {
      console.error("Error loading auth data:", err);
      setUser(null);
      setMenuData([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAuthData();
  }, [loadAuthData]);

  //======================= Login / Logout =======================

  // Call after a successful API login.
  //   userData  : { staffId, staffName, site, role }
  //   menu      : array for the sidebar
  //   rememberMe: true → localStorage (persists), false → sessionStorage
  const login = useCallback(
    (userData, menu, rememberMe = false) => {
      setUser(userData);
      setMenuData(menu);

      const storage = rememberMe ? localStorage : sessionStorage;
      // clear the other store so we never read a stale session
      (rememberMe ? sessionStorage : localStorage).clear();

      storage.setItem("user", JSON.stringify(userData));
      storage.setItem("menu", JSON.stringify(menu));
      storage.setItem("lastActivity", Date.now().toString());

      resetSessionTimeout();
    },
    [resetSessionTimeout]
  );

  const logout = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setUser(null);
    setMenuData(null);
    localStorage.clear();
    sessionStorage.clear();
  }, []);

  //======================= Session helpers (optional) =======================

  const getRemainingSessionTime = useCallback(() => {
    if (!user) return 0;
    const remaining = SESSION_TIMEOUT - (Date.now() - lastActivityRef.current);
    return Math.max(0, remaining);
  }, [user]);

  const extendSession = useCallback(() => {
    if (user) resetSessionTimeout();
  }, [user, resetSessionTimeout]);

  return (
    <AuthContext.Provider
      value={{
        user,
        menuData,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        resetSessionTimeout,
        extendSession,
        getRemainingSessionTime,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
