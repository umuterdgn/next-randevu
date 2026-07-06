import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";

// Sayfaları Import Ediyoruz
import LandingPage from "./pages/LandingPage";
import ApplyPage from "./pages/ApplyPage";
import LoginPage from "./pages/LoginPage";
import OwnerPage from "./pages/OwnerPage";
import BusinessPage from "./pages/BusinessPage";
import BookingPage from "./pages/BookingPage";
import QuickBookingPage from "./pages/QuickBookingPage";
import AppointmentTrackingPage from "./pages/AppointmentTrackingPage";
import AgentLoginPage from "./pages/AgentLoginPage";
import AgentDashboard from "./pages/AgentDashboard";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import SSOPage from "./pages/SSOPage";

// Güvenlik Bileşenini Import Ediyoruz
import Protected from "./components/Protected";

export default function App() {
  return (
    <>
      <Routes>
        {/* Herkese Açık Sayfalar */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/apply" element={<ApplyPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/auth/sso" element={<SSOPage />} />
        <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
        <Route path="/randevu/:id" element={<AppointmentTrackingPage />} />
        <Route path="/agent" element={<AgentLoginPage />} />
        <Route path="/agent/dashboard" element={<AgentDashboard />} />

        {/* Sadece Owner (SaaS Yöneticisi) Tarafından Erişilebilen Sayfalar */}
        <Route
          path="/owner/*"
          element={
            <Protected role="owner">
              <OwnerPage />
            </Protected>
          }
        />

        {/* İşletmeler Tarafından Erişilebilen Sayfalar */}
        <Route
          path="/business/*"
          element={
            <Protected>
              <BusinessPage />
            </Protected>
          }
        />
        <Route
          path="/business/quick-booking"
          element={
            <Protected>
              <QuickBookingPage />
            </Protected>
          }
        />

        {/* Root slug route - MUST BE LAST to not override other routes */}
        <Route path="/:slug" element={<BookingPage />} />
      </Routes>
      <Toaster position="top-right" toastOptions={{ duration: 3000, style: { background: '#333', color: '#fff', borderRadius: '10px' } }} />
    </>
  );
}