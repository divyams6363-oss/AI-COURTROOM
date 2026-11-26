
import { useEffect, useState } from "react";
import {
  Plus,
  FolderOpen,
  Search,
  X,
  Eye,
  Calendar,
  FileText,
  ShieldCheck,
  History,
  Brain,
  Scale,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Lightbulb,
  Gavel,
  Info,
  Loader2
} from "lucide-react";

import api from "../services/api";

const demoCases = [
  {
    id: "CASE-001",
    title: "Financial Transaction Investigation",
    description:
      "Investigation of suspicious financial transactions and conflicting records.",
    status: "Under Investigation",
    date: "2026-11-20",
    evidenceCount: 4
  },
  {
    id: "CASE-002",
    title: "Document Verification Case",
    description:
      "Verification of documents and identification of inconsistencies.",
    status: "Pending Review",
    date: "2026-11-22",
    evidenceCount: 2
  },
  {
    id: "CASE-003",
    title: "Digital Evidence Analysis",
    description:
      "Analysis of digital records and supporting evidence.",
    status: "Completed",
    date: "2026-11-24",
    evidenceCount: 6
  }
];

function formatCase(item) {
  const backendId = item.id;

  return {
    ...item,
    backendId,
    id: `CASE-${String(backendId).padStart(4, "0")}`,
    title: item.title || "Untitled Case",
    description: item.description || "",
    status: item.status || "Under Investigation",
    date: item.created_at
      ? item.created_at.slice(0, 10)
      : new Date().toISOString().slice(0, 10),
    evidenceCount: item.evidence_count || 0,
    allegation: item.allegation || ""
  };
}

function normalizeCases(data) {
  if (Array.isArray(data)) {
    return data.map(formatCase);
  }

  if (Array.isArray(data?.cases)) {
    return data.cases.map(formatCase);
  }

  if (data && typeof data === "object" && data.id !== undefined) {
    return [formatCase(data)];
  }

  return [];
}

function normalizeEvidence(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.evidence)) return data.evidence;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.files)) return data.files;
  return [];
}

function normalizeAuditLogs(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.logs)) return data.logs;
  return [];
}

function severityColor(severity) {
  switch (severity?.toLowerCase()) {
    case "high":
      return "text-red-400 bg-red-500/10 border-red-500/30";
    case "medium":
      return "text-orange-400 bg-orange-500/10 border-orange-500/30";
    case "low":
      return "text-green-400 bg-green-500/10 border-green-500/30";
    default:
      return "text-slate-300 bg-slate-800 border-slate-700";
  }
}

