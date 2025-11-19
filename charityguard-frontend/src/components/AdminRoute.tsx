import React from "react";
import { Navigate } from "react-router-dom";
import { useAdminAuth } from "../hooks/useAdminAuth";

const AdminRoute: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const { isAdmin } = useAdminAuth();
  return isAdmin ? <>{children}</> : <Navigate to="/admin/login" replace />;
};

export default AdminRoute;
