import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown, Plus } from "lucide-react";
import api from "../api/client";

export default function FinancePage() {
  const [transactions, setTransactions] = useState([]);
  const [form, setForm] = useState({
    type: "income",
    amount: "",
    description: "",
  });

  const loadTransactions = async () => {
    try {
      const response = await api.get("/business/finance");
      setTransactions(response.data);
    } catch (error) {
      console.error("İşlemler yüklenirken hata:", error);
    }
  };

  useEffect(() => {
    loadTransactions();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post("/business/finance", form);
      setForm({ type: "income", amount: "", description: "" });
      loadTransactions();
    } catch (error) {
      console.error("İşlem eklenirken hata:", error);
      alert("İşlem eklenirken hata oluştu.");
    }
  };

  const totalIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-slate-800 mb-8">Finans</h1>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="w-6 h-6 text-emerald-600" />
              <span className="text-emerald-700 font-semibold">Toplam Gelir</span>
            </div>
            <p className="text-3xl font-bold text-emerald-800">
              ₺{totalIncome.toLocaleString()}
            </p>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <TrendingDown className="w-6 h-6 text-red-600" />
              <span className="text-red-700 font-semibold">Toplam Gider</span>
            </div>
            <p className="text-3xl font-bold text-red-800">
              ₺{totalExpense.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Add Transaction Form */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-slate-800 mb-4">Yeni İşlem Ekle</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Tür</label>
              <select
                className="input w-full"
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
              >
                <option value="income">Gelir</option>
                <option value="expense">Gider</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Tutar</label>
              <input
                type="number"
                className="input w-full"
                placeholder="0.00"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Açıklama</label>
              <input
                type="text"
                className="input w-full"
                placeholder="Açıklama"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                required
              />
            </div>
            <div className="flex items-end">
              <button type="submit" className="btn-primary w-full flex items-center justify-center gap-2">
                <Plus className="w-4 h-4" /> Ekle
              </button>
            </div>
          </form>
        </div>

        {/* Transactions List */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold text-slate-800 mb-4">İşlem Geçmişi</h2>
          {transactions.length === 0 ? (
            <p className="text-slate-500 text-center py-8">Henüz işlem yok.</p>
          ) : (
            <div className="space-y-3">
              {transactions.map((t) => (
                <div
                  key={t._id}
                  className={`flex items-center justify-between p-4 rounded-lg border ${
                    t.type === "income"
                      ? "bg-emerald-50 border-emerald-200"
                      : "bg-red-50 border-red-200"
                  }`}
                >
                  <div>
                    <p className="font-semibold text-slate-800">{t.description}</p>
                    <p className="text-sm text-slate-500">
                      {new Date(t.createdAt).toLocaleDateString("tr-TR")}
                    </p>
                  </div>
                  <span
                    className={`font-bold ${
                      t.type === "income" ? "text-emerald-600" : "text-red-600"
                    }`}
                  >
                    {t.type === "income" ? "+" : "-"}₺{t.amount.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