function AnalysisCard({ title, icon: Icon, children, color = "blue" }) {
  const iconColors = {
    blue: "text-blue-400 bg-blue-500/10",
    green: "text-green-400 bg-green-500/10",
    orange: "text-orange-400 bg-orange-500/10",
    purple: "text-purple-400 bg-purple-500/10",
    red: "text-red-400 bg-red-500/10"
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${iconColors[color] || iconColors.blue}`}>
          <Icon size={21} />
        </div>

        <h4 className="font-semibold text-slate-100">
          {title}
        </h4>
      </div>

      {children}
    </div>
  );
}

function Disclaimer({ children }) {
  if (!children) return null;

  return (
    <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-3">
      <p className="text-xs text-orange-300 flex gap-2">
        <Info size={16} className="shrink-0" />
        {children}
      </p>
    </div>
  );
}

export default function Cases() {
  const [cases, setCases] = useState(() => {
    try {
      const saved = localStorage.getItem("veritas_demo_cases");
      return saved ? JSON.parse(saved) : demoCases;
    } catch {
      return demoCases;
    }
  });

  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [selectedCase, setSelectedCase] = useState(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [apiError, setApiError] = useState("");
  const [usingBackend, setUsingBackend] = useState(false);

  // Evidence states
  const [evidenceItems, setEvidenceItems] = useState([]);
  const [evidenceFile, setEvidenceFile] = useState(null);
  const [uploadingEvidence, setUploadingEvidence] = useState(false);
  const [evidenceError, setEvidenceError] = useState("");
  const [evidenceMessage, setEvidenceMessage] = useState("");

  // Integrity states
  const [integrityResults, setIntegrityResults] = useState({});
  const [verifyingId, setVerifyingId] = useState(null);

  // Audit Trail states
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditError, setAuditError] = useState("");

  // AI Analysis states
  const [analysis, setAnalysis] = useState(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisError, setAnalysisError] = useState("");

  // Fetch evidence
  async function fetchEvidence(caseId) {
    const response = await api.get(`/cases/${caseId}/evidence`);
    const items = normalizeEvidence(response.data);

    setEvidenceItems(items);
    return items;
  }

  // Fetch audit logs
  async function fetchAuditLogs(caseId) {
    if (!caseId) return;

    setAuditLoading(true);
    setAuditError("");

    try {
      const response = await api.get(`/cases/${caseId}/audit-logs`);

      const logs = normalizeAuditLogs(response.data);

      const sortedLogs = [...logs].sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at)
      );

      setAuditLogs(sortedLogs);
      return sortedLogs;
    } catch (error) {
      console.error("Failed to fetch audit logs:", error);
      setAuditError("Could not load audit logs. Please try again.");
    } finally {
      setAuditLoading(false);
    }
  }

  // Fetch cases and evidence counts
  async function fetchCases() {
    const response = await api.get("/cases");
    const backendCases = normalizeCases(response.data);

    const casesWithEvidence = await Promise.all(
      backendCases.map(async (item) => {
        try {
          const evidenceResponse = await api.get(
            `/cases/${item.backendId}/evidence`
          );

          const evidence = normalizeEvidence(evidenceResponse.data);

          return {
            ...item,
            evidenceCount: evidence.length
          };
        } catch (error) {
          console.error(
            `Failed to fetch evidence for case ${item.backendId}:`,
            error
          );

          return item;
        }
      })
    );

    setCases(casesWithEvidence);
    setUsingBackend(true);
    setApiError("");
  }

  // Load cases
  useEffect(() => {
    async function loadCases() {
      try {
        await fetchCases();
      } catch (error) {
        console.error("Failed to fetch cases:", error);

        setUsingBackend(false);
        setApiError(
          "Could not connect to backend. Showing saved demo cases."
        );
      } finally {
        setLoading(false);
      }
    }

    loadCases();
  }, []);

  // Save local fallback
  useEffect(() => {
    localStorage.setItem(
      "veritas_demo_cases",
      JSON.stringify(cases)
    );
  }, [cases]);

  // Load evidence when case changes
  useEffect(() => {
    if (!selectedCase?.backendId) {
      setEvidenceItems([]);
      setIntegrityResults({});
      return;
    }

    let cancelled = false;

    async function loadEvidence() {
      setEvidenceItems([]);
      setIntegrityResults({});
      setEvidenceError("");
      setEvidenceMessage("");

      try {
        const response = await api.get(
          `/cases/${selectedCase.backendId}/evidence`
        );

        const items = normalizeEvidence(response.data);

        if (!cancelled) {
          setEvidenceItems(items);
        }
      } catch (error) {
        console.error("Failed to load evidence:", error);

        if (!cancelled) {
          setEvidenceError(
            "Could not load evidence files. Please try again."
          );
        }
      }
    }

    loadEvidence();

    return () => {
      cancelled = true;
    };
  }, [selectedCase?.backendId]);

  // Load audit logs when case changes
  useEffect(() => {
    if (!selectedCase?.backendId) {
      setAuditLogs([]);
      setAuditError("");
      return;
    }

    setAuditLogs([]);
    fetchAuditLogs(selectedCase.backendId);
  }, [selectedCase?.backendId]);

  // Reset analysis when opening a different case
  useEffect(() => {
    setAnalysis(null);
    setAnalysisError("");
    setAnalysisLoading(false);
  }, [selectedCase?.backendId]);

  // Create case
  async function createCase(e) {
    e.preventDefault();

    if (!title.trim() || !description.trim()) return;

    setCreating(true);
    setApiError("");

    try {
      await api.post("/cases", {
        title: title.trim(),
        description: description.trim(),
        allegation: ""
      });

      await fetchCases();

      setTitle("");
      setDescription("");
      setShowForm(false);
    } catch (error) {
      console.error("Failed to create case:", error);

      setApiError(
        error.response?.data?.detail ||
        "Unable to create case. Please check the backend connection."
      );
    } finally {
      setCreating(false);
    }
  }

  // Verify evidence integrity
  async function verifyEvidence(evidenceId) {
    if (!evidenceId) return;

    setVerifyingId(evidenceId);

    try {
      const response = await api.get(
        `/evidence/${evidenceId}/integrity`
      );

      setIntegrityResults((prev) => ({
        ...prev,
        [evidenceId]: response.data
      }));

      if (selectedCase?.backendId) {
        await fetchAuditLogs(selectedCase.backendId);
      }
    } catch (error) {
      console.error("Integrity verification failed:", error);

      setIntegrityResults((prev) => ({
        ...prev,
        [evidenceId]: {
          verified: false,
          status:
            error.response?.data?.detail ||
            "Verification request failed"
        }
      }));
    } finally {
      setVerifyingId(null);
    }
  }

  // Upload evidence
  async function uploadEvidence() {
    if (!evidenceFile || !selectedCase?.backendId) {
      setEvidenceError("Please select a file first.");
      return;
    }

    const formData = new FormData();
    formData.append("file", evidenceFile);

    setUploadingEvidence(true);
    setEvidenceError("");
    setEvidenceMessage("");

    try {
      await api.post(
        `/cases/${selectedCase.backendId}/evidence`,
        formData
      );

      const items = await fetchEvidence(selectedCase.backendId);

      setSelectedCase((prev) => ({
        ...prev,
        evidenceCount: items.length
      }));

      setCases((prev) =>
        prev.map((item) =>
          item.backendId === selectedCase.backendId
            ? { ...item, evidenceCount: items.length }
            : item
        )
      );

      setEvidenceFile(null);
      setEvidenceMessage("Evidence uploaded successfully!");
      setIntegrityResults({});

      await fetchAuditLogs(selectedCase.backendId);

      const fileInput = document.getElementById(
        "evidence-file-input"
      );

      if (fileInput) fileInput.value = "";
    } catch (error) {
      console.error("Evidence upload failed:", error);

      setEvidenceError(
        error.response?.data?.detail ||
        "Evidence upload failed. Please try again."
      );
    } finally {
      setUploadingEvidence(false);
    }
  }

  // Run VERITAS AI analysis
  async function runAnalysis() {
    if (!selectedCase?.backendId) return;

    setAnalysisLoading(true);
    setAnalysisError("");
    setAnalysis(null);

    try {
      const response = await api.post(
        `/cases/${selectedCase.backendId}/analyze`
      );

      if (!response.data || typeof response.data !== "object") {
        throw new Error("The backend returned an invalid analysis response.");
      }

      setAnalysis(response.data);

      // Refresh audit trail after analysis
      await fetchAuditLogs(selectedCase.backendId);
    } catch (error) {
      console.error("AI analysis failed:", error);

      const detail =
        error.response?.data?.detail ||
        error.message ||
        "Unable to run AI analysis.";

      setAnalysisError(
        typeof detail === "string"
          ? detail
          : JSON.stringify(detail)
      );
    } finally {
      setAnalysisLoading(false);
    }
  }

  const filteredCases = cases.filter((item) =>
    item.title.toLowerCase().includes(search.toLowerCase()) ||
    item.id.toLowerCase().includes(search.toLowerCase())
  );

  function statusColor(status) {
    if (status === "Completed") return "text-green-400";
    if (status === "Pending Review") return "text-orange-400";
    return "text-blue-400";
  }

  function formatAction(action) {
    if (!action) return "Activity";

    return action
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (char) => char.toUpperCase());
  }

  return (
    <div className="space-y-7">

      {/* Page Header */}
      <div className="flex flex-wrap justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">
            Case Management
          </h1>

          <p className="text-slate-400 mt-2">
            Create, organize and manage investigations.
          </p>
        </div>

        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 hover:bg-blue-700 px-5 py-3 rounded-lg flex items-center gap-2"
        >
          <Plus size={19} />
          Create New Case
        </button>
      </div>

      {/* API Error */}
      {apiError && (
        <div className="bg-orange-500/10 border border-orange-500/30 text-orange-300 rounded-lg p-3 text-sm">
          {apiError}
        </div>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#111827] border border-slate-800 rounded-xl p-5">
          <p className="text-slate-400 text-sm">Total Cases</p>
          <h2 className="text-3xl font-bold mt-2">{cases.length}</h2>
        </div>

        <div className="bg-[#111827] border border-slate-800 rounded-xl p-5">
          <p className="text-slate-400 text-sm">Under Investigation</p>
          <h2 className="text-3xl font-bold mt-2">
            {cases.filter((c) => c.status === "Under Investigation").length}
          </h2>
        </div>

        <div className="bg-[#111827] border border-slate-800 rounded-xl p-5">
          <p className="text-slate-400 text-sm">Completed</p>
          <h2 className="text-3xl font-bold mt-2">
            {cases.filter((c) => c.status === "Completed").length}
          </h2>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search
          className="absolute left-4 top-3.5 text-slate-400"
          size={19}
        />

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search cases by name or ID..."
          className="w-full bg-[#111827] border border-slate-800 rounded-xl py-3 pl-12 pr-4 outline-none focus:border-blue-500"
        />
      </div>

      {/* Cases List */}
      {loading ? (
        <p className="text-center text-slate-400 py-10">
          Loading cases from backend...
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredCases.map((item) => (
            <div
              key={item.backendId ?? item.id}
              className="bg-[#111827] border border-slate-800 rounded-xl p-6 hover:border-blue-500 transition"
            >
              <div className="flex justify-between">
                <div className="bg-blue-500/10 p-3 rounded-lg">
                  <FolderOpen className="text-blue-400" size={24} />
                </div>

                <span className={`text-sm ${statusColor(item.status)}`}>
                  ● {item.status}
                </span>
              </div>

              <p className="text-xs text-slate-500 mt-5">{item.id}</p>

              <h2 className="font-bold text-xl mt-2">{item.title}</h2>

              <p className="text-slate-400 text-sm mt-2">
                {item.description}
              </p>

              <div className="flex justify-between mt-6 pt-4 border-t border-slate-800 text-sm text-slate-400">
                <span className="flex items-center gap-2">
                  <FileText size={15} />
                  {item.evidenceCount} Evidence
                </span>

                <span className="flex items-center gap-2">
                  <Calendar size={15} />
                  {item.date}
                </span>
              </div>

              <button
                onClick={() => setSelectedCase(item)}
                className="mt-5 w-full bg-slate-800 hover:bg-blue-600 rounded-lg p-3 flex items-center justify-center gap-2"
              >
                <Eye size={17} />
                View Case
              </button>
            </div>
          ))}
        </div>
      )}

      {!loading && filteredCases.length === 0 && (
        <p className="text-center text-slate-400 py-10">
          No matching cases found.
        </p>
      )}

      {/* Create Case Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <form
            onSubmit={createCase}
            className="bg-[#111827] border border-slate-700 rounded-xl p-7 w-full max-w-lg space-y-5"
          >
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold">Create New Case</h2>

              <button
                type="button"
                onClick={() => setShowForm(false)}
              >
                <X />
              </button>
            </div>

            <input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter case title"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3"
            />

            <textarea
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the investigation..."
              rows="4"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3"
            />

            <button
              type="submit"
              disabled={creating}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg p-3"
            >
              {creating ? "Creating..." : "Create Case"}
            </button>
          </form>
        </div>
      )}

      {/* Case Details Modal */}
      {selectedCase && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-[#111827] border border-slate-700 rounded-xl p-5 sm:p-7 w-full max-w-3xl max-h-[92vh] overflow-y-auto space-y-5">

            {/* Modal Header */}
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold">Case Details</h2>

              <button
                type="button"
                onClick={() => setSelectedCase(null)}
                className="text-slate-400 hover:text-white"
              >
                <X />
              </button>
            </div>

            <p className="text-blue-400 text-sm">{selectedCase.id}</p>

            <h3 className="text-2xl font-bold">{selectedCase.title}</h3>

            <p className="text-slate-400">{selectedCase.description}</p>

            {selectedCase.allegation && (
              <p className="text-slate-300">
                Allegation: {selectedCase.allegation}
              </p>
            )}

            <p className="text-slate-300">Status: {selectedCase.status}</p>
            <p className="text-slate-300">
              Evidence: {evidenceItems.length}
            </p>
            <p className="text-slate-400 text-sm">
              Date: {selectedCase.date}
            </p>

            {/* Evidence Management */}
            <div className="border-t border-slate-700 pt-5 space-y-4">
              <h3 className="font-semibold text-lg">Evidence Management</h3>

              <input
                id="evidence-file-input"
                type="file"
                onChange={(e) => {
                  setEvidenceFile(e.target.files?.[0] || null);
                  setEvidenceError("");
                  setEvidenceMessage("");
                }}
                className="block w-full text-sm text-slate-300 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-600 file:text-white"
              />

              {evidenceFile && (
                <p className="text-sm text-slate-400">
                  Selected: {evidenceFile.name}
                </p>
              )}

              <button
                type="button"
                onClick={uploadEvidence}
                disabled={!evidenceFile || uploadingEvidence}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg p-3"
              >
                {uploadingEvidence ? "Uploading..." : "Upload Evidence"}
              </button>

              {evidenceError && (
                <p className="text-sm text-red-400">{evidenceError}</p>
              )}

              {evidenceMessage && (
                <p className="text-sm text-green-400">{evidenceMessage}</p>
              )}

              <h4 className="font-medium">Uploaded Evidence</h4>

              {evidenceItems.length === 0 ? (
                <p className="text-sm text-slate-400">
                  No evidence files uploaded yet.
                </p>
              ) : (
                <div className="space-y-3">
                  {evidenceItems.map((item, index) => {
                    const result = integrityResults[item.id];

                    return (
                      <div
                        key={item.id ?? index}
                        className="bg-slate-900 rounded-lg p-3 text-sm space-y-3"
                      >
                        <div className="flex items-center gap-3">
                          <FileText size={22} className="text-blue-400 shrink-0" />

                          <div className="min-w-0 flex-1">
                            <p className="text-slate-200 break-all">
                              {item.filename ||
                                item.file_name ||
                                item.original_filename ||
                                item.name ||
                                `Evidence ${index + 1}`}
                            </p>

                            {item.file_size !== undefined && (
                              <p className="text-xs text-slate-500 mt-1">
                                {(item.file_size / 1024).toFixed(2)} KB
                              </p>
                            )}

                            {item.id && (
                              <p className="text-xs text-slate-500 mt-1">
                                Evidence ID: {item.id}
                              </p>
                            )}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => verifyEvidence(item.id)}
                          disabled={!item.id || verifyingId === item.id}
                          className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg px-4 py-2 flex items-center justify-center gap-2"
                        >
                          <ShieldCheck size={17} />
                          {verifyingId === item.id
                            ? "Verifying..."
                            : "Verify Integrity"}
                        </button>

                        {result && (
                          <div
                            className={`rounded-lg p-3 ${
                              result.verified
                                ? "bg-green-500/10 border border-green-500/30"
                                : "bg-red-500/10 border border-red-500/30"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <ShieldCheck
                                size={19}
                                className={
                                  result.verified
                                    ? "text-green-400"
                                    : "text-red-400"
                                }
                              />

                              <p
                                className={
                                  result.verified
                                    ? "text-green-400 font-semibold"
                                    : "text-red-400 font-semibold"
                                }
                              >
                                {result.status ||
                                  (result.verified
                                    ? "Integrity verified"
                                    : "Integrity verification failed")}
                              </p>
                            </div>

                            {result.original_sha256 && (
                              <div className="mt-3">
                                <p className="text-xs text-slate-400 mb-1">
                                  Original SHA-256
                                </p>
                                <p className="text-xs text-slate-300 break-all">
                                  {result.original_sha256}
                                </p>
                              </div>
                            )}

                            {result.current_sha256 && (
                              <div className="mt-3">
                                <p className="text-xs text-slate-400 mb-1">
                                  Current SHA-256
                                </p>
                                <p className="text-xs text-slate-300 break-all">
                                  {result.current_sha256}
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* AI Case Analysis */}
            <div className="border-t border-slate-700 pt-5 space-y-5">

              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <Brain className="text-purple-400" size={22} />
                    VERITAS AI Case Analysis
                  </h3>

                  <p className="text-xs text-slate-400 mt-1">
                    Multi-perspective investigative assessment
                  </p>
                </div>

                <button
                  type="button"
                  onClick={runAnalysis}
                  disabled={analysisLoading}
                  className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 rounded-lg px-4 py-3 flex items-center justify-center gap-2 text-sm font-medium"
                >
                  {analysisLoading ? (
                    <>
                      <Loader2 size={17} className="animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Brain size={17} />
                      {analysis ? "Run Again" : "Run AI Analysis"}
                    </>
                  )}
                </button>
              </div>

              {analysisError && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 space-y-3">
                  <p className="text-sm text-red-300">
                    {analysisError}
                  </p>

                  <button
                    type="button"
                    onClick={runAnalysis}
                    disabled={analysisLoading}
                    className="text-sm bg-red-500/20 hover:bg-red-500/30 px-3 py-2 rounded-lg flex items-center gap-2"
                  >
                    <RefreshCw size={15} />
                    Try Again
                  </button>
                </div>
              )}

              {analysisLoading && (
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center space-y-3">
                  <Loader2
                    size={34}
                    className="animate-spin text-purple-400 mx-auto"
                  />
                  <p className="font-medium text-slate-200">
                    VERITAS is analyzing this case...
                  </p>
                  <p className="text-sm text-slate-400">
                    Examining evidence, investigative gaps and alternative explanations.
                  </p>
                </div>
              )}

              {!analysis && !analysisLoading && !analysisError && (
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-center space-y-3">
                  <Brain size={35} className="text-purple-400 mx-auto" />

                  <p className="font-medium text-slate-200">
                    AI analysis has not been run yet
                  </p>

                  <p className="text-sm text-slate-400">
                    Click Run AI Analysis to generate prosecution, defence,
                    devil's advocate and judge assessments.
                  </p>
                </div>
              )}

              {analysis && (
                <div className="space-y-5">

                  {/* Judge Assessment Overview */}
                  {analysis.judge && (
                    <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-5 space-y-4">
                      <div className="flex flex-wrap justify-between items-center gap-3">
                        <div className="flex items-center gap-2">
                          <Gavel className="text-purple-400" size={23} />
                          <h4 className="font-bold text-lg">
                            {analysis.judge.title || "AI Judge Assessment"}
                          </h4>
                        </div>

                        <span
                          className={`text-xs uppercase font-bold px-3 py-2 rounded-full border ${
                            analysis.judge.status === "inconclusive"
                              ? "text-orange-300 bg-orange-500/10 border-orange-500/30"
                              : "text-blue-300 bg-blue-500/10 border-blue-500/30"
                          }`}
                        >
                          {analysis.judge.status || "Assessment"}
                        </span>
                      </div>

                      <p className="text-sm text-slate-300">
                        {analysis.judge.summary}
                      </p>

                      {analysis.judge.case_statistics && (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          {[
                            {
                              label: "Total Evidence",
                              value: analysis.judge.case_statistics.total_evidence
                            },
                            {
                              label: "Readable",
                              value: analysis.judge.case_statistics.readable_evidence
                            },
                            {
                              label: "Unreadable",
                              value: analysis.judge.case_statistics.unreadable_evidence
                            },
                            {
                              label: "Information Gaps",
                              value: analysis.judge.case_statistics.potential_information_gaps
                            }
                          ].map((stat) => (
                            <div
                              key={stat.label}
                              className="bg-slate-900/80 rounded-lg p-3"
                            >
                              <p className="text-xs text-slate-400">
                                {stat.label}
                              </p>
                              <p className="text-2xl font-bold mt-1">
                                {stat.value ?? "—"}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}

                      {analysis.judge.issues_requiring_human_review?.length > 0 && (
                        <div>
                          <h5 className="font-semibold text-sm mb-2 flex items-center gap-2">
                            <AlertTriangle size={16} className="text-orange-400" />
                            Issues Requiring Human Review
                          </h5>

                          <ul className="space-y-2">
                            {analysis.judge.issues_requiring_human_review.map(
                              (issue, index) => (
                                <li
                                  key={index}
                                  className="text-sm text-slate-300 flex gap-2"
                                >
                                  <span className="text-purple-400">•</span>
                                  {issue}
                                </li>
                              )
                            )}
                          </ul>
                        </div>
                      )}

                      <Disclaimer>
                        {analysis.judge.final_notice}
                      </Disclaimer>
                    </div>
                  )}

                  {/* Prosecution */}
                  {analysis.prosecution && (
                    <AnalysisCard
                      title={analysis.prosecution.title || "Prosecution Analysis"}
                      icon={Scale}
                      color="green"
                    >
                      <p className="text-sm text-slate-300">
                        {analysis.prosecution.summary}
                      </p>

                      <h5 className="font-semibold text-sm">
                        Relevant Evidence
                      </h5>

                      {analysis.prosecution.relevant_evidence?.length > 0 ? (
                        <div className="space-y-3">
                          {analysis.prosecution.relevant_evidence.map(
                            (item, index) => (
                              <div
                                key={`${item.evidence_id}-${index}`}
                                className="bg-slate-800/70 rounded-lg p-3 space-y-2"
                              >
                                <p className="font-medium text-sm break-all">
                                  {item.filename}
                                </p>

                                <p className="text-xs text-blue-300">
                                  Evidence ID: {item.evidence_id}
                                </p>

                                <div>
                                  <div className="flex justify-between text-xs text-slate-400 mb-1">
                                    <span>Relevance score</span>
                                    <span>
                                      {typeof item.relevance_score === "number"
                                        ? `${(item.relevance_score * 100).toFixed(1)}%`
                                        : "N/A"}
                                    </span>
                                  </div>

                                  <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-green-500 rounded-full"
                                      style={{
                                        width: `${Math.max(
                                          0,
                                          Math.min(
                                            100,
                                            (item.relevance_score || 0) * 100
                                          )
                                        )}%`
                                      }}
                                    />
                                  </div>
                                </div>

                                <p className="text-sm text-slate-300">
                                  {item.analysis}
                                </p>

                                {item.limitation && (
                                  <p className="text-xs text-orange-300">
                                    Limitation: {item.limitation}
                                  </p>
                                )}
                              </div>
                            )
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-slate-400">
                          No relevant evidence identified.
                        </p>
                      )}

                      <Disclaimer>
                        {analysis.prosecution.disclaimer}
                      </Disclaimer>
                    </AnalysisCard>
                  )}

                  {/* Defence */}
                  {analysis.defence && (
                    <AnalysisCard
                      title={analysis.defence.title || "Defence Analysis"}
                      icon={ShieldCheck}
                      color="blue"
                    >
                      <p className="text-sm text-slate-300">
                        {analysis.defence.summary}
                      </p>

                      <h5 className="font-semibold text-sm">
                        Questions to Investigate
                      </h5>

                      <div className="space-y-3">
                        {analysis.defence.questions?.map((item, index) => (
                          <div
                            key={index}
                            className="bg-slate-800/70 rounded-lg p-3"
                          >
                            <p className="text-sm font-medium text-slate-200">
                              {index + 1}. {item.question}
                            </p>

                            <p className="text-xs text-slate-400 mt-2">
                              {item.reason}
                            </p>
                          </div>
                        ))}
                      </div>

                      {analysis.defence.evidence_to_review?.length > 0 && (
                        <>
                          <h5 className="font-semibold text-sm">
                            Evidence to Review
                          </h5>

                          <div className="space-y-2">
                            {analysis.defence.evidence_to_review.map(
                              (item, index) => (
                                <div
                                  key={index}
                                  className="bg-slate-800/70 rounded-lg p-3"
                                >
                                  <p className="text-sm font-medium break-all">
                                    {item.filename}
                                  </p>
                                  <p className="text-xs text-slate-400 mt-1">
                                    {item.observation}
                                  </p>
                                </div>
                              )
                            )}
                          </div>
                        </>
                      )}

                      <Disclaimer>
                        {analysis.defence.disclaimer}
                      </Disclaimer>
                    </AnalysisCard>
                  )}

                  {/* Devil's Advocate */}
                  {analysis.devil_advocate && (
                    <AnalysisCard
                      title={analysis.devil_advocate.title || "Devil's Advocate"}
                      icon={AlertTriangle}
                      color="orange"
                    >
                      <p className="text-sm text-slate-300">
                        {analysis.devil_advocate.summary}
                      </p>

                      <div className="space-y-3">
                        {analysis.devil_advocate.challenges?.map(
                          (item, index) => (
                            <div
                              key={index}
                              className="bg-slate-800/70 rounded-lg p-3 space-y-2"
                            >
                              <div className="flex flex-wrap justify-between gap-2">
                                <p className="font-medium text-sm">
                                  {item.issue}
                                </p>

                                <span
                                  className={`text-xs px-2 py-1 rounded border uppercase ${severityColor(item.severity)}`}
                                >
                                  {item.severity || "Unknown"}
                                </span>
                              </div>

                              <p className="text-sm text-slate-300">
                                {item.challenge}
                              </p>
                            </div>
                          )
                        )}
                      </div>

                      <Disclaimer>
                        {analysis.devil_advocate.disclaimer}
                      </Disclaimer>
                    </AnalysisCard>
                  )}

                  {/* Blind Spot Detection */}
                  {analysis.blind_spots && (
                    <AnalysisCard
                      title={analysis.blind_spots.title || "Blind Spot Detection"}
                      icon={Lightbulb}
                      color="purple"
                    >
                      <p className="text-sm text-slate-300">
                        {analysis.blind_spots.summary}
                      </p>

                      <div className="space-y-3">
                        {analysis.blind_spots.potential_gaps?.map(
                          (item, index) => (
                            <div
                              key={index}
                              className="bg-slate-800/70 rounded-lg p-3 space-y-2"
                            >
                              <div className="flex items-center gap-2">
                                <AlertTriangle
                                  size={16}
                                  className="text-orange-400"
                                />
                                <p className="font-medium text-sm">
                                  {item.item}
                                </p>
                              </div>

                              <p className="text-sm text-slate-300">
                                {item.recommendation}
                              </p>

                              <p className="text-xs text-orange-300">
                                {item.status}
                              </p>
                            </div>
                          )
                        )}
                      </div>

                      {analysis.blind_spots.mentioned_categories?.length > 0 && (
                        <div>
                          <h5 className="font-semibold text-sm mb-2">
                            Categories Mentioned
                          </h5>

                          <div className="flex flex-wrap gap-2">
                            {analysis.blind_spots.mentioned_categories.map(
                              (item, index) => (
                                <span
                                  key={index}
                                  className="text-xs bg-blue-500/10 text-blue-300 border border-blue-500/20 rounded-full px-3 py-2"
                                >
                                  {item}
                                </span>
                              )
                            )}
                          </div>
                        </div>
                      )}

                      <Disclaimer>
                        {analysis.blind_spots.important_limitation}
                      </Disclaimer>
                    </AnalysisCard>
                  )}

                  {/* Engine Details */}
                  {analysis.engine && (
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
                      <h4 className="font-semibold flex items-center gap-2">
                        <Brain size={18} className="text-purple-400" />
                        Analysis Engine Information
                      </h4>

                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-xs text-slate-500">Engine</p>
                          <p className="text-slate-200 mt-1">
                            {analysis.engine.name}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-slate-500">Version</p>
                          <p className="text-slate-200 mt-1">
                            {analysis.engine.version}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-slate-500">Mode</p>
                          <p className="text-slate-200 mt-1">
                            {analysis.engine.mode}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-slate-500">Model Based</p>
                          <p className="text-slate-200 mt-1">
                            {analysis.engine.model_based ? "Yes" : "No"}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Overall Disclaimer */}
                  <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-4">
                    <p className="text-sm font-semibold text-orange-300 flex items-center gap-2 mb-2">
                      <Info size={18} />
                      Important Legal Disclaimer
                    </p>

                    <p className="text-xs text-slate-300 leading-relaxed">
                      {analysis.disclaimer ||
                        "Automated analysis is for investigative assistance only. It does not establish facts or determine legal guilt."}
                    </p>
                  </div>

                  <p className="text-xs text-slate-500 text-center">
                    Analysis ID: {analysis.case_id ?? selectedCase.backendId}
                    {" · "}
                    {analysis.case_title || selectedCase.title}
                  </p>
                </div>
              )}
            </div>

            {/* Audit Trail */}
            <div className="border-t border-slate-700 pt-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <History size={20} className="text-blue-400" />
                    Audit Trail
                  </h3>

                  <p className="text-xs text-slate-400 mt-1">
                    Complete history of case activities
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => fetchAuditLogs(selectedCase.backendId)}
                  disabled={auditLoading}
                  className="text-sm bg-slate-800 hover:bg-blue-600 disabled:opacity-50 px-3 py-2 rounded-lg"
                >
                  {auditLoading ? "Loading..." : "Refresh"}
                </button>
              </div>

              {auditError && (
                <p className="text-sm text-red-400">{auditError}</p>
              )}

              {auditLoading && auditLogs.length === 0 ? (
                <p className="text-sm text-slate-400">
                  Loading audit history...
                </p>
              ) : auditLogs.length === 0 && !auditError ? (
                <p className="text-sm text-slate-400">
                  No activities recorded yet.
                </p>
              ) : (
                <div className="space-y-3">
                  {auditLogs.map((log) => (
                    <div
                      key={log.id}
                      className="bg-slate-900 border border-slate-800 rounded-lg p-3"
                    >
                      <div className="flex items-start gap-3">
                        <div className="bg-blue-500/10 p-2 rounded-lg">
                          <ShieldCheck size={18} className="text-blue-400" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-200">
                            {formatAction(log.action)}
                          </p>

                          <p className="text-sm text-slate-400 mt-1 break-words">
                            {log.details}
                          </p>

                          <div className="flex flex-wrap gap-3 mt-2 text-xs text-slate-500">
                            <span>Log ID: {log.id}</span>
                            <span>{log.created_at}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setSelectedCase(null)}
              className="bg-blue-600 hover:bg-blue-700 p-3 rounded-lg w-full"
            >
              Close
            </button>

          </div>
        </div>
      )}

      {/* Backend Connection Status */}
      <p className="text-xs text-slate-500">
        {usingBackend
          ? "Connected to AI-COURTROOM backend. Cases are loaded from the database."
          : "Demo data only. Backend connection is currently unavailable."}
      </p>
    </div>
  );
}
