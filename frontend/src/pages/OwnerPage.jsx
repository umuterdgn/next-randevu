import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Activity,
  Building2,
  TrendingUp,
  Users,
  Mail,
  Phone,
  Trash2,
  Power,
  CalendarDays,
  DollarSign,
  Plus,
} from "lucide-react";
import AppLayout from "../layouts/AppLayout";
import api from "../api/client";
import Card from "../components/Card";
import toast from "react-hot-toast";

const statusClasses = {
  pending: "bg-amber-100 text-amber-700",
  approved: "bg-emerald-100 text-emerald-700",
  rejected: "bg-rose-100 text-rose-700",
  completed: "bg-indigo-100 text-indigo-700",
  cancelled: "bg-slate-200 text-slate-700",
};

export default function OwnerPage() {
  const location = useLocation();
  const navigate = useNavigate();

  // ÇÖZÜM 1: URL'yi dinleyerek hangi sekmede olduğumuzu buluyoruz
  const activeTab = location.pathname.includes("applications")
    ? "applications"
    : location.pathname.includes("businesses")
      ? "businesses"
      : location.pathname.includes("agents")
        ? "agents"
        : location.pathname.includes("sales")
          ? "sales"
          : "dashboard";

  const handleTabChange = (tab) => {
    if (tab === "dashboard") navigate("/owner");
    else navigate(`/owner/${tab}`);
  };

  const [stats, setStats] = useState(null);
  const [apps, setApps] = useState([]);
  const [businesses, setBusinesses] = useState([]);
  const [sales, setSales] = useState([]);
  const [agents, setAgents] = useState([]);
  const [totalSales, setTotalSales] = useState(0);
  const [totalCommission, setTotalCommission] = useState(0);
  const [showAgentModal, setShowAgentModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const [agentForm, setAgentForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    commission_rate: 0.1,
  });

  const load = async () => {
    try {
      const [s, a, b, salesData, agentsData] = await Promise.all([
        api.get("/owner/stats"),
        api.get("/applications"),
        api.get("/owner/businesses"),
        api.get("/agent/admin/all-sales"),
        api.get("/agent/admin/agents"),
      ]);
      console.log("DEBUG: Frontend salesData response:", salesData);
      console.log("DEBUG: Frontend agentsData response:", agentsData);
      setStats(s.data);
      setApps(a.data);
      setBusinesses(b.data);
      if (salesData.data.success) {
        setSales(salesData.data.data.sales);
        setTotalSales(salesData.data.data.totalSales);
        setTotalCommission(salesData.data.data.totalCommission);
        console.log("DEBUG: Sales set to state:", salesData.data.data.sales);
      } else {
        console.log("DEBUG: salesData.data.success is false:", salesData.data);
      }
      if (agentsData.data.success) {
        setAgents(agentsData.data.data);
        console.log("DEBUG: Agents set to state:", agentsData.data.data);
      } else {
        console.log("DEBUG: agentsData.data.success is false:", agentsData.data);
      }
    } catch (error) {
      console.error("Dashboard verileri yüklenirken hata:", error);
    }
  };

  const loadAllSales = async () => {
    try {
      const response = await api.get("/agent/admin/all-sales");
      if (response.data.success) {
        setSales(response.data.data.sales);
        setTotalSales(response.data.data.totalSales);
        setTotalCommission(response.data.data.totalCommission);
        console.log("DEBUG: Sales loaded and set to state:", response.data.data.sales);
      }
    } catch (error) {
      console.error("Satışlar yüklenirken hata:", error);
    }
  };

  const loadAllAgents = async () => {
    try {
      const response = await api.get("/agent/admin/agents");
      if (response.data.success) {
        setAgents(response.data.data);
        console.log("DEBUG: Agents loaded and set to state:", response.data.data);
      }
    } catch (error) {
      console.error("Bayiler yüklenirken hata:", error);
    }
  };

  const handleAddAgent = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await api.post("/agent/admin/agents", agentForm);

      if (response.data.success) {
        toast.success("Bayi başarıyla eklendi!");
        setAgentForm({ name: "", email: "", password: "", phone: "", commission_rate: 0.1 });
        setShowAgentModal(false);
        loadAllAgents();
      } else {
        toast.error(response.data.message || "Ekleme başarısız");
      }
    } catch (error) {
      toast.error("Sunucu bağlantı hatası");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAgent = async (agentId) => {
    if (!confirm("Bu bayiyi silmek istediğinize emin misiniz?")) return;

    try {
      const response = await api.delete(`/agent/admin/agents/${agentId}`);

      if (response.data.success) {
        toast.success("Bayi başarıyla silindi!");
        loadAllAgents();
      } else {
        toast.error(response.data.message || "Silme başarısız");
      }
    } catch (error) {
      toast.error("Sunucu bağlantı hatası");
    }
  };

  useEffect(() => {
    load();
  }, []);

  const sectorData = useMemo(
    () =>
      stats?.sectorDistribution?.map((x) => ({
        name: x._id,
        count: x.count,
      })) || [],
    [stats],
  );
  const businessSplit = useMemo(() => {
    const active = businesses.filter((b) => b.is_active !== false).length;
    const inactive = Math.max(businesses.length - active, 0);
    return [
      { name: "Aktif", value: active, color: "#22c55e" },
      { name: "Pasif", value: inactive, color: "#f97316" },
    ];
  }, [businesses]);
  const growthMetrics = useMemo(() => {
    const byMonth = new Map();
    businesses.forEach((b) => {
      const d = new Date(b.createdAt);
      if (Number.isNaN(d.getTime())) return;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      byMonth.set(key, (byMonth.get(key) || 0) + 1);
    });
    return [...byMonth.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-6)
      .map(([month, count]) => ({ month, count }));
  }, [businesses]);

  const growthPercent = growthMetrics.at(-2)?.count
    ? Number(
        (
          ((growthMetrics.at(-1)?.count - growthMetrics.at(-2)?.count) /
            growthMetrics.at(-2)?.count) *
          100
        ).toFixed(1),
      )
    : 100;

  return (
    <AppLayout>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-800">
          SaaS Yönetim Paneli
        </h2>
        <p className="text-slate-500 text-sm">
          Sistemdeki tüm işletmelerin genel durumu ve kontrolleri.
        </p>
      </div>

      <div className="mb-6 flex gap-6 border-b border-slate-200">
        <button
          className={`pb-3 text-sm font-medium transition-colors ${activeTab === "dashboard" ? "border-b-2 border-indigo-600 text-indigo-600" : "text-slate-500 hover:text-slate-800"}`}
          onClick={() => handleTabChange("dashboard")}
        >
          Genel Bakış
        </button>
        <button
          className={`pb-3 text-sm font-medium transition-colors ${activeTab === "applications" ? "border-b-2 border-indigo-600 text-indigo-600" : "text-slate-500 hover:text-slate-800"}`}
          onClick={() => handleTabChange("applications")}
        >
          Başvurular
          {apps.length > 0 && (
            <span className="ml-1.5 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
              {apps.length}
            </span>
          )}
        </button>
        <button
          className={`pb-3 text-sm font-medium transition-colors ${activeTab === "businesses" ? "border-b-2 border-indigo-600 text-indigo-600" : "text-slate-500 hover:text-slate-800"}`}
          onClick={() => handleTabChange("businesses")}
        >
          Kayıtlı İşletmeler
          {businesses.length > 0 && (
            <span className="ml-1.5 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
              {businesses.length}
            </span>
          )}
        </button>
        <button
          className={`pb-3 text-sm font-medium transition-colors ${activeTab === "agents" ? "border-b-2 border-indigo-600 text-indigo-600" : "text-slate-500 hover:text-slate-800"}`}
          onClick={() => handleTabChange("agents")}
        >
          Bayiler
          {agents.length > 0 && (
            <span className="ml-1.5 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
              {agents.length}
            </span>
          )}
        </button>
        <button
          className={`pb-3 text-sm font-medium transition-colors ${activeTab === "sales" ? "border-b-2 border-indigo-600 text-indigo-600" : "text-slate-500 hover:text-slate-800"}`}
          onClick={() => handleTabChange("sales")}
        >
          SaaS Finans/Satışlar
          {sales.length > 0 && (
            <span className="ml-1.5 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
              {sales.length}
            </span>
          )}
        </button>
      </div>

      {activeTab === "dashboard" && (
        <div className="animate-in fade-in duration-300">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6 mb-6">
            <div
              className="cursor-pointer hover:-translate-y-1 transition"
              onClick={() => handleTabChange("businesses")}
            >
              <Card
                title="Toplam İşletme"
                value={stats?.totalBusinesses || 0}
                icon={Building2}
              />
            </div>
            <div
              className="cursor-pointer hover:-translate-y-1 transition"
              onClick={() => handleTabChange("applications")}
            >
              <Card
                title="Bekleyen Başvuru"
                value={apps.filter((a) => a.status === "pending").length}
                icon={Users}
              />
            </div>
            <Card
              title="Aktif Kullanıcı"
              value={stats?.users?.active || 0}
              icon={Activity}
            />
            <div
              className="cursor-pointer hover:-translate-y-1 transition"
              onClick={() => handleTabChange("businesses")}
            >
              <Card
                title="Aktif İşletme"
                value={businessSplit[0]?.value || 0}
                icon={Building2}
              />
            </div>
            <Card
              title="AI Kullanımı"
              value={stats?.totalAiUsage || 0}
              icon={Activity}
            />
            <Card
              title="Büyüme (Aylık)"
              value={`${growthPercent > 0 ? "+" : ""}${growthPercent}%`}
              icon={TrendingUp}
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-2 mb-6">
            {/* ÇÖZÜM 2: Recharts uyarılarını önlemek için net pixel height verdik */}
            <div className="card w-full" style={{ minHeight: "340px" }}>
              <h3 className="mb-4 font-semibold text-slate-700">
                Sektör Dağılımı
              </h3>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={sectorData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#e2e8f0"
                    vertical={false}
                  />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <Tooltip
                    cursor={{ fill: "#f1f5f9" }}
                    contentStyle={{ borderRadius: "8px", border: "none" }}
                  />
                  <Bar
                    dataKey="count"
                    fill="#6366f1"
                    radius={[6, 6, 0, 0]}
                    barSize={40}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="card w-full" style={{ minHeight: "340px" }}>
              <h3 className="mb-4 font-semibold text-slate-700">
                İşletme Durumları
              </h3>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={businessSplit}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                  >
                    {businessSplit.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ borderRadius: "8px", border: "none" }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-2 flex justify-center gap-4 text-sm font-medium">
                {businessSplit.map((s) => (
                  <span
                    key={s.name}
                    className="flex items-center gap-2 text-slate-600"
                  >
                    <span
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: s.color }}
                    />{" "}
                    {s.name}: {s.value}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "applications" && (
        <div className="animate-in fade-in duration-300 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {apps.length === 0 ? (
            <p className="col-span-full text-center text-slate-500 py-10">
              Kayıtlı başvuru bulunmuyor.
            </p>
          ) : (
            apps.map((a) => (
              <div
                key={a._id}
                className="card flex flex-col justify-between hover:border-indigo-200 transition"
              >
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-bold text-lg text-slate-800">
                      {a.business_name}
                    </h3>
                    <span
                      className={`badge ${statusClasses[a.status] || "bg-slate-200 text-slate-700"}`}
                    >
                      {a.status === "pending"
                        ? "Bekliyor"
                        : a.status === "approved"
                          ? "Onaylandı"
                          : "Reddedildi"}
                    </span>
                  </div>
                  <div className="space-y-1 mb-4 text-sm text-slate-600">
                    <p className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-slate-400" />{" "}
                      {a.sector} • {a.city}
                    </p>
                    <p className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-slate-400" /> {a.email}
                    </p>
                    <p className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-slate-400" /> {a.phone}
                    </p>
                  </div>
                </div>
                {a.status === "pending" && (
                  <div className="flex gap-2 border-t border-slate-100 pt-4">
                    <button
                      className="btn-primary flex-1 py-2 text-sm font-medium"
                      onClick={async () => {
                        try {
                          await api.patch(`/applications/${a._id}/status`, {
                            status: "approved",
                          });
                          load();
                        } catch (err) {
                          toast.error("Onaylanırken hata oluştu.");
                        }
                      }}
                    >
                      Onayla & Hesap Aç
                    </button>
                    <button
                      className="btn flex-1 bg-rose-100 text-rose-700 hover:bg-rose-200 py-2 text-sm font-medium"
                      onClick={async () => {
                        if (
                          window.confirm(
                            "Başvuruyu reddetmek istediğinize emin misiniz?",
                          )
                        ) {
                          try {
                            await api.patch(`/applications/${a._id}/status`, {
                              status: "rejected",
                            });
                            load();
                          } catch (err) {
                            toast.error("Reddedilirken hata oluştu.");
                          }
                        }
                      }}
                    >
                      Reddet
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === "businesses" && (
        <div className="animate-in fade-in duration-300 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {businesses.length === 0 ? (
            <p className="col-span-full text-center text-slate-500 py-10">
              Sistemde kayıtlı işletme bulunmuyor.
            </p>
          ) : (
            businesses.map((b) => (
              <div
                key={b._id}
                className="card flex flex-col justify-between hover:border-indigo-200 transition"
              >
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-bold text-lg text-slate-800">
                      {b.name}
                    </h3>
                    <span
                      className={`badge ${b.is_active !== false ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}
                    >
                      {b.is_active !== false ? "Aktif" : "Pasif (Donduruldu)"}
                    </span>
                  </div>
                  <div className="space-y-1 mb-4 text-sm text-slate-600">
                    <p className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-slate-400" />{" "}
                      {b.sector}
                    </p>
                    <p className="flex items-center gap-2">
                      <CalendarDays className="w-4 h-4 text-slate-400" /> Kayıt:{" "}
                      {new Date(b.createdAt).toLocaleDateString()}
                    </p>
                    <p className="flex items-center gap-2">
                      <Activity className="w-4 h-4 text-slate-400" /> AI
                      Kullanımı: {b.ai_usage_count || 0}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2 border-t border-slate-100 pt-4">
                  <button
                    className="btn flex-1 bg-slate-100 text-slate-700 hover:bg-slate-200 py-2 text-sm font-medium flex items-center justify-center gap-2"
                    onClick={async () => {
                      try {
                        await api.patch(`/owner/businesses/${b._id}/status`, {
                          is_active: b.is_active === false ? true : false,
                        });
                        load();
                      } catch (err) {
                        toast.error(
                          "Durum güncellenemedi. Lütfen backend rotanızı kontrol edin.",
                        );
                      }
                    }}
                  >
                    <Power className="w-4 h-4" />
                    {b.is_active !== false
                      ? "Dondur (Pasife Al)"
                      : "Aktifleştir"}
                  </button>
                  <button
                    className="btn flex-1 bg-rose-100 text-rose-700 hover:bg-rose-200 py-2 text-sm font-medium flex items-center justify-center gap-2"
                    onClick={async () => {
                      if (
                        window.confirm(
                          `'${b.name}' işletmesini TAMAMEN SİLMEK istediğinize emin misiniz? Bu işlem geri alınamaz.`,
                        )
                      ) {
                        try {
                          await api.delete(`/owner/businesses/${b._id}`);
                          load();
                        } catch (err) {
                          toast.error(
                            "İşletme silinemedi. Lütfen backend rotanızı kontrol edin.",
                          );
                        }
                      }
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                    Sil
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === "sales" && (
        <div className="animate-in fade-in duration-300">
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
                <span className="text-slate-600 font-semibold">Toplam Komisyon</span>
              </div>
              <p className="text-3xl font-bold text-slate-800">₺{totalCommission.toLocaleString()}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-purple-500">
              <div className="flex items-center gap-3 mb-2">
                <Users className="w-6 h-6 text-purple-600" />
                <span className="text-slate-600 font-semibold">Toplam Bayi</span>
              </div>
              <p className="text-3xl font-bold text-slate-800">{agents.length}</p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-800">Tüm Satışlar</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">
                      Tarih
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">
                      Bayi
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">
                      İşletme
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">
                      Sektör
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">
                      Tutar
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">
                      Ödeme Yöntemi
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">
                      Komisyon
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {sales.map((sale) => (
                    <tr key={sale._id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {new Date(sale.createdAt).toLocaleDateString("tr-TR")}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-slate-800">
                        {sale.agent_id?.name || "-"}
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
      )}

      {activeTab === "agents" && (
        <div className="animate-in fade-in duration-300">
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-800">Bayiler</h2>
              <button
                onClick={() => setShowAgentModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                Yeni Bayi
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">
                      Ad
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">
                      E-posta
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">
                      Telefon
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">
                      Komisyon Oranı
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">
                      Durum
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">
                      İşlemler
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {agents.map((agent) => (
                    <tr key={agent._id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 text-sm font-medium text-slate-800">
                        {agent.name}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">{agent.email}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">{agent.phone || "-"}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {(agent.commission_rate * 100).toFixed(0)}%
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            agent.is_active
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {agent.is_active ? "Aktif" : "Pasif"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleDeleteAgent(agent._id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {agents.length === 0 && (
                <div className="p-8 text-center text-slate-500">Henüz bayi yok.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Agent Modal */}
      {showAgentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-slate-800">Yeni Bayi Ekle</h2>
                <button
                  onClick={() => setShowAgentModal(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleAddAgent} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Ad</label>
                  <input
                    type="text"
                    className="input w-full"
                    value={agentForm.name}
                    onChange={(e) => setAgentForm({ ...agentForm, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">E-posta</label>
                  <input
                    type="email"
                    className="input w-full"
                    value={agentForm.email}
                    onChange={(e) => setAgentForm({ ...agentForm, email: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Şifre</label>
                  <input
                    type="password"
                    className="input w-full"
                    value={agentForm.password}
                    onChange={(e) => setAgentForm({ ...agentForm, password: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Telefon</label>
                  <input
                    type="tel"
                    className="input w-full"
                    value={agentForm.phone}
                    onChange={(e) => setAgentForm({ ...agentForm, phone: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Komisyon Oranı (%)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    className="input w-full"
                    value={agentForm.commission_rate * 100}
                    onChange={(e) =>
                      setAgentForm({ ...agentForm, commission_rate: e.target.value / 100 })
                    }
                    required
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAgentModal(false)}
                    className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors"
                  >
                    İptal
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white font-semibold rounded-xl transition-colors"
                  >
                    {loading ? "Ekleniyor..." : "Ekle"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
