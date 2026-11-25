
import { useState } from "react";
import {
  Scale,
  Shield,
  Gavel,
  Eye,
  AlertTriangle
} from "lucide-react";

const demoCases = [
  {
    id: "CASE-001",
    title: "Financial Transaction Investigation"
  },
  {
    id: "CASE-002",
    title: "Document Verification Case"
  },
  {
    id: "CASE-003",
    title: "Digital Evidence Analysis"
  }
];

export default function Courtroom() {
  const [caseId, setCaseId] = useState("");
  const [result, setResult] = useState(null);

  const selectedCase = demoCases.find(
    (c) => c.id === caseId
  );

  function runCourtroom() {
    if (!caseId) return;

    setResult({
      prosecution: [
        "The bank statement shows a recorded transaction.",
        "The payment screenshot appears to support the transaction.",
        "The email communication may establish a connection."
      ],

      defence: [
        "The screenshot has not yet been independently verified.",
        "The sender's identity needs confirmation.",
        "The available records do not establish intent."
      ],

      devil_advocate: [
        "Could the screenshot have been edited?",
        "Are all timestamps consistent?",
        "Could another person have initiated the transaction?"
      ],

      blind_spots: [
        "Original source of the screenshot is not verified.",
        "No independent witness statement is available.",
        "Complete transaction metadata is missing."
      ],

      judge: [
        "The evidence contains potentially relevant information.",
        "Some records appear to support the same event.",
        "Important verification steps remain incomplete.",
        "No final conclusion should be drawn from this sample analysis."
      ]
    });
  }

  function Section({ title, icon: Icon, content, color }) {
    return (
      <div className="bg-[#111827] border border-slate-800
        rounded-xl p-5">

        <div className="flex items-center gap-3 mb-4">
          <Icon className={color} size={22} />
          <h2 className="font-bold text-lg">{title}</h2>
        </div>

        <ul className="space-y-3">
          {content.map((item, index) => (
            <li key={index}
              className="flex gap-3 text-slate-300 text-sm">
              <span className="text-slate-500">
                {index + 1}.
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ul>

      </div>
    );
  }

  return (
    <div className="space-y-6 text-white">

      <div>
        <h1 className="text-3xl font-bold">
          AI Courtroom
        </h1>

        <p className="text-slate-400 mt-2">
          Challenge evidence through multiple AI perspectives.
        </p>
      </div>

      <div className="bg-[#111827] border border-slate-800
        rounded-xl p-6 space-y-4">

        <h2 className="font-semibold text-lg">
          Select Investigation Case
        </h2>

        <select
          value={caseId}
          onChange={(e) => {
            setCaseId(e.target.value);
            setResult(null);
          }}
          className="bg-slate-900 border border-slate-700
            rounded-lg p-3 w-full text-white"
        >
          <option value="">Select a case</option>

          {demoCases.map((c) => (
            <option key={c.id} value={c.id}>
              {c.id} — {c.title}
            </option>
          ))}
        </select>

        <button
          onClick={runCourtroom}
          disabled={!caseId}
          className="bg-purple-600 hover:bg-purple-700
            disabled:opacity-40 px-6 py-3 rounded-lg
            font-semibold transition"
        >
          <span className="flex items-center gap-2">
            <Scale size={18} />
            Run AI Courtroom
          </span>
        </button>

      </div>

      {result && (
        <>
          <div className="bg-purple-950/30 border
            border-purple-800 rounded-xl p-4">
            <p className="text-purple-300 text-sm">
              Analysis for {selectedCase?.id}
            </p>
            <h2 className="font-bold text-xl mt-1">
              {selectedCase?.title}
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-5">

            <Section
              title="Prosecution AI"
              icon={Scale}
              color="text-blue-400"
              content={result.prosecution}
            />

            <Section
              title="Defence AI"
              icon={Shield}
              color="text-green-400"
              content={result.defence}
            />

            <Section
              title="Devil's Advocate"
              icon={Eye}
              color="text-orange-400"
              content={result.devil_advocate}
            />

            <Section
              title="Blind Spot Detector"
              icon={AlertTriangle}
              color="text-red-400"
              content={result.blind_spots}
            />

            <div className="md:col-span-2">
              <Section
                title="AI Judge Assessment"
                icon={Gavel}
                color="text-purple-400"
                content={result.judge}
              />
            </div>

          </div>

          <p className="text-xs text-yellow-500">
            Demo mode: These are sample AI perspectives,
            not real evidence analysis or a legal judgment.
          </p>
        </>
      )}

    </div>
  );
}
