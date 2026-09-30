import { createContext, useEffect, useState } from "react";
import { getProfile } from "../services/authService";

export const AuthContext = createContext();

function AuthProvider({ children }) {

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadUser = async () => {
    try {

      console.log("🔵 GETTING PROFILE...");

      const data = await getProfile();

      console.log("🟢 PROFILE RESPONSE:", data);

      if (data.success && data.user) {
        console.log("✅ SETTING USER:", data.user);
        setUser(data.user);
      } else {
        console.log("❌ PROFILE HAS NO USER");
        setUser(null);
      }

    } catch (error) {

      console.log(
        "🔴 PROFILE ERROR:",
        error.response?.status,
        error.response?.data || error.message
      );

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