import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: "admin" | "user" | "moderator";
}

const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    // Redirect to home with the attempted location
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  if (requiredRole && user.role !== requiredRole) {
    // User doesn't have required role
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
