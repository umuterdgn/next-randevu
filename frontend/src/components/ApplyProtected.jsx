import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ApplyProtected({ children }) {
  const { user } = useAuth();

  // 1. Çıkış yapmışsa (user yoksa) KESİNLİKLE Login'e şutla!
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === "owner" && user.business_id === "saas_root") {
    return <Navigate to="/owner" replace />;
  }

  if (user.business_id && user.business_id !== "pending") {
    return <Navigate to="/business" replace />;
  }

  return children;
}