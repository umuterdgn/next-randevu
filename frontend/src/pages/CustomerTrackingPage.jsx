import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { CalendarDays, Clock, MapPin, Phone, X, CheckCircle, Star, Gift } from "lucide-react";
import api from "../api/client";

export default function CustomerTrackingPage() {
  const { appointmentId } = useParams();
  const navigate = useNavigate();

  const [appointmentData, setAppointmentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelled, setCancelled] = useState(false);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);

  useEffect(() => {
    loadAppointment();
  }, [appointmentId]);

  const loadAppointment = async () => {
    try {
      const response = await api.get(`/booking/track/${appointmentId}`);
      setAppointmentData(response.data.data);
    } catch (error) {
      console.error("Randevu yüklenirken hata:", error);
      alert("Randevu bulunamadı.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm("Randevuyu iptal etmek istediğinizden emin misiniz?")) return;

    try {
      await api.patch(`/booking/track/${appointmentId}/cancel`);
      setCancelled(true);
      loadAvailableSlots();
    } catch (error) {
      console.error("İptal hatası:", error);
      alert("Randevu iptal edilirken hata oluştu.");
    }
  };

  const loadAvailableSlots = async () => {
    if (!appointmentData?.business?.slug || !appointmentData?.service?.duration) return;

    try {
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const dateStr = tomorrow.toISOString().split("T")[0];

      const response = await api.get(
        `/booking/availability?slug=${appointmentData.business.slug}&date=${dateStr}&serviceDuration=${appointmentData.service.duration}`
      );

      setAvailableSlots(response.data.data.availableSlots || []);
    } catch (error) {
      console.error("Müsait saatler yüklenirken hata:", error);
    }
  };

  const handleBookNewAppointment = async (slot) => {
    if (!selectedSlot) return;

    try {
      const [hours, minutes] = slot.split(":");
      const date = new Date();
      date.setDate(date.getDate() + 1);
      date.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      const startsAt = new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString();
      const endsAt = new Date(date.getTime() + appointmentData.service.duration * 60000 - (date.getTimezoneOffset() * 60000)).toISOString();

      await api.post("/booking/book", {
        slug: appointmentData.business.slug,
        serviceId: appointmentData.service.id,
        starts_at: startsAt,
        ends_at: endsAt,
        customer: {
          firstName: appointmentData.customer.name.split(" ")[0],
          lastName: appointmentData.customer.name.split(" ").slice(1).join(" ") || "",
          phone: appointmentData.customer.phone,
          email: "",
        },
      });

      alert("Yeni randevu başarıyla oluşturuldu!");
      navigate(`/${appointmentData.business.slug}`);
    } catch (error) {
      console.error("Randevu oluşturma hatası:", error);
      alert("Randevu oluşturulurken hata oluştu.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-slate-500">Yükleniyor...</div>
      </div>
    );
  }

  if (!appointmentData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-slate-500">Randevu bulunamadı.</div>
      </div>
    );
  }

  const statusColors = {
    pending: "bg-amber-100 text-amber-700",
    approved: "bg-emerald-100 text-emerald-700",
    completed: "bg-indigo-100 text-indigo-700",
    cancelled: "bg-slate-200 text-slate-700",
  };

  const statusLabels = {
    pending: "Beklemede",
    approved: "Onaylandı",
    completed: "Tamamlandı",
    cancelled: "İptal Edildi",
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {!cancelled ? (
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="bg-indigo-600 px-6 py-8 text-white">
              <h1 className="text-2xl font-bold mb-2">Randevu Detayları</h1>
              <p className="text-indigo-100">Randevu durumunuzu buradan takip edebilirsiniz</p>
            </div>

            <div className="p-6 space-y-6">
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Gift className="w-5 h-5 text-amber-600" />
                    <span className="font-semibold text-amber-800">Sadakat Puanınız</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                    <span className="font-bold text-amber-800">
                      {appointmentData.customer.loyalty_points} / {appointmentData.business.reward_threshold}
                    </span>
                  </div>
                </div>
                <div className="w-full bg-amber-200 rounded-full h-3 mb-2">
                  <div
                    className="bg-gradient-to-r from-amber-500 to-orange-500 h-3 rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min((appointmentData.customer.loyalty_points / appointmentData.business.reward_threshold) * 100, 100)}%`,
                    }}
                  ></div>
                </div>
                <p className="text-sm text-amber-700">
                  {appointmentData.customer.loyalty_points >= appointmentData.business.reward_threshold
                    ? "🎉 Tebrikler! Ödül kazandınız!"
                    : `${appointmentData.business.reward_threshold - appointmentData.customer.loyalty_points} puanda 1 Ücretsiz Hizmet!`}
                </p>
              </div>
              <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
                <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                  <CalendarDays className="w-6 h-6 text-indigo-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">Tarih & Saat</p>
                  <p className="font-semibold text-slate-800">
                    {new Date(appointmentData.appointment.starts_at).toLocaleString("tr-TR", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
                <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                  <Clock className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">Hizmet</p>
                  <p className="font-semibold text-slate-800">{appointmentData.service.name}</p>
                  <p className="text-sm text-slate-500">{appointmentData.service.duration} dk</p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
                <div className="w-12 h-12 bg-fuchsia-100 rounded-full flex items-center justify-center">
                  <MapPin className="w-6 h-6 text-fuchsia-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">İşletme</p>
                  <p className="font-semibold text-slate-800">{appointmentData.business.name}</p>
                  <p className="text-sm text-slate-500 flex items-center gap-1">
                    <Phone className="w-3 h-3" /> {appointmentData.business.phone}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                <div>
                  <p className="text-sm text-slate-500">Durum</p>
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${statusColors[appointmentData.appointment.status]}`}>
                    {statusLabels[appointmentData.appointment.status]}
                  </span>
                </div>
              </div>

              {appointmentData.appointment.status !== "completed" && appointmentData.appointment.status !== "cancelled" && (
                <button
                  onClick={handleCancel}
                  className="w-full py-3 px-6 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  <X className="w-5 h-5" /> Randevuyu İptal Et
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="bg-red-500 px-6 py-8 text-white">
              <div className="flex items-center gap-3 mb-2">
                <X className="w-8 h-8" />
                <h1 className="text-2xl font-bold">Randevu İptal Edildi</h1>
              </div>
              <p className="text-red-100">Randevunuz başarıyla iptal edildi</p>
            </div>

            <div className="p-6 space-y-6">
              <div className="text-center">
                <p className="text-slate-600 mb-4">Aşağıdaki müsait saatlerden birini seçerek yeni bir randevu oluşturabilirsiniz:</p>
              </div>

              {availableSlots.length > 0 ? (
                <div className="grid grid-cols-4 gap-3">
                  {availableSlots.map((slot) => (
                    <button
                      key={slot}
                      onClick={() => setSelectedSlot(slot)}
                      className={`py-3 px-4 rounded-lg font-medium transition ${
                        selectedSlot === slot
                          ? "bg-indigo-600 text-white"
                          : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                      }`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-center text-slate-500 py-8">Yarın için müsait saat bulunamadı.</p>
              )}

              {selectedSlot && (
                <button
                  onClick={() => handleBookNewAppointment(selectedSlot)}
                  className="w-full py-3 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-5 h-5" /> Yeni Randevu Oluştur
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
