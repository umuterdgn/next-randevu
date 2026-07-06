import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";

export default function SSOPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    const handleSSO = async () => {
      const token = searchParams.get("token");

      if (!token) {
        console.error("SSO token not found");
        navigate("/login");
        return;
      }

      try {
        const response = await api.get(`/auth/sso?token=${token}`);

        if (response.data.success) {
          // Store auth data using the auth context
          login(response.data.user, response.data.token);

          // Redirect based on Business existence
          const redirectPath = response.data.redirect || '/business';
          navigate(redirectPath);
        } else {
          console.error("SSO login failed:", response.data.message);
          navigate("/login");
        }
      } catch (error) {
        console.error("SSO error:", error);
        navigate("/login");
      }
    };

    handleSSO();
  }, [searchParams, navigate, login]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-slate-600 text-lg">Giriş yapılıyor...</p>
      </div>
    </div>
  );
}
