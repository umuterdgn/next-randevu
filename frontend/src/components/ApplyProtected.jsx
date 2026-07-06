import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ApplyProtected({ children }) {
  const { user } = useAuth();

  // If not authenticated, redirect to login
  if (!user) {
    return <Navigate to="/login" />;
  }

  // If user already has a business (business_id is not 'pending'), redirect to business dashboard
  if (user.business_id && user.business_id !== 'pending') {
    return <Navigate to="/business" />;
  }

  // Allow access - user is authenticated but doesn't have a business yet
  return children;
}
