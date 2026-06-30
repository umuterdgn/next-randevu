import { useEffect, useState } from "react";
import { CreditCard, Wallet, DollarSign, X, Trash2, Calendar } from "lucide-react";
import api from "../api/client";

export default function CariPage() {
  const [customers, setCustomers] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedCari, setSelectedCari] = useState(null);
  const [staff, setStaff] = useState([]);
  const [paymentForm, setPaymentForm] = useState({
    amount: "",
    paymentMethod: "Nakit",
    description: "",
    debtDate: null,
    targetDebtId: null,
    staffId: null,
  });
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [activeTab, setActiveTab] = useState("customers");

  const loadCustomers = async () => {
    try {
      const [response, staffResponse, suppliersResponse] = await Promise.all([
        api.get("/business/customers"),
        api.get("/business/staff"),
        api.get("/business/suppliers"),
      ]);
      const customersWithCari = await Promise.all(
        response.data.map(async (customer) => {
          try {
            const cariResponse = await api.get(`/business/cari/customer/${customer._id}`);
            return { ...customer, cari: cariResponse.data };
          } catch {
            return { ...customer, cari: { total_debt: 0, total_paid: 0, total_balance: 0 } };
          }
        })
      );
      setCustomers(customersWithCari);
      setStaff(staffResponse.data);
      setSuppliers(suppliersResponse.data);
    } catch (error) {
      console.error("Müşteriler yüklenirken hata:", error);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  const handlePayment = async (e) => {
    e.preventDefault();
    try {
      await api.post("/business/cari/payment", {
        entity_type: "customer",
        entity_id: selectedCustomer._id,
        amount: parseFloat(paymentForm.amount),
        payment_method: paymentForm.paymentMethod,
        description: paymentForm.description,
        debt_date: paymentForm.debtDate,
        target_debt_id: paymentForm.targetDebtId,
        staff_id: paymentForm.staffId,
      });
      setShowPaymentModal(false);
      setPaymentForm({ amount: "", paymentMethod: "Nakit", description: "", debtDate: null, targetDebtId: null, staffId: null });
      setSelectedCustomer(null);
      loadCustomers();
      alert("Ödeme başarıyla kaydedildi!");
    } catch (error) {
      console.error("Ödeme kaydedilirken hata:", error);
      alert("Ödeme kaydedilirken hata oluştu.");
    }
  };

  const handleDeleteTransaction = async (cariId, transactionId) => {
    if (!confirm("Bu işlemi silmek istediğinize emin misiniz?")) {
      return;
    }
    try {
      await api.delete(`/business/cari/transaction/${cariId}/${transactionId}`);
      loadCustomers();
      // Refresh the selected cari data
      if (selectedCustomer) {
        const cariResponse = await api.get(`/business/cari/customer/${selectedCustomer._id}`);
        setSelectedCari(cariResponse.data);
      }
      alert("İşlem başarıyla silindi!");
    } catch (error) {
      console.error("İşlem silinirken hata:", error);
      alert("İşlem silinirken hata oluştu.");
    }
  };

  const handlePayDebt = (transaction) => {
    const dateObj = new Date(transaction.date);
    setSelectedCustomer(selectedCustomer);
    setPaymentForm({
      amount: (transaction.remaining_amount || transaction.amount).toString(),
      paymentMethod: "Nakit",
      description: "",
      debtDate: transaction.date,
      targetDebtId: transaction._id,
    });
    setShowDetailModal(false);
    setShowPaymentModal(true);
  };

  const openDetailModal = async (customer) => {
    setSelectedCustomer(customer);
    try {
      const cariResponse = await api.get(`/business/cari/customer/${customer._id}`);
      setSelectedCari(cariResponse.data);
      setShowDetailModal(true);
    } catch (error) {
      console.error("Cari detayları yüklenirken hata:", error);
      setSelectedCari({ total_debt: 0, total_paid: 0, total_balance: 0, transactions: [] });
      setShowDetailModal(true);
    }
  };

  const handleAddSupplier = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    try {
      const supplierData = {
        name: formData.get("name"),
        phone: formData.get("phone"),
        email: formData.get("email"),
        address: formData.get("address"),
        note: formData.get("note"),
      };
      await api.post("/business/suppliers", supplierData);
      alert("Tedarikçi başarıyla eklendi!");
      e.currentTarget.reset();
      loadCustomers();
    } catch (error) {
      console.error("Tedarikçi eklenirken hata:", error);
      alert("Tedarikçi eklenirken hata oluştu.");
    }
  };

  const handleEditSupplier = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    try {
      const supplierData = {
        name: formData.get("name"),
        phone: formData.get("phone"),
        email: formData.get("email"),
        address: formData.get("address"),
        note: formData.get("note"),
      };
      await api.put(`/business/suppliers/${editingSupplier._id}`, supplierData);
      alert("Tedarikçi başarıyla güncellendi!");
      setEditingSupplier(null);
      e.currentTarget.reset();
      loadCustomers();
    } catch (error) {
      console.error("Tedarikçi güncellenirken hata:", error);
      alert("Tedarikçi güncellenirken hata oluştu.");
    }
  };

  const handleDeleteSupplier = async (supplierId) => {
    if (confirm("Bu tedarikçiyi silmek istediğinize emin misiniz?")) {
      try {
        await api.delete(`/business/suppliers/${supplierId}`);
        alert("Tedarikçi başarıyla silindi!");
        loadCustomers();
      } catch (error) {
        console.error("Tedarikçi silinirken hata:", error);
        alert("Tedarikçi silinirken hata oluştu.");
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-slate-800 mb-8">Cari Hesaplar</h1>

        {/* Tabs */}
        <div className="flex gap-2 mb-8">
          <button
            onClick={() => setActiveTab("customers")}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              activeTab === "customers"
                ? "bg-indigo-600 text-white"
                : "bg-white text-slate-600 hover:bg-slate-100"
            }`}
          >
            Müşteriler
          </button>
          <button
            onClick={() => setActiveTab("suppliers")}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              activeTab === "suppliers"
                ? "bg-indigo-600 text-white"
                : "bg-white text-slate-600 hover:bg-slate-100"
            }`}
          >
            Tedarikçiler
          </button>
        </div>

        {/* Summary Cards - Only show for customers tab */}
        {activeTab === "customers" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-red-500">
            <div className="flex items-center gap-3 mb-2">
              <DollarSign className="w-6 h-6 text-red-600" />
              <span className="text-slate-600 font-semibold">Toplam Borç</span>
            </div>
            <p className="text-3xl font-bold text-red-600">
              ₺{customers.reduce((sum, c) => sum + (c.cari?.total_debt || 0), 0).toLocaleString()}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-emerald-500">
            <div className="flex items-center gap-3 mb-2">
              <Wallet className="w-6 h-6 text-emerald-600" />
              <span className="text-slate-600 font-semibold">Toplam Ödenen</span>
            </div>
            <p className="text-3xl font-bold text-emerald-600">
              ₺{customers.reduce((sum, c) => sum + (c.cari?.total_paid || 0), 0).toLocaleString()}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
            <div className="flex items-center gap-3 mb-2">
              <CreditCard className="w-6 h-6 text-blue-600" />
              <span className="text-slate-600 font-semibold">Toplam Bakiye</span>
            </div>
            <p className="text-3xl font-bold text-blue-600">
              ₺{customers.reduce((sum, c) => sum + (c.cari?.balance || 0), 0).toLocaleString()}
            </p>
          </div>
        </div>
        )}

        {/* Customer Table */}
        {activeTab === "customers" && (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-xl font-semibold text-slate-800">Müşteri Cari Hesapları</h2>
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
                      <th className="px-6 py-3 text-center text-xs font-semibold text-slate-600 uppercase">İşlem</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {customers.map((customer) => (
                      <tr key={customer._id} className="hover:bg-slate-50">
                        <td className="px-6 py-4">
                          <div className="font-medium text-slate-800">{customer.name}</div>
                        </td>
                        <td className="px-6 py-4 text-slate-600">{customer.phone}</td>
                        <td className="px-6 py-4 text-right font-semibold text-red-600">
                          ₺{(customer.cari?.total_debt || 0).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-right font-semibold text-emerald-600">
                          ₺{(customer.cari?.total_paid || 0).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-right font-semibold text-blue-600">
                          ₺{(customer.cari?.total_balance || 0).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex gap-2 justify-center">
                            <button
                              onClick={() => openDetailModal(customer)}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm px-3 py-2 rounded-lg transition-colors"
                          >
                            Detay
                          </button>
                          <button
                            onClick={() => {
                              setSelectedCustomer(customer);
                              setShowPaymentModal(true);
                            }}
                            className="btn-primary text-sm px-3 py-2"
                          >
                            Ödeme Al
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        )}

        {/* Suppliers Section */}
        {activeTab === "suppliers" && (
          <div className="space-y-6">
            {/* Add/Edit Supplier Form */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-slate-800 mb-4">
                {editingSupplier ? "Tedarikçi Düzenle" : "Yeni Tedarikçi Ekle"}
              </h2>
              <form onSubmit={editingSupplier ? handleEditSupplier : handleAddSupplier} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Tedarikçi Adı</label>
                  <input
                    name="name"
                    type="text"
                    className="input w-full"
                    placeholder="Tedarikçi adı"
                    required
                    defaultValue={editingSupplier?.name}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Telefon</label>
                  <input
                    name="phone"
                    type="text"
                    className="input w-full"
                    placeholder="Telefon"
                    defaultValue={editingSupplier?.phone}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">E-posta</label>
                  <input
                    name="email"
                    type="email"
                    className="input w-full"
                    placeholder="E-posta"
                    defaultValue={editingSupplier?.email}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Adres</label>
                  <input
                    name="address"
                    type="text"
                    className="input w-full"
                    placeholder="Adres"
                    defaultValue={editingSupplier?.address}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Not</label>
                  <textarea
                    name="note"
                    className="input w-full h-20 resize-none"
                    placeholder="Notlar"
                    defaultValue={editingSupplier?.note}
                  />
                </div>
                <div className="md:col-span-2 flex gap-3">
                  <button type="submit" className="btn-primary">
                    {editingSupplier ? "Güncelle" : "Ekle"}
                  </button>
                  {editingSupplier && (
                    <button
                      type="button"
                      onClick={() => setEditingSupplier(null)}
                      className="btn-secondary"
                    >
                      İptal
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* Suppliers List */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="p-6 border-b border-slate-200">
                <h2 className="text-xl font-semibold text-slate-800">Tedarikçiler</h2>
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
                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">E-posta</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Adres</th>
                        <th className="px-6 py-3 text-center text-xs font-semibold text-slate-600 uppercase">İşlemler</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {suppliers.map((supplier) => (
                        <tr key={supplier._id} className="hover:bg-slate-50">
                          <td className="px-6 py-4">
                            <div className="font-medium text-slate-800">{supplier.name}</div>
                          </td>
                          <td className="px-6 py-4 text-slate-600">{supplier.phone || "-"}</td>
                          <td className="px-6 py-4 text-slate-600">{supplier.email || "-"}</td>
                          <td className="px-6 py-4 text-slate-600">{supplier.address || "-"}</td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex gap-2 justify-center">
                              <button
                                onClick={() => setEditingSupplier(supplier)}
                                className="bg-blue-100 hover:bg-blue-200 text-blue-700 text-sm px-3 py-2 rounded-lg transition-colors"
                              >
                                Düzenle
                              </button>
                              <button
                                onClick={() => handleDeleteSupplier(supplier._id)}
                                className="bg-red-100 hover:bg-red-200 text-red-700 text-sm px-3 py-2 rounded-lg transition-colors"
                              >
                                Sil
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Payment Modal */}
      {showPaymentModal && selectedCustomer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-slate-800">Ödeme Al</h3>
                <button
                  onClick={() => {
                    setShowPaymentModal(false);
                    setSelectedCustomer(null);
                    setPaymentForm({ amount: "", paymentMethod: "cash", description: "", debtDate: null, targetDebtId: null });
                  }}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="mb-4 p-4 bg-slate-50 rounded-lg">
                <p className="text-sm text-slate-600">Müşteri</p>
                <p className="font-semibold text-slate-800">{selectedCustomer.name}</p>
                <p className="text-sm text-slate-600 mt-2">Mevcut Bakiye</p>
                <p className="font-bold text-blue-600">
                  ₺{(selectedCustomer.cari?.balance || 0).toLocaleString()}
                </p>
              </div>
              <form onSubmit={handlePayment} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Tutar</label>
                  <input
                    type="number"
                    className="input w-full"
                    placeholder="0.00"
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
                    <option value="Nakit">Nakit</option>
                    <option value="Kredi Kartı">Kredi Kartı</option>
                    <option value="IBAN/EFT">IBAN/EFT</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">İşlemi Yapan Personel/Bayi</label>
                  <select
                    className="input w-full"
                    value={paymentForm.staffId || ""}
                    onChange={(e) => setPaymentForm({ ...paymentForm, staffId: e.target.value || null })}
                  >
                    <option value="">Seçiniz (Opsiyonel)</option>
                    {staff.filter(s => s.is_active).map(s => (
                      <option key={s._id} value={s._id}>
                        {s.name} ({s.role === 'dealer' ? 'Bayi' : 'Personel'})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowPaymentModal(false);
                      setSelectedCustomer(null);
                      setPaymentForm({ amount: "", paymentMethod: "Nakit", description: "", debtDate: null, targetDebtId: null, staffId: null });
                    }}
                    className="flex-1 py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
                  >
                    İptal
                  </button>
                  <button type="submit" className="flex-1 btn-primary">
                    Ödemeyi Kaydet
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedCustomer && selectedCari && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-slate-800">İşlem Geçmişi - {selectedCustomer.name}</h3>
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    setSelectedCustomer(null);
                    setSelectedCari(null);
                  }}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-red-50 rounded-lg p-3">
                  <p className="text-sm text-red-600">Toplam Borç</p>
                  <p className="text-lg font-bold text-red-700">₺{selectedCari.total_debt?.toLocaleString() || 0}</p>
                </div>
                <div className="bg-emerald-50 rounded-lg p-3">
                  <p className="text-sm text-emerald-600">Toplam Ödenen</p>
                  <p className="text-lg font-bold text-emerald-700">₺{selectedCari.total_paid?.toLocaleString() || 0}</p>
                </div>
                <div className="bg-blue-50 rounded-lg p-3">
                  <p className="text-sm text-blue-600">Bakiye</p>
                  <p className="text-lg font-bold text-blue-700">₺{selectedCari.total_balance?.toLocaleString() || 0}</p>
                </div>
              </div>
            </div>
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {selectedCari.transactions && selectedCari.transactions.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Tarih</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Tür</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Açıklama</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase">Tutar</th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase">Aksiyonlar</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {selectedCari.transactions
                        .sort((a, b) => new Date(b.date) - new Date(a.date))
                        .map((transaction) => (
                          <tr key={transaction._id} className="hover:bg-slate-50">
                            <td className="px-4 py-3 text-sm text-slate-600">
                              {new Date(transaction.date).toLocaleDateString('tr-TR')}
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                  transaction.type === 'debt'
                                    ? 'bg-red-100 text-red-700'
                                    : 'bg-emerald-100 text-emerald-700'
                                }`}
                              >
                                {transaction.type === 'debt' ? 'Borç' : 'Ödeme'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-slate-800">{transaction.description}</td>
                            <td className={`px-4 py-3 text-right font-semibold ${
                              transaction.type === 'debt' ? 'text-red-600' : 'text-emerald-600'
                            }`}>
                              {transaction.type === 'debt' ? (
                                <div>
                                  <div className={transaction.remaining_amount === 0 ? 'line-through opacity-60' : ''}>
                                    ₺{transaction.amount?.toLocaleString()}
                                  </div>
                                  {transaction.remaining_amount !== undefined && (
                                    <div className="text-xs font-normal text-slate-500">
                                      (Kalan: ₺{(transaction.remaining_amount || 0).toLocaleString()})
                                    </div>
                                  )}
                                  {transaction.remaining_amount === 0 && (
                                    <span className="inline-block mt-1 px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs rounded-full">
                                      Ödendi
                                    </span>
                                  )}
                                </div>
                              ) : (
                                `₺${transaction.amount?.toLocaleString()}`
                              )}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <div className="flex gap-2 justify-center">
                                {transaction.type === 'debt' && transaction.remaining_amount > 0 && (
                                  <button
                                    onClick={() => handlePayDebt(transaction)}
                                    className="bg-emerald-500 hover:bg-emerald-600 text-white text-xs px-3 py-1.5 rounded-lg transition-colors"
                                  >
                                    Öde
                                  </button>
                                )}
                                <button
                                  onClick={() => handleDeleteTransaction(selectedCari._id, transaction._id)}
                                  className="bg-red-500 hover:bg-red-600 text-white text-xs px-2 py-1.5 rounded-lg transition-colors"
                                  title="Sil"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center text-slate-500 py-8">
                  <Calendar className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                  <p>Henüz işlem geçmişi bulunmuyor.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
