import { Routes, Route } from "react-router-dom";
import { AppProvider } from "./context/AppContext";
import AuthGate from "./components/AuthGate";
import AppShell from "./components/AppShell";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import ScheduleGenerator from "./pages/ScheduleGenerator";
import StressTest from "./pages/StressTest";
import EmployeeView from "./pages/EmployeeView";
import DispatchGate from "./pages/DispatchGate";
import Settings from "./pages/Settings";
import Archive from "./pages/Archive";

export default function App() {
  return (
    <AppProvider>
      <Routes>
        {/* ── Public routes — no auth required, no AppShell ── */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />

        {/* ── Protected routes — auth required, inside AppShell ── */}
        <Route element={<AuthGate><AppShell /></AuthGate>}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/schedule" element={<ScheduleGenerator />} />
          <Route path="/stress-test" element={<StressTest />} />
          <Route path="/employee" element={<EmployeeView />} />
          <Route path="/dispatch" element={<DispatchGate />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/archive" element={<Archive />} />
        </Route>
      </Routes>
    </AppProvider>
  );
}