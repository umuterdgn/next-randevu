import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { ArrowLeft, Search, CalendarDays, Clock, User, Phone } from "lucide-react";
import AppLayout from "../layouts/AppLayout";
import { useAuth } from "../context/AuthContext";
import api from "../api/client";

export default function QuickBookingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [customers, setCustomers] = useState([]);
  const [services, setServices] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedService, setSelectedService] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState("");

  const [newCustomer, setNewCustomer] = useState({ name: "", phone: "" });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [c, s] = await Promise.all([
        api.get("/business/customers"),
        api.get("/business/services"),
      ]);
      setCustomers(c.data);
      setServices(s.data);
    } catch (error) {
      console.error("Veriler yüklenirken hata:", error);
    }
  };

  const handleSearchCustomer = (e) => {
    setSearchTerm(e.target.value);
  };

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.includes(searchTerm)
  );

  const handleSelectCustomer = (customer) => {
    setSelectedCustomer(customer);
    setSearchTerm("");
  };

  const handleAddCustomer = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post("/business/customers", newCustomer);
      setSelectedCustomer(response.data);
      setNewCustomer({ name: "", phone: "" });
      loadData();
      alert("Müşteri başarıyla eklendi!");
    } catch (err) {
      alert("Müşteri eklenirken hata oluştu.");
    }
  };

  const handleCreateAppointment = async (e) => {
    e.preventDefault();
    if (!selectedCustomer || !selectedService || !selectedDate || !selectedTime) {
      alert("Lütfen tüm alanları doldurun.");
      return;
    }

    try {
      const date = selectedDate;
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const formattedDate = `${year}-${month}-${day}`;

      const startDateTimeStr = `${formattedDate}T${selectedTime}:00`;
      const startDateTime = new Date(startDateTimeStr);

      if (isNaN(startDateTime.getTime())) {
        alert("Lütfen geçerli bir tarih ve saat seçin.");
        return;
      }

      const endDateTime = new Date(startDateTime.getTime() + selectedService.duration * 60000);

      const startsAt = startDateTime.toISOString();
      const endsAt = endDateTime.toISOString();

      await api.post("/business/appointments", {
        customer_id: selectedCustomer._id,
        service_id: selectedService._id,
        starts_at: startsAt,
        ends_at: endsAt,
      });

      alert("Randevu başarıyla oluşturuldu!");
      navigate("/business/appointments");
    } catch (err) {
      console.error("Randevu oluşturma hatası:", err);
      alert("Randevu oluşturulurken hata oluştu.");
    }
  };

  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 9; hour <= 18; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const time = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
        slots.push(time);
      }
    }
    return slots;
  };

  return (
    <AppLayout>
      <div className="mb-6">
        <button
          onClick={() => navigate("/business/appointments")}
          className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-800 transition mb-4"
        >
          <ArrowLeft className="w-4 h-4" /> Randevulara Dön
        </button>
        <h2 className="text-2xl font-bold text-slate-800">Hızlı Randevu Oluştur</h2>
        <p className="text-slate-500 text-sm">
          Müşteri seçin, hizmet ve tarih belirleyin, randevuyu oluşturun.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Sol Taraf: Müşteri */}
        <div className="space-y-6">
          <div className="card">
            <h3 className="mb-4 font-semibold text-slate-700 flex items-center gap-2">
              <User className="w-5 h-5 text-indigo-500" /> Müşteri Seç
            </h3>

            {/* Arama Çubuğu */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="İsim veya telefon ara..."
                className="input w-full pl-10"
                value={searchTerm}
                onChange={handleSearchCustomer}
              />
            </div>

            {/* Müşteri Listesi */}
            {searchTerm && !selectedCustomer && (
              <div className="space-y-2 max-h-60 overflow-y-auto mb-4">
                {filteredCustomers.length === 0 ? (
                  <p className="text-sm text-slate-500 text-center py-4">
                    Müşteri bulunamadı.
                  </p>
                ) : (
                  filteredCustomers.map((c) => (
                    <div
                      key={c._id}
                      onClick={() => handleSelectCustomer(c)}
                      className="p-3 rounded-lg border border-slate-200 bg-white hover:border-indigo-300 hover:bg-indigo-50 cursor-pointer transition"
                    >
                      <p className="font-medium text-slate-800">{c.name}</p>
                      <p className="text-sm text-slate-500">{c.phone}</p>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Seçili Müşteri */}
            {selectedCustomer && (
              <div className="p-4 rounded-lg bg-indigo-50 border border-indigo-200">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-bold text-slate-800">{selectedCustomer.name}</p>
                    <p className="text-sm text-slate-600 flex items-center gap-1">
                      <Phone className="w-3 h-3" /> {selectedCustomer.phone}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedCustomer(null)}
                    className="text-xs text-red-600 hover:text-red-800"
                  >
                    Değiştir
                  </button>
                </div>
              </div>
            )}

            {!selectedCustomer && (
              <>
                <div className="border-t border-slate-200 pt-4 mt-4">
                  <p className="text-sm font-medium text-slate-700 mb-3">
                    Yeni Müşteri Ekle
                  </p>
                  <form onSubmit={handleAddCustomer} className="space-y-3">
                    <input
                      type="text"
                      placeholder="İsim Soyisim"
                      className="input w-full"
                      value={newCustomer.name}
                      onChange={(e) =>
                        setNewCustomer({ ...newCustomer, name: e.target.value })
                      }
                      required
                    />
                    <input
                      type="tel"
                      placeholder="Telefon"
                      className="input w-full"
                      value={newCustomer.phone}
                      onChange={(e) =>
                        setNewCustomer({ ...newCustomer, phone: e.target.value })
                      }
                      required
                    />
                    <button type="submit" className="btn-primary w-full py-2">
                      Müşteri Ekle
                    </button>
                  </form>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Sağ Taraf: Hizmet & Takvim */}
        <div className="space-y-6">
          <div className="card">
            <h3 className="mb-4 font-semibold text-slate-700 flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-indigo-500" /> Hizmet Seç
            </h3>

            <div className="space-y-2">
              {services.map((s) => (
                <div
                  key={s._id}
                  onClick={() => setSelectedService(s)}
                  className={`p-4 rounded-lg border cursor-pointer transition ${
                    selectedService?._id === s._id
                      ? "border-indigo-500 bg-indigo-50"
                      : "border-slate-200 bg-white hover:border-indigo-300"
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-slate-800">{s.name}</p>
                      <p className="text-sm text-slate-500 flex items-center gap-1 mt-1">
                        <Clock className="w-3 h-3" /> {s.duration} dk
                      </p>
                    </div>
                    {s.price && (
                      <span className="font-bold text-indigo-600">{s.price} TL</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {selectedService && (
            <div className="card">
              <h3 className="mb-4 font-semibold text-slate-700 flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-indigo-500" /> Tarih & Saat
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Tarih Seç
                  </label>
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
                </div>

                {selectedDate && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Saat Seç
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {generateTimeSlots().map((time) => (
                        <button
                          key={time}
                          onClick={() => setSelectedTime(time)}
                          className={`py-2 px-3 rounded-lg text-sm font-medium transition ${
                            selectedTime === time
                              ? "bg-indigo-600 text-white"
                              : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                          }`}
                        >
                          {time}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {selectedDate && selectedTime && (
                  <button
                    onClick={handleCreateAppointment}
                    className="btn-primary w-full py-3 text-lg"
                  >
                    Randevuyu Oluştur
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
