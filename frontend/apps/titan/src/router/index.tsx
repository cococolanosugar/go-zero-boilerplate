import React from "react";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "../contexts/AuthContext";
import { ProjectProvider } from "../contexts/ProjectContext";
import { routes } from "../config/routes";
import { RouteRenderer } from "./RouteRenderer";

export const AppRouter: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ProjectProvider>
          <RouteRenderer routes={routes} />
        </ProjectProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default AppRouter;
