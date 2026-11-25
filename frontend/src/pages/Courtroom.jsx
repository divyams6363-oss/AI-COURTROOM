import { useEffect, useState } from "react";
import api from "../services/api";

export default function Courtroom() {
  const [cases, setCases] = useState([]);
  const [caseId, setCaseId] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get("/cases")
      .then(res => setCases(res.data))
      .catch(console.error);
  }, []);

  async function runCourtroom() {
    if (!caseId) return;

    setLoading(true);
    setResult(null);

    try {
      const response = await api.post(
        `/cases/${caseId}/courtroom`
      );

      setResult(response.data);

    } catch (error) {
      console.error(error);
      alert("Courtroom analysis failed.");
    } finally {
      setLoading(false);
    }
  }

  function Section({ title, content }) {
    return (
      <div className="bg-[#111827] border border-slate-800
        rounded-xl p-6">

        <h2 className="font-bold text-xl mb-4">{title}</h2>

        {Array.isArray(content) ? (
          <ul className="list-disc pl-5 space-y-2 text-slate-300">
            {content.map((item, index) => (
              <li key={index}>
                {typeof item === "string"
                  ? item
                  : JSON.stringify(item)}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-slate-300 whitespace-pre-wrap">
            {typeof content === "string"
              ? content
              : JSON.stringify(content, null, 2)}
          </p>
        )}

      </div>
    );
  }

  return (
    <div className="space-y-6">

      <div>
        <h1 className="text-3xl font-bold">AI Courtroom</h1>
        <p className="text-slate-400 mt-2">
          Examine evidence from multiple analytical perspectives.
        </p>
      </div>

      <select
        value={caseId}
        onChange={e => setCaseId(e.target.value)}
        className="bg-slate-900 border border-slate-700
        rounded-lg p-3 w-full"
      >
        <option value="">Select a case</option>
        {cases.map(c => (
          <option key={c.id} value={c.id}>{c.title}</option>
        ))}
      </select>

      <button
        onClick={runCourtroom}
        disabled={!caseId || loading}
        className="bg-purple-600 px-6 py-3 rounded-lg
        disabled:opacity-50"
      >
        {loading ? "Analyzing Evidence..." : "Run AI Courtroom"}
      </button>

      {result && (
        <div className="grid md:grid-cols-2 gap-5">

          <Section
            title="Prosecution AI"
            content={result.prosecution}
          />

          <Section
            title="Defence AI"
            content={result.defence}
          />

          <Section
            title="Devil's Advocate"
            content={result.devil_advocate}
          />

          <Section
            title="Blind Spot Detector"
            content={result.blind_spots}
          />

          <div className="md:col-span-2">
            <Section
              title="AI Judge Assessment"
              content={result.judge}
            />
          </div>

        </div>
      )}

    </div>
  );
}