import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown, Plus, Download } from "lucide-react";
import toast from "react-hot-toast";
import api from "../api/client";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

export default function FinanceComponent() {
  const [transactions, setTransactions] = useState([]);
  const [staff, setStaff] = useState([]);
  const [form, setForm] = useState({
    type: "income",
    amount: "",
    description: "",
    paymentMethod: "Nakit",
    staffId: null,
  });
  const [dateRange, setDateRange] = useState({
    startDate: "",
    endDate: "",
  });

  const loadTransactions = async () => {
    try {
      const [response, staffResponse] = await Promise.all([
        api.get("/business/finance"),
        api.get("/business/staff"),
      ]);
      let filteredTransactions = response.data;
      
      if (dateRange.startDate) {
        filteredTransactions = filteredTransactions.filter(
          (t) => new Date(t.createdAt) >= new Date(dateRange.startDate)
        );
      }
      if (dateRange.endDate) {
        filteredTransactions = filteredTransactions.filter(
          (t) => new Date(t.createdAt) <= new Date(dateRange.endDate)
        );
      }
      
      setTransactions(filteredTransactions);
      setStaff(staffResponse.data);
    } catch (error) {
      console.error("İşlemler yüklenirken hata:", error);
      toast.error(error.response?.data?.message || "İşlemler yüklenirken hata oluştu.");
    }
  };

  useEffect(() => {
    loadTransactions();
  }, [dateRange]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post("/business/finance", {
        type: form.type,
        amount: parseFloat(form.amount),
        description: form.description,
        payment_method: form.paymentMethod,
        staff_id: form.staffId,
      });
      setForm({ type: "income", amount: "", description: "", paymentMethod: "Nakit", staffId: null });
      loadTransactions();
    } catch (error) {
      console.error("İşlem eklenirken hata:", error);
      toast.error(error.response?.data?.message || "İşlem eklenirken hata oluştu.");
    }
  };

  const totalIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  const exportPDF = () => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.text("Finans Raporu", 14, 20);
    
    doc.setFontSize(12);
    doc.text(`Rapor Tarihi: ${new Date().toLocaleDateString("tr-TR")}`, 14, 30);
    doc.text(`Tarih Aralığı: ${dateRange.startDate || "Başlangıç"} - ${dateRange.endDate || "Bugün"}`, 14, 38);
    
    // Summary
    doc.setFontSize(11);
    doc.text(`Toplam Gelir: ₺${totalIncome.toLocaleString()}`, 14, 50);
    doc.text(`Toplam Gider: ₺${totalExpense.toLocaleString()}`, 14, 58);
    doc.text(`Net Bakiye: ₺${(totalIncome - totalExpense).toLocaleString()}`, 14, 66);
    
    // Table
    const tableData = transactions.map((t) => [
      new Date(t.createdAt).toLocaleDateString("tr-TR"),
      t.type === "income" ? "Gelir" : "Gider",
      t.description,
      `₺${t.amount.toLocaleString()}`,
    ]);
    
    autoTable(doc, {
      startY: 75,
      head: [["Tarih", "Tür", "Açıklama", "Tutar"]],
      body: tableData,
      theme: "striped",
      headStyles: {
        fillColor: [59, 130, 246],
        textColor: 255,
        fontSize: 11,
        fontStyle: "bold",
      },
      bodyStyles: {
        fontSize: 10,
      },
      alternateRowStyles: {
        fillColor: [240, 248, 255],
      },
      styles: {
        cellPadding: 3,
        lineColor: [200, 200, 200],
        lineWidth: 0.1,
      },
    });
    
    doc.save("finans-raporu.pdf");
  };

  const exportExcel = () => {
    const data = transactions.map((t) => ({
      Tarih: new Date(t.createdAt).toLocaleDateString("tr-TR"),
      Tür: t.type === "income" ? "Gelir" : "Gider",
      Açıklama: t.description,
      Tutar: t.amount,
    }));
    
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Finans");
    
    // Auto-width columns
    const colWidths = Object.keys(data[0] || {}).map((key) => ({
      wch: Math.max(key.length, ...data.map((row) => String(row[key]).length)) + 2,
    }));
    ws['!cols'] = colWidths;
    
    // Bold headers
    const headerRange = XLSX.utils.decode_range(ws['!ref']);
    for (let C = headerRange.s.c; C <= headerRange.e.c; ++C) {
      const address = XLSX.utils.encode_cell({ r: headerRange.s.r, c: C });
      if (!ws[address]) continue;
      ws[address].s = {
        font: { bold: true },
        fill: { fgColor: { rgb: "4472C4" } },
      };
    }
    
    XLSX.writeFile(wb, "finans-raporu.xlsx");
  };

  return (
    <div className="animate-in fade-in duration-300">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Finans</h2>
        <div className="flex gap-2">
          <button onClick={exportPDF} className="btn-secondary flex items-center gap-2">
            <Download className="w-4 h-4" /> PDF İndir
          </button>
          <button onClick={exportExcel} className="btn-secondary flex items-center gap-2">
            <Download className="w-4 h-4" /> Excel İndir
          </button>
        </div>
      </div>

      {/* Date Range Filter */}
      <div className="card mb-6">
        <h3 className="mb-4 font-semibold text-slate-700">Tarih Filtresi</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Başlangıç Tarihi</label>
            <input
              type="date"
              className="input w-full"
              value={dateRange.startDate}
              onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Bitiş Tarihi</label>
            <input
              type="date"
              className="input w-full"
              value={dateRange.endDate}
              onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
            />
          </div>
        </div>
      </div>

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
      <div className="card mb-8">
        <h3 className="mb-4 font-semibold text-slate-700">Yeni İşlem Ekle</h3>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Ödeme Yöntemi</label>
            <select
              className="input w-full"
              value={form.paymentMethod}
              onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
            >
              <option value="Nakit">Nakit</option>
              <option value="Kredi Kartı">Kredi Kartı</option>
              <option value="IBAN/EFT">IBAN/EFT</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">İşlemi Yapan Personel/Bayi</label>
            <select
              className="input w-full"
              value={form.staffId || ""}
              onChange={(e) => setForm({ ...form, staffId: e.target.value || null })}
            >
              <option value="">Seçiniz (Opsiyonel)</option>
              {staff.filter(s => s.is_active).map(s => (
                <option key={s._id} value={s._id}>
                  {s.name} ({s.role === 'dealer' ? 'Bayi' : 'Personel'})
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button type="submit" className="btn-primary w-full flex items-center justify-center gap-2">
              <Plus className="w-4 h-4" /> Ekle
            </button>
          </div>
        </form>
      </div>

      {/* Transactions List */}
      <div className="card">
        <h3 className="mb-4 font-semibold text-slate-700">İşlem Geçmişi</h3>
        {transactions.length === 0 ? (
          <p className="text-slate-500 text-center py-8">Henüz işlem yok.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Tarih</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Tür</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Açıklama</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Ödeme Yöntemi</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">İşlemi Yapan</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase">Tutar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {transactions.map((t) => {
                  const staffMember = staff.find(s => s._id === t.staff_id);
                  return (
                    <tr key={t._id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {new Date(t.createdAt).toLocaleDateString("tr-TR")}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            t.type === "income"
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {t.type === "income" ? "Gelir" : "Gider"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-800">{t.description}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{t.payment_method || "Nakit"}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{staffMember ? staffMember.name : "-"}</td>
                      <td className={`px-4 py-3 text-right font-semibold ${
                        t.type === "income" ? "text-emerald-600" : "text-red-600"
                      }`}>
                        {t.type === "income" ? "+" : "-"}₺{t.amount.toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
