
import { useEffect, useState } from "react";
import api from "../services/api";

export default function Timeline() {
  const [cases, setCases] = useState([]);
  const [caseId, setCaseId] = useState("");
  const [events, setEvents] = useState([]);
  const [message, setMessage] = useState("");
  const [loadingCases, setLoadingCases] = useState(true);
  const [loadingTimeline, setLoadingTimeline] = useState(false);

  useEffect(() => {
    api.get("/cases")
      .then(res => setCases(res.data))
      .catch(console.error);
  }, []);

  async function loadTimeline(id) {
    setCaseId(id);

    try {
      const response = await api.get(`/cases/${id}/timeline`);
      setEvents(response.data);
    } catch (error) {
      console.error(error);
    }
  }

  return (
    <div className="space-y-6">

      <h1 className="text-3xl font-bold">Case Timeline</h1>

      <select
        value={caseId}
        onChange={e => loadTimeline(e.target.value)}
        className="bg-slate-900 border border-slate-700
        rounded-lg p-3 w-full"
      >
        <option value="">Select a case</option>
        {cases.map(c => (
          <option key={c.id} value={c.id}>{c.title}</option>
        ))}
      </select>

      <div className="space-y-5 border-l-2 border-blue-600 ml-4 pl-6">

        {events.map(event => (
          <div key={event.id} className="relative">
            <div className="absolute -left-[33px] w-4 h-4
              bg-blue-500 rounded-full" />

            <div className="bg-[#111827] border border-slate-800
              rounded-lg p-4">

              <h3 className="font-semibold">{event.title}</h3>

              <p className="text-sm text-slate-400 mt-2">
                {event.description}
              </p>

              <p className="text-xs text-blue-400 mt-2">
                {event.timestamp}
              </p>

            </div>
          </div>
        ))}

      </div>

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
