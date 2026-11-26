
import { useEffect, useRef, useState } from "react";
import {
  Bell,
  Search,
  ShieldCheck,
  UserCircle,
  X,
  FolderKanban,
  FileSearch,
  Clock
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

export default function Header() {
  const navigate = useNavigate();

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [cases, setCases] = useState([]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const headerRef = useRef(null);

  useEffect(() => {
    function closeMenus(event) {
      if (
        headerRef.current &&
        !headerRef.current.contains(event.target)
      ) {
        setNotificationsOpen(false);
        setProfileOpen(false);
      }
    }

    document.addEventListener("mousedown", closeMenus);

    return () => {
      document.removeEventListener("mousedown", closeMenus);
    };
  }, []);

  async function openSearch() {
    setSearchOpen(true);
    setNotificationsOpen(false);
    setProfileOpen(false);

    if (cases.length > 0) return;

    setLoading(true);

    try {
      const response = await api.get("/cases");
      const data = Array.isArray(response.data)
        ? response.data
        : response.data?.cases || [];

      setCases(data);
    } catch (error) {
      console.error("Case search loading failed:", error);
    } finally {
      setLoading(false);
    }
  }

  const filteredCases = cases.filter((item) => {
    const query = searchText.trim().toLowerCase();

    if (!query) return false;

    return (
      String(item.title || "").toLowerCase().includes(query) ||
      String(item.id || "").toLowerCase().includes(query) ||
      `case-${String(item.id)}`.toLowerCase().includes(query)
    );
  });

  function selectCase(id) {
    setSearchOpen(false);
    setSearchText("");
    navigate("/cases");
  }

  return (
    <header
      ref={headerRef}
      className="min-h-16 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 px-4 sm:px-8 py-3 bg-[#0b1120] relative z-40"
    >
      <div>
        <p className="text-sm text-slate-400">
          VERITAS AI / Investigation Workspace
        </p>
      </div>

      <div className="flex items-center gap-4 sm:gap-5">

        <div className="flex items-center gap-2 bg-slate-900 px-3 py-2 rounded-lg">
          <ShieldCheck size={16} className="text-green-400" />
          <span className="text-xs">Local & Secure</span>
        </div>

        {/* Search */}
        <button
          onClick={openSearch}
          title="Search cases"
          className="text-slate-400 hover:text-blue-400 transition"
        >
          <Search size={20} />
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => {
              setNotificationsOpen(!notificationsOpen);
              setProfileOpen(false);
              setSearchOpen(false);
            }}
            title="Notifications"
            className="text-slate-400 hover:text-blue-400 transition"
          >
            <Bell size={20} />
          </button>

          {notificationsOpen && (
            <div className="absolute right-0 top-10 w-72 bg-[#111827] border border-slate-700 rounded-xl shadow-xl p-4">
              <h3 className="font-semibold mb-3">
                Notifications
              </h3>

              <div className="space-y-3 text-sm">
                <div className="flex gap-3">
                  <ShieldCheck size={18} className="text-green-400 shrink-0" />
                  <p className="text-slate-300">
                    Evidence integrity verification is available.
                  </p>
                </div>

                <div className="flex gap-3">
                  <FolderKanban size={18} className="text-blue-400 shrink-0" />
                  <p className="text-slate-300">
                    Manage your investigations from the Cases page.
                  </p>
                </div>

                <div className="flex gap-3">
                  <Clock size={18} className="text-yellow-400 shrink-0" />
                  <p className="text-slate-300">
                    Review pending investigation activities.
                  </p>
                </div>
              </div>

              <p className="text-xs text-slate-500 border-t border-slate-700 mt-4 pt-3">
                General system information. Live alerts are not connected.
              </p>
            </div>
          )}
        </div>

        {/* Guest Profile */}
        <div className="relative">
          <button
            onClick={() => {
              setProfileOpen(!profileOpen);
              setNotificationsOpen(false);
              setSearchOpen(false);
            }}
            title="Profile"
            className="w-9 h-9 rounded-full bg-blue-600 hover:bg-blue-500 flex items-center justify-center font-bold transition"
          >
            V
          </button>

          {profileOpen && (
            <div className="absolute right-0 top-12 w-56 bg-[#111827] border border-slate-700 rounded-xl shadow-xl p-4">
              <div className="flex items-center gap-3 mb-3">
                <UserCircle size={30} className="text-blue-400" />

                <div>
                  <p className="font-semibold text-sm">
                    Guest User
                  </p>
                  <p className="text-xs text-slate-400">
                    Local workspace
                  </p>
                </div>
              </div>

              <div className="border-t border-slate-700 pt-3">
                <button
                  onClick={() => {
                    setProfileOpen(false);
                    navigate("/cases");
                  }}
                  className="w-full text-left text-sm text-slate-300 hover:text-blue-400"
                >
                  View Investigations
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Case Search Panel */}
      {searchOpen && (
        <div className="absolute top-full right-4 sm:right-8 mt-2 w-[min(24rem,calc(100vw-2rem))] bg-[#111827] border border-slate-700 rounded-xl shadow-2xl p-4">
          <div className="flex items-center gap-2 bg-slate-900 rounded-lg px-3">
            <Search size={17} className="text-slate-400" />

            <input
              autoFocus
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
              placeholder="Search cases by title or ID..."
              className="w-full bg-transparent outline-none py-3 text-sm text-white"
            />

            <button
              onClick={() => {
                setSearchOpen(false);
                setSearchText("");
              }}
              className="text-slate-400 hover:text-white"
            >
              <X size={17} />
            </button>
          </div>

          <div className="mt-3 max-h-64 overflow-y-auto">
            {loading && (
              <p className="text-sm text-slate-400 p-2">
                Loading cases...
              </p>
            )}

            {!loading && searchText.trim() && filteredCases.length === 0 && (
              <p className="text-sm text-slate-400 p-2">
                No matching cases found.
              </p>
            )}

            {!loading && filteredCases.map((item) => (
              <button
                key={item.id}
                onClick={() => selectCase(item.id)}
                className="w-full text-left p-3 rounded-lg hover:bg-slate-800 transition"
              >
                <div className="flex items-center gap-2">
                  <FileSearch size={17} className="text-blue-400" />
                  <span className="text-sm font-medium text-white">
                    {item.title || "Untitled Case"}
                  </span>
                </div>

                <p className="text-xs text-slate-400 mt-1 ml-6">
                  CASE-{String(item.id).padStart(3, "0")}
                </p>
              </button>
            ))}

            {!loading && !searchText.trim() && (
              <p className="text-xs text-slate-500 p-2">
                Enter a case title or case ID to search.
              </p>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
