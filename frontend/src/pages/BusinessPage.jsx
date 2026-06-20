import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import {
  Activity,
  CalendarDays,
  Clock3,
  Users,
  Star,
  ArrowLeft,
  Award,
  CheckCircle,
  XCircle,
  Settings,
  Globe,
} from "lucide-react";
import AppLayout from "../layouts/AppLayout";
import { useAuth } from "../context/AuthContext";
import api from "../api/client";
import Card from "../components/Card";

const statusClasses = {
  pending: "bg-amber-100 text-amber-700",
  arrived: "bg-emerald-100 text-emerald-700",
  no_show: "bg-rose-100 text-rose-700",
  completed: "bg-indigo-100 text-indigo-700",
  cancelled: "bg-slate-200 text-slate-700",
};

export default function BusinessPage() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const activeTab = location.pathname.includes("services")
    ? "services"
    : location.pathname.includes("customers")
      ? "customers"
      : location.pathname.includes("appointments")
        ? "appointments"
        : location.pathname.includes("campaigns")
          ? "campaigns"
          : "dashboard";

  const handleTabChange = (tab) => {
    if (tab === "dashboard") navigate("/business");
    else navigate(`/business/${tab}`);
  };

  // State Yönetimi
  const [dash, setDash] = useState(null);
  const [services, setServices] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [campaigns, setCampaigns] = useState([]);

  // AI Form
  const [sector, setSector] = useState("");
  const [city, setCity] = useState("");
  const [target, setTarget] = useState("");

  // Yeni Özellik Stateleri
  const [selectedCustomer, setSelectedCustomer] = useState(null); // Portfolyo görünümü için
  const [loyaltySettings, setLoyaltySettings] = useState({
    symbol: "⭐",
    threshold: 5,
  }); // Sadakat ayarları
  const [verifyCodes, setVerifyCodes] = useState({}); // 4 haneli kod inputlarını tutmak için

  const load = async () => {
    try {
      const [d, s, c, a] = await Promise.all([
        api.get("/business/dashboard"),
        api.get("/business/services"),
        api.get("/business/customers"),
        api.get("/business/appointments"),
      ]);
      setDash(d.data);
      setServices(s.data);
      setCustomers(c.data);
      setAppointments(a.data);

      // Eğer işletmenin backend'den gelen sadakat ayarları varsa onları da state'e al
      if (d.data?.loyalty_settings) {
        setLoyaltySettings(d.data.loyalty_settings);
      }
    } catch (error) {
      console.error("Veriler yüklenirken hata:", error);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const mostUsedServicesData = dash?.most_used_services || [];
  const appointmentTrendsData = dash?.appointment_trends || [];

  return (
    <AppLayout>
      <div className="mb-6 flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">
            {user?.name || "İşletme"} Paneli
          </h2>
          <p className="text-slate-500 text-sm">
            Sisteminizi ve müşterilerinizi yönetin.
          </p>
        </div>
      </div>

      {/* DASHBOARD SEKMESİ */}
      {activeTab === "dashboard" && (
        <div className="animate-in fade-in duration-300">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
            <div
              className="cursor-pointer hover:-translate-y-1 transition"
              onClick={() => handleTabChange("appointments")}
            >
              <Card
                title="Toplam Randevu"
                value={dash?.total_appointments || 0}
                icon={CalendarDays}
              />
            </div>
            <div
              className="cursor-pointer hover:-translate-y-1 transition"
              onClick={() => handleTabChange("appointments")}
            >
              <Card
                title="Bekleyen"
                value={dash?.statuses?.pending || 0}
                icon={Clock3}
              />
            </div>
            <Card
              title="Tamamlanan"
              value={dash?.statuses?.completed || 0}
              icon={Activity}
            />
            <div
              className="cursor-pointer hover:-translate-y-1 transition"
              onClick={() => handleTabChange("customers")}
            >
              <Card
                title="Müşteri Elde Tutma"
                value={`%${dash?.customer_retention_rate || 0}`}
                icon={Users}
              />
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2 mb-6">
            <div className="card w-full" style={{ minHeight: "340px" }}>
              <h3 className="mb-4 font-semibold text-slate-700">
                Randevu Trendi (Son 30 Gün)
              </h3>
              {appointmentTrendsData.length > 0 ? (
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={appointmentTrendsData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#e2e8f0"
                    />
                    <XAxis
                      dataKey="date"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{ borderRadius: "8px", border: "none" }}
                    />
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke="#8b5cf6"
                      strokeWidth={3}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-[260px] items-center justify-center text-sm text-slate-400">
                  Yeterli trend verisi yok.
                </div>
              )}
            </div>

            <div className="card w-full" style={{ minHeight: "340px" }}>
              <h3 className="mb-4 font-semibold text-slate-700">
                En Çok Kullanılan Servisler
              </h3>
              {mostUsedServicesData.length > 0 ? (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart
                    data={mostUsedServicesData}
                    layout="vertical"
                    margin={{ left: 20 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      horizontal={false}
                      stroke="#e2e8f0"
                    />
                    <XAxis type="number" axisLine={false} tickLine={false} />
                    <YAxis
                      dataKey="name"
                      type="category"
                      width={100}
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip
                      cursor={{ fill: "#f1f5f9" }}
                      contentStyle={{ borderRadius: "8px", border: "none" }}
                    />
                    <Bar
                      dataKey="count"
                      fill="#3b82f6"
                      radius={[0, 4, 4, 0]}
                      barSize={24}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-[260px] items-center justify-center text-sm text-slate-400">
                  Henüz servis kullanımı yok.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SERVİSLER SEKMESİ */}
      {activeTab === "services" && (
        <div className="animate-in fade-in duration-300">
          <div className="card flex flex-col mb-6 relative">
            <h3 className="mb-4 font-semibold text-slate-700">
              Servisler (Hizmetler)
            </h3>
            <form
              className="mb-4 flex gap-2"
              onSubmit={async (e) => {
                e.preventDefault();
                const f = new FormData(e.currentTarget);
                try {
                  await api.post("/business/services", {
                    name: f.get("name"),
                    duration_minutes: Number(f.get("duration_minutes")),
                  });
                  e.currentTarget.reset();
                  load();
                } catch (err) {
                  alert("Servis eklenirken hata oluştu.");
                }
              }}
            >
              <input
                name="name"
                placeholder="Servis adı"
                className="input flex-1"
                required
              />
              <input
                name="duration_minutes"
                placeholder="Süre (Dk)"
                type="number"
                className="input w-24"
                required
              />
              <button className="btn-primary whitespace-nowrap px-4">
                Ekle
              </button>
            </form>
            <div className="space-y-2 overflow-y-auto max-h-[400px] pr-2 custom-scrollbar mb-6">
              {services.length === 0 ? (
                <p className="text-sm text-slate-500 py-2">
                  Henüz servis eklenmemiş.
                </p>
              ) : null}
              {services.map((s) => (
                <div
                  key={s._id}
                  className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50/50 p-3 text-sm"
                >
                  <span className="font-medium text-slate-800">{s.name}</span>
                  <span className="badge bg-indigo-50 text-indigo-700 border border-indigo-100">
                    {s.duration_minutes} Dk
                  </span>
                </div>
              ))}
            </div>

            {/* Müşteri Randevu Sayfasını Güncelleme Butonu */}
            <div className="border-t border-slate-100 pt-4 flex flex-col items-center">
              <p className="text-xs text-slate-500 mb-3 text-center">
                Servislerde yaptığınız değişikliklerin müşterilerin online
                randevu sayfasında (Booking Page) görünmesi için yayına
                almalısınız.
              </p>
              <button
                className="btn-dark w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3"
                onClick={async () => {
                  try {
                    await api.post("/business/settings/publish");
                    alert(
                      "Değişiklikler başarıyla yayına alındı! Müşterileriniz yeni servisleri görebilir.",
                    );
                  } catch (err) {
                    alert("Yayına alınırken bir hata oluştu.");
                  }
                }}
              >
                <Globe className="w-4 h-4" />
                Değişiklikleri Yayına Al (Güncelle)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MÜŞTERİLER VE PORTFOLYO SEKMESİ */}
      {activeTab === "customers" && (
        <div className="animate-in fade-in duration-300">
          {/* A - PORTFOLYO GÖRÜNÜMÜ (Müşteri Seçildiyse) */}
          {selectedCustomer ? (
            <div className="space-y-6">
              <button
                onClick={() => setSelectedCustomer(null)}
                className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-800 transition"
              >
                <ArrowLeft className="w-4 h-4" /> Müşteri Listesine Dön
              </button>

              <div className="card border-2 border-indigo-50">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-2xl">
                      {selectedCustomer.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-slate-800">
                        {selectedCustomer.name}
                      </h2>
                      <p className="text-slate-500">{selectedCustomer.phone}</p>
                    </div>
                  </div>

                  {/* Portfolyo Sadakat Durumu */}
                  <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl text-center min-w-[150px]">
                    <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider mb-1">
                      Sadakat Puanı
                    </p>
                    <div className="flex items-center justify-center gap-1 text-2xl font-bold text-amber-600">
                      {selectedCustomer.visit_count || 0}{" "}
                      <span className="text-lg">{loyaltySettings.symbol}</span>
                    </div>
                    <p className="text-xs text-amber-600 mt-1">
                      {loyaltySettings.threshold} puanda 1 ücretsiz hizmet!
                    </p>
                  </div>
                </div>

                <h3 className="font-semibold text-slate-700 mb-3 border-b border-slate-100 pb-2">
                  Geçmiş Randevu Hareketleri
                </h3>
                <div className="space-y-2">
                  {appointments.filter(
                    (a) => a.customer_id?._id === selectedCustomer._id,
                  ).length === 0 ? (
                    <p className="text-sm text-slate-500 py-4 text-center">
                      Bu müşteriye ait henüz bir randevu kaydı bulunmuyor.
                    </p>
                  ) : (
                    appointments
                      .filter(
                        (a) => a.customer_id?._id === selectedCustomer._id,
                      )
                      .map((a) => (
                        <div
                          key={a._id}
                          className="flex items-center justify-between p-3 bg-slate-50 rounded-lg text-sm"
                        >
                          <div>
                            <p className="font-medium text-slate-800">
                              {a.service_id?.name}
                            </p>
                            <p className="text-xs text-slate-500">
                              {new Date(a.starts_at).toLocaleString("tr-TR")}
                            </p>
                          </div>
                          <span
                            className={`badge ${statusClasses[a.status] || "bg-slate-200 text-slate-700"}`}
                          >
                            {a.status === "completed"
                              ? "Tamamlandı"
                              : a.status === "no_show"
                                ? "Gelmedi"
                                : a.status === "arrived"
                                  ? "Kodu Onaylandı"
                                  : "Bekliyor"}
                          </span>
                        </div>
                      ))
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* B - MÜŞTERİ LİSTESİ VE SADAKAT AYARLARI (Varsayılan Görünüm) */
            <div className="space-y-6">
              {/* Sadakat Sistemi Ayarları */}
              <div className="card bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-100">
                <div className="flex items-center gap-2 mb-4">
                  <Award className="w-5 h-5 text-amber-600" />
                  <h3 className="font-semibold text-amber-900">
                    Sadakat Sistemi Ayarları
                  </h3>
                </div>
                <form
                  className="flex flex-wrap items-end gap-4"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    try {
                      await api.post(
                        "/business/loyalty/settings",
                        loyaltySettings,
                      );
                      alert("Sadakat ayarları kaydedildi!");
                    } catch (err) {
                      alert("Ayarlar kaydedilemedi.");
                    }
                  }}
                >
                  <div>
                    <label className="block text-xs font-medium text-amber-800 mb-1">
                      Sembol Seçimi
                    </label>
                    <select
                      className="input bg-white border-amber-200"
                      value={loyaltySettings.symbol}
                      onChange={(e) =>
                        setLoyaltySettings({
                          ...loyaltySettings,
                          symbol: e.target.value,
                        })
                      }
                    >
                      <option value="⭐">⭐ Yıldız</option>
                      <option value="☕">☕ Kahve</option>
                      <option value="💎">💎 Elmas</option>
                      <option value="✂️">✂️ Makas</option>
                      <option value="🎁">🎁 Hediye</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-amber-800 mb-1">
                      Hedef Puan (Kaçta Ücretsiz?)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="20"
                      className="input bg-white border-amber-200 w-24"
                      value={loyaltySettings.threshold}
                      onChange={(e) =>
                        setLoyaltySettings({
                          ...loyaltySettings,
                          threshold: Number(e.target.value),
                        })
                      }
                    />
                  </div>
                  <button className="btn bg-amber-500 hover:bg-amber-600 text-white py-2">
                    Ayarları Kaydet
                  </button>
                </form>
              </div>

              {/* Müşteri Listesi */}
              <div className="card">
                <h3 className="mb-4 font-semibold text-slate-700">
                  Müşteri Rehberi & Portfolyolar
                </h3>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {customers.length === 0 ? (
                    <div className="col-span-full text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                      <p className="text-sm text-slate-500">
                        Sistemde müşteri bulunmuyor.
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        Randevular sekmesinden yeni müşteri ekleyebilirsiniz.
                      </p>
                    </div>
                  ) : null}

                  {customers.map((c) => (
                    <div
                      key={c._id}
                      className="group cursor-pointer rounded-xl border border-slate-200 bg-white p-4 transition-all hover:border-indigo-300 hover:shadow-md"
                      onClick={() => setSelectedCustomer(c)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors">
                          {c.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800">
                            {c.name}
                          </p>
                          <p className="text-xs text-slate-500 mb-1">
                            {c.phone}
                          </p>
                          <div className="flex items-center gap-1 text-xs font-medium text-amber-600 bg-amber-50 inline-flex px-2 py-0.5 rounded-full">
                            {c.visit_count || 0} {loyaltySettings.symbol} Puan
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* RANDEVULAR VE HIZLI MÜŞTERİ EKLEME SEKMESİ */}
      {activeTab === "appointments" && (
        <div className="animate-in fade-in duration-300">
          <div className="grid gap-6 md:grid-cols-2 mb-6">
            {/* Sol: Hızlı Müşteri Ekle */}
            <div className="card bg-slate-50/50 border-dashed border-2 border-slate-200">
              <h3 className="mb-4 font-semibold text-slate-700 flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-500" /> Hızlı Müşteri Ekle
              </h3>
              <form
                className="grid gap-3"
                onSubmit={async (e) => {
                  e.preventDefault();
                  const f = new FormData(e.currentTarget);
                  try {
                    await api.post("/business/customers", {
                      name: f.get("name"),
                      phone: f.get("phone"),
                    });
                    e.currentTarget.reset();
                    load();
                    alert(
                      "Müşteri başarıyla eklendi! Sağ taraftan hemen randevu oluşturabilirsiniz.",
                    );
                  } catch (err) {
                    alert("Müşteri eklenirken hata oluştu.");
                  }
                }}
              >
                <input
                  name="name"
                  placeholder="İsim Soyisim"
                  className="input bg-white"
                  required
                />
                <input
                  name="phone"
                  placeholder="Telefon"
                  className="input bg-white"
                  required
                />
                <button className="btn-primary py-2.5">Kaydet</button>
              </form>
            </div>

            {/* Sağ: Randevu Oluştur */}
            <div className="card border-2 border-slate-100 shadow-sm">
              <h3 className="mb-4 font-semibold text-slate-700 flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-indigo-500" /> Randevu
                Oluştur
              </h3>
              <form
                className="grid gap-3"
                onSubmit={async (e) => {
                  e.preventDefault();
                  const f = new FormData(e.currentTarget);
                  try {
                    await api.post("/business/appointments", {
                      customer_id: f.get("customer_id"),
                      service_id: f.get("service_id"),
                      starts_at: f.get("starts_at"),
                    });
                    e.currentTarget.reset();
                    load();
                  } catch (err) {
                    alert("Randevu oluşturulurken hata oluştu.");
                  }
                }}
              >
                <select
                  name="customer_id"
                  className="input bg-slate-50"
                  required
                >
                  <option value="">Kayıtlı Müşteri Seçin...</option>
                  {customers.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <div className="grid grid-cols-2 gap-3">
                  <select
                    name="service_id"
                    className="input bg-slate-50"
                    required
                  >
                    <option value="">Servis Seçin...</option>
                    {services.map((s) => (
                      <option key={s._id} value={s._id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                  <input
                    type="datetime-local"
                    name="starts_at"
                    className="input bg-slate-50 text-sm"
                    required
                  />
                </div>
                <button className="btn-dark py-2.5">Randevuyu Kaydet</button>
              </form>
            </div>
          </div>

          {/* Güncel Randevu Listesi ve Onay Mekanizması */}
          <div className="card">
            <h3 className="mb-4 font-semibold text-slate-700">
              Aktif Randevular & Müşteri Karşılama
            </h3>
            <div className="space-y-3 overflow-y-auto max-h-[600px] pr-2 custom-scrollbar">
              {appointments.length === 0 ? (
                <p className="text-sm text-slate-500 py-4 text-center bg-slate-50 rounded-lg">
                  Aktif randevu bulunmuyor.
                </p>
              ) : null}

              {appointments.map((a) => (
                <div
                  key={a._id}
                  className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 rounded-xl border border-slate-200 p-4 bg-white transition hover:border-indigo-200"
                >
                  {/* Randevu Bilgileri */}
                  <div>
                    <p className="font-bold text-slate-800 text-base">
                      {a.customer_id?.name || "Bilinmeyen Müşteri"}
                    </p>
                    <p className="text-sm text-slate-500 mt-1 flex items-center gap-1.5 font-medium">
                      <Clock3 className="w-4 h-4 text-slate-400" />
                      {new Date(a.starts_at).toLocaleString("tr-TR", {
                        day: "2-digit",
                        month: "long",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                      <span className="text-slate-300">|</span>
                      <span className="text-indigo-600">
                        {a.service_id?.name}
                      </span>
                    </p>
                  </div>

                  {/* Durum Yönetimi ve 4 Haneli Kod Doğrulama */}
                  <div className="flex flex-wrap items-center gap-3 bg-slate-50 p-2 rounded-lg border border-slate-100">
                    {a.status === "pending" && (
                      <>
                        {/* GELDİ Mİ? (Kod Girişi) */}
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            maxLength={4}
                            placeholder="4 Haneli Kod"
                            className="input bg-white w-32 h-9 text-sm text-center tracking-widest font-bold"
                            value={verifyCodes[a._id] || ""}
                            onChange={(e) =>
                              setVerifyCodes({
                                ...verifyCodes,
                                [a._id]: e.target.value.replace(/\D/g, ""),
                              })
                            }
                          />
                          <button
                            className="btn bg-emerald-500 hover:bg-emerald-600 text-white px-3 h-9 text-xs flex items-center gap-1 shadow-sm"
                            onClick={async () => {
                              const code = verifyCodes[a._id];
                              if (!code || code.length !== 4)
                                return alert(
                                  "Lütfen müşterinin verdiği 4 haneli kodu eksiksiz girin.",
                                );
                              try {
                                // Backend'de status'u 'completed' yapıp, kod eşleşirse müşteriye +1 puan ekleyen endpoint çağrısı
                                await api.post(
                                  `/business/appointments/${a._id}/verify-and-complete`,
                                  { code },
                                );
                                alert(
                                  `Kod onaylandı! Müşteri 1 ${loyaltySettings.symbol} kazandı.`,
                                );
                                load();
                              } catch (err) {
                                alert("Kod hatalı veya işlem başarısız.");
                              }
                            }}
                          >
                            <CheckCircle className="w-4 h-4" /> Geldi (Kodu
                            Onayla)
                          </button>
                        </div>

                        {/* GELMEDİ Mİ? */}
                        <button
                          className="btn bg-rose-100 hover:bg-rose-200 text-rose-700 px-3 h-9 text-xs flex items-center gap-1"
                          onClick={async () => {
                            if (
                              window.confirm(
                                "Müşterinin gelmediğini onaylıyor musunuz?",
                              )
                            ) {
                              try {
                                await api.patch(
                                  `/business/appointments/${a._id}/status`,
                                  { status: "no_show" },
                                );
                                load();
                              } catch (err) {
                                alert("Durum güncellenemedi.");
                              }
                            }
                          }}
                        >
                          <XCircle className="w-4 h-4" /> Gelmedi
                        </button>
                      </>
                    )}

                    {a.status === "completed" && (
                      <span className="badge bg-emerald-100 text-emerald-800 font-semibold px-3 py-1.5">
                        <CheckCircle className="w-4 h-4 mr-1 inline" /> İşlem
                        Tamamlandı
                      </span>
                    )}
                    {a.status === "no_show" && (
                      <span className="badge bg-rose-100 text-rose-800 font-semibold px-3 py-1.5">
                        <XCircle className="w-4 h-4 mr-1 inline" /> Müşteri
                        Gelmedi
                      </span>
                    )}
                    {a.status === "cancelled" && (
                      <span className="badge bg-slate-200 text-slate-700 font-semibold px-3 py-1.5">
                        İptal Edildi
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* AI KAMPANYA SEKMESİ */}
      {activeTab === "campaigns" && (
        <div className="animate-in fade-in duration-300">
          <div className="card overflow-hidden relative mb-6">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Activity className="w-24 h-24 text-fuchsia-600" />
            </div>
            <h3 className="mb-1 font-bold text-slate-800 relative z-10">
              AI Kampanya Yöneticisi
            </h3>
            <p className="text-sm text-slate-500 mb-5 relative z-10">
              Gemini altyapısı ile saniyeler içinde hedef kitlenize özel
              pazarlama fikirleri üretin.
            </p>

            <div className="mb-6 grid gap-3 md:grid-cols-2 xl:grid-cols-[1fr_1fr_auto] relative z-10">
              <input
                className="input"
                placeholder="Sektör (Örn: Kafe, Kuaför)"
                value={sector}
                onChange={(e) => setSector(e.target.value)}
              />
              <input
                className="input"
                placeholder="Şehir (Örn: İstanbul)"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
              <input
                className="input md:col-span-2 xl:col-span-1"
                placeholder="Hedef Kitle (Örn: Öğrenciler)"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
              />
              <button
                className="btn bg-fuchsia-600 text-white hover:bg-fuchsia-700 shadow-md shadow-fuchsia-200"
                onClick={async () => {
                  if (!sector || !city)
                    return alert("Lütfen sektör ve şehir giriniz.");
                  try {
                    const { data } = await api.post("/ai/campaign", {
                      sector,
                      city,
                      target,
                    });
                    setCampaigns(data.ideas || []);
                  } catch (err) {
                    alert("Kampanya oluşturulurken hata oluştu.");
                  }
                }}
              >
                Fikir Üret
              </button>
            </div>

            {campaigns.length > 0 && (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 relative z-10">
                {campaigns.map((x, i) => (
                  <div
                    key={i}
                    className="rounded-xl border border-fuchsia-100 bg-fuchsia-50/30 p-5 transition hover:shadow-md hover:shadow-fuchsia-100"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-6 h-6 rounded-full bg-fuchsia-200 flex items-center justify-center text-xs font-bold text-fuchsia-700">
                        {i + 1}
                      </div>
                      <span className="text-xs font-bold uppercase tracking-wider text-fuchsia-700">
                        Öneri
                      </span>
                    </div>
                    <p className="text-sm leading-relaxed text-slate-700">
                      {x}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </AppLayout>
  );
}
