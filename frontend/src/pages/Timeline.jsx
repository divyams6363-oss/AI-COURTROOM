import { useEffect, useState } from "react";
import api from "../services/api";
import { CalendarDays } from "lucide-react";

export default function Timeline() {
  const [cases, setCases] = useState([]);
  const [caseId, setCaseId] = useState("");
  const [events, setEvents] = useState([]);
  const [message, setMessage] = useState("");
  const [loadingCases, setLoadingCases] = useState(true);
  const [loadingTimeline, setLoadingTimeline] = useState(false);

  useEffect(() => {
    api.get("/cases")
      .then((res) => setCases(Array.isArray(res.data) ? res.data : []))
      .catch((error) => {
        console.error(error);
        setMessage("Unable to load cases.");
      })
      .finally(() => setLoadingCases(false));
  }, []);

  async function loadTimeline(id) {
    setCaseId(id);
    setEvents([]);
    setMessage("");

    if (!id) return;

    setLoadingTimeline(true);

    try {
      const response = await api.get(`/cases/${id}/timeline`);
      setEvents(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error(error);
      setMessage("Unable to load timeline.");
    } finally {
      setLoadingTimeline(false);
    }
  }

  return (
    <div className="space-y-6">

      <div>
        <h1 className="text-3xl font-bold">Case Timeline</h1>
        <p className="text-slate-400 mt-2">
          View the chronological events associated with a case.
        </p>
      </div>

      {/* Case Selection */}
      <div className="bg-[#111827] border border-slate-800 rounded-xl p-4">
        <label className="text-sm text-slate-400">
          Select Case
        </label>

        <select
          value={caseId}
          onChange={(e) => loadTimeline(e.target.value)}
          className="bg-slate-900 border border-slate-700 rounded-lg p-3 w-full mt-2"
        >
          <option value="">Select a case</option>

          {cases.map((c) => (
            <option key={c.id} value={c.id}>
              {c.title}
            </option>
          ))}
        </select>
      </div>

      {/* Error Message */}
      {message && (
        <p className="text-red-400">{message}</p>
      )}

      {/* Loading Timeline */}
      {loadingTimeline && (
        <p className="text-slate-400">
          Loading timeline...
        </p>
      )}

      {/* Timeline Events */}
      {!loadingTimeline && caseId && events.length > 0 && (
        <div className="space-y-5 border-l-2 border-blue-600 ml-4 pl-6">

          {events.map((event, index) => (
            <div key={event.id ?? index} className="relative">

              <div className="absolute -left-[33px] w-4 h-4 bg-blue-500 rounded-full" />

              <div className="bg-[#111827] border border-slate-800 rounded-lg p-4">

                <h3 className="font-semibold">
                  {event.title || event.action || "Timeline Event"}
                </h3>

                <p className="text-sm text-slate-400 mt-2">
                  {event.description || event.details || ""}
                </p>

                <p className="text-xs text-blue-400 mt-2">
                  {event.timestamp || ""}
                </p>

              </div>
            </div>
          ))}

        </div>
      )}

      {/* Empty Timeline */}
      {!loadingTimeline && caseId && events.length === 0 && !message && (
        <div className="bg-[#111827] border border-slate-800 rounded-xl p-10 text-center">

          <CalendarDays
            size={45}
            className="text-slate-500 mx-auto"
          />

          <h2 className="text-xl font-semibold mt-4">
            No Timeline Events
          </h2>

          <p className="text-slate-400 mt-2">
            No events are available for this case yet.
          </p>

        </div>
      )}

      {/* Initial State */}
      {!caseId && !loadingCases && !message && (
        <div className="bg-[#111827] border border-slate-800 rounded-xl p-10 text-center">

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

      {/* Loading Cases */}
      {loadingCases && (
        <p className="text-slate-400">
          Loading cases...
        </p>
      )}

    </div>
  );
}