import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Protected({ children, role }) {
  const { user } = useAuth();

  // Redirect unauthenticated users to appropriate login page based on role
  if (!user) {
    if (role === "staff") {
      return <Navigate to="/personel-giris" />;
    }
    return <Navigate to="/login" />;
  }

  // Redirect staff members trying to access business owner routes
  if (user.role === "staff" && role !== "staff") {
    return <Navigate to="/staff/dashboard" />;
  }

  // Allow business, business_admin, and cashier roles to access business routes
  if (role && user.role !== role && !(role === "admin" && (user.role === "business" || user.role === "business_admin" || user.role === "cashier"))) {
    return <Navigate to={user.role === "owner" ? "/owner" : "/business"};
  }
  return children;
}