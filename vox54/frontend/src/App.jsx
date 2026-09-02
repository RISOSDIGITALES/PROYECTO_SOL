import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./AuthContext";
import LoginPage from "./pages/LoginPage";
import AgencyHomePage from "./pages/AgencyHomePage";
import AgencyBusinessesPage from "./pages/AgencyBusinessesPage";
import AgencyAgentsPage from "./pages/AgencyAgentsPage";
import AgencyBusinessDetail from "./pages/AgencyBusinessDetail";
import AgencyBotConfig from "./pages/AgencyBotConfig";
import AgencyConfigPage from "./pages/AgencyConfigPage";
import BusinessDashboard from "./pages/BusinessDashboard";
import NotFoundPage from "./pages/NotFoundPage";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/agencia/login" replace />} />
          <Route path="/agencia/login" element={<LoginPage role="agency" />} />
          <Route path="/negocio/login" element={<LoginPage role="business" />} />
          <Route path="/agencia" element={<AgencyHomePage />} />
          <Route path="/agencia/negocios" element={<AgencyBusinessesPage />} />
          <Route path="/agencia/agentes" element={<AgencyAgentsPage />} />
          <Route path="/agencia/configuracion" element={<AgencyConfigPage />} />
          <Route path="/agencia/negocios/:id" element={<AgencyBusinessDetail />} />
          <Route path="/agencia/negocios/:id/bot" element={<AgencyBotConfig />} />
          <Route path="/negocio" element={<BusinessDashboard />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
