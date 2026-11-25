
import { useEffect, useState } from "react";
import {
  FolderKanban,
  FileSearch,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  Clock,
  Activity,
  Scale,
  Network
} from "lucide-react";

import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const navigate = useNavigate();

  const [cases, setCases] = useState([]);
  const [evidence, setEvidence] = useState([]);

  useEffect(() => {
    function loadDashboardData() {
      try {
        const savedCases = JSON.parse(
          localStorage.getItem("veritas_demo_cases") || "[]"
        );

        const savedEvidence = JSON.parse(
          localStorage.getItem("veritas_demo_evidence") || "[]"
        );

        setCases(Array.isArray(savedCases) ? savedCases : []);
        setEvidence(Array.isArray(savedEvidence) ? savedEvidence : []);
      } catch {
        setCases([]);
        setEvidence([]);
      }
    }

    loadDashboardData();

    window.addEventListener("focus", loadDashboardData);

    return () => {
      window.removeEventListener("focus", loadDashboardData);
    };
  }, []);

  const stats = [
    {
      title: "Total Cases",
      value: cases.length,
      icon: FolderKanban,
      color: "text-blue-400",
      bg: "bg-blue-500/10"
    },
    {
      title: "Evidence Files",
      value: evidence.length,
      icon: FileSearch,
      color: "text-purple-400",
      bg: "bg-purple-500/10"
    },
    {
      title: "Verified Evidence",
      value: evidence.filter(item => item.status === "Verified").length,
      icon: ShieldCheck,
      color: "text-green-400",
      bg: "bg-green-500/10"
    },
    {
      title: "Needs Review",
      value: cases.filter(item => item.status === "Pending Review").length,
      icon: AlertTriangle,
      color: "text-orange-400",
      bg: "bg-orange-500/10"
    }
  ];

  const recentCases = [...cases]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 4);

  const quickActions = [
    {
      title: "Manage Cases",
      description: "Create and review investigations",
      icon: FolderKanban,
      color: "text-blue-400",
      path: "/cases"
    },
    {
      title: "Upload Evidence",
      description: "Add files to investigations",
      icon: FileSearch,
      color: "text-purple-400",
      path: "/evidence"
    },
    {
      title: "Evidence Graph",
      description: "Explore evidence connections",
      icon: Network,
      color: "text-cyan-400",
      path: "/graph"
    },
    {
      title: "AI Courtroom",
      description: "Examine different AI perspectives",
      icon: Scale,
      color: "text-pink-400",
      path: "/courtroom"
    }
  ];

  return (
    <div className="space-y-8">

      {/* Welcome */}
      <div>
        <p className="text-blue-400 text-sm font-semibold tracking-wider">
          VERITAS AI / COMMAND CENTRE
        </p>

        <h1 className="text-3xl font-bold mt-2">
          Investigation Dashboard
        </h1>

        <p className="text-slate-400 mt-2">
          Monitor investigations, evidence and intelligence activities.
        </p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">

        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <div
              key={stat.title}
              className="bg-[#111827] border border-slate-800 rounded-xl p-6 hover:border-slate-600 transition"
            >
              <div className="flex justify-between items-center">
                <p className="text-slate-400 text-sm">
                  {stat.title}
                </p>

                <div className={`p-3 rounded-lg ${stat.bg}`}>
                  <Icon className={stat.color} size={22} />
                </div>
              </div>

              <h2 className="text-3xl font-bold mt-5">
                {stat.value.toString().padStart(2, "0")}
              </h2>
            </div>
          );
        })}

      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold mb-4">
          Investigation Workspace
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

          {quickActions.map((action) => {
            const Icon = action.icon;

            return (
              <button
                key={action.title}
                onClick={() => navigate(action.path)}
                className="bg-[#111827] border border-slate-800 rounded-xl p-5 text-left hover:border-blue-500 transition group"
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <Icon className={action.color} size={24} />

                    <div>
                      <h3 className="font-semibold">
                        {action.title}
                      </h3>

                      <p className="text-sm text-slate-400 mt-1">
                        {action.description}
                      </p>
                    </div>
                  </div>

                  <ArrowRight
                    size={18}
                    className="text-slate-500 group-hover:text-blue-400 transition"
                  />
                </div>
              </button>
            );
          })}

        </div>
      </div>

      {/* Recent Cases */}
      <div className="bg-[#111827] border border-slate-800 rounded-xl p-6">

        <div className="flex justify-between items-center mb-5">
          <div>
            <h2 className="text-xl font-semibold">
              Recent Investigations
            </h2>

            <p className="text-sm text-slate-400 mt-1">
              Your latest investigation records
            </p>
          </div>

          <button
            onClick={() => navigate("/cases")}
            className="text-blue-400 text-sm hover:text-blue-300"
          >
            View All
          </button>
        </div>

        <div className="space-y-3">

          {recentCases.map(item => (
            <div
              key={item.id}
              className="flex flex-wrap justify-between items-center gap-3 border-b border-slate-800 last:border-0 pb-4 last:pb-0"
            >
              <div>
                <p className="font-medium">
                  {item.title}
                </p>

                <p className="text-xs text-slate-500 mt-1">
                  {item.id} · {item.date}
                </p>
              </div>

              <span className={`text-xs px-3 py-1 rounded-full ${
                item.status === "Completed"
                  ? "bg-green-500/10 text-green-400"
                  : item.status === "Pending Review"
                  ? "bg-orange-500/10 text-orange-400"
                  : "bg-blue-500/10 text-blue-400"
              }`}>
                {item.status}
              </span>
            </div>
          ))}

          {recentCases.length === 0 && (
            <p className="text-slate-400 text-sm py-5 text-center">
              No investigations yet. Create your first case to get started.
            </p>
          )}

        </div>
      </div>

      {/* System Status */}
      <div className="bg-[#111827] border border-slate-800 rounded-xl p-6">

        <div className="flex items-center gap-2 mb-4">
          <Activity className="text-green-400" size={21} />

          <h2 className="text-xl font-semibold">
            System Overview
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

          <div className="flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-green-400"></span>
            <span className="text-sm text-slate-300">
              Frontend modules operational
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-yellow-400"></span>
            <span className="text-sm text-slate-300">
              Backend integration pending
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-blue-400"></span>
            <span className="text-sm text-slate-300">
              Demo data stored locally
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-yellow-400"></span>
            <span className="text-sm text-slate-300">
              Evidence verification pending
            </span>
          </div>

        </div>

        <p className="text-xs text-slate-500 mt-5">
          Demo environment. Backend connectivity and actual evidence verification are not yet confirmed.
        </p>

      </div>

    </div>
  );
}
