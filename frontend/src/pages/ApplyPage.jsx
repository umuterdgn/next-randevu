import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";

export default function ApplyPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ business_name: "", phone: "", email: "", sector: "", city: "" });
  const [loading, setLoading] = useState(false);
  const labels = {
    business_name: "İşletme Adı",
    phone: "Telefon",
    email: "E-posta",
    sector: "Sektör",
    city: "Şehir",
  };

  // Pre-fill form with user data from SSO
  useEffect(() => {
    if (user) {
      setForm(prev => ({
        ...prev,
        email: user.email || "",
        phone: user.phone || "",
        business_name: user.name ? `${user.name} İşletmesi` : ""
      }));
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Create Business and link to existing User
      const response = await api.post("/business/create-from-user", {
        business_name: form.business_name,
        phone: form.phone,
        email: form.email,
        sector: form.sector,
        city: form.city,
      });

      if (response.data.success) {
        // Update user in auth context with new business_id
        localStorage.setItem("user", JSON.stringify(response.data.user));
        window.location.reload(); // Reload to update auth state
      }
    } catch (error) {
      alert("İşletme oluşturulamadı: " + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-b from-slate-100 to-slate-50 p-4 md:p-8 flex items-center justify-center">
      <div className="w-full max-w-2xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-slate-800 md:text-4xl">İşletmenizi Kurun</h1>
          <p className="mt-3 text-slate-500">SSO ile giriş yaptınız. İşletmenizi oluşturmak için bilgileri tamamlayın.</p>
        </div>
        <form
          className="card space-y-5 p-6 md:p-8 shadow-xl shadow-slate-200/50"
          onSubmit={handleSubmit}
        >
          <div className="grid gap-5 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">{labels.business_name}</label>
              <input
                type="text"
                className="input w-full"
                placeholder={`${labels.business_name} giriniz`}
                value={form.business_name}
                required
                onChange={(e) => setForm({ ...form, business_name: e.target.value })}
              />
            </div>
            <div className="md:col-span-2">
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">{labels.email}</label>
              <input
                type="email"
                className="input w-full bg-slate-50"
                placeholder="E-posta adresi"
                value={form.email}
                readOnly
              />
              <p className="text-xs text-slate-500 mt-1">SSO ile gelen e-posta (değiştirilemez)</p>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">{labels.phone}</label>
              <input
                type="text"
                className="input w-full bg-slate-50"
                placeholder="Telefon numarası"
                value={form.phone}
                readOnly
              />
              <p className="text-xs text-slate-500 mt-1">SSO ile gelen telefon (değiştirilemez)</p>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">{labels.sector}</label>
              <input
                type="text"
                className="input w-full"
                placeholder="Sektör giriniz"
                value={form.sector}
                required
                onChange={(e) => setForm({ ...form, sector: e.target.value })}
              />
            </div>
            <div className="md:col-span-2">
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">{labels.city}</label>
              <input
                type="text"
                className="input w-full"
                placeholder="Şehir giriniz"
                value={form.city}
                required
                onChange={(e) => setForm({ ...form, city: e.target.value })}
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-3 mt-4 text-base disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "İşleniyor..." : "İşletmeyi Oluştur"}
          </button>
        </form>
      </div>
    </div>
  );
}
