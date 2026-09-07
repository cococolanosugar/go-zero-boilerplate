import React from "react";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "../contexts/AuthContext";
import { routes } from "../config/routes";
import { RouteRenderer } from "./RouteRenderer";

export const AppRouter: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <RouteRenderer routes={routes} />
      </AuthProvider>
    </BrowserRouter>
  );
};

export default AppRouter;