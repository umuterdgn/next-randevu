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
} from "lucide-react";
import AppLayout from "../layouts/AppLayout";
import api from "../api/client";
import Card from "../components/Card";

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
      : "dashboard";

  const handleTabChange = (tab) => {
    if (tab === "dashboard") navigate("/owner");
    else navigate(`/owner/${tab}`);
  };

  const [stats, setStats] = useState(null);
  const [apps, setApps] = useState([]);
  const [businesses, setBusinesses] = useState([]);

  const load = async () => {
    try {
      const [s, a, b] = await Promise.all([
        api.get("/owner/stats"),
        api.get("/applications"),
        api.get("/owner/businesses"),
      ]);
      setStats(s.data);
      setApps(a.data);
      setBusinesses(b.data);
    } catch (error) {
      console.error("Dashboard verileri yüklenirken hata:", error);
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
                          alert("Onaylanırken hata oluştu.");
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
                            alert("Reddedilirken hata oluştu.");
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
                        alert(
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
                          alert(
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
    </AppLayout>
  );
}
