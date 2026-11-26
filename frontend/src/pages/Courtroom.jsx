
import { useEffect, useState } from "react";
import {
  Scale,
  Shield,
  Gavel,
  Eye,
  AlertTriangle,
  Brain,
  Loader2
} from "lucide-react";
import api from "../services/api";

function Section({ title, icon: Icon, children, color = "text-blue-400" }) {
  return (
    <div className="bg-[#111827] border border-slate-800 rounded-xl p-5">
      <div className="flex items-center gap-3 mb-4">
        <Icon className={color} size={22} />
        <h2 className="font-bold text-lg">{title}</h2>
      </div>
      <div className="space-y-3 text-slate-300 text-sm">
        {children}
      </div>
    </div>
  );
}

function BulletList({ items, renderItem }) {
  if (!Array.isArray(items) || items.length === 0) {
    return <p className="text-slate-500">No items returned by this analysis.</p>;
  }

  return (
    <ul className="space-y-3">
      {items.map((item, index) => (
        <li key={index} className="flex gap-3">
          <span className="text-slate-500">{index + 1}.</span>
          <div>{renderItem ? renderItem(item) : String(item)}</div>
        </li>
      ))}
    </ul>
  );
}

export default function Courtroom() {
  const [cases, setCases] = useState([]);
  const [caseId, setCaseId] = useState("");
  const [result, setResult] = useState(null);
  const [loadingCases, setLoadingCases] = useState(true);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadCases() {
      try {
        const response = await api.get("/cases");
        setCases(response.data);
        setError("");
      } catch (err) {
        setError(
          err.response?.data?.detail ||
          "Unable to load cases. Check whether the backend is running."
        );
      } finally {
        setLoadingCases(false);
      }
    }

    loadCases();
  }, []);

  async function runCourtroom() {
    if (!caseId) {
      setError("Please select a case first.");
      return;
    }

    setLoadingAnalysis(true);
    setError("");
    setResult(null);

    try {
      const response = await api.post(`/cases/${caseId}/analyze`);
      setResult(response.data);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
        err.message ||
        "Unable to run the AI analysis."
      );
    } finally {
      setLoadingAnalysis(false);
    }
  }

  const judge = result?.judge;
  const statistics = judge?.case_statistics;

  return (
    <div className="space-y-6 text-white">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <Scale className="text-blue-400" size={30} />
          <h1 className="text-2xl font-bold">AI Courtroom</h1>
        </div>
        <p className="text-slate-400 text-sm">
          Examine cases through multiple AI investigative perspectives.
        </p>
      </div>

      <div className="bg-[#111827] border border-slate-800 rounded-xl p-5">
        <label className="block text-sm font-semibold mb-3">
          Select an investigation case
        </label>

        <select
          value={caseId}
          onChange={(e) => {
            setCaseId(e.target.value);
            setResult(null);
            setError("");
          }}
          disabled={loadingCases || loadingAnalysis}
          className="w-full bg-[#0b1220] border border-slate-700 rounded-lg p-3 text-white"
        >
          <option value="">
            {loadingCases ? "Loading cases..." : "Select a case"}
          </option>

          {cases.map((item) => (
            <option key={item.id} value={item.id}>
              {item.title} (Case #{item.id})
            </option>
          ))}
        </select>

        {!loadingCases && cases.length === 0 && (
          <p className="text-amber-400 text-sm mt-3">
            No cases found. Create a case from the Cases page first.
          </p>
        )}

        <button
          onClick={runCourtroom}
          disabled={!caseId || loadingAnalysis || loadingCases}
          className="mt-4 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:cursor-not-allowed px-5 py-3 rounded-lg font-semibold transition"
        >
          {loadingAnalysis ? (
            <>
              <Loader2 className="animate-spin" size={18} />
              Running AI Analysis...
            </>
          ) : (
            <>
              <Gavel size={18} />
              Run AI Courtroom
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="bg-red-950/40 border border-red-800 text-red-300 rounded-xl p-4 text-sm">
          {error}
        </div>
      )}

      {loadingAnalysis && (
        <div className="bg-[#111827] border border-slate-800 rounded-xl p-6 text-center">
          <Loader2 className="animate-spin mx-auto mb-3 text-blue-400" size={30} />
          <p className="font-semibold">Analyzing the selected case...</p>
          <p className="text-slate-400 text-sm mt-2">
            The local AI model and investigative modules are processing the evidence.
            This may take a few minutes.
          </p>
        </div>
      )}

      {result && (
        <>
          <div className="bg-[#111827] border border-slate-800 rounded-xl p-5">
            <h2 className="font-bold text-xl mb-2">
              {result.case_title || "Case Analysis"}
            </h2>
            <p className="text-slate-400 text-sm">
              Case ID: {result.case_id}
            </p>
            {result.engine && (
              <p className="text-blue-300 text-sm mt-3">
                {result.engine.name} · Version {result.engine.version} ·{" "}
                {result.engine.llm_model}
              </p>
            )}
          </div>

          <Section title="Prosecution AI" icon={Shield} color="text-green-400">
            <p>{result.prosecution?.summary || "No summary available."}</p>
            <h3 className="font-semibold text-white pt-2">Relevant evidence</h3>
            <BulletList
              items={result.prosecution?.relevant_evidence}
              renderItem={(item) => (
                <>
                  <p className="font-semibold text-white">{item.filename}</p>
                  <p>{item.analysis}</p>
                  <p className="text-slate-400">
                    Relevance score: {item.relevance_score}
                  </p>
                  {item.limitation && (
                    <p className="text-amber-300">Limitation: {item.limitation}</p>
                  )}
                </>
              )}
            />
          </Section>

          <Section title="Defence AI" icon={Scale} color="text-cyan-400">
            <p>{result.defence?.summary || "No summary available."}</p>
            <h3 className="font-semibold text-white pt-2">Questions requiring review</h3>
            <BulletList
              items={result.defence?.questions}
              renderItem={(item) => (
                <>
                  <p className="font-semibold text-white">{item.question}</p>
                  <p>{item.reason}</p>
                </>
              )}
            />
            <h3 className="font-semibold text-white pt-2">Evidence to review</h3>
            <BulletList
              items={result.defence?.evidence_to_review}
              renderItem={(item) => (
                <>
                  <p className="font-semibold text-white">{item.filename}</p>
                  <p>{item.observation}</p>
                </>
              )}
            />
          </Section>

          <Section title="Devil's Advocate" icon={AlertTriangle} color="text-amber-400">
            <p>{result.devil_advocate?.summary || "No summary available."}</p>
            <BulletList
              items={result.devil_advocate?.challenges}
              renderItem={(item) => (
                <>
                  <p className="font-semibold text-white">{item.issue}</p>
                  <p>{item.challenge}</p>
                  <p className="text-amber-300">
                    Severity: {item.severity}
                  </p>
                </>
              )}
            />
          </Section>

          <Section title="Blind Spot Detector" icon={Eye} color="text-purple-400">
            <p>{result.blind_spots?.summary || "No summary available."}</p>
            <BulletList
              items={result.blind_spots?.potential_gaps}
              renderItem={(item) => (
                <>
                  <p className="font-semibold text-white">{item.item}</p>
                  <p>{item.recommendation}</p>
                  <p className="text-slate-400">{item.status}</p>
                </>
              )}
            />
            {Array.isArray(result.blind_spots?.mentioned_categories) &&
              result.blind_spots.mentioned_categories.length > 0 && (
                <p className="pt-2">
                  Mentioned categories:{" "}
                  {result.blind_spots.mentioned_categories.join(", ")}
                </p>
              )}
          </Section>

          <Section title="AI Judge Assessment" icon={Gavel} color="text-red-400">
            <p className="text-white font-semibold">
              Status: {judge?.status || "Not available"}
            </p>
            <p>{judge?.summary || "No assessment summary available."}</p>

            {statistics && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-3">
                {Object.entries(statistics).map(([key, value]) => (
                  <div key={key} className="bg-[#0b1220] rounded-lg p-3">
                    <p className="text-slate-400 text-xs">
                      {key.replaceAll("_", " ")}
                    </p>
                    <p className="text-xl font-bold text-white">{value}</p>
                  </div>
                ))}
              </div>
            )}

            <h3 className="font-semibold text-white pt-3">
              Issues requiring human review
            </h3>
            <BulletList items={judge?.issues_requiring_human_review} />

            {judge?.final_notice && (
              <p className="text-amber-300 pt-3">{judge.final_notice}</p>
            )}
          </Section>

          <Section title="Qwen Local AI Analysis" icon={Brain} color="text-indigo-400">
            {result.llm_analysis?.available ? (
              <>
                <p className="text-indigo-300 text-xs">
                  Model: {result.llm_analysis.model}
                </p>
                <p className="whitespace-pre-wrap">
                  {result.llm_analysis.analysis}
                </p>
              </>
            ) : (
              <p className="text-amber-300">
                The local language model did not return an analysis.
                {result.llm_analysis?.error
                  ? ` Details: ${result.llm_analysis.error}`
                  : ""}
              </p>
            )}
          </Section>

          <div className="bg-amber-950/30 border border-amber-800 rounded-xl p-4 text-amber-200 text-sm">
            <p className="font-semibold mb-1">Important notice</p>
            <p>
              {result.disclaimer ||
                "This automated analysis is for investigative assistance only. All observations require human verification and do not establish facts or determine legal guilt."}
            </p>
          </div>
        </>
      )}
    </div>
  );
}
