
import { useState } from "react";
import {
  Download,
  FileText,
  ShieldCheck,
  AlertTriangle,
  Scale,
  FolderSearch
} from "lucide-react";

const demoCases = [
  {
    id: "CASE-001",
    title: "Financial Transaction Investigation",
    evidence: 4,
    contradictions: 1,
    status: "Under Investigation",
    summary:
      "A financial transaction is being examined using bank statements, payment screenshots and communication records."
  },
  {
    id: "CASE-002",
    title: "Document Verification Case",
    evidence: 3,
    contradictions: 2,
    status: "Under Investigation",
    summary:
      "Documents are being compared to identify inconsistencies and possible authenticity concerns."
  },
  {
    id: "CASE-003",
    title: "Digital Evidence Analysis",
    evidence: 5,
    contradictions: 1,
    status: "Under Review",
    summary:
      "Digital records and communication evidence are being examined for consistency."
  }
];

export default function Reports() {
  const [caseId, setCaseId] = useState("");
  const [report, setReport] = useState(null);

  const selectedCase = demoCases.find(
    (c) => c.id === caseId
  );

  function generateReport() {
    if (!selectedCase) return;

    setReport({
      summary: selectedCase.summary,
      findings: [
        "Multiple evidence items are available for examination.",
        "Some evidence relationships require further verification.",
        "Original sources and metadata should be independently checked."
      ],
      recommendations: [
        "Verify the authenticity of original documents.",
        "Compare timestamps across all evidence items.",
        "Obtain additional supporting records where necessary."
      ]
    });
  }

  function downloadReport() {
    if (!report || !selectedCase) return;

    const printWindow = window.open("", "_blank");

    if (!printWindow) {
      alert("Please allow pop-ups to export your report.");
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>VERITAS AI Investigation Report</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            padding: 40px;
            color: #222;
            line-height: 1.6;
          }
          h1 { color: #1d4ed8; }
          h2 {
            border-bottom: 1px solid #ddd;
            padding-bottom: 6px;
            margin-top: 28px;
          }
          .meta {
            background: #f1f5f9;
            padding: 15px;
            border-radius: 8px;
          }
          li { margin-bottom: 8px; }
          .footer {
            margin-top: 45px;
            font-size: 12px;
            color: #666;
          }
          @media print {
            body { padding: 10px; }
          }
        </style>
      </head>
      <body>
        <h1>VERITAS AI</h1>
        <h2>Investigation Report</h2>

        <div class="meta">
          <p><b>Case ID:</b> ${selectedCase.id}</p>
          <p><b>Case Title:</b> ${selectedCase.title}</p>
          <p><b>Status:</b> ${selectedCase.status}</p>
          <p><b>Evidence Items:</b> ${selectedCase.evidence}</p>
          <p><b>Contradictions:</b> ${selectedCase.contradictions}</p>
          <p><b>Report Date:</b> ${new Date().toLocaleDateString()}</p>
        </div>

        <h2>1. Investigation Summary</h2>
        <p>${report.summary}</p>

        <h2>2. Evidence Overview</h2>
        <p>Total evidence items: ${selectedCase.evidence}</p>

        <h2>3. Contradiction Analysis</h2>
        <p>Potential contradictions identified: ${selectedCase.contradictions}</p>

        <h2>4. Investigation Findings</h2>
        <ul>
          ${report.findings.map(item => `<li>${item}</li>`).join("")}
        </ul>

        <h2>5. Recommendations</h2>
        <ul>
          ${report.recommendations.map(item => `<li>${item}</li>`).join("")}
        </ul>

        <div class="footer">
          DEMO REPORT — Generated using sample data.
          This is not a verified forensic or legal report.
        </div>

        <script>
          window.onload = function() {
            window.print();
          };
        </script>
      </body>
      </html>
    `);

    printWindow.document.close();
  }

  return (
    <div className="space-y-6 text-white">

      <div>
        <h1 className="text-3xl font-bold">Reports Dashboard</h1>
        <p className="text-slate-400 mt-2">
          Generate structured investigation reports.
        </p>
      </div>

      <div className="bg-[#111827] border border-slate-800
        rounded-xl p-6 space-y-5">

        <FileText size={35} className="text-blue-400" />

        <h2 className="text-xl font-semibold">
          Generate Investigation Report
        </h2>

        <select
          value={caseId}
          onChange={(e) => {
            setCaseId(e.target.value);
            setReport(null);
          }}
          className="w-full bg-slate-900 border border-slate-700
            rounded-lg p-3"
        >
          <option value="">Select a case</option>

          {demoCases.map((c) => (
            <option key={c.id} value={c.id}>
              {c.id} — {c.title}
            </option>
          ))}
        </select>

        <button
          onClick={generateReport}
          disabled={!caseId}
          className="bg-blue-600 hover:bg-blue-700
            disabled:opacity-40 px-5 py-3 rounded-lg
            font-semibold"
        >
          Generate Investigation Report
        </button>

      </div>

      {report && selectedCase && (
        <>
          <div className="grid md:grid-cols-3 gap-4">

            <div className="bg-[#111827] border border-slate-800
              rounded-xl p-5">
              <FolderSearch className="text-blue-400" />
              <p className="text-slate-400 mt-3 text-sm">
                Evidence Items
              </p>
              <h2 className="text-3xl font-bold mt-1">
                {selectedCase.evidence}
              </h2>
            </div>

            <div className="bg-[#111827] border border-slate-800
              rounded-xl p-5">
              <AlertTriangle className="text-red-400" />
              <p className="text-slate-400 mt-3 text-sm">
                Contradictions
              </p>
              <h2 className="text-3xl font-bold mt-1">
                {selectedCase.contradictions}
              </h2>
            </div>

            <div className="bg-[#111827] border border-slate-800
              rounded-xl p-5">
              <ShieldCheck className="text-green-400" />
              <p className="text-slate-400 mt-3 text-sm">
                Case Status
              </p>
              <h2 className="text-lg font-bold mt-2">
                {selectedCase.status}
              </h2>
            </div>

          </div>

          <div className="bg-[#111827] border border-slate-800
            rounded-xl p-6 space-y-6">

            <div className="flex items-center gap-3">
              <Scale className="text-purple-400" size={28} />
              <div>
                <h2 className="text-xl font-bold">
                  Investigation Report Preview
                </h2>
                <p className="text-slate-400 text-sm">
                  {selectedCase.id} — {selectedCase.title}
                </p>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-blue-400 mb-2">
                Investigation Summary
              </h3>
              <p className="text-slate-300">
                {report.summary}
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-blue-400 mb-2">
                Investigation Findings
              </h3>
              <ul className="list-disc pl-5 space-y-2 text-slate-300">
                {report.findings.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-blue-400 mb-2">
                Recommendations
              </h3>
              <ul className="list-disc pl-5 space-y-2 text-slate-300">
                {report.recommendations.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>

            <button
              onClick={downloadReport}
              className="bg-green-600 hover:bg-green-700
                px-5 py-3 rounded-lg flex items-center gap-2
                font-semibold"
            >
              <Download size={18} />
              Export PDF Report
            </button>

          </div>
        </>
      )}

      <p className="text-xs text-slate-500">
        Demo mode: Report contents use sample data and are not
        generated from verified investigation evidence.
      </p>

    </div>
  );
}
