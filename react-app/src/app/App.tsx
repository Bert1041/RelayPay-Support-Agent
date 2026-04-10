import { BrowserRouter, Routes, Route } from "react-router-dom";
import VoiceAgentView from "@/features/assistant/components/VoiceAgentView";
import AdminPage from "@/features/admin/pages/AdminPage";
import ErrorPage from "@/shared/components/pages/ErrorPage";
import RuixenMoonChat from "@/features/chat/components/RuixenMoonChat";
import LandingPage from "@/features/home/pages/LandingPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/voice" element={<VoiceAgentView />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/chat" element={<RuixenMoonChat />} />
        {/* Fallback for 404 errors */}
        <Route path="*" element={<ErrorPage />} />
      </Routes>
    </BrowserRouter>
  );
}
