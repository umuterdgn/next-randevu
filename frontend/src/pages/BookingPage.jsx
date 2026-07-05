import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

const BookingPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [selectedService, setSelectedService] = useState(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [expandedService, setExpandedService] = useState(null);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
  });

  // API states
  const [services, setServices] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [business, setBusiness] = useState(null);

  // Hizmetleri API'den çek
  useEffect(() => {
    const fetchServices = async () => {
      if (!slug) {
        setError("İşletme bulunamadı");
        return;
      }

      try {
        setLoading(true);
        setError("");
        const businessResponse = await fetch(`http://localhost:5000/api/booking/business/${slug}`, {
          cache: 'no-store'
        });
        const businessData = await businessResponse.json();

        console.log("Frontend'e gelen veri:", businessData);
        console.log("Frontend'e gelen servisler:", businessData.services);

        if (businessData.business) {
          setBusiness(businessData.business);
          setServices(businessData.services || []);
        } else {
          setError("İşletme bilgileri yüklenirken bir hata oluştu");
        }
      } catch (err) {
        setError("Sunucu bağlantı hatası");
        console.error("Business fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, [slug]);

  const handleServiceSelect = (service) => {
    setSelectedService(service);
    setStep(2);
  };

  const handleDateChange = async (e) => {
    const date = e.target.value;
    setSelectedDate(date);
    setSelectedTime(""); // Reset time when date changes

    // Tarih seçildiğinde müsait saatleri çek
    if (date && selectedService && slug) {
      try {
        setLoading(true);
        setError("");
        const response = await fetch(
          `http://localhost:5000/api/booking/availability?slug=${slug}&date=${date}&serviceDuration=${selectedService.duration}`
        );
        const data = await response.json();

        if (data.success) {
          setAvailableSlots(data.data.availableSlots);
        } else {
          setError("Müsait saatler yüklenirken bir hata oluştu");
        }
      } catch (err) {
        setError("Sunucu bağlantı hatası");
        console.error("Availability fetch error:", err);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleTimeSelect = (time) => {
    setSelectedTime(time);
    setStep(3);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleConfirm = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // starts_at ve ends_at tarihlerini oluştur
      const starts_at = new Date(`${selectedDate}T${selectedTime}:00`);
      const ends_at = new Date(starts_at.getTime() + selectedService.duration * 60000);

      const bookingData = {
        slug,
        serviceId: selectedService._id,
        is_online: selectedService.is_online || false, // İŞTE EKSİK OLAN SİHİRLİ SATIR
        starts_at: starts_at.toISOString(),
        ends_at: ends_at.toISOString(),
        customer: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone,
          email: formData.email,
        },
      };

      const response = await fetch("http://localhost:5000/api/booking/book", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(bookingData),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        // Redirect to appointment tracking page
        const appointmentId = data.appointment?._id || data.data?._id || data.appointmentId;
        if (appointmentId) {
          navigate(`/randevu/${appointmentId}`);
        } else {
          // Fallback: reset form if no appointment ID
          setStep(1);
          setSelectedService(null);
          setSelectedDate("");
          setSelectedTime("");
          setFormData({ firstName: "", lastName: "", phone: "", email: "" });
          setAvailableSlots([]);
        }
      } else {
        setError(data.message || "Randevu oluşturulurken bir hata oluştu");
      }
    } catch (err) {
      setError("Sunucu bağlantı hatası");
      console.error("Booking error:", err);
    } finally {
      setLoading(false);
    }
  };

  const goBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  return (
    <div className="min-h-screen py-8 px-4" style={{ background: `linear-gradient(135deg, ${business?.theme_color || '#3B82F6'}15 0%, ${business?.theme_color || '#3B82F6'}05 100%)` }}>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          {business?.logo_url && (
            <div className="flex justify-center mb-4">
              <img
                src={business.logo_url}
                alt={`${business.name} Logo`}
                className="h-24 w-auto object-contain rounded-xl shadow-md border border-white/20"
                onError={(e) => e.target.style.display = 'none'}
              />
            </div>
          )}
          <h1 className="text-3xl font-bold text-center my-4 drop-shadow-sm" style={{ color: business?.theme_color || '#3B82F6' }}>
            {business?.name || "İşletme"}
          </h1>
          <p className="text-slate-600 text-lg font-medium">Size en uygun zamanı seçin</p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          {[1, 2, 3].map((s) => (
            <React.Fragment key={s}>
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all duration-300 ${step === s
                    ? "text-white scale-110"
                    : step > s
                      ? "bg-green-500 text-white"
                      : "bg-slate-200 text-slate-500"
                  }`}
                style={step === s ? { backgroundColor: business?.theme_color || "#3B82F6" } : {}}
              >
                {step > s ? "✓" : s}
              </div>
              {s < 3 && (
                <div
                  className={`w-16 h-1 mx-2 transition-all duration-300 ${step > s ? "bg-green-500" : "bg-slate-200"
                    }`}
                />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6">
            {error}
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="bg-green-50 border-2 border-green-200 text-green-700 px-6 py-4 rounded-xl mb-6">
            <div className="flex items-center gap-3">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <div>
                <p className="font-semibold">Randevunuz Alındı!</p>
                <p className="text-sm">Randevu talebiniz başarıyla oluşturuldu.</p>
              </div>
            </div>
            <button
              onClick={() => setSuccess(false)}
              className="mt-3 text-sm font-medium text-green-600 hover:text-green-800"
            >
              Yeni Randevu Al
            </button>
          </div>
        )}

        {/* Step Content */}
        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
          {/* Step 1: Service Selection */}
          {step === 1 && (
            <div>
              <h2 className="text-xl font-semibold text-slate-800 mb-6">Hizmet Seçin</h2>
              {loading ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <p className="mt-3 text-slate-600">Yükleniyor...</p>
                </div>
              ) : !Array.isArray(services) || services.length === 0 ? (
                <div className="text-center py-8 text-slate-600">
                  <p>Hizmet bulunamadı</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {services.map((service) => (
                    <div key={service._id} className="rounded-xl border-2 border-slate-200 hover:border-blue-500 transition-all duration-300 overflow-hidden">
                      <button
                        onClick={() => setExpandedService(expandedService === service._id ? null : service._id)}
                        className="w-full p-5 text-left group"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold text-slate-800 group-hover:text-blue-600 transition-colors">
                              {service.name}
                            </h3>
                            <p className="text-sm text-slate-500 mt-1">{service.duration} dakika</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-lg text-slate-800">
                              {service.price ? `${service.price} ${service.currency || "TL"}` : "Fiyat Sorunuz"}
                            </p>
                          </div>
                        </div>
                      </button>
                      {expandedService === service._id && (
                        <div className="px-5 pb-5 border-t border-slate-200 pt-4 animate-in slide-in-from-top-2 duration-300">
                          {(service.description || service.critical_points || service.process_steps) && (
                            <div className="space-y-3 mb-4">
                              {service.description && (
                                <div>
                                  <p className="text-sm font-medium text-slate-700 mb-1">Açıklama</p>
                                  <p className="text-sm text-slate-600">{service.description}</p>
                                </div>
                              )}
                              {service.critical_points && (
                                <div>
                                  <p className="text-sm font-medium text-slate-700 mb-1">Kritik Noktalar</p>
                                  <p className="text-sm text-slate-600">{service.critical_points}</p>
                                </div>
                              )}
                              {service.process_steps && (
                                <div>
                                  <p className="text-sm font-medium text-slate-700 mb-1">İşlem Süreçleri</p>
                                  <p className="text-sm text-slate-600">{service.process_steps}</p>
                                </div>
                              )}
                            </div>
                          )}
                          <button
                            onClick={() => handleServiceSelect(service)}
                            className="w-full py-3 text-white font-semibold rounded-xl transition-colors duration-300"
                            style={{ backgroundColor: business?.theme_color || "#3B82F6" }}
                          >
                            Bu Hizmeti Seç
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 2: Date & Time Selection */}
          {step === 2 && (
            <div>
              <button
                onClick={goBack}
                className="mb-4 font-medium transition-colors"
                style={{ color: business?.theme_color || "#3B82F6" }}
              >
                ← Geri Dön
              </button>
              <h2 className="text-xl font-semibold text-slate-800 mb-6">Tarih ve Saat Seçin</h2>

              {/* Selected Service Info */}
              {selectedService && (
                <div className="bg-blue-50 rounded-xl p-4 mb-6">
                  <p className="text-sm text-slate-600">Seçilen Hizmet:</p>
                  <p className="font-semibold text-slate-800">{selectedService.name}</p>
                  <p className="text-sm text-slate-600">{selectedService.duration} dakika - {selectedService.price} TL</p>
                </div>
              )}

              {/* Date Picker */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 mb-2">Tarih Seçin</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={handleDateChange}
                  min={new Date().toISOString().split("T")[0]}
                  className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-blue-500 focus:outline-none transition-colors"
                />
              </div>

              {/* Time Slots */}
              {selectedDate && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-3">Müsait Saatler</label>
                  {loading ? (
                    <div className="text-center py-4">
                      <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                      <p className="mt-2 text-sm text-slate-600">Yükleniyor...</p>
                    </div>
                  ) : availableSlots.length === 0 ? (
                    <div className="text-center py-4 text-slate-600">
                      <p>Bu tarih için müsait saat bulunamadı</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                      {availableSlots.map((time) => (
                        <button
                          key={time}
                          onClick={() => handleTimeSelect(time)}
                          className="py-3 px-4 rounded-xl border-2 border-slate-200 hover:bg-blue-50 font-medium text-slate-700 transition-all duration-300"
                          style={{ borderColor: selectedTime === time ? (business?.theme_color || "#3B82F6") : "", backgroundColor: selectedTime === time ? `${business?.theme_color || "#3B82F6"}20` : "" }}
                        >
                          {time}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Step 3: Contact Form */}
          {step === 3 && (
            <div>
              <button
                onClick={goBack}
                className="mb-4 font-medium transition-colors"
                style={{ color: business?.theme_color || "#3B82F6" }}
              >
                ← Geri Dön
              </button>
              <h2 className="text-xl font-semibold text-slate-800 mb-6">İletişim Bilgileri</h2>

              {/* Summary */}
              <div className="bg-slate-50 rounded-xl p-4 mb-6">
                <p className="text-sm text-slate-600 mb-2">Randevu Özeti:</p>
                <p className="font-semibold text-slate-800">{selectedService?.name}</p>
                <p className="text-sm text-slate-600">
                  {selectedDate} - {selectedTime}
                </p>
                <p className="font-bold text-lg text-slate-800 mt-2">{selectedService?.price} TL</p>
              </div>

              {/* Contact Form */}
              <form onSubmit={handleConfirm}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Ad</label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-blue-500 focus:outline-none transition-colors"
                      placeholder="Adınız"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Soyad</label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-blue-500 focus:outline-none transition-colors"
                      placeholder="Soyadınız"
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700 mb-2">Telefon</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-blue-500 focus:outline-none transition-colors"
                    placeholder="05XX XXX XX XX"
                  />
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-slate-700 mb-2">E-posta</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-blue-500 focus:outline-none transition-colors"
                    placeholder="ornek@email.com"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 text-white font-semibold rounded-xl transition-colors duration-300 shadow-lg hover:shadow-xl disabled:bg-slate-400 disabled:cursor-not-allowed"
                  style={{ backgroundColor: business?.theme_color || "#3B82F6" }}
                >
                  {loading ? "İşleniyor..." : "Randevuyu Onayla"}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookingPage;