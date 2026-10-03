import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ToastProvider } from "./contexts/ToastContext";
import CreateLink from "./pages/CreateLink";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import LinkDetails from "./pages/LinkDetails";

function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <div className="bg-zinc-950 min-h-screen text-white font-sans selection:bg-blue-600 selection:text-white">
          <Routes>
            <Route path="/" element={<CreateLink />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/links/:shortUrl" element={<LinkDetails />} />
          </Routes>
        </div>
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;
