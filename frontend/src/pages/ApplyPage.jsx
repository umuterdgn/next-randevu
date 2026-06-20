import { useState } from "react";
import api from "../api/client";

export default function ApplyPage() {
  const [form, setForm] = useState({ business_name: "", phone: "", email: "", sector: "", city: "", password: "" });
  const labels = {
    business_name: "İşletme Adı",
    phone: "Telefon",
    email: "E-posta",
    sector: "Sektör",
    city: "Şehir",
  };

  return (
    <div className="min-h-screen bg-linear-to-b from-slate-100 to-slate-50 p-4 md:p-8 flex items-center justify-center">
      <div className="w-full max-w-2xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-slate-800 md:text-4xl">Platforma Katılın</h1>
          <p className="mt-3 text-slate-500">İşletme hesabınızı oluşturmak için başvuru formunu doldurun.</p>
        </div>
        <form
          className="card space-y-5 p-6 md:p-8 shadow-xl shadow-slate-200/50"
          onSubmit={async (e) => {
            e.preventDefault();
            if (form.password.length < 6) return alert("Şifre en az 6 karakter olmalıdır.");
            try {
              await api.post("/applications", form);
              alert("Başvurunuz başarıyla alındı! En kısa sürede iletişime geçeceğiz.");
              setForm({ business_name: "", phone: "", email: "", sector: "", city: "", password: "" });
            } catch (error) {
              alert("Başvuru gönderilemedi: " + (error.response?.data?.message || error.message));
            }
          }}
        >
          <div className="grid gap-5 md:grid-cols-2">
            {Object.keys(form).map((k) => {
              if (k === "password") return null;
              return (
                <div key={k} className={k === "business_name" || k === "email" ? "md:col-span-2" : ""}>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">{labels[k]}</label>
                  <input
                    type={k === "email" ? "email" : "text"}
                    className="input w-full"
                    placeholder={`${labels[k]} giriniz`}
                    value={form[k]}
                    required
                    onChange={(e) => setForm({ ...form, [k]: e.target.value })}
                  />
                </div>
              );
            })}
            <div className="md:col-span-2">
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">Şifre Belirleyin</label>
              <input
                type="password"
                className="input w-full"
                placeholder="Hesabınız için en az 6 karakterli bir şifre girin"
                value={form.password}
                required
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </div>
          </div>
          <button className="btn-primary w-full py-3 mt-4 text-base">Başvuruyu Gönder</button>
        </form>
      </div>
    </div>
  );
}