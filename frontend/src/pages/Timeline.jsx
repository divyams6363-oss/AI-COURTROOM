
import { useEffect, useState } from "react";
import api from "../services/api";

function getEvents(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.events)) return data.events;
  if (Array.isArray(data?.timeline)) return data.timeline;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.items)) return data.items;
  return [];
}

function formatDate(value) {
  if (!value) return "Date not available";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleString();
}

export default function Timeline() {
  const [cases, setCases] = useState([]);
  const [caseId, setCaseId] = useState("");
  const [events, setEvents] = useState([]);
  const [message, setMessage] = useState("");
  const [loadingCases, setLoadingCases] = useState(true);
  const [loadingTimeline, setLoadingTimeline] = useState(false);

  useEffect(() => {
    async function loadCases() {
      try {
        const response = await api.get("/cases");
        const data = response.data;

        setCases(
          Array.isArray(data)
            ? data
            : Array.isArray(data?.cases)
              ? data.cases
              : []
        );
      } catch (error) {
        console.error("Failed to load cases:", error);
        setMessage("Unable to load cases. Check the backend connection.");
      } finally {
        setLoadingCases(false);
      }
    }

    loadCases();
  }, []);

  async function loadTimeline(id) {
    setCaseId(id);
    setEvents([]);
    setMessage("");

    if (!id) return;

    setLoadingTimeline(true);

    try {
      const response = await api.get(`/cases/${id}/timeline`);
      const timelineEvents = getEvents(response.data);

      setEvents(timelineEvents);

      if (timelineEvents.length === 0) {
        setMessage(
          "No timeline events found for this case. Evidence may not contain extractable dates yet."
        );
      }
    } catch (error) {
      console.error("Failed to load timeline:", error);

      setMessage(
        error.response?.data?.detail ||
        "Unable to load the timeline for this case."
      );
    } finally {
      setLoadingTimeline(false);
    }
  }

  return (
    <div className="space-y-6 text-white">
      <div>
        <h1 className="text-3xl font-bold">Case Timeline</h1>
        <p className="mt-2 text-sm text-slate-400">
          Review chronological events extracted from case evidence.
        </p>
      </div>

      <div>
        <label className="mb-2 block text-sm text-slate-400">
          Select Investigation
        </label>

        <select
          value={caseId}
          onChange={event => loadTimeline(event.target.value)}
          className="w-full rounded-lg border border-slate-700 bg-slate-900 p-3 text-white"
        >
          <option value="">Select a case</option>
          {cases.map(item => (
            <option key={item.id} value={item.id}>
              {item.title || `Case ${item.id}`}
            </option>
          ))}
        </select>
      </div>

      {message && (
        <div className="rounded-lg border border-slate-700 bg-slate-900 p-4 text-sm text-slate-300">
          {message}
        </div>
      )}

      {loadingCases && (
        <div className="py-10 text-center text-slate-400">
          Loading cases...
        </div>
      )}

      {!loadingCases && cases.length === 0 && (
        <div className="rounded-xl border border-slate-800 bg-[#111827] p-10 text-center text-slate-400">
          No cases found. Create a case first.
        </div>
      )}

      {!caseId && !loadingCases && cases.length > 0 && (
        <div className="rounded-xl border border-slate-800 bg-[#111827] p-10 text-center">
          <div className="text-4xl">🕒</div>
          <h2 className="mt-4 text-xl font-semibold">
            No Case Selected
          </h2>
          <p className="mt-2 text-slate-400">
            Select a case above to view its evidence timeline.
          </p>
        </div>
      )}

      {loadingTimeline && (
        <div className="py-10 text-center text-blue-400">
          Loading timeline events...
        </div>
      )}

      {!loadingTimeline && caseId && events.length > 0 && (
        <div className="space-y-5 border-l-2 border-blue-600 ml-4 pl-6">
          {events.map((event, index) => {
            const title =
              event.title ||
              event.action ||
              event.event ||
              "Investigation Event";

            const description =
              event.description ||
              event.details ||
              event.message ||
              "No additional details available.";

            const timestamp =
              event.timestamp ||
              event.created_at ||
              event.date ||
              event.event_date;

            return (
              <div
                key={event.id ?? `${caseId}-${index}`}
                className="relative"
              >
                <div className="absolute -left-[33px] h-4 w-4 rounded-full border-2 border-blue-300 bg-blue-600" />

                <div className="rounded-lg border border-slate-800 bg-[#111827] p-4">
                  <h3 className="font-semibold text-white">
                    {title}
                  </h3>

                  <p className="mt-2 text-sm text-slate-400">
                    {description}
                  </p>

                  <p className="mt-3 text-xs text-blue-400">
                    {formatDate(timestamp)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
