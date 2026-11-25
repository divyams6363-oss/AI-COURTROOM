
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Sidebar from "./components/Sidebar";
import Header from "./components/Header";

import Dashboard from "./pages/Dashboard";
import Cases from "./pages/Cases";
import Evidence from "./pages/Evidence";
import Timeline from "./pages/Timeline";
import Graph from "./pages/Graph";
import Courtroom from "./pages/Courtroom";
import Reports from "./pages/Reports";

function Layout() {
  return (
    <div className="flex min-h-screen">

      <Sidebar />

      <div className="flex-1 min-w-0">
        <Header />

        <main className="p-8">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/cases" element={<Cases />} />
            <Route path="/evidence" element={<Evidence />} />
            <Route path="/timeline" element={<Timeline />} />
            <Route path="/graph" element={<Graph />} />
            <Route path="/courtroom" element={<Courtroom />} />
            <Route path="/reports" element={<Reports />} />
          </Routes>
        </main>
      </div>

    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Layout />
    </BrowserRouter>
  );
}
