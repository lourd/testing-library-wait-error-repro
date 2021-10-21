import { useEffect, useState, createContext, useContext } from "react";

import { authenticateOrRedirect } from "./auth";

const initialAuthState = {
  accessToken: null,
  idToken: null,
  expiresAt: null,
  tokenRenewalTimeoutId: null,
  useAuthlessToken: false,
};

const AuthContext = createContext(initialAuthState);

export const AuthProvider = ({ children }) => {
  const [authState, setAuthState] = useState(initialAuthState);
  useEffect(() => {
    authenticateOrRedirect()
      .then(setAuthState)
      .catch((error) => setAuthState((prev) => ({ ...prev, error })));
  }, []);

  return (
    <AuthContext.Provider value={authState}>{children}</AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
