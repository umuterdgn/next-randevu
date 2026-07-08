import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Protected({ children, role }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  
  // Redirect staff members trying to access business owner routes
  if (user.role === "staff" && role !== "staff") {
    return <Navigate to="/staff/dashboard" />;
  }
  
  // Allow business role to access business routes
  if (role && user.role !== role && !(role === "admin" && user.role === "business")) {
    return <Navigate to={user.role === "owner" ? "/owner" : "/business"} />;
  }
  return children;
}