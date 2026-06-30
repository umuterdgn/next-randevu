import { useEffect, useState } from "react";
import { CreditCard, Wallet, DollarSign, X, Plus, Building, User, Eye, Download, ArrowDown } from "lucide-react";
import toast from "react-hot-toast";
import api from "../api/client";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

export default function CariComponent() {
  const [activeTab, setActiveTab] = useState("customers");
  const [customers, setCustomers] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [cariData, setCariData] = useState([]);
  const [showAddSupplierModal, setShowAddSupplierModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showAddDebtModal, setShowAddDebtModal] = useState(false);
  const [selectedEntity, setSelectedEntity] = useState(null);
  const [selectedCari, setSelectedCari] = useState(null);
  const [supplierForm, setSupplierForm] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    note: "",
  });
  const [paymentForm, setPaymentForm] = useState({
    amount: "",
    paymentMethod: "cash",
  });
  const [debtForm, setDebtForm] = useState({
    amount: "",
    description: "",
  });

  const loadCustomers = async () => {
    try {
      const response = await api.get("/business/customers");
      setCustomers(response.data);
    } catch (error) {
      console.error("Müşteriler yüklenirken hata:", error);
      toast.error(error.response?.data?.message || "Müşteriler yüklenirken hata oluştu.");
    }
  };

  const loadSuppliers = async () => {
    try {
      const response = await api.get("/business/suppliers");
      setSuppliers(response.data);
    } catch (error) {
      console.error("Tedarikçiler yüklenirken hata:", error);
      toast.error(error.response?.data?.message || "Tedarikçiler yüklenirken hata oluştu.");
    }
  };

  const loadCariData = async () => {
    try {
      const response = await api.get("/business/cari");
      setCariData(response.data);
    } catch (error) {
      console.error("Cari verileri yüklenirken hata:", error);
      toast.error(error.response?.data?.message || "Cari verileri yüklenirken hata oluştu.");
    }
  };

  useEffect(() => {
    loadCustomers();
    loadSuppliers();
    loadCariData();
  }, []);

  const handleAddSupplier = async (e) => {
    e.preventDefault();
    try {
      await api.post("/business/suppliers", supplierForm);
      setShowAddSupplierModal(false);
      setSupplierForm({ name: "", phone: "", email: "", address: "", note: "" });
      loadSuppliers();
      toast.success("Tedarikçi başarıyla eklendi!");
    } catch (error) {
      console.error("Tedarikçi eklenirken hata:", error);
      toast.error(error.response?.data?.message || "Tedarikçi eklenirken hata oluştu.");
    }
  };

  const handleDetail = async (entity, entityType) => {
    try {
      const response = await api.get(`/business/cari/${entityType}/${entity._id}`);
      setSelectedEntity(entity);
      setSelectedCari(response.data);
      setShowDetailModal(true);
    } catch (error) {
      console.error("Detay yüklenirken hata:", error);
      // Fallback: use entity info directly if API fails
      setSelectedEntity(entity);
      setSelectedCari({
        entity_type: entityType,
        entity_id: entity._id,
        total_debt: 0,
        total_paid: 0,
        total_balance: 0,
        transactions: [],
      });
      setShowDetailModal(true);
    }
  };

  const handlePayment = async (e) => {
    e.preventDefault();
    try {
      await api.post("/business/cari/payment", {
        entity_type: selectedCari.entity_type,
        entity_id: selectedCari.entity_id,
        amount: parseFloat(paymentForm.amount),
        payment_method: paymentForm.paymentMethod,
      });
      setPaymentForm({ amount: "", paymentMethod: "cash" });
      loadCariData();
      const response = await api.get(`/business/cari/${selectedCari.entity_type}/${selectedCari.entity_id}`);
      setSelectedCari(response.data);
      toast.success("Ödeme başarıyla kaydedildi!");
    } catch (error) {
      console.error("Ödeme kaydedilirken hata:", error);
      toast.error(error.response?.data?.message || "Ödeme kaydedilirken hata oluştu.");
    }
  };

  const handleAddDebt = async (e) => {
    e.preventDefault();
    try {
      await api.post("/business/cari/debt", {
        entity_type: selectedCari.entity_type,
        entity_id: selectedCari.entity_id,
        amount: parseFloat(debtForm.amount),
        description: debtForm.description,
      });
      setDebtForm({ amount: "", description: "" });
      setShowAddDebtModal(false);
      loadCariData();
      const response = await api.get(`/business/cari/${selectedCari.entity_type}/${selectedCari.entity_id}`);
      setSelectedCari(response.data);
      toast.success("Borç başarıyla eklendi!");
    } catch (error) {
      console.error("Borç eklenirken hata:", error);
      console.error("Error details:", error.response?.data);
      toast.error(error.response?.data?.message || "Borç eklenirken hata oluştu.");
    }
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.text("Cari Hesap Raporu", 14, 20);
    
    doc.setFontSize(12);
    doc.text(`Rapor Tarihi: ${new Date().toLocaleDateString("tr-TR")}`, 14, 30);
    
    // Summary
    doc.setFontSize(11);
    doc.text(`Toplam Borç: ₺${totalDebt.toLocaleString()}`, 14, 42);
    doc.text(`Toplam Ödenen: ₺${totalPaid.toLocaleString()}`, 14, 50);
    doc.text(`Toplam Bakiye: ₺${totalBalance.toLocaleString()}`, 14, 58);
    
    // Customers Table
    const customerData = customers.map((customer) => {
      const cari = getCariForEntity(customer._id, "customer");
      return [
        customer.name,
        customer.phone,
        `₺${(cari?.total_debt || 0).toLocaleString()}`,
        `₺${(cari?.total_paid || 0).toLocaleString()}`,
        `₺${(cari?.total_balance || 0).toLocaleString()}`,
      ];
    });
    
    if (customerData.length > 0) {
      autoTable(doc, {
        startY: 68,
        head: [["Müşteri", "Telefon", "Toplam Borç", "Ödenen", "Bakiye"]],
        body: customerData,
        theme: "striped",
        headStyles: {
          fillColor: [59, 130, 246],
          textColor: 255,
          fontSize: 10,
          fontStyle: "bold",
        },
        bodyStyles: {
          fontSize: 9,
        },
        alternateRowStyles: {
          fillColor: [240, 248, 255],
        },
        styles: {
          cellPadding: 2,
          lineColor: [200, 200, 200],
          lineWidth: 0.1,
        },
      });
    }
    
    // Suppliers Table
    const supplierData = suppliers.map((supplier) => {
      const cari = getCariForEntity(supplier._id, "supplier");
      return [
        supplier.name,
        supplier.phone || "-",
        `₺${(cari?.total_debt || 0).toLocaleString()}`,
        `₺${(cari?.total_paid || 0).toLocaleString()}`,
        `₺${(cari?.total_balance || 0).toLocaleString()}`,
      ];
    });
    
    if (supplierData.length > 0) {
      const finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 10 : 68;
      autoTable(doc, {
        startY: finalY,
        head: [["Tedarikçi", "Telefon", "Toplam Borç", "Ödenen", "Bakiye"]],
        body: supplierData,
        theme: "striped",
        headStyles: {
          fillColor: [59, 130, 246],
          textColor: 255,
          fontSize: 10,
          fontStyle: "bold",
        },
        bodyStyles: {
          fontSize: 9,
        },
        alternateRowStyles: {
          fillColor: [240, 248, 255],
        },
        styles: {
          cellPadding: 2,
          lineColor: [200, 200, 200],
          lineWidth: 0.1,
        },
      });
    }
    
    doc.save("cari-raporu.pdf");
  };

  const exportExcel = () => {
    const customerData = customers.map((customer) => {
      const cari = getCariForEntity(customer._id, "customer");
      return {
        Tür: "Müşteri",
        Ad: customer.name,
        Telefon: customer.phone,
        "Toplam Borç": cari?.total_debt || 0,
        Ödenen: cari?.total_paid || 0,
        Bakiye: cari?.total_balance || 0,
      };
    });
    
    const supplierData = suppliers.map((supplier) => {
      const cari = getCariForEntity(supplier._id, "supplier");
      return {
        Tür: "Tedarikçi",
        Ad: supplier.name,
        Telefon: supplier.phone || "-",
        "Toplam Borç": cari?.total_debt || 0,
        Ödenen: cari?.total_paid || 0,
        Bakiye: cari?.total_balance || 0,
      };
    });
    
    const data = [...customerData, ...supplierData];
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Cari");
    
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
    
    XLSX.writeFile(wb, "cari-raporu.xlsx");
  };

  const getCariForEntity = (entityId, entityType) => {
    return cariData.find(c => c.entity_id === entityId && c.entity_type === entityType);
  };

  const totalDebt = cariData.reduce((sum, c) => sum + (c.total_debt || 0), 0);
  const totalPaid = cariData.reduce((sum, c) => sum + (c.total_paid || 0), 0);
  const totalBalance = cariData.reduce((sum, c) => sum + (c.total_balance || 0), 0);

  return (
    <div className="animate-in fade-in duration-300">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Cari Hesaplar</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setShowAddSupplierModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Tedarikçi Ekle
          </button>
          <button onClick={exportPDF} className="btn-secondary flex items-center gap-2">
            <Download className="w-4 h-4" /> PDF İndir
          </button>
          <button onClick={exportExcel} className="btn-secondary flex items-center gap-2">
            <Download className="w-4 h-4" /> Excel İndir
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-red-500">
          <div className="flex items-center gap-3 mb-2">
            <DollarSign className="w-6 h-6 text-red-600" />
            <span className="text-slate-600 font-semibold">Toplam Borç</span>
          </div>
          <p className="text-3xl font-bold text-red-600">
            ₺{totalDebt.toLocaleString()}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-emerald-500">
          <div className="flex items-center gap-3 mb-2">
            <Wallet className="w-6 h-6 text-emerald-600" />
            <span className="text-slate-600 font-semibold">Toplam Ödenen</span>
          </div>
          <p className="text-3xl font-bold text-emerald-600">
            ₺{totalPaid.toLocaleString()}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
          <div className="flex items-center gap-3 mb-2">
            <CreditCard className="w-6 h-6 text-blue-600" />
            <span className="text-slate-600 font-semibold">Toplam Bakiye</span>
          </div>
          <p className="text-3xl font-bold text-blue-600">
            ₺{totalBalance.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab("customers")}
          className={`flex-1 py-2 px-4 rounded-lg font-medium transition ${
            activeTab === "customers"
              ? "bg-indigo-600 text-white"
              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
          }`}
        >
          <User className="w-4 h-4 inline mr-2" />
          Müşteriler
        </button>
        <button
          onClick={() => setActiveTab("suppliers")}
          className={`flex-1 py-2 px-4 rounded-lg font-medium transition ${
            activeTab === "suppliers"
              ? "bg-indigo-600 text-white"
              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
          }`}
        >
          <Building className="w-4 h-4 inline mr-2" />
          Tedarikçiler
        </button>
      </div>

      {/* Customer Table */}
      {activeTab === "customers" && (
        <div className="card overflow-hidden">
          <div className="p-6 border-b border-slate-200">
            <h3 className="text-xl font-semibold text-slate-800">Müşteri Cari Hesapları</h3>
          </div>
          {customers.length === 0 ? (
            <div className="p-8 text-center text-slate-500">Müşteri bulunmuyor.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Müşteri</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Telefon</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-slate-600 uppercase">Toplam Borç</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-slate-600 uppercase">Ödenen</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-slate-600 uppercase">Bakiye</th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-slate-600 uppercase">Durum</th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-slate-600 uppercase">İşlem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {customers.map((customer) => {
                    const cari = getCariForEntity(customer._id, "customer");
                    const balance = cari?.total_balance || 0;
                    const isDebtClosed = balance === 0;
                    return (
                      <tr key={customer._id} className="hover:bg-slate-50">
                        <td className="px-6 py-4">
                          <div className="font-medium text-slate-800">{customer.name}</div>
                        </td>
                        <td className="px-6 py-4 text-slate-600">{customer.phone}</td>
                        <td className="px-6 py-4 text-right font-semibold text-red-600">
                          ₺{(cari?.total_debt || 0).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-right font-semibold text-emerald-600">
                          ₺{(cari?.total_paid || 0).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-right font-semibold text-blue-600">
                          ₺{balance.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-center">
                          {isDebtClosed ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                              Borç Kapatıldı
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                              ₺{balance.toLocaleString()}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => handleDetail(customer, "customer")}
                            className="btn-primary text-sm px-4 py-2 flex items-center gap-2"
                          >
                            <Eye className="w-4 h-4" /> Detay
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Supplier Table */}
      {activeTab === "suppliers" && (
        <div className="card overflow-hidden">
          <div className="p-6 border-b border-slate-200">
            <h3 className="text-xl font-semibold text-slate-800">Tedarikçi Cari Hesapları</h3>
          </div>
          {suppliers.length === 0 ? (
            <div className="p-8 text-center text-slate-500">Tedarikçi bulunmuyor.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Tedarikçi</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Telefon</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-slate-600 uppercase">Toplam Borç</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-slate-600 uppercase">Ödenen</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-slate-600 uppercase">Bakiye</th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-slate-600 uppercase">Durum</th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-slate-600 uppercase">İşlem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {suppliers.map((supplier) => {
                    const cari = getCariForEntity(supplier._id, "supplier");
                    const balance = cari?.total_balance || 0;
                    const isDebtClosed = balance === 0;
                    return (
                      <tr key={supplier._id} className="hover:bg-slate-50">
                        <td className="px-6 py-4">
                          <div className="font-medium text-slate-800">{supplier.name}</div>
                        </td>
                        <td className="px-6 py-4 text-slate-600">{supplier.phone || "-"}</td>
                        <td className="px-6 py-4 text-right font-semibold text-red-600">
                          ₺{(cari?.total_debt || 0).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-right font-semibold text-emerald-600">
                          ₺{(cari?.total_paid || 0).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-right font-semibold text-blue-600">
                          ₺{balance.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-center">
                          {isDebtClosed ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                              Borç Kapatıldı
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                              ₺{balance.toLocaleString()}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => handleDetail(supplier, "supplier")}
                            className="btn-primary text-sm px-4 py-2 flex items-center gap-2"
                          >
                            <Eye className="w-4 h-4" /> Detay
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Add Supplier Modal */}
      {showAddSupplierModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-slate-800">Tedarikçi Ekle</h3>
                <button
                  onClick={() => {
                    setShowAddSupplierModal(false);
                    setSupplierForm({ name: "", phone: "", email: "", address: "", note: "" });
                  }}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleAddSupplier} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Ad</label>
                  <input
                    type="text"
                    className="input w-full"
                    placeholder="Tedarikçi adı"
                    value={supplierForm.name}
                    onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Telefon</label>
                  <input
                    type="text"
                    className="input w-full"
                    placeholder="Telefon"
                    value={supplierForm.phone}
                    onChange={(e) => setSupplierForm({ ...supplierForm, phone: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">E-posta</label>
                  <input
                    type="email"
                    className="input w-full"
                    placeholder="E-posta"
                    value={supplierForm.email}
                    onChange={(e) => setSupplierForm({ ...supplierForm, email: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Adres</label>
                  <input
                    type="text"
                    className="input w-full"
                    placeholder="Adres"
                    value={supplierForm.address}
                    onChange={(e) => setSupplierForm({ ...supplierForm, address: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Not</label>
                  <textarea
                    className="input w-full h-20 resize-none"
                    placeholder="Not"
                    value={supplierForm.note}
                    onChange={(e) => setSupplierForm({ ...supplierForm, note: e.target.value })}
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddSupplierModal(false);
                      setSupplierForm({ name: "", phone: "", email: "", address: "", note: "" });
                    }}
                    className="flex-1 py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
                  >
                    İptal
                  </button>
                  <button type="submit" className="flex-1 btn-primary">
                    Ekle
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedEntity && selectedCari && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-slate-800">
                  {selectedEntity.name} - Detay
                </h3>
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    setSelectedEntity(null);
                    setSelectedCari(null);
                  }}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Summary */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-red-50 rounded-lg p-4 text-center">
                  <p className="text-sm text-slate-600">Toplam Borç</p>
                  <p className="text-2xl font-bold text-red-600">
                    ₺{(selectedCari.total_debt || 0).toLocaleString()}
                  </p>
                </div>
                <div className="bg-emerald-50 rounded-lg p-4 text-center">
                  <p className="text-sm text-slate-600">Ödenen</p>
                  <p className="text-2xl font-bold text-emerald-600">
                    ₺{(selectedCari.total_paid || 0).toLocaleString()}
                  </p>
                </div>
                <div className="bg-blue-50 rounded-lg p-4 text-center">
                  <p className="text-sm text-slate-600">Kalan Borç</p>
                  <p className="text-2xl font-bold text-blue-600">
                    ₺{(selectedCari.total_balance || 0).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Transaction History */}
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-slate-800 mb-4">İşlem Geçmişi</h4>
                {selectedCari.transactions && selectedCari.transactions.length > 0 ? (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {selectedCari.transactions
                      .sort((a, b) => new Date(b.date) - new Date(a.date))
                      .map((t, idx) => (
                        <div
                          key={idx}
                          className={`flex items-center justify-between p-3 rounded-lg border ${
                            t.type === "debt"
                              ? "bg-red-50 border-red-200"
                              : "bg-emerald-50 border-emerald-200"
                          }`}
                        >
                          <div>
                            <p className="font-semibold text-slate-800">{t.description}</p>
                            <p className="text-sm text-slate-500">
                              {new Date(t.date).toLocaleDateString("tr-TR")} {new Date(t.date).toLocaleTimeString("tr-TR")}
                            </p>
                          </div>
                          <span
                            className={`font-bold ${
                              t.type === "debt" ? "text-red-600" : "text-emerald-600"
                            }`}
                          >
                            {t.type === "debt" ? "+" : "-"}₺{t.amount.toLocaleString()}
                          </span>
                        </div>
                      ))}
                  </div>
                ) : (
                  <p className="text-slate-500 text-center py-4">Henüz işlem yok.</p>
                )}
              </div>

              {/* Payment Form */}
              {selectedCari.total_balance > 0 && (
                <div className="border-t border-slate-200 pt-6">
                  <h4 className="text-lg font-semibold text-slate-800 mb-4">Ödeme Yap</h4>
                  <form onSubmit={handlePayment} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Kalan Borç: ₺{selectedCari.total_balance.toLocaleString()}
                      </label>
                      <input
                        type="number"
                        className="input w-full"
                        placeholder="Tutar"
                        value={paymentForm.amount}
                        onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Ödeme Yöntemi</label>
                      <select
                        className="input w-full"
                        value={paymentForm.paymentMethod}
                        onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })}
                      >
                        <option value="cash">Nakit</option>
                        <option value="credit_card">Kredi Kartı</option>
                        <option value="transfer">Havale/EFT</option>
                      </select>
                    </div>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setShowDetailModal(false);
                          setSelectedEntity(null);
                          setSelectedCari(null);
                          setPaymentForm({ amount: "", paymentMethod: "cash" });
                        }}
                        className="flex-1 py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
                      >
                        Kapat
                      </button>
                      <button type="submit" className="flex-1 btn-primary">
                        Ödemeyi İşle
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Add Debt Button for Both Customers and Suppliers */}
              <div className="border-t border-slate-200 pt-6">
                <button
                  onClick={() => setShowAddDebtModal(true)}
                  className="w-full btn-secondary flex items-center justify-center gap-2"
                >
                  <ArrowDown className="w-4 h-4" /> Yeni Borç Ekle
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Debt Modal */}
      {showAddDebtModal && selectedEntity && selectedCari && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-slate-800">Borç Ekle</h3>
                <button
                  onClick={() => {
                    setShowAddDebtModal(false);
                    setDebtForm({ amount: "", description: "" });
                  }}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="mb-4 p-4 bg-slate-50 rounded-lg">
                <p className="text-sm text-slate-600">{selectedCari.entity_type === "customer" ? "Müşteri" : "Tedarikçi"}</p>
                <p className="font-semibold text-slate-800">{selectedEntity.name}</p>
                <p className="text-sm text-slate-600 mt-2">Mevcut Bakiye</p>
                <p className="font-bold text-blue-600">
                  ₺{(selectedCari.total_balance || 0).toLocaleString()}
                </p>
              </div>
              <form onSubmit={handleAddDebt} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Tutar</label>
                  <input
                    type="number"
                    className="input w-full"
                    placeholder="0.00"
                    value={debtForm.amount}
                    onChange={(e) => setDebtForm({ ...debtForm, amount: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Açıklama</label>
                  <input
                    type="text"
                    className="input w-full"
                    placeholder="Fatura/Mal alımı açıklaması"
                    value={debtForm.description}
                    onChange={(e) => setDebtForm({ ...debtForm, description: e.target.value })}
                    required
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddDebtModal(false);
                      setDebtForm({ amount: "", description: "" });
                    }}
                    className="flex-1 py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
                  >
                    İptal
                  </button>
                  <button type="submit" className="flex-1 btn-primary">
                    Borç Ekle
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
