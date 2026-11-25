
import { useEffect, useState } from "react";
import {
  CalendarDays,
  FileText,
  Clock,
  AlertCircle,
  RefreshCw
} from "lucide-react";

import api from "../services/api";

export default function Timeline() {
  const [cases, setCases] = useState([]);
  const [caseId, setCaseId] = useState("");
  const [events, setEvents] = useState([]);
  const [message, setMessage] = useState("");
  const [loadingCases, setLoadingCases] = useState(true);
  const [loadingTimeline, setLoadingTimeline] = useState(false);

  // Load available cases
  useEffect(() => {
    async function loadCases() {
      try {
        const response = await api.get("/cases");
        setCases(response.data);
        setMessage("");
      } catch (error) {
        console.error("Case loading error:", error);
        setMessage("Unable to load cases. Check backend connection.");
      } finally {
        setLoadingCases(false);
      }
    }

    loadCases();
  }, []);

  // Load timeline for selected case
  async function loadTimeline(id) {
    setCaseId(id);
    setEvents([]);
    setMessage("");

    if (!id) return;

    setLoadingTimeline(true);

    try {
      const response = await api.get(
        `/cases/${id}/timeline`
      );

      const timeline = response.data.timeline || [];

      // Sort events chronologically
      const sortedEvents = [...timeline].sort(
        (a, b) =>
          new Date(a.date) - new Date(b.date)
      );

      setEvents(sortedEvents);

      if (sortedEvents.length === 0) {
        setMessage(
          "No dates found in uploaded evidence. Upload documents containing dates."
        );
      }

    } catch (error) {
      console.error("Timeline loading error:", error);
      setMessage("Unable to load timeline. Please try again.");
    } finally {
      setLoadingTimeline(false);
    }
  }

  // Format date for display
  function formatDate(date) {
    if (!date) return "Unknown date";

    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) {
      return date;
    }

    return parsed.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "long",
      year: "numeric"
    });
  }

  return (
    <div className="space-y-6">

      {/* Page Header */}
      <div>
        <div className="flex items-center gap-3">
          <CalendarDays
            size={30}
            className="text-blue-400"
          />

          <h1 className="text-3xl font-bold">
            Case Timeline
          </h1>
        </div>

        <p className="text-slate-400 mt-2">
          Chronological events extracted from uploaded evidence.
        </p>
      </div>

      {/* Case Selection */}
      <div className="bg-[#111827] border border-slate-800
        rounded-xl p-5 space-y-3">

        <label className="font-semibold text-slate-300">
          Select Investigation Case
        </label>

        <select
          value={caseId}
          onChange={e => loadTimeline(e.target.value)}
          disabled={loadingCases}
          className="bg-slate-900 border border-slate-700
          rounded-lg p-3 w-full outline-none
          focus:border-blue-500"
        >
          <option value="">
            {loadingCases
              ? "Loading cases..."
              : "Select a case"}
          </option>

          {cases.map(c => (
            <option key={c.id} value={c.id}>
              {c.title}
            </option>
          ))}
        </select>

      </div>

      {/* Timeline Summary */}
      {caseId && !loadingTimeline && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          <div className="bg-[#111827] border border-slate-800
            rounded-xl p-5">

            <p className="text-slate-400 text-sm">
              Total Events
            </p>

            <h2 className="text-3xl font-bold mt-2">
              {events.length}
            </h2>

          </div>

          <div className="bg-[#111827] border border-slate-800
            rounded-xl p-5">

            <p className="text-slate-400 text-sm">
              Selected Case
            </p>

            <h2 className="text-xl font-bold mt-2">
              {cases.find(c => String(c.id) === String(caseId))?.title
                || `Case ${caseId}`}
            </h2>

          </div>

        </div>
      )}

      {/* Loading State */}
      {loadingTimeline && (
        <div className="bg-[#111827] border border-slate-800
          rounded-xl p-8 text-center">

          <RefreshCw
            className="animate-spin text-blue-400 mx-auto"
            size={30}
          />

          <p className="text-slate-400 mt-3">
            Extracting chronological events...
          </p>

        </div>
      )}

      {/* Message */}
      {message && (
        <div className="bg-[#111827] border border-slate-800
          rounded-xl p-5 flex items-center gap-3">

          <AlertCircle
            className="text-orange-400 shrink-0"
            size={22}
          />

          <p className="text-slate-300">
            {message}
          </p>

        </div>
      )}

      {/* Timeline Events */}
      {!loadingTimeline && events.length > 0 && (
        <div className="bg-[#111827] border border-slate-800
          rounded-xl p-6">

          <h2 className="text-xl font-semibold mb-8">
            Extracted Evidence Events
          </h2>

          <div className="space-y-8 border-l-2
            border-blue-600 ml-3 pl-7">

            {events.map((event, index) => (
              <div
                key={event.id || `${event.evidence_id}-${event.date}-${index}`}
                className="relative"
              >

                {/* Timeline Marker */}
                <div className="absolute -left-[37px]
                  top-1 w-5 h-5 rounded-full
                  bg-blue-500 border-4
                  border-[#111827]"
                />

                {/* Event Card */}
                <div className="bg-slate-900 border
                  border-slate-700 rounded-xl p-5
                  hover:border-blue-500 transition">

                  <div className="flex flex-wrap
                    items-center justify-between gap-3">

                    <h3 className="font-bold text-lg
                      text-white">
                      {event.original_date || formatDate(event.date)}
                    </h3>

                    <span className="text-xs
                      text-blue-400 flex items-center gap-1">
                      <Clock size={14} />
                      {formatDate(event.date)}
                    </span>

                  </div>

                  <p className="text-slate-300
                    text-sm mt-4 leading-relaxed">
                    {event.description || "No event description available."}
                  </p>

                  <div className="border-t
                    border-slate-700 mt-4 pt-4
                    space-y-2">

                    <div className="flex items-center
                      gap-2 text-sm text-slate-400">

                      <FileText
                        size={16}
                        className="text-blue-400"
                      />

                      <span>
                        Source: {event.filename || "Unknown file"}
                      </span>

                    </div>

                    <p className="text-xs text-slate-500">
                      Evidence ID: {event.evidence_id || "Unavailable"}
                    </p>

                  </div>

                </div>

              </div>
            ))}

          </div>

        </div>
      )}

      {/* Initial State */}
      {!caseId && !loadingCases && !message && (
        <div className="bg-[#111827] border border-slate-800
          rounded-xl p-10 text-center">

          <CalendarDays
            size={45}
            className="text-slate-500 mx-auto"
          />

          <h2 className="text-xl font-semibold mt-4">
            No Case Selected
          </h2>

          <p className="text-slate-400 mt-2">
            Select a case above to view its evidence timeline.
          </p>

        </div>
      )}

    </div>
  );
}
