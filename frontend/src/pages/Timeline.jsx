
import { useEffect, useState } from "react";
import {
  Clock,
  FileText,
  RefreshCw,
  AlertCircle,
  Activity
} from "lucide-react";

import api from "../services/api";

export default function Timeline() {
  const [cases, setCases] = useState([]);
  const [caseId, setCaseId] = useState("");
  const [events, setEvents] = useState([]);

  const [loadingCases, setLoadingCases] = useState(true);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [error, setError] = useState("");

  // Load cases from backend
  useEffect(() => {
    async function loadCases() {
      try {
        setLoadingCases(true);

        const response = await api.get("/cases");

        const data = Array.isArray(response.data)
          ? response.data
          : [];

        setCases(data);
      } catch (err) {
        console.error("Cases loading error:", err);
        setError("Unable to load cases. Check backend connection.");
      } finally {
        setLoadingCases(false);
      }
    }

    loadCases();
  }, []);

  // Load audit logs for selected case
  async function loadTimeline(id) {
    setCaseId(id);
    setEvents([]);
    setError("");

    if (!id) return;

    try {
      setLoadingEvents(true);

      const response = await api.get(
        `/cases/${id}/audit-logs`
      );

      const data = Array.isArray(response.data)
        ? response.data
        : [];

      setEvents(data);
    } catch (err) {
      console.error("Timeline loading error:", err);

      setError(
        err.response?.data?.detail ||
        "Unable to load audit logs for this case."
      );
    } finally {
      setLoadingEvents(false);
    }
  }

  function formatDate(date) {
    if (!date) return "Date unavailable";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return date;
    }

    return parsedDate.toLocaleString();
  }

  return (
    <div className="space-y-6">

      {/* Page heading */}
      <div>
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-blue-500/10">
            <Clock className="text-blue-400" size={26} />
          </div>

          <div>
            <h1 className="text-3xl font-bold text-white">
              Case Timeline
            </h1>

            <p className="text-slate-400 mt-1">
              Track case activities and audit history.
            </p>
          </div>
        </div>
      </div>

      {/* Case selection */}
      <div className="bg-[#111827] border border-slate-800 rounded-xl p-5">

        <label className="block text-sm text-slate-300 mb-2">
          Select Case
        </label>

        <select
          value={caseId}
          onChange={(e) => loadTimeline(e.target.value)}
          disabled={loadingCases}
          className="bg-slate-900 border border-slate-700
          rounded-lg p-3 w-full text-white outline-none
          focus:border-blue-500 disabled:opacity-50"
        >
          <option value="">
            {loadingCases ? "Loading cases..." : "Select a case"}
          </option>

          {cases.map((c) => (
            <option key={c.id} value={c.id}>
              {c.title || `Case ${c.id}`}
            </option>
          ))}
        </select>

        {!loadingCases && cases.length === 0 && (
          <p className="text-sm text-slate-400 mt-3">
            No cases found. Create a case first.
          </p>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 bg-red-500/10
          border border-red-500/30 rounded-xl p-4">

          <AlertCircle className="text-red-400 shrink-0" />

          <p className="text-red-300 text-sm">{error}</p>
        </div>
      )}

      {/* Loading */}
      {loadingEvents && (
        <div className="flex items-center gap-3 text-blue-400 p-5">
          <RefreshCw className="animate-spin" size={20} />
          Loading case timeline...
        </div>
      )}

      {/* Timeline events */}
      {!loadingEvents && caseId && !error && (
        <div className="bg-[#111827] border border-slate-800
          rounded-xl p-6">

          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Activity className="text-blue-400" />

              <h2 className="text-lg font-semibold text-white">
                Activity History
              </h2>
            </div>

            <span className="text-xs text-slate-400">
              {events.length} events
            </span>
          </div>

          {events.length === 0 ? (
            <div className="text-center py-12">
              <FileText
                size={40}
                className="mx-auto text-slate-600 mb-3"
              />

              <p className="text-slate-300 font-medium">
                No timeline events found
              </p>

              <p className="text-sm text-slate-500 mt-2">
                Activities will appear here when audit logs are recorded.
              </p>
            </div>
          ) : (
            <div className="space-y-6 border-l-2
              border-blue-600 ml-3 pl-6">

              {events.map((event, index) => (
                <div
                  key={event.id ?? index}
                  className="relative"
                >
                  <div className="absolute -left-[33px]
                    top-1 w-4 h-4 bg-blue-500
                    border-4 border-[#111827] rounded-full"
                  />

                  <div className="bg-slate-900 border
                    border-slate-800 rounded-lg p-4">

                    <h3 className="font-semibold text-white">
                      {event.action || "Case Activity"}
                    </h3>

                    <p className="text-sm text-slate-400 mt-2">
                      {typeof event.details === "string"
                        ? event.details
                        : event.details
                          ? JSON.stringify(event.details)
                          : "No additional details available."}
                    </p>

                    <p className="text-xs text-blue-400 mt-3">
                      {formatDate(event.created_at)}
                    </p>

                  </div>
                </div>
              ))}

            </div>
          )}
        </div>
      )}

      {!caseId && !loadingCases && (
        <div className="text-center py-12 bg-[#111827]
          border border-slate-800 rounded-xl">

          <Clock
            size={40}
            className="mx-auto text-slate-600 mb-3"
          />

          <p className="text-slate-300">
            Select a case to view its timeline.
          </p>
        </div>
      )}

    </div>
  );
}
