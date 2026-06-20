import { Routes, Route, Navigate } from "react-router-dom";

// Sayfaları Import Ediyoruz
import ApplyPage from "./pages/ApplyPage";
import LoginPage from "./pages/LoginPage";
import OwnerPage from "./pages/OwnerPage";
import BusinessPage from "./pages/BusinessPage";

// Güvenlik Bileşenini Import Ediyoruz
import Protected from "./components/Protected";

export default function App() {
  return (
    <Routes>
      {/* Herkese Açık Sayfalar */}
      <Route path="/" element={<Navigate to="/apply" />} />
      <Route path="/apply" element={<ApplyPage />} />
      <Route path="/login" element={<LoginPage />} />
{/* DİKKAT: /owner sonundaki /* çok önemli, alt sayfaların açılmasını sağlar */}
<Route path="/owner/*" element={<Protected role="owner"><OwnerPage /></Protected>} />
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
    </Routes>
  );
}