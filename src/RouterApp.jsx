// src/RouterApp.jsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import App from "./App.jsx"; // ✅ seu onboarding (fica intacto)
import Dashboard from "./pages/Dashboard.jsx";
import Analises from "./pages/Analises.jsx";

export default function RouterApp() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ✅ Aluno: onboarding atual */}
        <Route path="/" element={<App />} />

        {/* ✅ Você: painel */}
        <Route path="/admin" element={<Dashboard />} />

        {/* ✅ Você: análises/personas */}
        <Route path="/analises" element={<Analises />} />

        {/* fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
