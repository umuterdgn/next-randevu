import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import api from "../api/client";

export default function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);

  if (user) {
    if (user.role === "owner") return <Navigate to="/owner" />;
    if (user.role === "business") return <Navigate to="/business" />;
    return <Navigate to="/business" />;
  }

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setForgotLoading(true);
    try {
      await api.post("/auth/forgot-password", { email: forgotEmail });
      toast.success("Şifre sıfırlama bağlantısı e-postanıza gönderildi!");
      setShowForgotPassword(false);
      setForgotEmail("");
    } catch (error) {
      toast.error("Bir hata oluştu. Lütfen tekrar deneyin.");
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center bg-linear-to-b from-slate-100 to-slate-50 p-4">
      <form
        className="card w-full max-w-md space-y-5 p-8 shadow-xl shadow-slate-200/50"
        onSubmit={async (e) => {
          e.preventDefault();
          setLoading(true);
          try {
            await login(email, password);
          } catch (error) {
            if (error.response?.status === 401) toast.error("E-posta veya şifre hatalı!");
            else toast.error("Giriş başarısız: " + error.message);
          } finally {
            setLoading(false);
          }
        }}
      >
        <div className="text-center mb-4">
          <h2 className="text-3xl font-bold tracking-tight text-slate-800">Hoş Geldiniz</h2>
          <p className="mt-2 text-sm text-slate-500">Yönetim paneline erişmek için giriş yapın.</p>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-slate-700">E-posta</label>
          <input className="input w-full" type="email" placeholder="ornek@sirket.com" value={email} required onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-slate-700">Şifre</label>
          <input className="input w-full" placeholder="••••••••" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <div className="text-right">
          <button
            type="button"
            onClick={() => setShowForgotPassword(true)}
            className="text-sm text-blue-600 hover:text-blue-800 hover:underline transition-colors"
          >
            Şifremi Unuttum
          </button>
        </div>
        <button className="btn-dark w-full py-2.5" disabled={loading}>
          {loading ? "Giriş Yapılıyor..." : "Giriş Yap"}
        </button>
        <div className="text-center pt-2">
          <button
            type="button"
            onClick={() => navigate("/agent")}
            className="text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
          >
            Satış Ekibi / Bayi Girişi
          </button>
        </div>
      </form>

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-slate-800">Şifremi Unuttum</h3>
              <p className="mt-2 text-sm text-slate-500">E-posta adresinizi girin, şifre sıfırlama bağlantısı gönderelim.</p>
            </div>
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">E-posta</label>
                <input
                  className="input w-full"
                  type="email"
                  placeholder="ornek@sirket.com"
                  value={forgotEmail}
                  required
                  onChange={(e) => setForgotEmail(e.target.value)}
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotPassword(false);
                    setForgotEmail("");
                  }}
                  className="flex-1 py-2.5 px-4 border-2 border-slate-200 rounded-xl font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="flex-1 py-2.5 px-4 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {forgotLoading ? "Gönderiliyor..." : "Gönder"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}