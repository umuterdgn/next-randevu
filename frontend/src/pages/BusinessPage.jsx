import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import toast from "react-hot-toast";
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
  Edit2,
  Trash2,
} from "lucide-react";
import AppLayout from "../layouts/AppLayout";
import { useAuth } from "../context/AuthContext";
import api from "../api/client";
import Card from "../components/Card";
import FinanceComponent from "../components/FinanceComponent";
import CariComponent from "../components/CariComponent";

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
          : location.pathname.includes("finance")
            ? "finance"
            : location.pathname.includes("cari")
              ? "cari"
              : location.pathname.includes("staff")
                ? "staff"
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
  const [editingService, setEditingService] = useState(null);
  const [staff, setStaff] = useState([]);
  const [editingStaff, setEditingStaff] = useState(null);
  const [isSubmittingService, setIsSubmittingService] = useState(false);
  const [isSubmittingStaff, setIsSubmittingStaff] = useState(false);

  // Randevu Filtreleri
  const [selectedDate, setSelectedDate] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

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
  const [themeColor, setThemeColor] = useState("#3B82F6"); // Tema rengi
  const [verifyCodes, setVerifyCodes] = useState({}); // 4 haneli kod inputlarını tutmak için

  // Block Time Modal State
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [blockForm, setBlockForm] = useState({
    date: "",
    startTime: "",
    endTime: "",
    note: "",
  });
  const [blockTab, setBlockTab] = useState("custom"); // "weekly" or "custom"
  const [workingHours, setWorkingHours] = useState({
    monday: { open: "09:00", close: "17:00", isClosed: false, breaks: [] },
    tuesday: { open: "09:00", close: "17:00", isClosed: false, breaks: [] },
    wednesday: { open: "09:00", close: "17:00", isClosed: false, breaks: [] },
    thursday: { open: "09:00", close: "17:00", isClosed: false, breaks: [] },
    friday: { open: "09:00", close: "17:00", isClosed: false, breaks: [] },
    saturday: { open: "09:00", close: "17:00", isClosed: false, breaks: [] },
    sunday: { open: "09:00", close: "17:00", isClosed: false, breaks: [] },
  });
  const [isAllDayBlock, setIsAllDayBlock] = useState(false);
  const [blockEndDate, setBlockEndDate] = useState("");

  const load = async () => {
    try {
      const [d, s, c, a, st] = await Promise.all([
        api.get("/business/dashboard"),
        api.get("/business/services"),
        api.get("/business/customers"),
        api.get("/business/appointments"),
        api.get("/business/staff"),
      ]);
      setDash(d.data);
      setServices(s.data);
      setCustomers(c.data);
      setAppointments(a.data);
      setStaff(st.data);

      // Eğer işletmenin backend'den gelen sadakat ayarları varsa onları da state'e al
      if (d.data?.loyalty_settings) {
        setLoyaltySettings(d.data.loyalty_settings);
      }

      // Tema rengini al
      if (d.data?.theme_color) {
        setThemeColor(d.data.theme_color);
      }

      // Eğer seçili bir müşteri varsa, onu yeni gelen listedeki güncel haliyle güncelle
      if (selectedCustomer) {
        const updatedCustomer = c.data.find((customer) => customer._id === selectedCustomer._id);
        if (updatedCustomer) {
          setSelectedCustomer(updatedCustomer);
        }
      }
    } catch (error) {
      console.error("Veriler yüklenirken hata:", error);
      toast.error(error.response?.data?.message || "Veriler yüklenirken hata oluştu.");
    }
  };

  const loadAppointments = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedDate) {
        const formattedDate = new Date(selectedDate.getTime() - (selectedDate.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
        params.append("date", formattedDate);
      }
      if (searchTerm) {
        params.append("search", searchTerm);
      }
      if (statusFilter) {
        params.append("status", statusFilter);
      }

      const response = await api.get(`/business/appointments?${params.toString()}`);
      setAppointments(response.data);
    } catch (error) {
      console.error("Randevular yüklenirken hata:", error);
      toast.error(error.response?.data?.message || "Randevular yüklenirken hata oluştu.");
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    loadAppointments();
  }, [selectedDate, searchTerm, statusFilter]);

  const handleBlockTime = async (e) => {
    e.preventDefault();
    try {
      if (blockTab === "weekly") {
        await api.put("/business/settings", { workingHours });
        toast.success("Çalışma saatleri güncellendi!");
      } else {
        const startDate = new Date(blockForm.date);
        const endDate = blockEndDate ? new Date(blockEndDate) : new Date(blockForm.date);

        const appointmentsToCreate = [];
        let currentDate = new Date(startDate);

        while (currentDate <= endDate) {
          let startsAtISO, endsAtISO;

          if (isAllDayBlock) {
            const dateStr = currentDate.toISOString().split('T')[0];
            const startDateTime = new Date(dateStr + 'T00:00:00');
            const endDateTime = new Date(dateStr + 'T23:59:59');

            if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
              toast.error("Geçersiz tarih formatı");
              return;
            }

            startsAtISO = startDateTime.toISOString();
            endsAtISO = endDateTime.toISOString();
          } else {
            const dateStr = currentDate.toISOString().split('T')[0];
            const startDateTime = new Date(dateStr + 'T' + blockForm.startTime + ':00');
            const endDateTime = new Date(dateStr + 'T' + blockForm.endTime + ':00');

            if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
              toast.error("Geçersiz tarih veya saat formatı");
              return;
            }

            startsAtISO = startDateTime.toISOString();
            endsAtISO = endDateTime.toISOString();
          }

          appointmentsToCreate.push({
            customer_id: null,
            service_id: null,
            starts_at: startsAtISO,
            ends_at: endsAtISO,
            status: "blocked",
            note: blockForm.note,
            is_all_day: isAllDayBlock,
          });

          currentDate.setDate(currentDate.getDate() + 1);
        }

        for (const appointment of appointmentsToCreate) {
          await api.post("/business/appointments", appointment);
        }

        toast.success("Zaman başarıyla engellendi!");
      }

      setShowBlockModal(false);
      setBlockForm({ date: "", startTime: "", endTime: "", note: "" });
      setIsAllDayBlock(false);
      setBlockEndDate("");
      loadAppointments();
    } catch (err) {
      console.error("Zaman engelleme hatası:", err);
      toast.error(err.response?.data?.message || "Zaman engellenirken hata oluştu.");
    }
  };

  const handleEditService = (service) => {
    setEditingService(service);
  };

  const handleDeleteService = async (serviceId) => {
    if (!confirm("Bu hizmeti silmek istediğinizden emin misiniz?")) return;
    try {
      await api.delete(`/business/services/${serviceId}`);
      load();
    } catch (err) {
      toast.error("Hizmet silinirken hata oluştu.");
    }
  };

  const handleCancelEdit = () => {
    setEditingService(null);
  };

  const mostUsedServicesData = (dash?.most_used_services || []).map(item => ({
    name: item.service,
    count: item.count
  }));
  const appointmentTrendsData = (dash?.appointment_trend || []).map(item => ({
    date: item._id,
    count: item.count
  }));

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
              className="mb-4 flex flex-col gap-3"
              onSubmit={async (e) => {
                e.preventDefault();
                setIsSubmittingService(true);
                const f = new FormData(e.currentTarget);
                try {
                  const serviceData = {
                    name: f.get("name"),
                    duration: Number(f.get("duration")),
                    price: f.get("price") ? Number(f.get("price")) : null,
                    description: f.get("description") || "",
                    critical_points: f.get("critical_points") || "",
                    process_steps: f.get("process_steps") || "",
                  };

                  if (editingService) {
                    await api.put(`/business/services/${editingService._id}`, serviceData);
                    setEditingService(null);
                    toast.success("Servis başarıyla güncellendi!");
                  } else {
                    await api.post("/business/services", serviceData);
                    toast.success("Servis başarıyla eklendi!");
                  }
                  e.currentTarget?.reset();
                  load();
                } catch (err) {
                  console.error("Hata:", err);
                  toast.error(err.response?.data?.message || (editingService ? "Servis güncellenirken hata oluştu." : "Servis eklenirken hata oluştu."));
                } finally {
                  setIsSubmittingService(false);
                }
              }}
            >
              <div className="flex gap-2">
                <input
                  name="name"
                  placeholder="Servis adı"
                  className="input flex-1"
                  required
                  defaultValue={editingService?.name}
                />
                <input
                  name="duration"
                  placeholder="Süre (Dk)"
                  type="number"
                  className="input w-24"
                  required
                  defaultValue={editingService?.duration}
                />
                <input
                  name="price"
                  placeholder="Fiyat (TL)"
                  type="number"
                  className="input w-28"
                  defaultValue={editingService?.price}
                />
                <button type="submit" className="btn-primary whitespace-nowrap px-4" disabled={isSubmittingService}>
                  {isSubmittingService ? "İşleniyor..." : (editingService ? "Güncelle" : "Ekle")}
                </button>
                {editingService && (
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="btn-secondary whitespace-nowrap px-4"
                  >
                    İptal
                  </button>
                )}
              </div>
              <textarea
                name="description"
                placeholder="Hizmet Açıklaması (opsiyonel)"
                className="input w-full h-20 resize-none"
                defaultValue={editingService?.description}
              />
              <textarea
                name="critical_points"
                placeholder="Kritik Noktalar (opsiyonel)"
                className="input w-full h-20 resize-none"
                defaultValue={editingService?.critical_points}
              />
              <textarea
                name="process_steps"
                placeholder="İşlem Süreçleri (opsiyonel)"
                className="input w-full h-20 resize-none"
                defaultValue={editingService?.process_steps}
              />
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
                  <div className="flex-1">
                    <span className="font-medium text-slate-800">{s.name}</span>
                    <div className="flex gap-2 mt-1">
                      <span className="badge bg-indigo-50 text-indigo-700 border border-indigo-100">
                        {s.duration} Dk
                      </span>
                      {s.price && (
                        <span className="badge bg-green-50 text-green-700 border border-green-100">
                          {s.price} TL
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => handleEditService(s)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Düzenle"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteService(s._id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Sil"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* PERSONELLER/BAYİLER SEKMESİ */}
      {activeTab === "staff" && (
        <div className="animate-in fade-in duration-300">
          <div className="card flex flex-col mb-6 relative">
            <h3 className="mb-4 font-semibold text-slate-700">
              Personeller ve Bayiler
            </h3>
            <form
              className="mb-4 flex flex-col gap-3"
              onSubmit={async (e) => {
                e.preventDefault();
                const f = new FormData(e.currentTarget);
                try {
                  const staffData = {
                    name: f.get("name"),
                    role: f.get("role"),
                    phone: f.get("phone") || null,
                    email: f.get("email") || null,
                  };

                  if (editingStaff) {
                    await api.put(`/business/staff/${editingStaff._id}`, staffData);
                    setEditingStaff(null);
                    toast.success("Personel başarıyla güncellendi!");
                  } else {
                    await api.post("/business/staff", staffData);
                    toast.success("Personel başarıyla eklendi!");
                  }
                  e.currentTarget.reset();
                  load();
                } catch (err) {
                  console.error("Hata:", err);
                  toast.error(err.response?.data?.message || (editingStaff ? "Personel güncellenirken hata oluştu." : "Personel eklenirken hata oluştu."));
                }
              }}
            >
              <div className="flex gap-2">
                <input
                  name="name"
                  placeholder="Ad Soyad"
                  className="input flex-1"
                  required
                  defaultValue={editingStaff?.name}
                />
                <select
                  name="role"
                  className="input w-32"
                  required
                  defaultValue={editingStaff?.role}
                >
                  <option value="staff">Personel</option>
                  <option value="dealer">Bayi</option>
                </select>
                <input
                  name="phone"
                  placeholder="Telefon"
                  className="input w-36"
                  defaultValue={editingStaff?.phone}
                />
                <input
                  name="email"
                  placeholder="E-posta"
                  className="input flex-1"
                  defaultValue={editingStaff?.email}
                />
                <button type="submit" className="btn-primary whitespace-nowrap px-4">
                  {editingStaff ? "Güncelle" : "Ekle"}
                </button>
                {editingStaff && (
                  <button
                    type="button"
                    onClick={() => setEditingStaff(null)}
                    className="btn-secondary whitespace-nowrap px-4"
                  >
                    İptal
                  </button>
                )}
              </div>
            </form>
            <div className="space-y-2 overflow-y-auto max-h-[400px] pr-2 custom-scrollbar mb-6">
              {staff.length === 0 ? (
                <p className="text-sm text-slate-500 py-2">
                  Henüz personel/bayi eklenmemiş.
                </p>
              ) : null}
              {staff.map((s) => (
                <div
                  key={s._id}
                  className={`flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50/50 p-3 text-sm ${!s.is_active ? 'opacity-60' : ''}`}
                >
                  <div className="flex-1">
                    <span className="font-medium text-slate-800">{s.name}</span>
                    <div className="flex gap-2 mt-1">
                      <span className={`badge ${s.role === 'dealer' ? 'bg-purple-50 text-purple-700 border border-purple-100' : 'bg-indigo-50 text-indigo-700 border border-indigo-100'}`}>
                        {s.role === 'dealer' ? 'Bayi' : 'Personel'}
                      </span>
                      {s.phone && (
                        <span className="badge bg-slate-100 text-slate-600 border border-slate-200">
                          {s.phone}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => setEditingStaff(s)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Düzenle"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={async () => {
                        if (confirm(`${s.name} adlı personeli silmek istediğinize emin misiniz?`)) {
                          try {
                            await api.delete(`/business/staff/${s._id}`);
                            load();
                          } catch (err) {
                            toast.error("Personel silinirken hata oluştu.");
                          }
                        }
                      }}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Sil"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
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
                      {selectedCustomer.loyalty_points || 0}{" "}
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
                      toast.success("Sadakat ayarları kaydedildi!");
                    } catch (err) {
                      toast.error("Ayarlar kaydedilemedi.");
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

              {/* Tema Rengi Ayarları */}
              <div className="card bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-100">
                <div className="flex items-center gap-2 mb-4">
                  <Settings className="w-5 h-5 text-indigo-600" />
                  <h3 className="font-semibold text-indigo-900">
                    Görünüm Ayarları
                  </h3>
                </div>
                <form
                  className="flex flex-wrap items-end gap-4"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    try {
                      await api.put("/business/settings", { theme_color: themeColor });
                      toast.success("Tema rengi kaydedildi!");
                    } catch (err) {
                      toast.error(err.response?.data?.message || "Tema rengi kaydedilemedi.");
                    }
                  }}
                >
                  <div>
                    <label className="block text-xs font-medium text-indigo-800 mb-1">
                      Tema Rengi
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={themeColor}
                        onChange={(e) => setThemeColor(e.target.value)}
                        className="w-12 h-10 rounded cursor-pointer border-2 border-indigo-200"
                      />
                      <input
                        type="text"
                        value={themeColor}
                        onChange={(e) => setThemeColor(e.target.value)}
                        className="input bg-white border-indigo-200 w-24"
                        pattern="^#[0-9A-Fa-f]{6}$"
                      />
                    </div>
                  </div>
                  <button className="btn bg-indigo-500 hover:bg-indigo-600 text-white py-2">
                    Rengi Kaydet
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
                            {c.loyalty_points || 0} {loyaltySettings.symbol} Puan
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
          {/* Üst Bar: Filtreler & Arama */}
          <div className="card mb-6">
            <div className="flex flex-col md:flex-row gap-4 items-center">
              <div className="flex-1 w-full">
                <input
                  type="text"
                  placeholder="Müşteri adı veya hizmet ara..."
                  className="input w-full"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="w-full md:w-48">
                <select
                  className="input w-full"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="">Tüm Durumlar</option>
                  <option value="pending">Bekleyenler</option>
                  <option value="approved">Onaylananlar</option>
                  <option value="completed">Tamamlananlar</option>
                  <option value="cancelled">İptal Edilenler</option>
                </select>
              </div>
              <button
                onClick={() => navigate("/business/quick-booking")}
                className="btn-primary whitespace-nowrap px-6"
              >
                Hızlı Randevu Oluştur
              </button>
              <button
                onClick={() => setShowBlockModal(true)}
                className="btn-dark whitespace-nowrap px-6"
              >
                Zamanı Kapat
              </button>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Sol Bölüm: Takvim */}
            <div className="lg:col-span-1">
              <div className="card">
                <h3 className="mb-4 font-semibold text-slate-700">Takvim</h3>
                <Calendar
                  onChange={setSelectedDate}
                  value={selectedDate}
                  className="w-full"
                  tileClassName={({ date, view }) =>
                    view === "month" &&
                    selectedDate &&
                    date.toDateString() === selectedDate.toDateString()
                      ? "bg-indigo-600 text-white rounded-lg"
                      : ""
                  }
                />
                <button
                  onClick={() => setSelectedDate(null)}
                  className="w-full mt-4 py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors text-sm font-medium"
                >
                  Tüm Zamanların Randevularını Gör
                </button>
              </div>
            </div>

            {/* Sağ Bölüm: Randevu Listesi */}
            <div className="lg:col-span-2">
              <div className="card">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold text-slate-700">
                    {selectedDate
                      ? `${selectedDate.toLocaleDateString("tr-TR", {
                          day: "2-digit",
                          month: "long",
                          year: "numeric",
                        })} Randevuları`
                      : "Tüm Randevular"}
                  </h3>
                  <span className="text-sm text-slate-500">
                    {appointments.length} randevu
                  </span>
                </div>

                <div className="space-y-3 overflow-y-auto max-h-[700px] pr-2 custom-scrollbar">
                  {appointments.length === 0 ? (
                    <p className="text-sm text-slate-500 py-8 text-center bg-slate-50 rounded-lg">
                      Randevu bulunmuyor.
                    </p>
                  ) : null}

                  {appointments.map((a) => (
                    <div
                      key={a._id}
                      className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border p-4 transition ${
                        a.status === 'blocked'
                          ? 'bg-slate-100 border-slate-300 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,#e5e7eb_10px,#e5e7eb_20px)]'
                          : 'bg-white border-slate-200 hover:border-indigo-200'
                      }`}
                    >
                      <div className="flex-1">
                        {a.status === 'blocked' ? (
                          <>
                            <p className="font-bold text-slate-700 text-base">
                              🚫 {a.note || 'Engellenmiş Zaman'}
                            </p>
                            <p className="text-sm text-slate-600 mt-1 flex items-center gap-1.5 font-medium">
                              <Clock3 className="w-4 h-4 text-slate-500" />
                              {new Date(a.starts_at).toLocaleString("tr-TR", {
                                day: "2-digit",
                                month: "long",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                              <span className="text-slate-400">|</span>
                              <span className="text-slate-600">
                                {new Date(a.ends_at).toLocaleTimeString("tr-TR", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            </p>
                          </>
                        ) : (
                          <>
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
                          </>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-3">
                        <select
                          value={a.status}
                          onChange={async (e) => {
                            try {
                              await api.patch(`/business/appointments/${a._id}/status`, {
                                status: e.target.value,
                              });
                              loadAppointments();
                            } catch (err) {
                              alert("Durum güncellenirken hata oluştu.");
                            }
                          }}
                          className="input text-sm py-1.5 px-3 w-32"
                        >
                          <option value="pending">Beklemede</option>
                          <option value="approved">Onaylandı</option>
                          <option value="completed">Tamamlandı</option>
                          <option value="cancelled">İptal</option>
                          <option value="blocked">Kapalı</option>
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Block Time Modal */}
      {showBlockModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-xl font-bold text-slate-800 mb-4">Zaman Yönetimi</h3>
              
              {/* Tabs */}
              <div className="flex gap-2 mb-6">
                <button
                  onClick={() => setBlockTab("weekly")}
                  className={`flex-1 py-2 px-4 rounded-lg font-medium transition ${
                    blockTab === "weekly"
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  Haftalık Çalışma Saatleri
                </button>
                <button
                  onClick={() => setBlockTab("custom")}
                  className={`flex-1 py-2 px-4 rounded-lg font-medium transition ${
                    blockTab === "custom"
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  Özel Tarih/Saat Kapat
                </button>
              </div>

              {/* Weekly Hours Tab */}
              {blockTab === "weekly" && (
                <form onSubmit={handleBlockTime} className="space-y-4">
                  {Object.entries(workingHours).map(([day, hours]) => (
                    <div key={day} className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg">
                      <div className="w-32 font-medium text-slate-700 capitalize">
                        {day === "monday" && "Pazartesi"}
                        {day === "tuesday" && "Salı"}
                        {day === "wednesday" && "Çarşamba"}
                        {day === "thursday" && "Perşembe"}
                        {day === "friday" && "Cuma"}
                        {day === "saturday" && "Cumartesi"}
                        {day === "sunday" && "Pazar"}
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="time"
                          className="input text-sm w-28"
                          value={hours.open}
                          onChange={(e) =>
                            setWorkingHours({
                              ...workingHours,
                              [day]: { ...hours, open: e.target.value },
                            })
                          }
                          disabled={hours.isClosed}
                        />
                        <span className="text-slate-400">-</span>
                        <input
                          type="time"
                          className="input text-sm w-28"
                          value={hours.close}
                          onChange={(e) =>
                            setWorkingHours({
                              ...workingHours,
                              [day]: { ...hours, close: e.target.value },
                            })
                          }
                          disabled={hours.isClosed}
                        />
                      </div>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={hours.isClosed}
                          onChange={(e) =>
                            setWorkingHours({
                              ...workingHours,
                              [day]: { ...hours, isClosed: e.target.checked },
                            })
                          }
                          className="w-4 h-4"
                        />
                        <span className="text-sm text-slate-600">Kapalı</span>
                      </label>
                    </div>
                  ))}
                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowBlockModal(false);
                        setBlockTab("custom");
                      }}
                      className="flex-1 py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
                    >
                      İptal
                    </button>
                    <button type="submit" className="flex-1 btn-primary">
                      Çalışma Saatlerini Kaydet
                    </button>
                  </div>
                </form>
              )}

              {/* Custom Blocking Tab */}
              {blockTab === "custom" && (
                <form onSubmit={handleBlockTime} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Başlangıç Tarihi</label>
                    <input
                      type="date"
                      className="input w-full"
                      value={blockForm.date}
                      onChange={(e) => setBlockForm({ ...blockForm, date: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Bitiş Tarihi</label>
                    <input
                      type="date"
                      className="input w-full"
                      value={blockEndDate}
                      onChange={(e) => setBlockEndDate(e.target.value)}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="isAllDay"
                      checked={isAllDayBlock}
                      onChange={(e) => setIsAllDayBlock(e.target.checked)}
                      className="w-4 h-4"
                    />
                    <label htmlFor="isAllDay" className="text-sm text-slate-600">
                      Tüm Gün Komple Kapat
                    </label>
                  </div>
                  {!isAllDayBlock && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Başlangıç Saati</label>
                        <input
                          type="time"
                          className="input w-full"
                          value={blockForm.startTime}
                          onChange={(e) => setBlockForm({ ...blockForm, startTime: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Bitiş Saati</label>
                        <input
                          type="time"
                          className="input w-full"
                          value={blockForm.endTime}
                          onChange={(e) => setBlockForm({ ...blockForm, endTime: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Engelleme Nedeni</label>
                    <input
                      type="text"
                      className="input w-full"
                      placeholder="Örn: Kişisel iş, Öğle arası uzadı"
                      value={blockForm.note}
                      onChange={(e) => setBlockForm({ ...blockForm, note: e.target.value })}
                      required
                    />
                  </div>
                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowBlockModal(false);
                        setBlockForm({ date: "", startTime: "", endTime: "", note: "" });
                        setIsAllDayBlock(false);
                        setBlockEndDate("");
                      }}
                      className="flex-1 py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
                    >
                      İptal
                    </button>
                    <button type="submit" className="flex-1 btn-dark">
                      Zamanı Kapat
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* FINANS SEKMESİ */}
      {activeTab === "finance" && <FinanceComponent />}

      {/* CARI HESAPLAR SEKMESİ */}
      {activeTab === "cari" && <CariComponent />}

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
