import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Calendar, Clock, Star, CheckCircle, XCircle, Clock3, AlertCircle, Download, Globe, Plus, MapPin, Info, ArrowRight, Phone, Video } from "lucide-react";
import api from "../api/client";

const statusConfig = {
  pending: { label: "Bekliyor", icon: Clock3, color: "bg-amber-100 text-amber-700 border-amber-200", bgColor: "bg-amber-50" },
  approved: { label: "Onaylandı", icon: CheckCircle, color: "bg-emerald-100 text-emerald-700 border-emerald-200", bgColor: "bg-emerald-50" },
  completed: { label: "Tamamlandı", icon: CheckCircle, color: "bg-indigo-100 text-indigo-700 border-indigo-200", bgColor: "bg-indigo-50" },
  cancelled: { label: "İptal Edildi", icon: XCircle, color: "bg-rose-100 text-rose-700 border-rose-200", bgColor: "bg-rose-50" },
  no_show: { label: "Gelmedi", icon: XCircle, color: "bg-slate-100 text-slate-700 border-slate-200", bgColor: "bg-slate-50" }
};

const AppointmentTrackingPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancelling, setCancelling] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showReschedulePopup, setShowReschedulePopup] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleTime, setRescheduleTime] = useState("");
  const [isRescheduling, setIsRescheduling] = useState(false);

  useEffect(() => {
    const fetchAppointment = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/booking/track/${id}`);

        if (response.data.success) {
          setData(response.data.data);
          if (response.data.data.customer?.phone) {
            const allResponse = await api.get(`/booking/customer/${response.data.data.customer.phone}`);
            if (allResponse.data.success) {
              setAppointments(allResponse.data.data || []);
            }
          }
        } else {
          setError(response.data.message || "Randevu bulunamadı");
        }
      } catch (err) {
        setError("Sunucu bağlantı hatası");
        console.error("Appointment fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchAppointment();
  }, [id]);

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

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 px-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Randevu Bulunamadı</h2>
          <p className="text-slate-600 mb-6">{error || "Bağlantı hatası oluştu."}</p>
        </div>
      </div>
    );
  }

  const { appointment, service, business, customer } = data;
  const businessData = business || {};
  const statusInfo = statusConfig[appointment.status] || statusConfig.pending;
  const StatusIcon = statusInfo.icon;

  const handleCancelAppointment = async (appointmentId) => {
    try {
      setCancelling(appointmentId);
      const response = await api.patch(`/booking/track/${appointmentId}/cancel`);

      if (response.data.success) {
        alert("Randevu başarıyla iptal edildi");
        window.location.reload();
      } else {
        alert(response.data.message || "İptal işlemi başarısız");
      }
    } catch (err) {
      alert("Sunucu bağlantı hatası");
    } finally {
      setCancelling(null);
      setShowCancelModal(false);
    }
  };

  const handleReschedule = async () => {
    setIsRescheduling(true);
    try {
      const response = await api.patch(`/booking/track/${id}/update`, {
        starts_at: `${rescheduleDate}T${rescheduleTime}:00.000Z`,
        ends_at: `${rescheduleDate}T${rescheduleTime}:00.000Z`
      });

      if (response.data.success) {
        alert("Randevunuz başarıyla ertelendi, işletme onayına sunuldu.");
        setShowReschedulePopup(false);
        window.location.reload();
      } else {
        alert(response.data.message || "Erteleme işlemi başarısız oldu.");
      }
    } catch (error) {
      alert("Sunucu bağlantı hatası");
    } finally {
      setIsRescheduling(false);
    }
  };

  const canCancelAppointment = (apt) => {
    if (!apt.starts_at || apt.status === 'completed' || apt.status === 'cancelled') return false;
    const diffMinutes = (new Date(apt.starts_at) - new Date()) / (1000 * 60);
    const cancellationBuffer = businessData?.bookingSettings?.cancellationBuffer || 120;
    return diffMinutes >= cancellationBuffer;
  };

  const formatDate = (dateString) => new Date(dateString).toLocaleDateString("tr-TR", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  const formatTime = (dateString) => new Date(dateString).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="min-h-screen py-8 px-4 bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-2xl mx-auto">

        {/* Üst Alan */}
        <div className="text-center mb-8">
          {businessData?.logo_url && (
            <div className="mb-4">
              <img src={businessData.logo_url} alt={`${businessData.name} Logo`} className="h-20 w-auto mx-auto object-contain rounded-xl shadow-sm" />
            </div>
          )}
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Randevu Takip</h1>
          <p className="text-slate-600">Randevu durumunuzu buradan takip edebilirsiniz</p>
          {businessData?.slug && (
            <button onClick={() => navigate(`/${businessData.slug}`)} className="mt-4 inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors shadow-sm">
              <Plus className="w-5 h-5" /> Yeni Randevu Al
            </button>
          )}
        </div>

        {/* Durum Kartı */}
        <div className={`rounded-2xl shadow-lg p-6 mb-6 ${statusInfo.bgColor} border-2 ${statusInfo.color}`}>
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-xl bg-white/60 backdrop-blur-sm ${statusInfo.color}`}>
              <StatusIcon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-600 mb-1">Randevu Durumu</p>
              <p className="text-2xl font-bold text-slate-800">{statusInfo.label}</p>
            </div>
          </div>
        </div>

        {/* İşletme Bilgileri */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-slate-100">
          <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2 border-b pb-2">
            <MapPin className="w-5 h-5 text-blue-600" /> İşletme Bilgileri
          </h2>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-slate-500">İşletme Adı</p>
              <p className="text-lg font-bold text-slate-800">{businessData?.name || "İşletme"}</p>
            </div>

            {businessData?.about_text && (
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <p className="text-sm font-medium text-slate-500 flex items-center gap-1 mb-1">
                  <Info className="w-4 h-4 text-blue-500" /> Hakkımızda
                </p>
                <p className="text-slate-700 text-sm leading-relaxed">{businessData.about_text}</p>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              {businessData?.phone && (
                <div>
                  <p className="text-sm text-slate-500">Telefon</p>
                  <p className="text-base font-semibold text-slate-800">{businessData.phone}</p>
                </div>
              )}
              {businessData?.map_url && (
                <div className="flex items-end">
                  <a href={businessData.map_url} target="_blank" rel="noopener noreferrer" className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors shadow-sm text-sm">
                    📍 Haritada Gör
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Randevu Detay Kartı */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-slate-100">
          <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2 border-b pb-2">
            <Clock className="w-5 h-5 text-blue-600" /> Randevu Bilgileri
          </h2>
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-blue-50 rounded-lg text-blue-600"><Calendar className="w-5 h-5" /></div>
              <div>
                <p className="text-sm text-slate-500 mb-0.5">Tarih</p>
                <p className="text-base font-semibold text-slate-800">{formatDate(appointment.starts_at)}</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="p-2 bg-blue-50 rounded-lg text-blue-600"><Clock className="w-5 h-5" /></div>
              <div>
                <p className="text-sm text-slate-500 mb-0.5">Saat</p>
                <p className="text-base font-semibold text-slate-800">{formatTime(appointment.starts_at)} - {formatTime(appointment.ends_at)}</p>
              </div>
            </div>
            {service && (
              <div className="flex items-start gap-4">
                <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600"><CheckCircle className="w-5 h-5" /></div>
                <div className="flex-1">
                  <p className="text-sm text-slate-500 mb-0.5">Hizmet</p>
                  <p className="text-base font-semibold text-slate-800">{service.name}</p>
                </div>
                {service.price && (
                  <div className="text-right">
                    <p className="text-sm text-slate-500 mb-0.5">Fiyat</p>
                    <p className="text-base font-bold text-emerald-600">{service.price} TL</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Google Meet Butonu */}
        {appointment.meet_url && (
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl shadow-lg p-6 mb-6 border border-indigo-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                  <Video className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-white font-semibold text-lg">Google Meet ile Katıl</p>
                  <p className="text-indigo-100 text-sm">Randevunuz için video görüşme odası hazır</p>
                </div>
              </div>
              <a
                href={appointment.meet_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white text-indigo-600 font-bold rounded-xl hover:bg-indigo-50 transition-colors shadow-md"
              >
                💻 Katıl
              </a>
            </div>
          </div>
        )}

        {/* Takvime Ekle */}
        {(appointment.status === "pending" || appointment.status === "approved" || appointment.status === "confirmed" || appointment.status === "completed") && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-slate-100">
            <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2 border-b pb-2">
              <Calendar className="w-5 h-5 text-blue-600" /> Takvime Ekle
            </h2>
            <div className="flex gap-3">
              <a
                href={`https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(`${businessData?.name || 'İşletme'} - ${service?.name || 'Randevu'}`)}&dates=${new Date(appointment.starts_at).toISOString().replace(/-|:|\.\d\d\d/g, "")}/${new Date(appointment.ends_at).toISOString().replace(/-|:|\.\d\d\d/g, "")}&details=${encodeURIComponent(`Müşteri: ${customer?.name || ''}\nTelefon: ${customer?.phone || ''}\nHizmet: ${service?.name || ''}`)}&location=${encodeURIComponent(businessData?.address || '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors shadow-sm"
              >
                <Globe className="w-5 h-5" />
                Google Takvim
              </a>
              <a
                href={`${import.meta.env.VITE_API_URL}/calendar/appointment/${id}/download.ics`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-slate-800 hover:bg-slate-900 text-white font-semibold rounded-xl transition-colors shadow-sm"
              >
                <Download className="w-5 h-5" />
                .ics İndir
              </a>
            </div>
            <p className="text-xs text-slate-500 mt-3 text-center">
              .ics dosyasını Apple Calendar, Outlook veya diğer takvim uygulamalarına içe aktarabilirsiniz.
            </p>
          </div>
        )}

        {/* İşlem Butonları */}
        {(appointment.status === "pending" || appointment.status === "approved" || appointment.status === "confirmed") && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-slate-100">
            <div className="flex gap-4">
              <button onClick={() => setShowCancelModal(true)} disabled={!canCancelAppointment(appointment)} className={`flex-1 px-4 py-3 rounded-xl font-medium transition-colors ${!canCancelAppointment(appointment) ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200' : 'bg-red-50 text-red-600 hover:bg-red-100 border-2 border-red-200'}`}>
                İptal Et
              </button>
              <button onClick={() => setShowReschedulePopup(true)} className="flex-1 px-4 py-3 bg-slate-800 text-white hover:bg-slate-900 rounded-xl font-medium transition-colors border border-slate-800 shadow-sm">
                Ertele
              </button>
            </div>
            {!canCancelAppointment(appointment) && (
              <p className="text-xs text-red-600 mt-3 text-center flex items-center justify-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" /> Randevunuza çok az kaldığı için buradan iptal edilemez.
              </p>
            )}
          </div>
        )}

        {/* Sadakat Puanı */}
        <div className="bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 rounded-2xl shadow-lg p-6 border-2 border-amber-200 mb-6">
          <h2 className="text-lg font-semibold text-amber-900 mb-4 flex items-center gap-2">
            <Star className="w-5 h-5 text-amber-600 fill-amber-500" /> Sadakat Puanı
          </h2>

          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-md">
                <Star className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-amber-700 mb-0.5">Toplam Puan</p>
                <p className="text-2xl font-bold text-amber-600">{customer?.loyalty_points || 0}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-amber-700 mb-0.5">Hedef</p>
              <div className="inline-flex items-center gap-1 px-3 py-1 bg-amber-100 rounded-full text-sm font-semibold text-amber-600">
                {businessData?.reward_threshold || 10} puan
              </div>
            </div>
          </div>

          <div className="mb-2">
            <div className="w-full bg-amber-200 rounded-full h-3 overflow-hidden border border-amber-300">
              <div className="bg-gradient-to-r from-amber-400 to-orange-500 h-full transition-all duration-500" style={{ width: `${Math.min(((customer?.loyalty_points || 0) / (businessData?.reward_threshold || 10)) * 100, 100)}%` }} />
            </div>
          </div>

          {/* NXA Ödül Kodu */}
          {customer?.loyalty_points >= (businessData?.reward_threshold || 10) && (
            <div className="mt-5 p-4 bg-white rounded-xl border-2 border-amber-400 shadow-sm text-center animate-pulse">
              <p className="text-base font-bold text-amber-900">🎉 Tebrikler! Bedava Hizmet Kazandınız!</p>
              <p className="text-xs text-slate-600 mt-1 mb-2">Sıfırlama işlemi için bu kodu işletmeye iletin:</p>
              <div className="bg-slate-50 py-2.5 rounded-lg border-2 border-dashed border-amber-500">
                <span className="text-2xl font-black text-amber-600 tracking-widest">
                  NXA-{(customer?._id || id).toString().slice(-4).toUpperCase()}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Diğer Randevularınız */}
        {appointments.length > 1 && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-slate-100">
            <h2 className="text-lg font-semibold text-slate-800 mb-3 flex items-center gap-2 border-b pb-2">
              <Calendar className="w-5 h-5 text-blue-600" /> Tüm Randevularınız
            </h2>
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 scrollbar-thin">
              {appointments.map((apt) => {
                const aptStatus = statusConfig[apt.status] || statusConfig.pending;
                const isCurrent = apt._id === (appointment.id || id);

                return (
                  <div key={apt._id} className={`p-4 rounded-xl border-2 transition-all ${isCurrent ? 'border-blue-500 bg-blue-50/50 shadow-sm' : 'border-slate-100 bg-white hover:border-slate-200'}`}>
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${aptStatus.color}`}>{aptStatus.label}</span>
                          {isCurrent && <span className="text-[10px] bg-blue-600 text-white px-2 py-0.5 rounded-full font-bold">Şu anki</span>}
                        </div>
                        <p className="text-sm font-semibold text-slate-800">{formatDate(apt.starts_at)}</p>
                        <p className="text-xs text-slate-500">{formatTime(apt.starts_at)} - {apt.service_id?.name || "Hizmet"}</p>
                      </div>
                      {!isCurrent && (
                        <button onClick={() => { navigate(`/randevu/${apt._id}`); window.location.reload(); }} className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-700 rounded-lg text-xs font-semibold transition-colors">
                          Detay <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ALTA İŞLETME NUMARASI VE FOOTER EKLENDİ */}
        <div className="text-center mt-8 text-slate-500 text-sm">
          <p>Randevu durumunuz değiştiğinde bu sayfa otomatik güncellenecektir.</p>
          {businessData?.phone && (
            <div className="mt-4 flex flex-col items-center justify-center gap-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">İşletme İletişim</p>
              <a href={`tel:${businessData.phone}`} className="inline-flex items-center gap-2 px-4 py-2 bg-slate-200/60 hover:bg-slate-300 text-slate-700 rounded-full font-bold transition-colors">
                <Phone className="w-4 h-4 text-slate-600" />
                {businessData.name || "İşletme"} - {businessData.phone}
              </a>
            </div>
          )}
        </div>

      </div>

      {/* İptal Modalı */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-slate-800 mb-2">Randevuyu İptal Et</h3>
            <p className="text-slate-600 text-sm mb-6">Bu randevuyu iptal etmek istediğinize emin misiniz? Bu işlem geri alınamaz.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowCancelModal(false)} className="flex-1 py-2.5 bg-slate-100 text-slate-700 rounded-xl font-medium hover:bg-slate-200 transition-colors">Vazgeç</button>
              <button onClick={() => handleCancelAppointment(appointment.id || id)} className="flex-1 py-2.5 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors">
                {cancelling ? 'İşleniyor...' : 'Evet, İptal Et'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Erteleme Modalı */}
      {showReschedulePopup && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-slate-800 mb-2">Randevuyu Ertele</h3>
            <p className="text-slate-600 text-sm mb-5">Lütfen yeni tarih ve saat seçin. İşlem dükkan onayına düşecektir.</p>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Yeni Tarih</label>
                <input type="date" value={rescheduleDate} onChange={(e) => setRescheduleDate(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none" min={new Date().toISOString().split("T")[0]} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Yeni Saat</label>
                <input type="time" value={rescheduleTime} onChange={(e) => setRescheduleTime(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setShowReschedulePopup(false)} className="flex-1 py-2.5 bg-slate-100 text-slate-700 rounded-xl font-medium hover:bg-slate-200">İptal</button>
              <button disabled={!rescheduleDate || !rescheduleTime || isRescheduling} onClick={handleReschedule} className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                {isRescheduling ? "İşleniyor..." : "Onayla"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppointmentTrackingPage;