import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../api/client";

export default function ResetPasswordPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error("Şifreler eşleşmiyor!");
      return;
    }

    if (password.length < 6) {
      toast.error("Şifre en az 6 karakter olmalı!");
      return;
    }

    setLoading(true);
    try {
      await api.put(`/auth/reset-password/${token}`, { password });
      toast.success("Şifreniz başarıyla sıfırlandı! Giriş yapabilirsiniz.");
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (error) {
      toast.error(error.response?.data?.message || "Şifre sıfırlama başarısız oldu. Link geçersiz veya süresi dolmuş olabilir.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center bg-linear-to-b from-slate-100 to-slate-50 p-4">
      <div className="card w-full max-w-md space-y-5 p-8 shadow-xl shadow-slate-200/50">
        <div className="text-center mb-4">
          <h2 className="text-3xl font-bold tracking-tight text-slate-800">Şifre Sıfırla</h2>
          <p className="mt-2 text-sm text-slate-500">Yeni şifrenizi belirleyin</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">Yeni Şifre</label>
            <input
              className="input w-full"
              type="password"
              placeholder="••••••••"
              value={password}
              required
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">Şifre Tekrar</label>
            <input
              className="input w-full"
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              required
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="btn-dark w-full py-2.5"
          >
            {loading ? "İşleniyor..." : "Şifreyi Sıfırla"}
          </button>
        </form>
        <div className="text-center pt-2">
          <button
            type="button"
            onClick={() => navigate("/login")}
            className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
          >
            Giriş Sayfasına Dön
          </button>
        </div>
      </div>
    </div>
  );
}
