import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { getToken } from "@zero/api";

export const AuthGuard: React.FC = () => {
  const token = getToken();
  const location = useLocation();

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
};