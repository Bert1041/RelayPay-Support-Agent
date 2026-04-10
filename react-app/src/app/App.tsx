import { BrowserRouter, Routes, Route } from "react-router-dom";
import VoiceAgentView from "@/features/assistant/components/VoiceAgentView";
import AdminPage from "@/features/admin/pages/AdminPage";
import ErrorPage from "@/shared/components/pages/ErrorPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<VoiceAgentView />} />
        <Route path="/admin" element={<AdminPage />} />
        {/* Fallback for 404 errors */}
        <Route path="*" element={<ErrorPage />} />
      </Routes>
    </BrowserRouter>
  );
}
