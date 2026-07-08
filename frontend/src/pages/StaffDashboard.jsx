import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../api/client";
import { toast } from "react-hot-toast";
import { Calendar, Clock, CheckCircle, LogOut, User } from "lucide-react";

export default function StaffDashboard() {
  const { user, logout } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("upcoming"); // upcoming | history

  useEffect(() => {
    loadAppointments();
  }, [activeTab]);

  const loadAppointments = async () => {
    try {
      setLoading(true);
      const status = activeTab === "history" ? "completed" : "pending,approved,arrived";
      const response = await api.get(`/business/staff/appointments?status=${status}`);
      setAppointments(response.data);
    } catch (error) {
      console.error("Error loading appointments:", error);
      toast.error("Randevular yüklenirken hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (appointmentId, newStatus) => {
    try {
      await api.patch(`/business/appointments/${appointmentId}/status`, {
        status: newStatus,
      });
      toast.success("Durum güncellendi");
      loadAppointments();
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Durum güncellenirken hata oluştu");
    }
  };

  const handleLogout = () => {
    logout();
    window.location.href = "/staff/login";
  };

  const statusClasses = {
    pending: "bg-amber-100 text-amber-700",
    approved: "bg-blue-100 text-blue-700",
    arrived: "bg-emerald-100 text-emerald-700",
    completed: "bg-indigo-100 text-indigo-700",
    cancelled: "bg-rose-100 text-rose-700",
  };

  const statusLabels = {
    pending: "Beklemede",
    approved: "Onaylandı",
    arrived: "Geldi",
    completed: "Tamamlandı",
    cancelled: "İptal",
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-800">
                  {user?.name || "Personel Paneli"}
                </h1>
                <p className="text-sm text-slate-500">
                  {activeTab === "upcoming" ? "Yaklaşan Randevular" : "Geçmiş Randevular"}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Çıkış
            </button>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab("upcoming")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === "upcoming"
                ? "bg-indigo-600 text-white"
                : "bg-white text-slate-600 hover:bg-slate-100"
            }`}
          >
            Yaklaşan Randevular
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === "history"
                ? "bg-indigo-600 text-white"
                : "bg-white text-slate-600 hover:bg-slate-100"
            }`}
          >
            Geçmiş Randevular
          </button>
        </div>

        {/* Appointments List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <p className="text-slate-500 mt-2">Yükleniyor...</p>
          </div>
        ) : appointments.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <Calendar className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-700 mb-2">
              {activeTab === "upcoming" ? "Yaklaşan randevu bulunmuyor" : "Geçmiş randevu bulunmuyor"}
            </h3>
            <p className="text-slate-500">
              {activeTab === "upcoming"
                ? "Yakında yeni randevularınız burada görünecek."
                : "Tamamlanan randevularınız burada görünecek."}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {appointments.map((appointment) => (
              <div
                key={appointment._id}
                className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Clock className="w-5 h-5 text-indigo-600" />
                      <span className="font-semibold text-slate-800">
                        {new Date(appointment.starts_at).toLocaleString("tr-TR", {
                          day: "2-digit",
                          month: "long",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <h3 className="text-lg font-medium text-slate-800 mb-1">
                      {appointment.customer_id?.name || "Bilinmeyen Müşteri"}
                    </h3>
                    <p className="text-slate-600 mb-2">
                      {appointment.service_id?.name || "Belirtilmemiş Hizmet"}
                    </p>
                    {appointment.note && (
                      <p className="text-sm text-slate-500 bg-slate-50 p-2 rounded-lg">
                        Not: {appointment.note}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        statusClasses[appointment.status] || "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {statusLabels[appointment.status] || appointment.status}
                    </span>

                    {activeTab === "upcoming" && appointment.status !== "completed" && (
                      <select
                        value={appointment.status}
                        onChange={(e) => handleStatusChange(appointment._id, e.target.value)}
                        className="input text-sm py-2 px-3 w-32"
                      >
                        <option value="pending">Beklemede</option>
                        <option value="approved">Onaylandı</option>
                        <option value="arrived">Geldi</option>
                        <option value="completed">Tamamlandı</option>
                        <option value="cancelled">İptal</option>
                      </select>
                    )}

                    {activeTab === "history" && appointment.status === "completed" && (
                      <div className="flex items-center gap-1 text-green-600">
                        <CheckCircle className="w-5 h-5" />
                        <span className="text-sm font-medium">Tamamlandı</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
