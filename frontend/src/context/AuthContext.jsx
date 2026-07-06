import { createContext, useContext, useMemo, useState } from "react";
import api from "../api/client";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  });

  const login = async (emailOrUser, passwordOrToken) => {
    try {
      // Check if first argument is a user object (SSO case) or email string (normal login)
      if (typeof emailOrUser === 'object' && emailOrUser !== null) {
        // SSO login - user object and token provided directly
        const user = emailOrUser;
        const token = passwordOrToken;

        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(user));
        setUser(user);
      } else {
        // Normal login - email and password provided
        const email = emailOrUser;
        const password = passwordOrToken;

        // API'ye istek atıyoruz
        const { data } = await api.post("/auth/login", { email, password });

        // Başarılı olursa token ve user bilgilerini kaydediyoruz
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        setUser(data.user);
      }

    } catch (error) {
      // Hata oluşursa konsola yazdır (geliştirme aşamasında görmek için)
      console.error("Giriş işlemi başarısız:", error.response?.data || error.message);

      // Hatayı Login (App.jsx) bileşenine fırlat ki orada kullanıcıya uyarı gösterebilelim
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  const value = useMemo(() => ({ user, login, logout }), [user]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);