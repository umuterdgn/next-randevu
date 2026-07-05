import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, Plus, LogOut, TrendingUp, DollarSign, Users, Copy, MessageCircle, CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";

export default function AgentDashboard() {
  const [agent, setAgent] = useState(null);
  const [sales, setSales] = useState([]);
  const [totalSales, setTotalSales] = useState(0);
  const [totalCommission, setTotalCommission] = useState(0);
  const [showRegistrationForm, setShowRegistrationForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showSuccessState, setShowSuccessState] = useState(false);
  const [paymentLink, setPaymentLink] = useState("");
  const [selectedPlan, setSelectedPlan] = useState("physical");
  const navigate = useNavigate();

  const [registrationForm, setRegistrationForm] = useState({
    business_name: "",
    business_sector: "",
    owner_name: "",
    owner_email: "",
    owner_password: "",
    owner_phone: "",
    amount: "",
    payment_method: "cash",
  });

  useEffect(() => {
    const agentData = localStorage.getItem("agent");
    if (!agentData) {
      navigate("/agent");
      return;
    }
    setAgent(JSON.parse(agentData));
    loadSalesHistory(JSON.parse(agentData)._id);
  }, [navigate]);

  const loadSalesHistory = async (agentId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/agent/sales/${agentId}`);
      const data = await response.json();
      if (data.success) {
        setSales(data.data.sales);
        setTotalSales(data.data.totalSales);
        setTotalCommission(data.data.totalCommission);
      }
    } catch (error) {
      console.error("Satış geçmişi yüklenirken hata:", error);
    }
  };

  const handleRegistration = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("http://localhost:5000/api/agent/register-business", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...registrationForm,
          amount: parseFloat(registrationForm.amount),
          agent_id: agent._id,
          plan: selectedPlan,
        }),
      });

      const data = await response.json();

      if (response.status === 200 || response.status === 201) {
        // Check if payment_link exists (credit card) or not (cash)
        if (data.data.payment_link) {
          // Credit card payment: show payment link modal
          setPaymentLink(data.data.payment_link);
          setShowRegistrationForm(false);
          setShowSuccessState(true);
        } else {
          // Cash payment: show success toast
          toast.success("✅ Nakit tahsilat yapıldı, işletme hesabı anında aktifleştirildi ve komisyonunuz işlendi!");
          setShowRegistrationForm(false);
        }
        setRegistrationForm({
          business_name: "",
          business_sector: "",
          owner_name: "",
          owner_email: "",
          owner_password: "",
          owner_phone: "",
          amount: "",
          payment_method: "cash",
        });
        setSelectedPlan("physical");
        loadSalesHistory(agent._id);
      } else {
        toast.error(data.message || "Kayıt başarısız");
      }
    } catch (error) {
      toast.error("Sunucu bağlantı hatası");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("agent");
    navigate("/agent");
  };

  if (!agent) return null;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800">Nexa Bayi Portalı</h1>
              <p className="text-sm text-slate-500">Hoş geldin, {agent.name}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Çıkış
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-blue-500">
            <div className="flex items-center gap-3 mb-2">
              <DollarSign className="w-6 h-6 text-blue-600" />
              <span className="text-slate-600 font-semibold">Toplam Satış</span>
            </div>
            <p className="text-3xl font-bold text-slate-800">₺{totalSales.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-emerald-500">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="w-6 h-6 text-emerald-600" />
              <span className="text-slate-600 font-semibold">Komisyon</span>
            </div>
            <p className="text-3xl font-bold text-slate-800">₺{totalCommission.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-purple-500">
            <div className="flex items-center gap-3 mb-2">
              <Users className="w-6 h-6 text-purple-600" />
              <span className="text-slate-600 font-semibold">Kayıtlı İşletme</span>
            </div>
            <p className="text-3xl font-bold text-slate-800">{sales.length}</p>
          </div>
        </div>

        {/* Action Button */}
        <div className="mb-8">
          <button
            onClick={() => setShowRegistrationForm(true)}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors shadow-lg"
          >
            <Plus className="w-5 h-5" />
            Yeni İşletme Kaydı
          </button>
        </div>

        {/* Sales History Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-800">Satış Geçmişi</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Tarih</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">İşletme</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Sektör</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Tutar</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Ödeme Yöntemi</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Komisyon</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {sales.map((sale) => (
                  <tr key={sale._id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {new Date(sale.createdAt).toLocaleDateString("tr-TR")}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-800">
                      {sale.business_id?.name || "-"}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {sale.business_id?.sector || "-"}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-slate-800">
                      ₺{sale.amount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{sale.payment_method}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-emerald-600">
                      ₺{sale.commission_amount.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {sales.length === 0 && (
              <div className="p-8 text-center text-slate-500">Henüz satış yok.</div>
            )}
          </div>
        </div>
      </div>

      {/* Registration Modal */}
      {showRegistrationForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-slate-800">Yeni İşletme Kaydı</h2>
                <button
                  onClick={() => setShowRegistrationForm(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleRegistration} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      İşletme Adı
                    </label>
                    <input
                      type="text"
                      className="input w-full"
                      value={registrationForm.business_name}
                      onChange={(e) =>
                        setRegistrationForm({ ...registrationForm, business_name: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Sektör
                    </label>
                    <input
                      type="text"
                      className="input w-full"
                      value={registrationForm.business_sector}
                      onChange={(e) =>
                        setRegistrationForm({ ...registrationForm, business_sector: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      İşletme Sahibi Adı
                    </label>
                    <input
                      type="text"
                      className="input w-full"
                      value={registrationForm.owner_name}
                      onChange={(e) =>
                        setRegistrationForm({ ...registrationForm, owner_name: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      İşletme Sahibi E-posta
                    </label>
                    <input
                      type="email"
                      className="input w-full"
                      value={registrationForm.owner_email}
                      onChange={(e) =>
                        setRegistrationForm({ ...registrationForm, owner_email: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      İşletme Sahibi Telefon
                    </label>
                    <input
                      type="tel"
                      className="input w-full"
                      value={registrationForm.owner_phone}
                      onChange={(e) =>
                        setRegistrationForm({ ...registrationForm, owner_phone: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Şifre
                    </label>
                    <input
                      type="password"
                      className="input w-full"
                      value={registrationForm.owner_password}
                      onChange={(e) =>
                        setRegistrationForm({ ...registrationForm, owner_password: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Ödeme Tutarı
                    </label>
                    <input
                      type="number"
                      className="input w-full"
                      value={registrationForm.amount}
                      onChange={(e) =>
                        setRegistrationForm({ ...registrationForm, amount: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Ödeme Yöntemi
                    </label>
                    <select
                      className="input w-full"
                      value={registrationForm.payment_method}
                      onChange={(e) =>
                        setRegistrationForm({ ...registrationForm, payment_method: e.target.value })
                      }
                    >
                      <option value="cash">Nakit / Elden / Havale</option>
                      <option value="credit_card">Kredi Kartı / Online Ödeme</option>
                    </select>
                  </div>
                </div>

                {/* Package Selection */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-3">Paket Seçimi</label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <label className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-colors ${selectedPlan === 'physical' ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-slate-300'}`}>
                      <input
                        type="radio"
                        name="plan"
                        value="physical"
                        checked={selectedPlan === 'physical'}
                        onChange={(e) => setSelectedPlan(e.target.value)}
                        className="w-4 h-4 text-blue-600"
                      />
                      <div>
                        <p className="font-semibold text-slate-800">Fiziksel</p>
                        <p className="text-xs text-slate-600">Sadece fiziksel randevular</p>
                      </div>
                    </label>
                    <label className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-colors ${selectedPlan === 'online' ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-slate-300'}`}>
                      <input
                        type="radio"
                        name="plan"
                        value="online"
                        checked={selectedPlan === 'online'}
                        onChange={(e) => setSelectedPlan(e.target.value)}
                        className="w-4 h-4 text-blue-600"
                      />
                      <div>
                        <p className="font-semibold text-slate-800">Online</p>
                        <p className="text-xs text-slate-600">Online görüşmeler + Google Meet</p>
                      </div>
                    </label>
                    <label className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-colors ${selectedPlan === 'full' ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-slate-300'}`}>
                      <input
                        type="radio"
                        name="plan"
                        value="full"
                        checked={selectedPlan === 'full'}
                        onChange={(e) => setSelectedPlan(e.target.value)}
                        className="w-4 h-4 text-blue-600"
                      />
                      <div>
                        <p className="font-semibold text-slate-800">Full</p>
                        <p className="text-xs text-slate-600">Tüm özellikler dahil</p>
                      </div>
                    </label>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowRegistrationForm(false)}
                    className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors"
                  >
                    İptal
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white font-semibold rounded-xl transition-colors"
                  >
                    {loading ? "Kaydediliyor..." : "Kaydet"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Success State - Payment Link */}
      {showSuccessState && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center justify-center mb-6">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                </div>
              </div>

              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-slate-800 mb-2">İşletme Kaydedildi!</h2>
                <p className="text-slate-600">Ödeme linki başarıyla oluşturuldu. Müşteriye iletin.</p>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 mb-2">Güvenli Ödeme Linki</label>
                <div className="relative">
                  <input
                    type="text"
                    readOnly
                    value={paymentLink}
                    className="input w-full pr-20 bg-slate-50 text-sm"
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(paymentLink);
                      toast.success("Link kopyalandı!");
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
                    title="Kopyala"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(paymentLink);
                    toast.success("Link kopyalandı!");
                  }}
                  className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  <Copy className="w-4 h-4" />
                  Linki Kopyala
                </button>
                <button
                  onClick={() => {
                    const planNames = { physical: 'Fiziksel', online: 'Online', full: 'Full' };
                    const planName = planNames[selectedPlan] || 'Fiziksel';
                    const message = `Merhaba, Nexa ${planName} paketiniz için güvenli ödeme linkiniz: ${paymentLink}`;
                    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
                  }}
                  className="flex-1 py-3 px-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  <MessageCircle className="w-4 h-4" />
                  WhatsApp ile Gönder
                </button>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-200">
                <button
                  onClick={() => setShowSuccessState(false)}
                  className="w-full py-3 px-4 text-slate-600 hover:text-slate-800 hover:bg-slate-50 rounded-xl transition-colors"
                >
                  Kapat
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
