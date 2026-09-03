import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./AuthContext";
import LoginPage from "./pages/LoginPage";
import AgencyHomePage from "./pages/AgencyHomePage";
import AgencyProfilePage from "./pages/AgencyProfilePage";
import AgencyBusinessesPage from "./pages/AgencyBusinessesPage";
import AgencyAgentsPage from "./pages/AgencyAgentsPage";
import AgencyBusinessDetail from "./pages/AgencyBusinessDetail";
import AgencyBusinessProfile from "./pages/AgencyBusinessProfile";
import AgencyBotConfig from "./pages/AgencyBotConfig";
import AgencyConfigPage from "./pages/AgencyConfigPage";
import AgencyCallsPage from "./pages/AgencyCallsPage";
import AgencyCallDetail from "./pages/AgencyCallDetail";
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
          <Route path="/agencia/perfil" element={<AgencyProfilePage />} />
          <Route path="/agencia/negocios" element={<AgencyBusinessesPage />} />
          <Route path="/agencia/agentes" element={<AgencyAgentsPage />} />
          <Route path="/agencia/registros" element={<AgencyCallsPage />} />
          <Route path="/agencia/registros/:callId" element={<AgencyCallDetail />} />
          <Route path="/agencia/configuracion" element={<AgencyConfigPage />} />
          <Route path="/agencia/negocios/:id" element={<AgencyBusinessDetail />} />
          <Route path="/agencia/negocios/:id/perfil" element={<AgencyBusinessProfile />} />
          <Route path="/agencia/negocios/:id/bot" element={<AgencyBotConfig />} />
          <Route path="/negocio" element={<BusinessDashboard />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
