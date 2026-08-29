import { createContext, useContext, useState } from "react";

const AuthContext = createContext(null);

const STORAGE_KEY = "vox54_session";

function loadSession() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(loadSession);

  function login(data) {
    // data: { access_token, role, name }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    setSession(data);
  }

  function logout() {
    localStorage.removeItem(STORAGE_KEY);
    setSession(null);
  }

  return (
    <AuthContext.Provider value={{ session, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
