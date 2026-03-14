import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom';
import ChatPage from './pages/ChatPage';

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-white relative">
        <Routes>
          <Route path="/" element={<Navigate to="/chat" replace />} />
          <Route path="/chat" element={<ChatPage />} />
          {/* Other routes can be added back if needed, but keeping simple for now */}
        </Routes>
      </div>
    </BrowserRouter>
  );
}
