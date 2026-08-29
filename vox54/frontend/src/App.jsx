import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./AuthContext";
import LoginPage from "./pages/LoginPage";
import AgencyDashboard from "./pages/AgencyDashboard";
import AgencyBusinessDetail from "./pages/AgencyBusinessDetail";
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
          <Route path="/agencia" element={<AgencyDashboard />} />
          <Route path="/agencia/negocios/:id" element={<AgencyBusinessDetail />} />
          <Route path="/negocio" element={<BusinessDashboard />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
