import { useEffect, useMemo, useState } from "react";
import {
  Download,
  FileText,
  ShieldCheck,
  AlertTriangle,
  Scale,
  FolderSearch,
  Loader2,
  RefreshCw
} from "lucide-react";

import api from "../services/api";

// Safely escape dynamic content before inserting it into the printable HTML.
function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    };

    return entities[char];
  });
}

function formatStatus(status) {
  if (!status) return "Not available";

  return String(status)
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export default function Reports() {
  const [cases, setCases] = useState([]);
  const [evidenceCounts, setEvidenceCounts] = useState({});
  const [caseId, setCaseId] = useState("");
  const [report, setReport] = useState(null);

  const [loadingCases, setLoadingCases] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const selectedCase = useMemo(
    () => cases.find((item) => String(item.id) === String(caseId)),
    [cases, caseId]
  );

  // Load real backend cases and their evidence counts.
  async function loadCases() {
    setLoadingCases(true);
    setError("");

    try {
      const response = await api.get("/cases");

      const caseList = Array.isArray(response.data)
        ? response.data
        : response.data?.cases || [];

      setCases(caseList);

      const counts = {};

      await Promise.all(
        caseList.map(async (item) => {
          try {
            const evidenceResponse = await api.get(
              `/cases/${item.id}/evidence`
            );

            const evidenceList = Array.isArray(evidenceResponse.data)
              ? evidenceResponse.data
              : evidenceResponse.data?.evidence || [];

            counts[item.id] = evidenceList.length;
          } catch (err) {
            console.error(
              `Could not load evidence for case ${item.id}:`,
              err
            );

            counts[item.id] = 0;
          }
        })
      );

      setEvidenceCounts(counts);

      // Keep the selected case if it still exists.
      setCaseId((previous) => {
        const exists = caseList.some(
          (item) => String(item.id) === String(previous)
        );

        if (exists) return previous;

        return caseList.length > 0
          ? String(caseList[0].id)
          : "";
      });
    } catch (err) {
      console.error("Failed to load cases:", err);

      setError(
        err.response?.data?.detail ||
        "Unable to load cases. Please check the backend connection."
      );

      setCases([]);
      setEvidenceCounts({});
    } finally {
      setLoadingCases(false);
    }
  }

  useEffect(() => {
    loadCases();
  }, []);

  // Generate the report using the actual backend analysis API.
  async function generateReport() {
    if (!selectedCase) return;

    setGenerating(true);
    setError("");
    setSuccess("");
    setReport(null);

    try {
      const response = await api.post(
        `/cases/${selectedCase.id}/analyze`
      );

      if (!response.data || !response.data.case_id) {
        throw new Error("The backend returned an invalid analysis response.");
      }

      setReport(response.data);
      setSuccess("Investigation analysis generated successfully.");
    } catch (err) {
      console.error("Report generation failed:", err);

      setError(
        err.response?.data?.detail ||
        err.message ||
        "Unable to generate the report. Please try again."
      );
    } finally {
      setGenerating(false);
    }
  }

  // Extract report sections safely from the backend response.
  const judge = report?.judge || {};
  const prosecution = report?.prosecution || {};
  const defence = report?.defence || {};
  const devilAdvocate = report?.devil_advocate || {};
  const blindSpots = report?.blind_spots || {};
  const engine = report?.engine || {};

  const statistics = judge.case_statistics || {};

  const evidenceTotal =
    statistics.total_evidence ??
    evidenceCounts[selectedCase?.id] ??
    0;

  const reviewChallenges = Array.isArray(devilAdvocate.challenges)
    ? devilAdvocate.challenges
    : [];

  const relevantEvidence = Array.isArray(prosecution.relevant_evidence)
    ? prosecution.relevant_evidence
    : [];

  const defenceQuestions = Array.isArray(defence.questions)
    ? defence.questions
    : [];

  const potentialGaps = Array.isArray(blindSpots.potential_gaps)
    ? blindSpots.potential_gaps
    : [];

  const humanReviewIssues = Array.isArray(
    judge.issues_requiring_human_review
  )
    ? judge.issues_requiring_human_review
    : [];

  // Create the printable report.
  function downloadReport() {
    if (!report || !selectedCase) return;

    const printWindow = window.open("", "_blank");

    if (!printWindow) {
      alert("Please allow pop-ups to export your report.");
      return;
    }

    const caseTitle = escapeHtml(
      report.case_title || selectedCase.title
    );

    const reportCaseId = escapeHtml(
      report.case_id || selectedCase.id
    );

    const status = escapeHtml(
      formatStatus(judge.status)
    );

    const summary = escapeHtml(
      judge.summary ||
      prosecution.summary ||
      "No investigation summary was provided."
    );

    const evidenceItems = relevantEvidence.length
      ? relevantEvidence.map((item) => `
          <li>
            <strong>${escapeHtml(item.filename)}</strong>
            <p>Evidence ID: ${escapeHtml(item.evidence_id)}</p>
            <p>Relevance score: ${escapeHtml(item.relevance_score ?? "Not available")}</p>
            <p>${escapeHtml(item.analysis)}</p>
            <p><strong>Limitation:</strong> ${escapeHtml(item.limitation)}</p>
          </li>
        `).join("")
      : "<li>No relevant evidence details were returned.</li>";

    const challenges = reviewChallenges.length
      ? reviewChallenges.map((item) => `
          <li>
            <strong>${escapeHtml(item.issue)}</strong>
            <p>${escapeHtml(item.challenge)}</p>
            <p>Severity: ${escapeHtml(item.severity)}</p>
          </li>
        `).join("")
      : "<li>No challenges were returned.</li>";

    const questions = defenceQuestions.length
      ? defenceQuestions.map((item) => `
          <li>
            <strong>${escapeHtml(item.question)}</strong>
            <p>${escapeHtml(item.reason)}</p>
          </li>
        `).join("")
      : "<li>No defence questions were returned.</li>";

    const gaps = potentialGaps.length
      ? potentialGaps.map((item) => `
          <li>
            <strong>${escapeHtml(item.item)}</strong>
            <p>${escapeHtml(item.recommendation)}</p>
            <p>Status: ${escapeHtml(item.status)}</p>
          </li>
        `).join("")
      : "<li>No potential gaps were returned.</li>";

    const issues = humanReviewIssues.length
      ? humanReviewIssues.map((item) =>
          `<li>${escapeHtml(item)}</li>`
        ).join("")
      : "<li>No additional issues were listed.</li>";

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8" />
        <title>VERITAS AI Investigation Report</title>

        <style>
          body {
            font-family: Arial, sans-serif;
            padding: 40px;
            color: #222;
            line-height: 1.6;
          }

          h1 {
            color: #1d4ed8;
            margin-bottom: 4px;
          }

          h2 {
            border-bottom: 1px solid #ddd;
            padding-bottom: 6px;
            margin-top: 28px;
            color: #1e293b;
          }

          .meta {
            background: #f1f5f9;
            padding: 15px;
            border-radius: 8px;
          }

          li {
            margin-bottom: 12px;
          }

          .notice {
            background: #fff7ed;
            border-left: 4px solid #f59e0b;
            padding: 12px;
            margin-top: 20px;
          }

          .footer {
            margin-top: 45px;
            font-size: 12px;
            color: #666;
          }

          @media print {
            body {
              padding: 10px;
            }

            button {
              display: none;
            }
          }
        </style>
      </head>

      <body>
        <h1>VERITAS AI</h1>
        <p>Digital Investigation and Evidence Analysis</p>

        <h2>Investigation Report</h2>

        <div class="meta">
          <p><strong>Case ID:</strong> ${reportCaseId}</p>
          <p><strong>Case Title:</strong> ${caseTitle}</p>
          <p><strong>Assessment Status:</strong> ${status}</p>
          <p><strong>Total Evidence:</strong> ${escapeHtml(evidenceTotal)}</p>
          <p><strong>Readable Evidence:</strong> ${escapeHtml(statistics.readable_evidence ?? "Not available")}</p>
          <p><strong>Unreadable Evidence:</strong> ${escapeHtml(statistics.unreadable_evidence ?? "Not available")}</p>
          <p><strong>Potential Information Gaps:</strong> ${escapeHtml(statistics.potential_information_gaps ?? potentialGaps.length)}</p>
          <p><strong>Report Date:</strong> ${escapeHtml(new Date().toLocaleDateString())}</p>
        </div>

        <h2>1. Investigation Summary</h2>
        <p>${summary}</p>

        <h2>2. Prosecution Analysis</h2>
        <p>${escapeHtml(prosecution.summary)}</p>
        <ul>${evidenceItems}</ul>

        <h2>3. Defence Analysis</h2>
        <p>${escapeHtml(defence.summary)}</p>
        <ul>${questions}</ul>

        <h2>4. Devil's Advocate Review</h2>
        <p>${escapeHtml(devilAdvocate.summary)}</p>
        <ul>${challenges}</ul>

        <h2>5. Blind Spot Detection</h2>
        <p>${escapeHtml(blindSpots.summary)}</p>
        <ul>${gaps}</ul>

        <h2>6. Issues Requiring Human Review</h2>
        <ul>${issues}</ul>

        <h2>7. Engine Information</h2>
        <p><strong>Engine:</strong> ${escapeHtml(engine.name)}</p>
        <p><strong>Version:</strong> ${escapeHtml(engine.version)}</p>
        <p><strong>Mode:</strong> ${escapeHtml(engine.mode)}</p>
        <p><strong>Model Based:</strong> ${escapeHtml(engine.model_based ?? "Not available")}</p>

        <div class="notice">
          <strong>Important Notice</strong>
          <p>${escapeHtml(judge.final_notice || report.disclaimer || "This automated analysis is for investigative assistance only.")}</p>
          <p>${escapeHtml(report.disclaimer)}</p>
        </div>

        <div class="footer">
          VERITAS AI — Investigation Assistance Report<br />
          Generated from the connected investigation backend.
          This report is not a judicial verdict or determination of guilt.
        </div>

        <script>
          window.onload = function() {
            window.print();
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
  }

  return (
    <div className="space-y-6 text-white">

      {/* Page Heading */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">
            Reports Dashboard
          </h1>

          <p className="text-slate-400 mt-2">
            Generate structured investigation reports using backend analysis.
          </p>
        </div>

        <button
          onClick={loadCases}
          disabled={loadingCases}
          className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 px-4 py-2 rounded-lg"
        >
          <RefreshCw size={17} />
          Refresh Cases
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-300 rounded-lg p-4">
          {error}
        </div>
      )}

      {/* Success */}
      {success && (
        <div className="bg-green-500/10 border border-green-500/30 text-green-300 rounded-lg p-4">
          {success}
        </div>
      )}

      {/* Report Generator */}
      <div className="bg-[#111827] border border-slate-800 rounded-xl p-6 space-y-5">

        <FileText size={35} className="text-blue-400" />

        <h2 className="text-xl font-semibold">
          Generate Investigation Report
        </h2>

        <p className="text-sm text-slate-400">
          Select a case to run the backend investigation analysis.
        </p>

        <select
          value={caseId}
          onChange={(e) => {
            setCaseId(e.target.value);
            setReport(null);
            setError("");
            setSuccess("");
          }}
          disabled={loadingCases || generating}
          className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white"
        >
          <option value="">Select a case</option>

          {cases.map((item) => (
            <option key={item.id} value={String(item.id)}>
              {`CASE-${String(item.id).padStart(3, "0")} — ${item.title}`}
            </option>
          ))}
        </select>

        {loadingCases && (
          <p className="text-slate-400 text-sm flex items-center gap-2">
            <Loader2 size={16} className="animate-spin" />
            Loading cases from backend...
          </p>
        )}

        {!loadingCases && cases.length === 0 && (
          <p className="text-yellow-300 text-sm">
            No cases found. Create a case before generating a report.
          </p>
        )}

        <button
          onClick={generateReport}
          disabled={!selectedCase || generating || loadingCases}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-40 px-5 py-3 rounded-lg font-semibold flex items-center gap-2"
        >
          {generating ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Analyzing Case...
            </>
          ) : (
            <>
              <Scale size={18} />
              Generate Investigation Report
            </>
          )}
        </button>

      </div>

      {/* Report Preview */}
      {report && selectedCase && (
        <>
          {/* Statistics */}
          <div className="grid md:grid-cols-3 gap-4">

            <div className="bg-[#111827] border border-slate-800 rounded-xl p-5">
              <FolderSearch className="text-blue-400" />

              <p className="text-slate-400 mt-3 text-sm">
                Total Evidence
              </p>

              <h2 className="text-3xl font-bold mt-1">
                {evidenceTotal}
              </h2>
            </div>

            <div className="bg-[#111827] border border-slate-800 rounded-xl p-5">
              <AlertTriangle className="text-yellow-400" />

              <p className="text-slate-400 mt-3 text-sm">
                Review Challenges
              </p>

              <h2 className="text-3xl font-bold mt-1">
                {reviewChallenges.length}
              </h2>
            </div>

            <div className="bg-[#111827] border border-slate-800 rounded-xl p-5">
              <ShieldCheck className="text-green-400" />

              <p className="text-slate-400 mt-3 text-sm">
                Assessment Status
              </p>

              <h2 className="text-lg font-bold mt-2 capitalize">
                {formatStatus(judge.status)}
              </h2>
            </div>

          </div>

          {/* Full Report */}
          <div className="bg-[#111827] border border-slate-800 rounded-xl p-6 space-y-7">

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3">
                <Scale className="text-purple-400" size={28} />

                <div>
                  <h2 className="text-xl font-bold">
                    Investigation Report Preview
                  </h2>

                  <p className="text-slate-400 text-sm">
                    {report.case_id} — {report.case_title}
                  </p>
                </div>
              </div>

              <button
                onClick={downloadReport}
                className="bg-green-600 hover:bg-green-700 px-5 py-3 rounded-lg flex items-center justify-center gap-2 font-semibold"
              >
                <Download size={18} />
                Export PDF Report
              </button>
            </div>

            {/* Judge Assessment */}
            <section>
              <h3 className="font-semibold text-purple-400 mb-2">
                AI Judge Assessment
              </h3>

              <p className="text-slate-300 mb-3">
                {judge.summary || "No judge assessment summary returned."}
              </p>

              <div className="bg-slate-900 rounded-lg p-4 space-y-2 text-sm text-slate-300">
                <p>
                  <strong>Status:</strong>{" "}
                  {formatStatus(judge.status)}
                </p>

                <p>
                  <strong>Readable Evidence:</strong>{" "}
                  {statistics.readable_evidence ?? "N/A"}
                </p>

                <p>
                  <strong>Unreadable Evidence:</strong>{" "}
                  {statistics.unreadable_evidence ?? "N/A"}
                </p>

                <p>
                  <strong>Potential Information Gaps:</strong>{" "}
                  {statistics.potential_information_gaps ?? potentialGaps.length}
                </p>
              </div>
            </section>

            {/* Prosecution */}
            <section>
              <h3 className="font-semibold text-blue-400 mb-2">
                Prosecution Analysis
              </h3>

              <p className="text-slate-300 mb-3">
                {prosecution.summary || "No prosecution summary returned."}
              </p>

              {relevantEvidence.length > 0 ? (
                <ul className="space-y-3">
                  {relevantEvidence.map((item, index) => (
                    <li
                      key={`${item.evidence_id}-${index}`}
                      className="bg-slate-900 rounded-lg p-4"
                    >
                      <p className="font-semibold text-white">
                        {item.filename}
                      </p>

                      <p className="text-sm text-slate-400 mt-1">
                        Evidence ID: {item.evidence_id}
                      </p>

                      <p className="text-sm text-slate-300 mt-2">
                        {item.analysis}
                      </p>

                      <p className="text-sm text-yellow-300 mt-2">
                        Limitation: {item.limitation}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-slate-400 text-sm">
                  No relevant evidence details returned.
                </p>
              )}

              {prosecution.disclaimer && (
                <p className="text-xs text-slate-500 mt-3">
                  {prosecution.disclaimer}
                </p>
              )}
            </section>

            {/* Defence */}
            <section>
              <h3 className="font-semibold text-blue-400 mb-2">
                Defence Analysis
              </h3>

              <p className="text-slate-300 mb-3">
                {defence.summary || "No defence summary returned."}
              </p>

              {defenceQuestions.length > 0 ? (
                <ul className="list-disc pl-5 space-y-3 text-slate-300">
                  {defenceQuestions.map((item, index) => (
                    <li key={index}>
                      <p className="font-medium">{item.question}</p>
                      <p className="text-sm text-slate-400">
                        {item.reason}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-slate-400 text-sm">
                  No defence questions returned.
                </p>
              )}

              {defence.disclaimer && (
                <p className="text-xs text-slate-500 mt-3">
                  {defence.disclaimer}
                </p>
              )}
            </section>

            {/* Devil's Advocate */}
            <section>
              <h3 className="font-semibold text-yellow-400 mb-2">
                Devil's Advocate
              </h3>

              <p className="text-slate-300 mb-3">
                {devilAdvocate.summary || "No review summary returned."}
              </p>

              {reviewChallenges.length > 0 ? (
                <ul className="space-y-3">
                  {reviewChallenges.map((item, index) => (
                    <li
                      key={index}
                      className="bg-slate-900 rounded-lg p-4"
                    >
                      <div className="flex flex-wrap justify-between gap-2">
                        <p className="font-semibold text-white">
                          {item.issue}
                        </p>

                        <span className="text-xs text-yellow-300">
                          {formatStatus(item.severity)} severity
                        </span>
                      </div>

                      <p className="text-sm text-slate-300 mt-2">
                        {item.challenge}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-slate-400 text-sm">
                  No review challenges returned.
                </p>
              )}

              {devilAdvocate.disclaimer && (
                <p className="text-xs text-slate-500 mt-3">
                  {devilAdvocate.disclaimer}
                </p>
              )}
            </section>

            {/* Blind Spots */}
            <section>
              <h3 className="font-semibold text-orange-400 mb-2">
                Blind Spot Detection
              </h3>

              <p className="text-slate-300 mb-3">
                {blindSpots.summary || "No blind spot summary returned."}
              </p>

              {potentialGaps.length > 0 ? (
                <ul className="space-y-3">
                  {potentialGaps.map((item, index) => (
                    <li
                      key={index}
                      className="bg-slate-900 rounded-lg p-4"
                    >
                      <p className="font-semibold text-white">
                        {item.item}
                      </p>

                      <p className="text-sm text-slate-300 mt-2">
                        Recommendation: {item.recommendation}
                      </p>

                      <p className="text-xs text-orange-300 mt-2">
                        Status: {item.status}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-slate-400 text-sm">
                  No potential gaps returned.
                </p>
              )}

              {blindSpots.important_limitation && (
                <p className="text-xs text-slate-500 mt-3">
                  {blindSpots.important_limitation}
                </p>
              )}
            </section>

            {/* Human Review */}
            <section>
              <h3 className="font-semibold text-orange-400 mb-2">
                Issues Requiring Human Review
              </h3>

              {humanReviewIssues.length > 0 ? (
                <ul className="list-disc pl-5 space-y-2 text-slate-300">
                  {humanReviewIssues.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-slate-400 text-sm">
                  No additional issues listed.
                </p>
              )}
            </section>

            {/* Engine Information */}
            <section>
              <h3 className="font-semibold text-slate-300 mb-2">
                Engine Information
              </h3>

              <div className="bg-slate-900 rounded-lg p-4 text-sm text-slate-300 space-y-2">
                <p>
                  <strong>Engine:</strong> {engine.name || "N/A"}
                </p>

                <p>
                  <strong>Version:</strong> {engine.version || "N/A"}
                </p>

                <p>
                  <strong>Mode:</strong> {engine.mode || "N/A"}
                </p>

                <p>
                  <strong>Model Based:</strong>{" "}
                  {engine.model_based === undefined
                    ? "N/A"
                    : engine.model_based
                      ? "Yes"
                      : "No"}
                </p>
              </div>
            </section>

            {/* Disclaimer */}
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
              <h3 className="font-semibold text-yellow-300 mb-2">
                Important Notice
              </h3>

              <p className="text-sm text-slate-300">
                {judge.final_notice ||
                  report.disclaimer ||
                  "This automated analysis is for investigative assistance only."}
              </p>

              {report.disclaimer && (
                <p className="text-xs text-slate-400 mt-2">
                  {report.disclaimer}
                </p>
              )}
            </div>

            <button
              onClick={downloadReport}
              className="bg-green-600 hover:bg-green-700 px-5 py-3 rounded-lg flex items-center gap-2 font-semibold"
            >
              <Download size={18} />
              Export PDF Report
            </button>

          </div>
        </>
      )}

      <p className="text-xs text-slate-500">
        Reports use the connected backend analysis response. Automated
        analysis is investigative assistance only and does not establish
        facts, guilt, innocence or legal liability.
      </p>

    </div>
  );
}