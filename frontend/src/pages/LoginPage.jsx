import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const { user, login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to={user.role === "owner" ? "/owner" : "/business"} />;

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
            if (error.response?.status === 401) alert("E-posta veya şifre hatalı!");
            else alert("Giriş başarısız: " + error.message);
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
        <button className="btn-dark w-full py-2.5" disabled={loading}>
          {loading ? "Giriş Yapılıyor..." : "Giriş Yap"}
        </button>
      </form>
    </div>
  );
}