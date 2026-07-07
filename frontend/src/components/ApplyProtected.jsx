import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ApplyProtected({ children }) {
  const { user } = useAuth();

  if (user) {
    // Eğer giren kişi en yetkili SaaS yöneticisiyse onu Owner paneline yolla
    if (user.role === "owner" && user.business_id === "saas_root") {
      return <Navigate to="/owner" replace />;
    }

    // Eğer kullanıcının ZATEN KURULU bir işletmesi varsa onu Business paneline yolla
    // (Ancak "pending" durumundaysa, yani henüz kurmadıysa AŞAĞIYA GEÇMESİNE İZİN VER!)
    if (user.business_id && user.business_id !== "pending") {
      return <Navigate to="/business" replace />;
    }
  }

  // Kullanıcı giriş yapmamışsa veya işletmesi "pending" durumundaysa Apply sayfasını göster!
  return children;
}
