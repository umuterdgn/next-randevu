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
  Gift,
  CheckCircle,
  XCircle,
  Settings,
  Globe,
  Edit2,
  Trash2,
  Mail,
  Search,
  MapPin,
  Sparkles,
  Loader2,
  Send,
  Lock,
  Download,
  Copy,
} from "lucide-react";
import AppLayout from "../layouts/AppLayout";
import { useAuth } from "../context/AuthContext";
import api from "../api/client";
import Card from "../components/Card";
import FinanceComponent from "../components/FinanceComponent";
import CariComponent from "../components/CariComponent";
import Modal, { ConfirmModal } from "../components/Modal";

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
                : location.pathname.includes("settings")
                  ? "settings"
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
  const [campaigns, setCampaigns] = useState({
    whatsapp: "",
    instagram: "",
    facebook: "",
  });
  const [activePlatformTab, setActivePlatformTab] = useState("whatsapp");
  const [editingService, setEditingService] = useState(null);
  const [staff, setStaff] = useState([]);
  const [editingStaff, setEditingStaff] = useState(null);
  const [isSubmittingService, setIsSubmittingService] = useState(false);
  const [isSubmittingStaff, setIsSubmittingStaff] = useState(false);

  // DÖNGÜYÜ KIRAN STATE BURADA

  // Randevu Filtreleri
  const [selectedDate, setSelectedDate] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // AI Form
  const [sector, setSector] = useState("");
  const [city, setCity] = useState("");
  const [target, setTarget] = useState("");
  const [segment, setSegment] = useState("all");
  const [duration, setDuration] = useState("");
  const [creditsRemaining, setCreditsRemaining] = useState(5);

  // Yeni Özellik Stateleri
  const [selectedCustomer, setSelectedCustomer] = useState(null); // Portfolyo görünümü için
  const [loyaltySettings, setLoyaltySettings] = useState({
    symbol: "⭐",
    threshold: 5,
  }); // Sadakat ayarları
  const [redeemForm, setRedeemForm] = useState({
    reward_code: "",
    customer_id: "",
  }); // Ödül kullanım formu
  const [themeColor, setThemeColor] = useState("#3B82F6"); // Tema rengi
  const [verifyCodes, setVerifyCodes] = useState({}); // 4 haneli kod inputlarını tutmak için
  const [sendingCampaign, setSendingCampaign] = useState(null); // Hangi kampanya gönderiliyor
  const [isGenerating, setIsGenerating] = useState(false); // Kampanya üretim durumu
  const [selectedCampaign, setSelectedCampaign] = useState(null); // Düzenlenecek kampanya
  const [customMessage, setCustomMessage] = useState(""); // Kişiselleştirilmiş mesaj
  const [logoFile, setLogoFile] = useState(null); // Logo dosyası için state

  // AI Visual Studio States
  const [imagePrompt, setImagePrompt] = useState("");
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState("");
  const [imageFormat, setImageFormat] = useState("post"); // post, story, banner

  // Settings State
  const [settings, setSettings] = useState({
    name: "",
    address: "",
    theme_color: "#3B82F6",
    logo_url: "",
    map_url: "",
    about_text: "",
    whatsapp_token: "",
    whatsapp_phone_number_id: "",
    bookingSettings: {
      bufferTime: 10,
      maxConcurrent: 1,
      slotInterval: 30,
      cancellationBuffer: 120,
    },
    integrations: {
      whatsappEnabled: true,
      googleCalendar: false,
      appleCalendar: false,
    },
    auto_approve_appointments: true,
  });

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

  // Delete Confirmation Modal State
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    type: null, // 'service' or 'staff'
    id: null,
    name: "",
  });

  // Service Edit Modal State
  const [showServiceEditModal, setShowServiceEditModal] = useState(false);
  const [serviceForm, setServiceForm] = useState({
    name: "",
    duration: "",
    price: "",
    description: "",
    critical_points: "",
    process_steps: "",
    is_online: false,
  });

  const load = async () => {
    try {
      const [d, s, c, a, st, settingsRes] = await Promise.all([
        api.get("/business/dashboard"),
        api.get("/business/services"),
        api.get("/business/customers"),
        api.get("/business/appointments"),
        api.get("/business/staff"),
        api.get("/business/settings"),
      ]);
      setDash(d.data);
      setServices(s.data);
      setCustomers(
        c.data?.data ||
          c.data?.customers ||
          (Array.isArray(c.data) ? c.data : []),
      );
      setAppointments(a.data);
      setStaff(st.data);

      // Ayarları yeni rotadan al (settingsRes.data)
      const bData = settingsRes.data;
      if (bData) {
        setSettings((prev) => ({
          ...prev,
          name: bData.name || "",
          address: bData.address || "",
          theme_color: bData.theme_color || "#3B82F6",
          logo_url: bData.logo_url || "",
          map_url: bData.map_url || "",
          about_text: bData.about_text || "",
          whatsapp_token: bData.whatsapp_token || "",
          whatsapp_phone_number_id: bData.whatsapp_phone_number_id || "",
          is_loyalty_enabled: bData.is_loyalty_enabled ?? true,
          bookingSettings: bData.bookingSettings || {
            bufferTime: 10,
            maxConcurrent: 1,
            slotInterval: 30,
            cancellationBuffer: 120,
          },
          integrations: bData.integrations || {
            whatsappEnabled: true,
            googleCalendar: false,
            appleCalendar: false,
          },
          auto_approve_appointments: bData.auto_approve_appointments ?? true,
        }));

        // Also update dash state with fallbacks including plan and extraFeatures
        setDash((prev) => ({
          ...prev,
          about_text: bData.about_text || "",
          map_url: bData.map_url || "",
          plan: bData.plan || "physical",
          extraFeatures: bData.extraFeatures || {},
        }));

        // Sembolü ve sayıyı doğru çek:
        setLoyaltySettings({
          threshold: bData.reward_threshold || 10,
          symbol: bData.loyalty_symbol || "⭐",
        });

        // AI kredilerini çek
        setCreditsRemaining(bData.ai_campaign_credits || 5);
      }

      // Eğer seçili bir müşteri varsa, onu yeni gelen listedeki güncel haliyle güncelle
      if (selectedCustomer) {
        const updatedCustomer = c.data.find(
          (customer) => customer._id === selectedCustomer._id,
        );
        if (updatedCustomer) {
          setSelectedCustomer(updatedCustomer);
        }
      }
    } catch (error) {
      console.error("Load error:", error);
      // Artık döngü tehlikesi yok, direkt apply sayfasına uçuruyoruz!
      if (
        error.response?.data?.require_apply ||
        error.response?.status === 404
      ) {
        navigate("/apply");
        return;
      }
      toast.error(
        error.response?.data?.message || "Veriler yüklenirken hata oluştu.",
      );
    }
  };

  const loadAppointments = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedDate) {
        const formattedDate = new Date(
          selectedDate.getTime() - selectedDate.getTimezoneOffset() * 60000,
        )
          .toISOString()
          .split("T")[0];
        params.append("date", formattedDate);
      }
      if (searchTerm) {
        params.append("search", searchTerm);
      }
      if (statusFilter) {
        params.append("status", statusFilter);
      }

      const response = await api.get(
        `/business/appointments?${params.toString()}`,
      );
      setAppointments(response.data);
    } catch (error) {
      console.error("Randevular yüklenirken hata:", error);
      toast.error(
        error.response?.data?.message || "Randevular yüklenirken hata oluştu.",
      );
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
        const endDate = blockEndDate
          ? new Date(blockEndDate)
          : new Date(blockForm.date);

        const appointmentsToCreate = [];
        let currentDate = new Date(startDate);

        while (currentDate <= endDate) {
          let startsAtISO, endsAtISO;

          if (isAllDayBlock) {
            const dateStr = currentDate.toISOString().split("T")[0];
            const startDateTime = new Date(dateStr + "T00:00:00");
            const endDateTime = new Date(dateStr + "T23:59:59");

            if (
              isNaN(startDateTime.getTime()) ||
              isNaN(endDateTime.getTime())
            ) {
              toast.error("Geçersiz tarih formatı");
              return;
            }

            startsAtISO = startDateTime.toISOString();
            endsAtISO = endDateTime.toISOString();
          } else {
            const dateStr = currentDate.toISOString().split("T")[0];
            const startDateTime = new Date(
              dateStr + "T" + blockForm.startTime + ":00",
            );
            const endDateTime = new Date(
              dateStr + "T" + blockForm.endTime + ":00",
            );

            if (
              isNaN(startDateTime.getTime()) ||
              isNaN(endDateTime.getTime())
            ) {
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
      toast.error(
        err.response?.data?.message || "Zaman engellenirken hata oluştu.",
      );
    }
  };

  const handleEditService = (service) => {
    setServiceForm({
      name: service.name,
      duration: service.duration,
      price: service.price || "",
      description: service.description || "",
      critical_points: service.critical_points || "",
      process_steps: service.process_steps || "",
      is_online: service.is_online || false,
    });
    setEditingService(service);
    setShowServiceEditModal(true);
  };

  const handleDeleteService = (serviceId, serviceName) => {
    setDeleteModal({
      isOpen: true,
      type: "service",
      id: serviceId,
      name: serviceName,
    });
  };

  const confirmDelete = async () => {
    try {
      if (deleteModal.type === "service") {
        await api.delete(`/business/services/${deleteModal.id}`);
        toast.success("Hizmet başarıyla silindi!");
      } else if (deleteModal.type === "staff") {
        await api.delete(`/business/staff/${deleteModal.id}`);
        toast.success("Personel başarıyla silindi!");
      }
      load();
    } catch (err) {
      toast.error("Silme işlemi sırasında hata oluştu.");
    } finally {
      setDeleteModal({ isOpen: false, type: null, id: null, name: "" });
    }
  };

  const handleCancelEdit = () => {
    setEditingService(null);
    setShowServiceEditModal(false);
    setServiceForm({
      name: "",
      duration: "",
      price: "",
      description: "",
      critical_points: "",
      process_steps: "",
      is_online: false,
    });
  };

  const handleSaveSettings = async () => {
    try {
      let currentLogoUrl = settings.logo_url;

      if (logoFile) {
        const formData = new FormData();
        formData.append("logo", logoFile);

        const logoResponse = await api.patch("/business/logo", formData);

        if (logoResponse.data.success) {
          currentLogoUrl = logoResponse.data.data.logo_url;

          setSettings((prev) => ({ ...prev, logo_url: currentLogoUrl }));
          setLogoFile(null);
          toast.success("Logo başarıyla yüklendi!");
        }
      }

      const response = await api.put("/business/settings", {
        name: settings.name,
        address: settings.address,
        theme_color: settings.theme_color,
        logo_url: currentLogoUrl,
        map_url: settings.map_url,
        about_text: settings.about_text,
        is_loyalty_enabled: settings.is_loyalty_enabled,
        bookingSettings: settings.bookingSettings,
        integrations: settings.integrations,
        whatsapp_token: settings.whatsapp_token,
        whatsapp_phone_number_id: settings.whatsapp_phone_number_id,
        auto_approve_appointments: settings.auto_approve_appointments,
      });

      if (response.data.googleAuthUrl) {
        toast.info("Google Calendar bağlantısı için yönlendiriliyorsunuz...");
        window.location.href = response.data.googleAuthUrl;
        return;
      }

      toast.success("Ayarlar başarıyla güncellendi!");
      load();
    } catch (error) {
      console.error("🔥 KAYIT HATASI DETAYI:", error.response?.data || error);
      toast.error("Ayarlar güncellenirken hata oluştu");
    }
  };

  const handleBuyCredit = async () => {
    const loadingToast = toast.loading("Ödeme sayfasına yönlendiriliyor...");
    try {
      const response = await api.post("/payment/buy-credits");
      if (response.data.success && response.data.payment_link) {
        toast.dismiss(loadingToast);
        // Redirect to nxa.com.tr payment page
        window.location.href = response.data.payment_link;
      }
    } catch (error) {
      toast.error("Ödeme linki oluşturulurken hata oluştu.", {
        id: loadingToast,
      });
    }
  };

  const handleRedeemReward = async (e) => {
    e.preventDefault();
    try {
      await api.post("/business/redeem-reward", redeemForm);
      toast.success("Ödül başarıyla kullandırıldı ve puanlar güncellendi");
      setRedeemForm({ reward_code: "", customer_id: "" });
      load(); // Reload to get updated customer data
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Ödül kullanılırken hata oluştu",
      );
    }
  };

  const mostUsedServicesData = (dash?.most_used_services || []).map((item) => ({
    name: item.service,
    count: item.count,
  }));
  const appointmentTrendsData = (dash?.appointment_trend || []).map((item) => ({
    date: item._id,
    count: item.count,
  }));

  // ==========================================
  // İŞLETME KURULU DEĞİLSE GÖSTERİLECEK EKRAN
  // ==========================================

  // ==========================================
  // NORMAL İŞLETME EKRANI
  // ==========================================
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

          {/* Share Business Link Button */}
          <div className="card w-full mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-slate-700 mb-1">
                  Randevu Sayfası Linki
                </h3>
                <p className="text-sm text-slate-500">
                  Müşterilerinize bu linki göndererek randevu alabilirler
                </p>
              </div>
              <button
                onClick={async () => {
                  try {
                    // SADECE slug'ı kontrol et, yoksa hata ver.
                    if (!dash?.slug) {
                      toast.error(
                        "İşletmenizin özel adresi (slug) henüz tanımlanmamış. Lütfen ayarlarınızı kontrol edin.",
                      );
                      return;
                    }
                    const link = `https://tamvaktinde.com.tr/${dash.slug}`;
                    await navigator.clipboard.writeText(link);
                    toast.success("Bağlantı kopyalandı: " + link);
                  } catch (err) {
                    toast.error("Bağlantı kopyalanamadı.");
                  }
                }}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
              >
                <Copy className="w-4 h-4" />
                Bağlantıyı Kopyala
              </button>
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
                    is_online: f.get("is_online") === "true",
                  };

                  await api.post("/business/services", serviceData);
                  toast.success("Servis başarıyla eklendi!");
                  e.currentTarget?.reset();
                  load();
                } catch (err) {
                  console.error("Hata:", err);
                  toast.error(
                    err.response?.data?.message ||
                      "Servis eklenirken hata oluştu.",
                  );
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
                />
                <input
                  name="duration"
                  placeholder="Süre (Dk)"
                  type="number"
                  className="input w-24"
                  required
                />
                <input
                  name="price"
                  placeholder="Fiyat (TL)"
                  type="number"
                  className="input w-28"
                />
                <button
                  type="submit"
                  className="btn-primary whitespace-nowrap px-4"
                  disabled={isSubmittingService}
                >
                  {isSubmittingService ? "İşleniyor..." : "Ekle"}
                </button>
              </div>
              <textarea
                name="description"
                placeholder="Hizmet Açıklaması (opsiyonel)"
                className="input w-full h-20 resize-none"
              />
              <textarea
                name="critical_points"
                placeholder="Kritik Noktalar (opsiyonel)"
                className="input w-full h-20 resize-none"
              />
              <textarea
                name="process_steps"
                placeholder="İşlem Süreçleri (opsiyonel)"
                className="input w-full h-20 resize-none"
              />
              {(() => {
                const canUseOnline =
                  dash?.plan === "full" ||
                  dash?.plan === "online" ||
                  dash?.extraFeatures?.onlineUnlocked;
                return (
                  <div
                    className={`flex items-center gap-3 p-4 rounded-lg border ${canUseOnline ? "bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200" : "bg-slate-50 border-slate-200 opacity-60"}`}
                  >
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        name="is_online"
                        type="checkbox"
                        value="true"
                        className="sr-only peer"
                        disabled={!canUseOnline}
                      />
                      <div
                        className={`w-11 h-6 ${canUseOnline ? "bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300" : "bg-slate-300"} rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all ${canUseOnline ? "peer-checked:bg-indigo-600" : "peer-checked:bg-slate-400"}`}
                      ></div>
                    </label>
                    <div className="flex-1">
                      <p className="font-semibold text-slate-800 flex items-center gap-2">
                        🌐 Online Görüşme (Google Meet)
                        {!canUseOnline && (
                          <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-bold rounded-full">
                            🔒 Premium
                          </span>
                        )}
                      </p>
                      <p className="text-sm text-slate-600">
                        Bu hizmet seçildiğinde müşteriye otomatik Google Meet
                        linki gönderilir.
                      </p>
                    </div>
                    {!canUseOnline && (
                      <button
                        type="button"
                        onClick={() => {
                          const bizId =
                            user?.business_id || user?._id || dash?._id;
                          if (bizId) {
                            window.location.href = `https://nxa.com.tr/checkout?biz_id=${bizId}&type=upgrade`;
                          } else {
                            toast.error(
                              "İşletme kimliği yüklenemedi, lütfen sayfayı yenileyin.",
                            );
                          }
                        }}
                        className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-xs font-bold rounded-lg shadow-md transition-all"
                      >
                        Paketi Yükselt
                      </button>
                    )}
                  </div>
                );
              })()}
            </form>
            <div className="space-y-2 overflow-y-auto max-h-[400px] pr-2 custom-scrollbar mb-6">
              {!Array.isArray(services) || services.length === 0 ? (
                <p className="text-sm text-slate-500 py-2">
                  Henüz servis eklenmemiş.
                </p>
              ) : null}
              {Array.isArray(services) &&
                services.map((s) => (
                  <div
                    key={s._id}
                    className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50/50 p-3 text-sm"
                  >
                    <div className="flex-1">
                      <span className="font-medium text-slate-800">
                        {s.name}
                      </span>
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
                        onClick={() => handleDeleteService(s._id, s.name)}
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
                    await api.put(
                      `/business/staff/${editingStaff._id}`,
                      staffData,
                    );
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
                  toast.error(
                    err.response?.data?.message ||
                      (editingStaff
                        ? "Personel güncellenirken hata oluştu."
                        : "Personel eklenirken hata oluştu."),
                  );
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
                <button
                  type="submit"
                  className="btn-primary whitespace-nowrap px-4"
                >
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
              {!Array.isArray(staff) || staff.length === 0 ? (
                <p className="text-sm text-slate-500 py-2">
                  Henüz personel/bayi eklenmemiş.
                </p>
              ) : null}
              {Array.isArray(staff) &&
                staff.map((s) => (
                  <div
                    key={s._id}
                    className={`flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50/50 p-3 text-sm ${!s.is_active ? "opacity-60" : ""}`}
                  >
                    <div className="flex-1">
                      <span className="font-medium text-slate-800">
                        {s.name}
                      </span>
                      <div className="flex gap-2 mt-1">
                        <span
                          className={`badge ${s.role === "dealer" ? "bg-purple-50 text-purple-700 border border-purple-100" : "bg-indigo-50 text-indigo-700 border border-indigo-100"}`}
                        >
                          {s.role === "dealer" ? "Bayi" : "Personel"}
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
                        onClick={() =>
                          setDeleteModal({
                            isOpen: true,
                            type: "staff",
                            id: s._id,
                            name: s.name,
                          })
                        }
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
                      {loyaltySettings.threshold ||
                        settings.bookingSettings?.reward_threshold ||
                        10}{" "}
                      puanda 1 ücretsiz hizmet!
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
              {/* Ödül Kodu Kullanım Alanı */}
              <div className="card bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100">
                <div className="flex items-center gap-2 mb-4">
                  <Gift className="w-5 h-5 text-emerald-600" />
                  <h3 className="font-semibold text-emerald-900">
                    Ödül Kodu Kullan (Redeem Reward)
                  </h3>
                </div>
                <form
                  className="flex flex-wrap items-end gap-4"
                  onSubmit={handleRedeemReward}
                >
                  <div className="flex-1 min-w-[200px]">
                    <label className="block text-xs font-medium text-emerald-800 mb-1">
                      Ödül Kodu
                    </label>
                    <input
                      type="text"
                      placeholder="NXA-1234"
                      className="input bg-white border-emerald-200"
                      value={redeemForm.reward_code}
                      onChange={(e) =>
                        setRedeemForm({
                          ...redeemForm,
                          reward_code: e.target.value.toUpperCase(),
                        })
                      }
                      required
                    />
                  </div>
                  <div className="flex-1 min-w-[200px]">
                    <label className="block text-xs font-medium text-emerald-800 mb-1">
                      Müşteri Seçin
                    </label>
                    <select
                      className="input bg-white border-emerald-200"
                      value={redeemForm.customer_id}
                      onChange={(e) =>
                        setRedeemForm({
                          ...redeemForm,
                          customer_id: e.target.value,
                        })
                      }
                      required
                    >
                      <option value="">Müşteri seçin...</option>
                      {customers.map((c) => (
                        <option key={c._id} value={c._id}>
                          {c.name} - {c.phone} ({c.loyalty_points || 0} puan)
                        </option>
                      ))}
                    </select>
                  </div>
                  <button className="btn bg-emerald-500 hover:bg-emerald-600 text-white py-2">
                    Onayla
                  </button>
                </form>
              </div>

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
                      await api.post("/business/loyalty/settings", {
                        reward_threshold: loyaltySettings.threshold,
                        loyalty_symbol: loyaltySettings.symbol,
                      });
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

                  {Array.isArray(customers) &&
                    customers.map((c) => (
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
                              {c.loyalty_points || 0} {loyaltySettings.symbol}{" "}
                              Puan
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
                  {!Array.isArray(appointments) || appointments.length === 0 ? (
                    <p className="text-sm text-slate-500 py-8 text-center bg-slate-50 rounded-lg">
                      Randevu bulunmuyor.
                    </p>
                  ) : null}

                  {Array.isArray(appointments) &&
                    appointments.map((a) => (
                      <div
                        key={a._id}
                        className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border p-4 transition ${
                          a.status === "blocked"
                            ? "bg-slate-100 border-slate-300 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,#e5e7eb_10px,#e5e7eb_20px)]"
                            : "bg-white border-slate-200 hover:border-indigo-200"
                        }`}
                      >
                        <div className="flex-1">
                          {a.status === "blocked" ? (
                            <>
                              <p className="font-bold text-slate-700 text-base">
                                🚫 {a.note || "Engellenmiş Zaman"}
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
                                  {new Date(a.ends_at).toLocaleTimeString(
                                    "tr-TR",
                                    {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    },
                                  )}
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
                                await api.patch(
                                  `/business/appointments/${a._id}/status`,
                                  {
                                    status: e.target.value,
                                  },
                                );
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
              <h3 className="text-xl font-bold text-slate-800 mb-4">
                Zaman Yönetimi
              </h3>

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
                    <div
                      key={day}
                      className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg"
                    >
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
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Başlangıç Tarihi
                    </label>
                    <input
                      type="date"
                      className="input w-full"
                      value={blockForm.date}
                      onChange={(e) =>
                        setBlockForm({ ...blockForm, date: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Bitiş Tarihi
                    </label>
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
                    <label
                      htmlFor="isAllDay"
                      className="text-sm text-slate-600"
                    >
                      Tüm Gün Komple Kapat
                    </label>
                  </div>
                  {!isAllDayBlock && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Başlangıç Saati
                        </label>
                        <input
                          type="time"
                          className="input w-full"
                          value={blockForm.startTime}
                          onChange={(e) =>
                            setBlockForm({
                              ...blockForm,
                              startTime: e.target.value,
                            })
                          }
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Bitiş Saati
                        </label>
                        <input
                          type="time"
                          className="input w-full"
                          value={blockForm.endTime}
                          onChange={(e) =>
                            setBlockForm({
                              ...blockForm,
                              endTime: e.target.value,
                            })
                          }
                          required
                        />
                      </div>
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Engelleme Nedeni
                    </label>
                    <input
                      type="text"
                      className="input w-full"
                      placeholder="Örn: Kişisel iş, Öğle arası uzadı"
                      value={blockForm.note}
                      onChange={(e) =>
                        setBlockForm({ ...blockForm, note: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowBlockModal(false);
                        setBlockForm({
                          date: "",
                          startTime: "",
                          endTime: "",
                          note: "",
                        });
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

      {/* AYARLAR SEKMESİ */}
      {activeTab === "settings" && (
        <div className="animate-in fade-in duration-300">
          <div className="card p-6">
            <h2 className="text-2xl font-bold text-slate-800 mb-6">
              İşletme Ayarları
            </h2>

            {/* General Settings */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-slate-700 mb-4 flex items-center gap-2">
                <Settings className="w-5 h-5 text-blue-600" />
                Genel Ayarlar
              </h3>
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    İşletme Adı
                  </label>
                  <input
                    type="text"
                    value={settings.name || ""}
                    onChange={(e) =>
                      setSettings((prev) => ({ ...prev, name: e.target.value }))
                    }
                    className="input w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    İşletme Adresi
                  </label>
                  <input
                    type="text"
                    value={settings.address || ""}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        address: e.target.value,
                      }))
                    }
                    className="input w-full"
                    placeholder="Mahalle, Sokak No, Şehir"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Tema Rengi
                  </label>
                  <div className="flex gap-3 items-center">
                    <input
                      type="color"
                      value={settings.theme_color || "#3B82F6"}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          theme_color: e.target.value,
                        }))
                      }
                      className="w-16 h-10 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={settings.theme_color || "#3B82F6"}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          theme_color: e.target.value,
                        }))
                      }
                      className="input flex-1"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Logo
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setLogoFile(e.target.files[0])}
                    className="input w-full"
                  />
                  {logoFile && (
                    <div className="mt-2">
                      <img
                        src={URL.createObjectURL(logoFile)}
                        alt="Logo Preview"
                        className="h-16 w-auto object-contain rounded border border-slate-200"
                      />
                      <p className="text-xs text-slate-500 mt-1">
                        Seçilen: {logoFile.name}
                      </p>
                    </div>
                  )}
                  {!logoFile && settings.logo_url && (
                    <div className="mt-2">
                      <img
                        src={settings.logo_url}
                        alt="Current Logo"
                        className="h-16 w-auto object-contain rounded border border-slate-200"
                        onError={(e) => (e.target.style.display = "none")}
                      />
                      <p className="text-xs text-slate-500 mt-1">Mevcut logo</p>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Google Maps Konum Linki
                  </label>
                  <input
                    type="text"
                    value={settings.map_url || ""}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        map_url: e.target.value,
                      }))
                    }
                    className="input w-full"
                    placeholder="https://maps.google.com/?q=..."
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Müşterilerin işletmenizi haritada bulması için Google Maps
                    linki
                  </p>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    İşletme Hakkında
                  </label>
                  <textarea
                    value={settings.about_text || ""}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        about_text: e.target.value,
                      }))
                    }
                    className="input w-full h-24 resize-none"
                    placeholder="İşletmeniz hakkında kısa bir açıklama yazın..."
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Müşterilerinize gösterilecek işletme açıklaması
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-amber-50 rounded-lg border border-amber-100 mb-6">
                <div>
                  <p className="font-bold text-amber-900">
                    Sadakat Sistemi (Loyalty)
                  </p>
                  <p className="text-sm text-amber-700">
                    Müşterilere puan ve indirim kodu (Örn: NXA-WIN) sistemini
                    aktif et
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.is_loyalty_enabled ?? true}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        is_loyalty_enabled: e.target.checked,
                      }))
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-amber-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
                </label>
              </div>
            </div>

            {/* Booking Settings */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-slate-700 mb-4 flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-blue-600" />
                Randevu Ayarları
              </h3>
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Randevular Arası Boşluk (Dakika)
                  </label>
                  <input
                    type="number"
                    value={settings.bookingSettings?.bufferTime || 10}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        bookingSettings: {
                          ...prev.bookingSettings,
                          bufferTime: Number(e.target.value),
                        },
                      }))
                    }
                    className="input w-full"
                    min="0"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Randevular arası minimum bekleme süresi
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Aynı Anda Max Randevu
                  </label>
                  <input
                    type="number"
                    value={settings.bookingSettings?.maxConcurrent || 1}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        bookingSettings: {
                          ...prev.bookingSettings,
                          maxConcurrent: Number(e.target.value),
                        },
                      }))
                    }
                    className="input w-full"
                    min="1"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Aynı saatte alınabilecek max randevu sayısı
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Saat Aralığı (Dakika)
                  </label>
                  <input
                    type="number"
                    value={settings.bookingSettings?.slotInterval || 30}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        bookingSettings: {
                          ...prev.bookingSettings,
                          slotInterval: Number(e.target.value),
                        },
                      }))
                    }
                    className="input w-full"
                    min="5"
                    step="5"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Takvimde saatlerin kaçar dakika arayla bölüneceği
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    İptal Süresi (Dakika)
                  </label>
                  <input
                    type="number"
                    value={settings.bookingSettings?.cancellationBuffer || 120}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        bookingSettings: {
                          ...prev.bookingSettings,
                          cancellationBuffer: Number(e.target.value),
                        },
                      }))
                    }
                    className="input w-full"
                    min="0"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Randevu öncesi kaç dakikaya kadar iptal edilebilir
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-100">
                <div>
                  <p className="font-bold text-blue-900">
                    Otomatik Randevu Onayı
                  </p>
                  <p className="text-sm text-blue-700">
                    Müşteriler web üzerinden randevu aldığında otomatik olarak
                    onaylanır. Kapatırsanız randevular 'Bekliyor' statüsünde
                    düşer ve manuel onaylamanız gerekir.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.auto_approve_appointments ?? true}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        auto_approve_appointments: e.target.checked,
                      }))
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-blue-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>

            {/* Integration Settings */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-slate-700 mb-4 flex items-center gap-2">
                <Mail className="w-5 h-5 text-blue-600" />
                Entegrasyon Ayarları
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                  <div>
                    <p className="font-medium text-slate-800">
                      WhatsApp Entegrasyonu
                    </p>
                    <p className="text-sm text-slate-600">
                      Müşterilere WhatsApp üzerinden bildirim gönder
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.integrations?.whatsappEnabled ?? true}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          integrations: {
                            ...prev.integrations,
                            whatsappEnabled: e.target.checked,
                          },
                        }))
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                  </label>
                </div>

                {/* WhatsApp Cloud API Credentials */}
                <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                  <h4 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                    <span className="text-green-600">📱</span>
                    WhatsApp Cloud API Entegrasyonu
                  </h4>
                  <p className="text-sm text-slate-600 mb-4">
                    Kendi WhatsApp Business API bilgilerinizi girerek
                    müşterilere bildirim gönderin.
                  </p>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        WhatsApp Access Token
                      </label>
                      <input
                        type="text"
                        value={settings.whatsapp_token || ""}
                        onChange={(e) =>
                          setSettings((prev) => ({
                            ...prev,
                            whatsapp_token: e.target.value,
                          }))
                        }
                        placeholder="EAAcZAfbnnF0YBR..."
                        className="input w-full"
                      />
                      <p className="text-xs text-slate-500 mt-1">
                        Meta Developers'dan aldığınız Access Token
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        WhatsApp Phone Number ID
                      </label>
                      <input
                        type="text"
                        value={settings.whatsapp_phone_number_id || ""}
                        onChange={(e) =>
                          setSettings((prev) => ({
                            ...prev,
                            whatsapp_phone_number_id: e.target.value,
                          }))
                        }
                        placeholder="1120300507841864"
                        className="input w-full"
                      />
                      <p className="text-xs text-slate-500 mt-1">
                        WhatsApp Business Phone Number ID
                      </p>
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-600 rounded-lg">
                        <Globe className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800">
                          Google Takvim & Meet
                        </p>
                        <p className="text-sm text-slate-600">
                          Otomatik Google Meet linki oluşturma
                        </p>
                      </div>
                    </div>
                  </div>

                  {dash?.google_calendar_tokens ? (
                    <div className="bg-white rounded-lg p-3 border border-green-200">
                      <div className="flex items-center gap-2 text-green-700">
                        <CheckCircle className="w-5 h-5" />
                        <span className="font-semibold">
                          ✅ Google Hesabınız Bağlı
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 mt-1">
                        Sistem otomatik olarak Google Meet linkleri oluşturacak
                        ve müşterilerinize gönderecek.
                      </p>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        const bizId =
                          user?.business_id || user?._id || dash?._id;
                        if (!bizId) {
                          toast.error(
                            "İşletme kimliği yüklenemedi, lütfen sayfayı yenileyin.",
                          );
                          return;
                        }
                        window.location.href = `${import.meta.env.VITE_API_URL}/calendar/auth?businessId=${bizId}`;
                      }}
                      className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-lg transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                    >
                      <Globe className="w-5 h-5" />
                      Google Hesabını Bağla
                    </button>
                  )}

                  <div className="mt-3 p-3 bg-blue-100/50 rounded-lg border border-blue-200">
                    <p className="text-xs text-blue-800 flex items-start gap-2">
                      <span className="text-sm">💡</span>
                      <span>
                        Standart takvim senkronizasyonu tüm paketlerde açıktır.
                        Otomatik Google Meet linki oluşturma özelliği ise Online
                        ve Full paketlere özeldir.
                      </span>
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                  <div>
                    <p className="font-medium text-slate-800">Apple Calendar</p>
                    <p className="text-sm text-slate-600">
                      Randevuları Apple Calendar ile senkronize et
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.integrations?.appleCalendar ?? false}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          integrations: {
                            ...prev.integrations,
                            appleCalendar: e.target.checked,
                          },
                        }))
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gray-600"></div>
                  </label>
                </div>
              </div>
            </div>

            {/* Calendar Sync */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-slate-700 mb-4 flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-blue-600" />
                Takvim Senkronizasyonu
              </h3>
              <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                <p className="text-sm text-slate-700 mb-3">
                  İşletmenizin tüm randevularını Apple Calendar, Google Calendar
                  veya Outlook ile senkronize etmek için bu linki kullanın.
                </p>
                <div className="flex gap-3">
                  <input
                    type="text"
                    readOnly
                    value={`webcal://tamvaktinde.com.tr/api/business/${user?.business_id || user?._id}/calendar.ics`}
                    className="input flex-1 bg-white text-sm"
                  />
                  <button
                    onClick={() => {
                      const businessId = user?.business_id || user?._id;
                      navigator.clipboard.writeText(
                        `webcal://tamvaktinde.com.tr/api/business/${businessId}/calendar.ics`,
                      );
                      toast.success("Link kopyalandı!");
                    }}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
                  >
                    <Globe className="w-4 h-4" />
                    Linki Kopyala
                  </button>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  Apple Calendar: Dosya → Yeni Takvim Aboneliği → URL
                  <br />
                  Google Calendar: Ayarlar → URL ile Takvim Ekle
                  <br />
                  Outlook: Takvim → Takvim Ekle → Abonelikten
                  <br />
                </p>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end">
              <button
                onClick={handleSaveSettings}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors flex items-center gap-2"
              >
                <Settings className="w-4 h-4" />
                Değişiklikleri Kaydet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI KAMPANYA SEKMESİ */}
      {activeTab === "campaigns" && (
        <div className="animate-in fade-in duration-300">
          <div className="card overflow-hidden relative mb-8 bg-gradient-to-br from-fuchsia-50 via-white to-purple-50">
            <div className="absolute top-0 right-0 p-6 opacity-5">
              <Sparkles className="w-32 h-32 text-fuchsia-600" />
            </div>
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-gradient-to-br from-fuchsia-600 to-purple-600 rounded-lg">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold bg-gradient-to-r from-fuchsia-700 to-purple-700 bg-clip-text text-transparent">
                  AI Gelir Arttırma Merkezi
                </h3>
              </div>
              <p className="text-slate-600 mb-6 max-w-2xl">
                Yapay zeka ile saniyeler içinde hedef kitlenize özel WhatsApp
                kampanya fikirleri üretin ve müşterilerinize anında gönderin.
              </p>

              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl px-4 py-2">
                  <span className="text-2xl">🪙</span>
                  <div>
                    <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider">
                      Kalan Kredi
                    </p>
                    <p className="text-lg font-bold text-amber-800">
                      {Math.max(0, creditsRemaining)}
                    </p>
                  </div>
                </div>
                {Math.max(0, creditsRemaining) <= 0 && (
                  <button
                    onClick={handleBuyCredit}
                    className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold rounded-xl shadow-lg transition-all flex items-center gap-2"
                  >
                    <Gift className="w-4 h-4" /> Ek Kredi Satın Al
                  </button>
                )}
              </div>

              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-fuchsia-100">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent transition-all outline-none"
                      placeholder="Sektör (Örn: Kafe, Kuaför)"
                      value={sector}
                      onChange={(e) => setSector(e.target.value)}
                    />
                  </div>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent transition-all outline-none"
                      placeholder="Şehir (Örn: İstanbul)"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                    />
                  </div>
                  <div className="relative">
                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent transition-all outline-none"
                      placeholder="Hedef Kitle (Örn: Öğrenciler)"
                      value={target}
                      onChange={(e) => setTarget(e.target.value)}
                    />
                  </div>
                  <div className="relative">
                    <select
                      className="w-full pl-4 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent transition-all outline-none text-slate-600 appearance-none"
                      value={segment}
                      onChange={(e) => setSegment(e.target.value)}
                    >
                      <option value="all">Tüm Müşteriler</option>
                      <option value="inactive_1_week">
                        Son 1 Haftadır Gelmeyenler
                      </option>
                      <option value="inactive_1_month">
                        Son 1 Aydır Gelmeyenler
                      </option>
                      <option value="loyal">
                        Sadık (Çok Gelen) Müşteriler
                      </option>
                    </select>
                  </div>
                  <div className="relative">
                    <Clock3 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent transition-all outline-none"
                      placeholder="Kampanya Süresi (Örn: 3 Gün, Hafta Sonu, 1 Ay)"
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                    />
                  </div>
                </div>
                <div className="mt-4 flex justify-end">
                  <button
                    disabled={
                      isGenerating ||
                      !sector ||
                      !city ||
                      Math.max(0, creditsRemaining) <= 0
                    }
                    onClick={async () => {
                      if (!sector || !city) {
                        toast.error("Lütfen sektör ve şehir giriniz.");
                        return;
                      }
                      setIsGenerating(true);
                      try {
                        const { data } = await api.post("/ai/campaign", {
                          sector,
                          city,
                          target,
                          segment,
                          duration,
                        });

                        // Veri 'content' içinde, 'data' içinde veya direkt kök dizinde olabilir. Hepsini kontrol et!
                        const campaignPayload =
                          data.content || data.data || data;

                        setCampaigns({
                          whatsapp: campaignPayload.whatsapp || "",
                          instagram: campaignPayload.instagram || "",
                          facebook: campaignPayload.facebook || "",
                        });

                        setCreditsRemaining(
                          data.creditsRemaining !== undefined
                            ? data.creditsRemaining
                            : creditsRemaining - 1,
                        );
                        toast.success(
                          "Kampanya içerikleri başarıyla üretildi!",
                        );
                        setCampaigns(
                          data.content || {
                            whatsapp: "",
                            instagram: "",
                            facebook: "",
                          },
                        );
                        setCreditsRemaining(
                          data.creditsRemaining || creditsRemaining - 1,
                        );
                        toast.success(
                          "Kampanya içerikleri başarıyla üretildi!",
                        );
                      } catch (err) {
                        if (err.response?.status === 402) {
                          toast.error(
                            err.response?.data?.message ||
                              "Krediniz bitti, lütfen paket yükseltin",
                          );
                        } else {
                          toast.error("Kampanya oluşturulurken hata oluştu.");
                        }
                      } finally {
                        setIsGenerating(false);
                      }
                    }}
                    className="px-8 py-3 bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg shadow-fuchsia-200 hover:shadow-fuchsia-300 hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center gap-2"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Üretiliyor...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5" />
                        Fikir Üret
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {campaigns &&
          (campaigns.whatsapp || campaigns.instagram || campaigns.facebook) ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-lg">
              <div className="flex items-center gap-2 mb-6">
                <Sparkles className="w-5 h-5 text-fuchsia-500" />
                <h3 className="text-lg font-semibold text-slate-800">
                  AI Üretilen Kampanya İçerikleri
                </h3>
              </div>

              {/* Platform Tabs */}
              <div className="flex gap-2 mb-6">
                <button
                  onClick={() => setActivePlatformTab("whatsapp")}
                  className={`flex-1 py-2 px-4 rounded-lg font-medium transition ${
                    activePlatformTab === "whatsapp"
                      ? "bg-green-500 text-white"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  WhatsApp
                </button>
                <button
                  onClick={() => setActivePlatformTab("instagram")}
                  className={`flex-1 py-2 px-4 rounded-lg font-medium transition ${
                    activePlatformTab === "instagram"
                      ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  Instagram
                </button>
                <button
                  onClick={() => setActivePlatformTab("facebook")}
                  className={`flex-1 py-2 px-4 rounded-lg font-medium transition ${
                    activePlatformTab === "facebook"
                      ? "bg-blue-600 text-white"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  Facebook
                </button>
              </div>

              {/* Content Display */}
              <div className="bg-slate-50 rounded-xl p-4 min-h-[120px] mb-4">
                {activePlatformTab === "whatsapp" && (
                  <div>
                    <p className="text-sm font-medium text-slate-700 mb-2">
                      WhatsApp Mesajı (max 160 karakter)
                    </p>
                    <p className="text-slate-800 whitespace-pre-wrap">
                      {campaigns.whatsapp || "Henüz içerik üretilmedi"}
                    </p>
                  </div>
                )}
                {activePlatformTab === "instagram" && (
                  <div>
                    <p className="text-sm font-medium text-slate-700 mb-2">
                      Instagram Gönderi Metni (hashtagler dahil)
                    </p>
                    <p className="text-slate-800 whitespace-pre-wrap">
                      {campaigns.instagram || "Henüz içerik üretilmedi"}
                    </p>
                  </div>
                )}
                {activePlatformTab === "facebook" && (
                  <div>
                    <p className="text-sm font-medium text-slate-700 mb-2">
                      Facebook Duyuru Metni
                    </p>
                    <p className="text-slate-800 whitespace-pre-wrap">
                      {campaigns.facebook || "Henüz içerik üretilmedi"}
                    </p>
                  </div>
                )}
              </div>

              {/* Send Button */}
              <button
                onClick={() => {
                  setSelectedCampaign(campaigns[activePlatformTab]);
                  setCustomMessage(campaigns[activePlatformTab]);
                }}
                className="w-full px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold rounded-xl shadow-lg shadow-emerald-200 hover:shadow-emerald-300 transition-all duration-300 flex items-center justify-center gap-2"
              >
                <Send className="w-5 h-5" />
                WhatsApp ile Müşterilere Gönder
              </button>
            </div>
          ) : (
            <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-300">
              <div className="flex justify-center mb-4">
                <div className="p-4 bg-slate-100 rounded-full">
                  <Sparkles className="w-12 h-12 text-slate-400" />
                </div>
              </div>
              <h4 className="text-lg font-semibold text-slate-700 mb-2">
                Henüz kampanya fikri üretilmedi
              </h4>
              <p className="text-slate-500 max-w-md mx-auto">
                Yukarıdaki formu doldurarak yapay zeka ile hedef kitlenize özel
                WhatsApp kampanya fikirleri üretin.
              </p>
            </div>
          )}

          {/* AI GÖRSEL STÜDYOSU */}
          <div className="card overflow-hidden relative bg-gradient-to-br from-violet-50 via-white to-indigo-50">
            {/* Coming Soon Overlay */}
            <div className="absolute inset-0 z-20 bg-white/60 backdrop-blur-sm flex flex-col items-center justify-center rounded-2xl">
              <Lock className="w-16 h-16 text-violet-600 mb-4" />
              <h3 className="text-3xl font-bold bg-gradient-to-r from-violet-700 to-indigo-700 bg-clip-text text-transparent mb-2">
                Çok Yakında (Coming Soon)
              </h3>
              <p className="text-slate-600 text-lg text-center max-w-md">
                Yapay Zeka asistanımızla tanışmaya hazır olun!
              </p>
            </div>

            <div className="absolute top-0 right-0 p-6 opacity-5">
              <Sparkles className="w-32 h-32 text-violet-600" />
            </div>
            <div className="relative z-10 opacity-50 pointer-events-none">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-lg">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold bg-gradient-to-r from-violet-700 to-indigo-700 bg-clip-text text-transparent">
                  🎨 AI Görsel Stüdyosu
                </h3>
              </div>
              <p className="text-slate-600 mb-6 max-w-2xl">
                Yapay zeka ile kampanyalarınız için profesyonel görseller
                saniyeler içinde üretin.
              </p>

              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-violet-100">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Format Seçimi
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => setImageFormat("post")}
                      className={`p-3 rounded-xl border-2 transition-all ${
                        imageFormat === "post"
                          ? "border-violet-500 bg-violet-50 text-violet-700"
                          : "border-slate-200 bg-slate-50 text-slate-600 hover:border-violet-300"
                      }`}
                      disabled
                    >
                      <div className="text-center">
                        <div className="text-2xl mb-1">⬜</div>
                        <div className="text-xs font-semibold">
                          Instagram Post
                        </div>
                        <div className="text-xs text-slate-500">1:1 Kare</div>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setImageFormat("story")}
                      className={`p-3 rounded-xl border-2 transition-all ${
                        imageFormat === "story"
                          ? "border-violet-500 bg-violet-50 text-violet-700"
                          : "border-slate-200 bg-slate-50 text-slate-600 hover:border-violet-300"
                      }`}
                      disabled
                    >
                      <div className="text-center">
                        <div className="text-2xl mb-1">📱</div>
                        <div className="text-xs font-semibold">
                          Instagram Hikaye
                        </div>
                        <div className="text-xs text-slate-500">9:16 Dikey</div>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setImageFormat("banner")}
                      className={`p-3 rounded-xl border-2 transition-all ${
                        imageFormat === "banner"
                          ? "border-violet-500 bg-violet-50 text-violet-700"
                          : "border-slate-200 bg-slate-50 text-slate-600 hover:border-violet-300"
                      }`}
                      disabled
                    >
                      <div className="text-center">
                        <div className="text-2xl mb-1">🖼️</div>
                        <div className="text-xs font-semibold">
                          Afiş / Banner
                        </div>
                        <div className="text-xs text-slate-500">16:9 Yatay</div>
                      </div>
                    </button>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Görsel Açıklaması
                  </label>
                  <textarea
                    className="w-full h-32 p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all outline-none resize-none"
                    placeholder="Kampanyanız için ne tür bir görsel istiyorsunuz? Örn: Modern ışıklı bir kuaför salonu, pastel tonlarda, şık mobilyalar... Yazı eklemek istiyorsanız tırnak içinde belirtin: 'YAZA ÖZEL %20 İNDİRİM'"
                    value={imagePrompt}
                    onChange={(e) => setImagePrompt(e.target.value)}
                    disabled
                  />
                </div>

                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl px-4 py-2">
                    <span className="text-2xl">🪙</span>
                    <div>
                      <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider">
                        Kalan Kredi
                      </p>
                      <p className="text-lg font-bold text-amber-800">
                        {Math.max(0, creditsRemaining)}
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  disabled
                  className="w-full px-8 py-4 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-lg shadow-violet-200 hover:shadow-violet-300 hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-5 h-5" />
                  Görsel Üret (1 Kredi)
                </button>

                {Math.max(0, creditsRemaining) <= 0 && (
                  <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                    <p className="text-sm text-amber-800 flex items-center gap-2">
                      <Lock className="w-4 h-4" />
                      Krediniz bitti. Görsel üretmek için kredi yükleyin.
                    </p>
                    <button
                      onClick={handleBuyCredit}
                      className="mt-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold rounded-lg shadow-md transition-all flex items-center gap-2"
                      disabled
                    >
                      <Gift className="w-4 h-4" /> Kredi Satın Al
                    </button>
                  </div>
                )}
              </div>

              {/* Generated Image Display */}
              {generatedImageUrl && (
                <div className="mt-6 bg-white rounded-2xl p-6 shadow-lg border border-violet-100 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="flex items-center gap-2 mb-4">
                    <Sparkles className="w-5 h-5 text-violet-500" />
                    <h4 className="text-lg font-semibold text-slate-800">
                      Üretilen Görsel
                    </h4>
                  </div>
                  <div className="relative rounded-xl overflow-hidden border border-slate-200">
                    <img
                      src={generatedImageUrl}
                      alt="AI Generated"
                      className="w-full h-auto object-cover"
                    />
                  </div>
                  <div className="mt-4 flex justify-end">
                    <a
                      href={generatedImageUrl}
                      download="ai-generated-image.png"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold rounded-xl shadow-lg shadow-emerald-200 hover:shadow-emerald-300 transition-all duration-300 flex items-center gap-2"
                    >
                      <Download className="w-5 h-5" />
                      İndir / Kaydet
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() =>
          setDeleteModal({ isOpen: false, type: null, id: null, name: "" })
        }
        onConfirm={confirmDelete}
        title={deleteModal.type === "service" ? "Hizmeti Sil" : "Personeli Sil"}
        message={`${deleteModal.type === "service" ? "Bu hizmeti" : "Bu personeli"} silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`}
        confirmText="Sil"
        cancelText="İptal"
      />

      {/* Service Edit Modal */}
      <Modal
        isOpen={showServiceEditModal}
        onClose={handleCancelEdit}
        title="Hizmet Düzenle"
      >
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setIsSubmittingService(true);
            try {
              const serviceData = {
                name: serviceForm.name,
                duration: Number(serviceForm.duration),
                price: serviceForm.price ? Number(serviceForm.price) : null,
                description: serviceForm.description,
                critical_points: serviceForm.critical_points,
                process_steps: serviceForm.process_steps,
                is_online: serviceForm.is_online,
              };

              await api.put(
                `/business/services/${editingService._id}`,
                serviceData,
              );
              toast.success("Servis başarıyla güncellendi!");
              handleCancelEdit();
              load();
            } catch (err) {
              console.error("Hata:", err);
              toast.error(
                err.response?.data?.message ||
                  "Servis güncellenirken hata oluştu.",
              );
            } finally {
              setIsSubmittingService(false);
            }
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Servis Adı
            </label>
            <input
              type="text"
              value={serviceForm.name}
              onChange={(e) =>
                setServiceForm({ ...serviceForm, name: e.target.value })
              }
              className="input w-full"
              required
            />
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Süre (Dk)
              </label>
              <input
                type="number"
                value={serviceForm.duration}
                onChange={(e) =>
                  setServiceForm({ ...serviceForm, duration: e.target.value })
                }
                className="input w-full"
                required
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Fiyat (TL)
              </label>
              <input
                type="number"
                value={serviceForm.price}
                onChange={(e) =>
                  setServiceForm({ ...serviceForm, price: e.target.value })
                }
                className="input w-full"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Hizmet Açıklaması
            </label>
            <textarea
              value={serviceForm.description}
              onChange={(e) =>
                setServiceForm({ ...serviceForm, description: e.target.value })
              }
              className="input w-full h-20 resize-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Kritik Noktalar
            </label>
            <textarea
              value={serviceForm.critical_points}
              onChange={(e) =>
                setServiceForm({
                  ...serviceForm,
                  critical_points: e.target.value,
                })
              }
              className="input w-full h-20 resize-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              İşlem Süreçleri
            </label>
            <textarea
              value={serviceForm.process_steps}
              onChange={(e) =>
                setServiceForm({
                  ...serviceForm,
                  process_steps: e.target.value,
                })
              }
              className="input w-full h-20 resize-none"
            />
          </div>
          {(() => {
            const canUseOnline =
              dash?.plan === "full" ||
              dash?.plan === "online" ||
              dash?.extraFeatures?.onlineUnlocked;
            return (
              <div
                className={`flex items-center gap-3 p-4 rounded-lg border ${canUseOnline ? "bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200" : "bg-slate-50 border-slate-200 opacity-60"}`}
              >
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={serviceForm.is_online}
                    onChange={(e) =>
                      setServiceForm({
                        ...serviceForm,
                        is_online: e.target.checked,
                      })
                    }
                    className="sr-only peer"
                    disabled={!canUseOnline}
                  />
                  <div
                    className={`w-11 h-6 ${canUseOnline ? "bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300" : "bg-slate-300"} rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all ${canUseOnline ? "peer-checked:bg-indigo-600" : "peer-checked:bg-slate-400"}`}
                  ></div>
                </label>
                <div className="flex-1">
                  <p className="font-semibold text-slate-800 flex items-center gap-2">
                    🌐 Online Görüşme (Google Meet)
                    {!canUseOnline && (
                      <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-bold rounded-full">
                        🔒 Premium
                      </span>
                    )}
                  </p>
                  <p className="text-sm text-slate-600">
                    Bu hizmet seçildiğinde müşteriye otomatik Google Meet linki
                    gönderilir.
                  </p>
                </div>
                {!canUseOnline && (
                  <button
                    type="button"
                    onClick={() => {
                      const bizId = user?.business_id || user?._id || dash?._id;
                      if (bizId) {
                        window.location.href = `https://nxa.com.tr/checkout?biz_id=${bizId}&type=upgrade`;
                      } else {
                        toast.error(
                          "İşletme kimliği yüklenemedi, lütfen sayfayı yenileyin.",
                        );
                      }
                    }}
                    className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-xs font-bold rounded-lg shadow-md transition-all"
                  >
                    Paketi Yükselt
                  </button>
                )}
              </div>
            );
          })()}
          <div className="flex gap-3 justify-end pt-4">
            <button
              type="button"
              onClick={handleCancelEdit}
              className="btn-secondary px-4"
            >
              İptal
            </button>
            <button
              type="submit"
              className="btn-primary px-4"
              disabled={isSubmittingService}
            >
              {isSubmittingService ? "İşleniyor..." : "Kaydet"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Campaign Edit Modal */}
      <Modal
        isOpen={!!selectedCampaign}
        onClose={() => setSelectedCampaign(null)}
        title="Kampanyayı Düzenle ve Gönder"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-500">
            Müşterilerinize gidecek mesajı göndermeden önce
            kişiselleştirebilirsiniz.
          </p>
          <textarea
            value={customMessage}
            onChange={(e) => setCustomMessage(e.target.value)}
            className="w-full h-32 p-3 border rounded-lg focus:ring-2 focus:ring-fuchsia-500 outline-none resize-none text-sm"
          />
          <div className="flex justify-end gap-3 pt-4">
            <button
              onClick={() => setSelectedCampaign(null)}
              className="px-4 py-2 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              İptal
            </button>
            <button
              onClick={async () => {
                try {
                  await api.post("/business/campaign/send", {
                    campaignText: customMessage,
                    segment,
                  });
                  toast.success("Kampanya mesajları başarıyla gönderiliyor!");
                  setSelectedCampaign(null);
                } catch (error) {
                  toast.error("Gönderim sırasında hata oluştu.");
                }
              }}
              className="px-6 py-2 bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-700 hover:to-purple-700 text-white font-medium rounded-lg shadow-md transition-all"
            >
              🚀 Şimdi Gönder
            </button>
          </div>
        </div>
      </Modal>
    </AppLayout>
  );
}
