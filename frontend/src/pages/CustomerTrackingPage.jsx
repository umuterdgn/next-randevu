import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Calendar, Clock, Star, CheckCircle, XCircle, Clock3, AlertCircle, Download, Globe, Plus, MapPin, Info, ArrowRight } from "lucide-react";
import api from "../api/client"; // Senin profesyonel API istemcin

const statusConfig = {
  pending: { label: "Bekliyor", icon: Clock3, color: "bg-amber-100 text-amber-700 border-amber-200", bgColor: "bg-amber-50" },
  approved: { label: "Onaylandı", icon: CheckCircle, color: "bg-emerald-100 text-emerald-700 border-emerald-200", bgColor: "bg-emerald-50" },
  completed: { label: "Tamamlandı", icon: CheckCircle, color: "bg-indigo-100 text-indigo-700 border-indigo-200", bgColor: "bg-indigo-50" },
  cancelled: { label: "İptal Edildi", icon: XCircle, color: "bg-rose-100 text-rose-700 border-rose-200", bgColor: "bg-rose-50" },
  no_show: { label: "Gelmedi", icon: XCircle, color: "bg-slate-100 text-slate-700 border-slate-200", bgColor: "bg-slate-50" }
};

export default function CustomerTrackingPage() {
  const { appointmentId } = useParams();
  const navigate = useNavigate();

  const [appointmentData, setAppointmentData] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancelling, setCancelling] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showReschedulePopup, setShowReschedulePopup] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleTime, setRescheduleTime] = useState("");
  const [isRescheduling, setIsRescheduling] = useState(false);

  useEffect(() => {
    loadAppointment();
  }, [appointmentId]);

  const loadAppointment = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/booking/track/${appointmentId}`);

      if (response.data.success) {
        setAppointmentData(response.data.data);

        // Müşterinin diğer randevularını çek
        if (response.data.data.customer?.phone) {
          const allResponse = await api.get(`/booking/customer/${response.data.data.customer.phone}`);
          if (allResponse.data.success) {
            setAppointments(allResponse.data.data || []);
          }
        }
      } else {
        setError("Randevu bulunamadı");
      }
    } catch (err) {
      setError("Sunucu bağlantı hatası");
      console.error("Appointment fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    try {
      setCancelling(true);
      const response = await api.patch(`/booking/track/${appointmentId}/cancel`);

      if (response.data.success) {
        alert("Randevunuz başarıyla iptal edildi.");
        window.location.reload();
      }
    } catch (error) {
      console.error("İptal hatası:", error);
      alert("Randevu iptal edilirken hata oluştu.");
    } finally {
      setCancelling(false);
      setShowCancelModal(false);
    }
  };

  const handleReschedule = async () => {
    setIsRescheduling(true);
    try {
      // Backend Starts_at ve ends_at bekliyor
      const response = await api.patch(`/booking/track/${appointmentId}/update`, {
        starts_at: `${rescheduleDate}T${rescheduleTime}:00.000Z`,
        ends_at: `${rescheduleDate}T${rescheduleTime}:00.000Z`
      });

      if (response.data.success) {
        alert("Randevunuz başarıyla ertelendi, işletme onayına sunuldu.");
        setShowReschedulePopup(false);
        window.location.reload();
      }
    } catch (error) {
      console.error("Erteleme hatası:", error);
      alert("Randevu ertelenirken hata oluştu.");
    } finally {
      setIsRescheduling(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-slate-600 font-medium">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (error || !appointmentData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 px-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Hata Oluştu</h2>
          <p className="text-slate-600 mb-6">{error || "Randevu bulunamadı"}</p>
        </div>
      </div>
    );
  }

  const { appointment, service, business, customer } = appointmentData;
  const businessData = business || {};
  const statusInfo = statusConfig[appointment.status] || statusConfig.pending;
  const StatusIcon = statusInfo.icon;

  const canCancelAppointment = (apt) => {
    if (!apt.starts_at || apt.status === 'completed' || apt.status === 'cancelled') return false;
    const diffMinutes = (new Date(apt.starts_at) - new Date()) / (1000 * 60);
    return diffMinutes >= (businessData?.bookingSettings?.cancellationBuffer || 120);
  };

  const formatDate = (dateString) => new Date(dateString).toLocaleDateString("tr-TR", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  const formatTime = (dateString) => new Date(dateString).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="min-h-screen py-8 px-4 bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="text-center mb-8">
          {businessData?.logo_url && (
            <div className="mb-4">
              <img src={businessData.logo_url} alt="Logo" className="h-20 w-auto mx-auto object-contain rounded-xl shadow-sm" />
            </div>
          )}
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Randevu Takip</h1>
          <p className="text-slate-600">Durumunuzu buradan takip edebilirsiniz</p>
          {businessData?.slug && (
            <button
              onClick={() => navigate(`/${businessData.slug}`)}
              className="mt-4 inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors shadow-md"
            >
              <Plus className="w-5 h-5" /> Yeni Randevu Al
            </button>
          )}
        </div>

        {/* Status Card */}
        <div className={`rounded-2xl shadow-lg p-6 mb-6 ${statusInfo.bgColor} border-2 ${statusInfo.color}`}>
          <div className="flex items-center gap-4">
            <div className={`p-4 rounded-xl bg-white/50 backdrop-blur-sm ${statusInfo.color.replace('border-', 'text-')}`}>
              <StatusIcon className="w-8 h-8" />
            </div>
            <div>
              <p className="text-sm font-semibold opacity-80 uppercase tracking-wider mb-1">Mevcut Durum</p>
              <p className="text-3xl font-black">{statusInfo.label}</p>
            </div>
          </div>
        </div>

        {/* İşletme Bilgileri */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-slate-100">
          <h2 className="text-xl font-bold text-slate-800 mb-5 flex items-center gap-2 border-b pb-3">
            <MapPin className="w-6 h-6 text-blue-600" /> İşletme Bilgileri
          </h2>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-slate-500 uppercase tracking-wide">İşletme Adı</p>
              <p className="text-lg font-bold text-slate-800">{businessData?.name || "Bilinmiyor"}</p>
            </div>
            {businessData?.about_text && (
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <p className="text-sm font-medium text-slate-500 flex items-center gap-1 mb-1">
                  <Info className="w-4 h-4" /> Hakkımızda
                </p>
                <p className="text-slate-700 leading-relaxed">{businessData.about_text}</p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              {businessData?.phone && (
                <div>
                  <p className="text-sm font-medium text-slate-500 uppercase tracking-wide">Telefon</p>
                  <p className="text-lg font-semibold text-slate-800">{businessData.phone}</p>
                </div>
              )}
              {businessData?.map_url && (
                <div className="flex items-end">
                  <a
                    href={businessData.map_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-800 hover:bg-slate-900 text-white font-medium rounded-xl transition-colors"
                  >
                    <MapPin className="w-5 h-5" /> Haritada Aç
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Randevu Bilgileri */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-slate-100">
          <h2 className="text-xl font-bold text-slate-800 mb-5 flex items-center gap-2 border-b pb-3">
            <Clock className="w-6 h-6 text-blue-600" /> Randevu Detayları
          </h2>
          <div className="space-y-4">
            <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div className="p-3 bg-blue-100 rounded-xl text-blue-600"><Calendar className="w-6 h-6" /></div>
              <div>
                <p className="text-sm font-medium text-slate-500">Tarih</p>
                <p className="text-lg font-bold text-slate-800">{formatDate(appointment.starts_at)}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div className="p-3 bg-indigo-100 rounded-xl text-indigo-600"><Clock className="w-6 h-6" /></div>
              <div>
                <p className="text-sm font-medium text-slate-500">Saat</p>
                <p className="text-lg font-bold text-slate-800">{formatTime(appointment.starts_at)} - {formatTime(appointment.ends_at)}</p>
              </div>
            </div>
            {service && (
              <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div className="p-3 bg-emerald-100 rounded-xl text-emerald-600"><CheckCircle className="w-6 h-6" /></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-500">Hizmet</p>
                  <p className="text-lg font-bold text-slate-800">{service.name}</p>
                </div>
                {service.price && (
                  <div className="text-right">
                    <p className="text-sm font-medium text-slate-500">Tutar</p>
                    <p className="text-xl font-black text-emerald-600">{service.price} ₺</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Aksiyon Butonları */}
        {(appointment.status === "pending" || appointment.status === "approved") && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <div className="flex gap-4">
              <button
                onClick={() => setShowCancelModal(true)}
                disabled={!canCancelAppointment(appointment)}
                className={`flex-1 py-4 rounded-xl font-bold transition-all ${!canCancelAppointment(appointment)
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    : 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 shadow-sm'
                  }`}
              >
                İptal Et
              </button>
              <button
                onClick={() => setShowReschedulePopup(true)}
                className="flex-1 py-4 bg-slate-800 text-white hover:bg-slate-900 rounded-xl font-bold transition-all shadow-md"
              >
                Ertele
              </button>
            </div>
            {!canCancelAppointment(appointment) && (
              <p className="text-sm text-red-500 mt-3 flex items-center justify-center gap-1 font-medium">
                <AlertCircle className="w-4 h-4" /> Randevuya çok az kaldığı için iptal edilemez.
              </p>
            )}
          </div>
        )}

        {/* Sadakat Puanı ve Ödül Kodu */}
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl shadow-lg p-6 mb-6 border-2 border-amber-200 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10"><Star className="w-32 h-32 text-amber-500" /></div>
          <h2 className="text-xl font-bold text-amber-900 mb-5 flex items-center gap-2 relative z-10">
            <Star className="w-6 h-6 text-amber-600 fill-amber-500" /> Sadakat Programı
          </h2>

          <div className="flex items-center justify-between mb-4 relative z-10">
            <div>
              <p className="text-sm font-bold text-amber-700 uppercase tracking-wider mb-1">Mevcut Puanınız</p>
              <p className="text-4xl font-black text-amber-600">{customer?.loyalty_points || 0}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-amber-700 uppercase tracking-wider mb-1">Hedef Puan</p>
              <span className="inline-block px-4 py-1 bg-amber-200 text-amber-800 rounded-full text-xl font-bold border border-amber-300">
                {businessData?.reward_threshold || 10}
              </span>
            </div>
          </div>

          <div className="mb-4 relative z-10">
            <div className="w-full bg-amber-200/50 rounded-full h-4 overflow-hidden border border-amber-200">
              <div
                className="bg-gradient-to-r from-amber-400 to-orange-500 h-full transition-all duration-1000 ease-out"
                style={{ width: `${Math.min(((customer?.loyalty_points || 0) / (businessData?.reward_threshold || 10)) * 100, 100)}%` }}
              />
            </div>
          </div>

          {/* NXA Ödül Kodu */}
          {customer?.loyalty_points >= (businessData?.reward_threshold || 10) && (
            <div className="mt-6 p-5 bg-white rounded-xl border-2 border-amber-400 shadow-md relative z-10 text-center transform hover:scale-[1.02] transition-transform">
              <span className="text-3xl mb-2 block">🎉🎁</span>
              <p className="text-lg font-bold text-amber-900">Tebrikler! Ücretsiz Hizmet Kazandınız!</p>
              <p className="text-sm text-slate-600 mt-2 mb-3">Ödülünüzü kullanmak için bu kodu kasada gösterin:</p>
              <div className="bg-slate-50 py-3 rounded-lg border-2 border-dashed border-amber-500">
                <span className="text-3xl font-black text-amber-600 tracking-[0.2em]">
                  NXA-{(customer?._id || customer?.phone?.slice(-4) || "WIN").toString().slice(-4).toUpperCase()}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Takvim Entegrasyonu */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <button
            onClick={() => {
              const startDate = new Date(appointment.starts_at);
              const endDate = new Date(appointment.ends_at);
              const fmt = (d) => d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
              const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(service?.name || "Randevu")}&dates=${fmt(startDate)}/${fmt(endDate)}&details=${encodeURIComponent("İşletme: " + businessData?.name)}&location=${encodeURIComponent(businessData?.map_url || businessData?.address || "")}`;
              window.open(url, "_blank");
            }}
            className="flex flex-col items-center justify-center gap-2 p-4 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold rounded-2xl transition-all shadow-sm"
          >
            <Globe className="w-8 h-8 text-blue-500" /> Google Takvim
          </button>
          <a
            href={`http://localhost:5000/api/calendar/appointment/${appointment.id}/download.ics`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center justify-center gap-2 p-4 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold rounded-2xl transition-all shadow-sm"
          >
            <Download className="w-8 h-8 text-slate-800" /> Apple / Outlook
          </a>
        </div>

        {/* Scroll Edilebilir Diğer Randevular */}
        {appointments.length > 1 && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-slate-100">
            <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2 border-b pb-3">
              <Calendar className="w-6 h-6 text-blue-600" /> Diğer Randevularınız
            </h2>

            <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
              {appointments.map((apt) => {
                const aptStatus = statusConfig[apt.status] || statusConfig.pending;
                const isCurrent = apt._id === appointment.id;

                return (
                  <div key={apt._id} className={`p-4 rounded-xl border-2 transition-all ${isCurrent ? 'border-blue-500 bg-blue-50 shadow-md' : 'border-slate-100 hover:border-slate-300 bg-white'}`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`px-2 py-1 text-xs font-bold rounded-md ${aptStatus.color}`}>{aptStatus.label}</span>
                          {isCurrent && <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded-md font-bold">Şu an Bakılan</span>}
                        </div>
                        <p className="font-bold text-slate-800">{formatDate(apt.starts_at)}</p>
                        <p className="text-sm text-slate-500 font-medium">{formatTime(apt.starts_at)} - {apt.service_id?.name || "Hizmet"}</p>
                      </div>

                      {!isCurrent && (
                        <button
                          onClick={() => {
                            navigate(`/randevu/${apt._id}`);
                            window.location.reload();
                          }}
                          className="flex items-center gap-1 px-4 py-2 bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-700 rounded-lg text-sm font-bold transition-colors"
                        >
                          Detay <ArrowRight className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>

      {/* İptal Modalı */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-bold text-center text-slate-800 mb-2">Emin misiniz?</h3>
            <p className="text-center text-slate-600 mb-8">Bu randevuyu iptal etmek istediğinize emin misiniz? Bu işlem geri alınamaz.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowCancelModal(false)} className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200">Vazgeç</button>
              <button onClick={handleCancel} className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700">
                {cancelling ? 'İptal Ediliyor...' : 'Evet, İptal Et'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Erteleme Modalı */}
      {showReschedulePopup && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full">
            <h3 className="text-2xl font-bold text-slate-800 mb-2">Randevuyu Ertele</h3>
            <p className="text-slate-600 mb-6">Lütfen yeni bir tarih ve saat seçin. İşletme onayından sonra kesinleşecektir.</p>

            <div className="space-y-4 mb-8">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Yeni Tarih</label>
                <input
                  type="date"
                  value={rescheduleDate}
                  onChange={(e) => setRescheduleDate(e.target.value)}
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                  min={new Date().toISOString().split("T")[0]}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Yeni Saat</label>
                <input
                  type="time"
                  value={rescheduleTime}
                  onChange={(e) => setRescheduleTime(e.target.value)}
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setShowReschedulePopup(false)} className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200">İptal</button>
              <button
                disabled={!rescheduleDate || !rescheduleTime || isRescheduling}
                onClick={handleReschedule}
                className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isRescheduling ? "İşleniyor..." : "Talebi Gönder"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}