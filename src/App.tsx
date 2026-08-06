import { Routes, Route } from "react-router-dom";
import { AppProvider } from "./context/AppContext";
import Header from "./components/Header";
import Dashboard from "./pages/Dashboard";
import ScheduleGenerator from "./pages/ScheduleGenerator";
import StressTest from "./pages/StressTest";
import Archive from "./pages/Archive";

export default function App() {
  return (
    <AppProvider>
      <div className="min-h-screen bg-dotgrid-glow">
        <Header />
        <main className="mx-auto max-w-6xl px-4 py-6">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/schedule" element={<ScheduleGenerator />} />
            <Route path="/stress-test" element={<StressTest />} />
            <Route path="/archive" element={<Archive />} />
          </Routes>
        </main>
      </div>
    </AppProvider>
  );
}