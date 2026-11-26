
import { useCallback, useEffect, useState } from "react";
import {
  FolderKanban,
  FileSearch,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  Clock,
  Activity,
  Scale,
  Network,
  RefreshCw,
  Wifi,
  WifiOff
} from "lucide-react";

import { useNavigate } from "react-router-dom";
import api from "../services/api";

const readLocalData = (key) => {
  try {
    const data = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
};

const getDate = (item) =>
  item.created_at || item.date || item.uploaded_at || "";

const formatDate = (date) => {
  if (!date) return "Date unavailable";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) return "Date unavailable";

  return parsed.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
};

const getCaseStatus = (item) =>
  item.status || item.case_status || "Under Investigation";

export default function Dashboard() {
  const navigate = useNavigate();

  const [cases, setCases] = useState([]);
  const [evidence, setEvidence] = useState([]);
  const [verifiedCount, setVerifiedCount] = useState(0);

  const [backendOnline, setBackendOnline] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dataSource, setDataSource] = useState("Connecting...");
  const [lastUpdated, setLastUpdated] = useState("");
  const [error, setError] = useState("");

  const loadDashboardData = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");

    try {
      // Check backend connectivity
      await api.get("/health");
      setBackendOnline(true);

      // Fetch all cases
      const casesResponse = await api.get("/cases");

      const backendCases = Array.isArray(casesResponse.data)
        ? casesResponse.data
        : casesResponse.data?.cases || [];

      setCases(backendCases);
      setDataSource("Live backend data");

      // Fetch evidence for every case
      const evidenceResults = await Promise.allSettled(
        backendCases.map(async (caseItem) => {
          const response = await api.get(
            `/cases/${caseItem.id}/evidence`
          );

          const files = Array.isArray(response.data)
            ? response.data
            : response.data?.evidence || [];

          return files;
        })
      );

      const allEvidence = [];

      evidenceResults.forEach((result) => {
        if (result.status === "fulfilled") {
          allEvidence.push(...result.value);
        }
      });

      setEvidence(allEvidence);

      // Verify evidence integrity
      const integrityResults = await Promise.allSettled(
        allEvidence.map(async (file) => {
          const response = await api.get(
            `/evidence/${file.id}/integrity`
          );

          return response.data;
        })
      );

      const verifiedFiles = integrityResults.filter((result) => {
        if (result.status !== "fulfilled") return false;

        const resultData = result.value;

        return (
          resultData?.verified === true ||
          String(resultData?.status || "").toLowerCase() === "verified"
        );
      });

      setVerifiedCount(verifiedFiles.length);

      // Report partial loading problems without losing available data
      if (
        evidenceResults.some((result) => result.status === "rejected")
      ) {
        setError("Some evidence records could not be loaded.");
      } else if (
        integrityResults.some((result) => result.status === "rejected")
      ) {
        setError("Some evidence integrity checks could not be completed.");
      }

      setLastUpdated(new Date().toLocaleTimeString("en-IN"));
    } catch (err) {
      console.error("Dashboard loading error:", err);

      setBackendOnline(false);

      // Use local demo data only when backend is unavailable
      const localCases = readLocalData("veritas_demo_cases");
      const localEvidence = readLocalData("veritas_demo_evidence");

      setCases(localCases);
      setEvidence(localEvidence);

      setVerifiedCount(
        localEvidence.filter(
          (item) =>
            String(item.status || "").toLowerCase() === "verified"
        ).length
      );

      setDataSource("Local demo data");

      setError(
        "Backend is unavailable. Showing locally saved demo data."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();

    const handleFocus = () => {
      loadDashboardData(true);
    };

    window.addEventListener("focus", handleFocus);

    return () => {
      window.removeEventListener("focus", handleFocus);
    };
  }, [loadDashboardData]);

  // Statistics
  const needsReview = cases.filter((item) => {
    const status = getCaseStatus(item).toLowerCase();

    return (
      status === "pending review" ||
      status === "needs review" ||
      status === "review required"
    );
  }).length;

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
      value: verifiedCount,
      icon: ShieldCheck,
      color: "text-green-400",
      bg: "bg-green-500/10"
    },
    {
      title: "Needs Review",
      value: needsReview,
      icon: AlertTriangle,
      color: "text-orange-400",
      bg: "bg-orange-500/10"
    }
  ];

  // Recent cases
  const recentCases = [...cases]
    .sort((a, b) => {
      const dateA = new Date(getDate(a) || 0).getTime();
      const dateB = new Date(getDate(b) || 0).getTime();

      return dateB - dateA;
    })
    .slice(0, 4);

  // Quick actions
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
      description: "Examine different investigative perspectives",
      icon: Scale,
      color: "text-pink-400",
      path: "/courtroom"
    }
  ];

  const getStatusStyle = (status) => {
    const value = status.toLowerCase();

    if (value === "completed") {
      return "bg-green-500/10 text-green-400";
    }

    if (
      value === "pending review" ||
      value === "needs review" ||
      value === "review required"
    ) {
      return "bg-orange-500/10 text-orange-400";
    }

    return "bg-blue-500/10 text-blue-400";
  };

  return (
    <div className="space-y-8">

      {/* Welcome */}
      <div className="flex flex-wrap justify-between items-start gap-4">
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

        <button
          onClick={() => loadDashboardData(true)}
          disabled={refreshing || loading}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-700 text-slate-300 hover:border-blue-500 hover:text-blue-400 transition disabled:opacity-50"
        >
          <RefreshCw
            size={16}
            className={refreshing ? "animate-spin" : ""}
          />
          Refresh
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="bg-[#111827] border border-slate-800 rounded-xl p-5 text-center">
          <RefreshCw
            size={22}
            className="animate-spin text-blue-400 mx-auto mb-2"
          />
          <p className="text-sm text-slate-400">
            Loading investigation data...
          </p>
        </div>
      )}

      {/* Error / fallback notice */}
      {error && (
        <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle
              size={19}
              className="text-orange-400 mt-0.5"
            />

            <p className="text-sm text-orange-300">
              {error}
            </p>
          </div>
        </div>
      )}

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
                {loading ? "--" : String(stat.value).padStart(2, "0")}
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

        <div className="flex flex-wrap justify-between items-center gap-3 mb-5">
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

          {recentCases.map((item) => {
            const status = getCaseStatus(item);

            return (
              <div
                key={item.id}
                className="flex flex-wrap justify-between items-center gap-3 border-b border-slate-800 last:border-0 pb-4 last:pb-0"
              >
                <div>
                  <p className="font-medium">
                    {item.title || "Untitled Investigation"}
                  </p>

                  <p className="text-xs text-slate-500 mt-1">
                    CASE-{item.id} · {formatDate(getDate(item))}
                  </p>
                </div>

                <span
                  className={`text-xs px-3 py-1 rounded-full ${getStatusStyle(status)}`}
                >
                  {status}
                </span>
              </div>
            );
          })}

          {!loading && recentCases.length === 0 && (
            <div className="py-8 text-center">
              <FolderKanban
                size={30}
                className="text-slate-600 mx-auto mb-3"
              />

              <p className="text-slate-400 text-sm">
                No investigations yet.
              </p>

              <button
                onClick={() => navigate("/cases")}
                className="text-blue-400 text-sm mt-3 hover:text-blue-300"
              >
                Create your first case
              </button>
            </div>
          )}

        </div>
      </div>

      {/* System Status */}
      <div className="bg-[#111827] border border-slate-800 rounded-xl p-6">

        <div className="flex flex-wrap justify-between items-center gap-3 mb-5">
          <div className="flex items-center gap-2">
            <Activity className="text-green-400" size={21} />

            <h2 className="text-xl font-semibold">
              System Overview
            </h2>
          </div>

          <span className="text-xs text-slate-500">
            {lastUpdated ? `Updated at ${lastUpdated}` : "Not updated yet"}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

          <div className="flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-green-400"></span>

            <span className="text-sm text-slate-300">
              Frontend modules operational
            </span>
          </div>

          <div className="flex items-center gap-3">
            {backendOnline ? (
              <Wifi className="text-green-400" size={17} />
            ) : (
              <WifiOff className="text-red-400" size={17} />
            )}

            <span className="text-sm text-slate-300">
              Backend: {backendOnline ? "Connected" : "Disconnected"}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <FileSearch className="text-purple-400" size={17} />

            <span className="text-sm text-slate-300">
              Data source: {dataSource}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <ShieldCheck className="text-blue-400" size={17} />

            <span className="text-sm text-slate-300">
              Integrity checks: {verifiedCount} verified
            </span>
          </div>

        </div>

        <div className="border-t border-slate-800 mt-5 pt-4 flex items-center gap-2">
          <Clock size={15} className="text-slate-500" />

          <p className="text-xs text-slate-500">
            Dashboard statistics are based on available backend records.
            Failed integrity checks are not counted as verified.
          </p>
        </div>

      </div>

    </div>
  );
}
