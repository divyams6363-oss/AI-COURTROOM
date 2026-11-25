import { Bell, Search, ShieldCheck } from "lucide-react";

export default function Header() {
  return (
    <header className="h-16 border-b border-slate-800
      flex items-center justify-between px-8 bg-[#0b1120]">

      <div>
        <p className="text-sm text-slate-400">
          VERITAS AI / Investigation Workspace
        </p>
      </div>

      <div className="flex items-center gap-5">

        <div className="flex items-center gap-2
          bg-slate-900 px-3 py-2 rounded-lg">
          <ShieldCheck size={16} className="text-green-400" />
          <span className="text-xs">Local & Secure</span>
        </div>

        <Search size={19} className="text-slate-400" />
        <Bell size={19} className="text-slate-400" />

        <div className="w-9 h-9 rounded-full bg-blue-600
          flex items-center justify-center font-bold">
          V
        </div>

      </div>
    </header>
  );
}