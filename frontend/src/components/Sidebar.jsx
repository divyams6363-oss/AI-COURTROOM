
import { NavLink } from "react-router-dom";

import {
  LayoutDashboard,
  FolderKanban,
  FileSearch,
  Clock,
  Network,
  Scale,
  FileText,
  ShieldCheck
} from "lucide-react";

const menu = [
  { name: "Dashboard", path: "/", icon: LayoutDashboard },
  { name: "Cases", path: "/cases", icon: FolderKanban },
  { name: "Evidence", path: "/evidence", icon: FileSearch },
  { name: "Timeline", path: "/timeline", icon: Clock },
  { name: "Evidence Graph", path: "/graph", icon: Network },
  { name: "AI Courtroom", path: "/courtroom", icon: Scale },
  { name: "Reports", path: "/reports", icon: FileText }
];

export default function Sidebar() {
  return (
    <aside className="w-64 min-h-screen bg-[#111827] border-r border-slate-800 p-5">

      <div className="flex items-center gap-3 mb-10">
        <div className="bg-blue-600 p-2 rounded-xl">
          <ShieldCheck size={25} />
        </div>

        <div>
          <h1 className="font-bold text-xl">VERITAS AI</h1>
          <p className="text-xs text-slate-400">
            Evidence Intelligence
          </p>
        </div>
      </div>

      <p className="text-xs text-slate-500 mb-4">
        MAIN MENU
      </p>

      <nav className="space-y-2">
        {menu.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/"}
              className={({ isActive }) =>
                `flex items-center gap-3 p-3 rounded-lg transition ${
                  isActive
                    ? "bg-blue-600 text-white"
                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                }`
              }
            >
              <Icon size={19} />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="mt-12 p-3 rounded-lg bg-slate-800">
        <p className="text-sm font-semibold">Offline Mode</p>
        <p className="text-xs text-green-400 mt-1">
          Local application
        </p>
      </div>

    </aside>
  );
}
