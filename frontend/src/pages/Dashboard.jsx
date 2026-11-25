import {
  FolderKanban,
  FileSearch,
  ShieldCheck,
  AlertTriangle,
  ArrowRight
} from "lucide-react";

import { useNavigate } from "react-router-dom";

const stats = [
  {
    title: "Total Cases",
    value: "00",
    icon: FolderKanban,
    color: "text-blue-400"
  },
  {
    title: "Evidence Files",
    value: "00",
    icon: FileSearch,
    color: "text-purple-400"
  },
  {
    title: "Verified Evidence",
    value: "00",
    icon: ShieldCheck,
    color: "text-green-400"
  },
  {
    title: "Needs Review",
    value: "00",
    icon: AlertTriangle,
    color: "text-orange-400"
  }
];

export default function Dashboard() {
  const navigate = useNavigate();

  return (
    <div className="space-y-8">

      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-slate-400 mt-2">
          Welcome to VERITAS AI Evidence Intelligence System.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">

        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <div key={stat.title}
              className="bg-[#111827] border border-slate-800
              rounded-xl p-6">

              <div className="flex justify-between">
                <p className="text-slate-400">{stat.title}</p>
                <Icon className={stat.color} />
              </div>

              <h2 className="text-3xl font-bold mt-5">
                {stat.value}
              </h2>

            </div>
          );
        })}

      </div>

      <div className="bg-[#111827] border border-slate-800
        rounded-xl p-6">

        <h2 className="text-xl font-semibold">
          Investigation Workspace
        </h2>

        <p className="text-slate-400 mt-2">
          Start an investigation or examine an existing case.
        </p>

        <div className="flex flex-wrap gap-4 mt-6">

          <button
            onClick={() => navigate("/cases")}
            className="bg-blue-600 hover:bg-blue-700
            px-5 py-3 rounded-lg flex items-center gap-2"
          >
            Manage Cases <ArrowRight size={17} />
          </button>

          <button
            onClick={() => navigate("/evidence")}
            className="bg-slate-700 hover:bg-slate-600
            px-5 py-3 rounded-lg"
          >
            Upload Evidence
          </button>

          <button
            onClick={() => navigate("/courtroom")}
            className="bg-purple-700 hover:bg-purple-600
            px-5 py-3 rounded-lg"
          >
            Open AI Courtroom
          </button>

        </div>

      </div>

    </div>
  );
}