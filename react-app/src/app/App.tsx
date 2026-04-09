import { BrowserRouter, Routes, Route } from "react-router-dom";
import VoiceAgentView from "@/features/assistant/components/VoiceAgentView";
import ErrorPage from "@/shared/components/pages/ErrorPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<VoiceAgentView />} />
        {/* Fallback for 404 errors */}
        <Route path="*" element={<ErrorPage />} />
      </Routes>
    </BrowserRouter>
  );
}
