import { createContext, useEffect, useState } from "react";
import { getProfile } from "../services/authService";

export const AuthContext = createContext();

function AuthProvider({ children }) {

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadUser = async () => {
    try {

      const data = await getProfile();

      setUser(data.user);

    } catch (error) {

      setUser(null);

    } finally {

      setLoading(false);

    }
  };

  useEffect(() => {
    loadUser();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export default AuthProvider;