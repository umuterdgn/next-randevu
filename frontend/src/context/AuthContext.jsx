import { createContext, useContext, useMemo, useState } from "react";
import api from "../api/client";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  });

  const login = async (email, password) => {
    try {
      // API'ye istek atıyoruz
      const { data } = await api.post("/auth/login", { email, password });
      
      // Başarılı olursa token ve user bilgilerini kaydediyoruz
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      setUser(data.user);
      
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