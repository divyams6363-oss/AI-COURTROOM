
import { useEffect, useState } from "react";
import { Upload, FileText, RefreshCw, Loader2, ShieldCheck } from "lucide-react";
import api from "../services/api";

export default function Evidence() {
  const [cases, setCases] = useState([]);
  const [caseId, setCaseId] = useState("");
  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);

  const [loadingCases, setLoadingCases] = useState(true);
  const [loadingEvidence, setLoadingEvidence] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [verifyingId, setVerifyingId] = useState(null);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [integrityResults, setIntegrityResults] = useState({});

  useEffect(() => {
    loadCases();
  }, []);

  async function loadCases() {
    setLoadingCases(true);
    setError("");

    try {
      const response = await api.get("/cases");

      const caseList = Array.isArray(response.data)
        ? response.data
        : response.data?.cases || [];

      setCases(caseList);

      if (caseList.length > 0) {
        setCaseId((previous) => {
          const exists = caseList.some(
            (item) => String(item.id) === String(previous)
          );

          return exists ? previous : String(caseList[0].id);
        });
      } else {
        setCaseId("");
        setFiles([]);
      }
    } catch (err) {
      console.error("Cases loading error:", err);
      setError("Unable to load cases. Check the backend connection.");
    } finally {
      setLoadingCases(false);
    }
  }

  async function loadEvidence(id) {
    if (!id) {
      setFiles([]);
      return;
    }

    setLoadingEvidence(true);
    setError("");

    try {
      const response = await api.get(`/cases/${id}/evidence`);

      const evidenceList = Array.isArray(response.data)
        ? response.data
        : response.data?.evidence || [];

      setFiles(evidenceList);
      setIntegrityResults({});
    } catch (err) {
      console.error("Evidence loading error:", err);
      setFiles([]);
      setError("Could not load evidence for this case.");
    } finally {
      setLoadingEvidence(false);
    }
  }

  useEffect(() => {
    if (caseId) {
      loadEvidence(caseId);
    }
  }, [caseId]);

  async function uploadEvidence(e) {
    e.preventDefault();

    if (!caseId || !selectedFile) {
      setError("Select a case and a file first.");
      return;
    }

    const formData = new FormData();
    formData.append("file", selectedFile);

    setUploading(true);
    setError("");
    setMessage("");

    try {
      await api.post(
        `/cases/${caseId}/evidence`,
        formData
      );

      setMessage("Evidence uploaded successfully.");
      setSelectedFile(null);

      // Clear the file input after successful upload.
      e.target.reset();

      await loadEvidence(caseId);
    } catch (err) {
      console.error("Evidence upload error:", err);

      setError(
        err.response?.data?.detail ||
        "Evidence upload failed. Please try again."
      );
    } finally {
      setUploading(false);
    }
  }

  async function verifyIntegrity(evidenceId) {
    setVerifyingId(evidenceId);
    setError("");

    try {
      const response = await api.get(
        `/evidence/${evidenceId}/integrity`
      );

      setIntegrityResults((previous) => ({
        ...previous,
        [evidenceId]: response.data
      }));
    } catch (err) {
      console.error("Integrity verification error:", err);
      setError("Unable to verify evidence integrity.");
    } finally {
      setVerifyingId(null);
    }
  }

  function formatSize(bytes) {
    if (bytes === undefined || bytes === null) return "Size unavailable";

    if (bytes < 1024) return `${bytes} bytes`;
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(2)} KB`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }

  return (
    <div className="space-y-6 text-white">

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">
            Evidence Management
          </h1>

          <p className="text-slate-400 mt-2">
            Upload, review and verify investigation evidence.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            loadCases();
            if (caseId) loadEvidence(caseId);
          }}
          disabled={loadingCases || loadingEvidence}
          className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 px-4 py-2 rounded-lg"
        >
          <RefreshCw size={17} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-300 rounded-lg p-4">
          {error}
        </div>
      )}

      {message && (
        <div className="bg-green-500/10 border border-green-500/30 text-green-300 rounded-lg p-4">
          {message}
        </div>
      )}

      <form
        onSubmit={uploadEvidence}
        className="bg-[#111827] border border-slate-800 rounded-xl p-6 space-y-5"
      >
        <Upload size={35} className="text-blue-400" />

        <h2 className="text-xl font-semibold">
          Upload Evidence
        </h2>

        <div>
          <label className="block text-sm text-slate-400 mb-2">
            Select Investigation Case
          </label>

          <select
            value={caseId}
            onChange={(e) => {
              setCaseId(e.target.value);
              setMessage("");
              setError("");
            }}
            disabled={loadingCases || uploading}
            className="w-full p-3 rounded-lg bg-slate-900 border border-slate-700 text-white"
          >
            <option value="">Select a case</option>

            {cases.map((item) => (
              <option key={item.id} value={String(item.id)}>
                {`CASE-${String(item.id).padStart(3, "0")} — ${item.title}`}
              </option>
            ))}
          </select>

          {loadingCases && (
            <p className="text-xs text-slate-400 mt-2">
              Loading cases...
            </p>
          )}

          {!loadingCases && cases.length === 0 && (
            <p className="text-xs text-yellow-300 mt-2">
              No cases available. Create a case first.
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm text-slate-400 mb-2">
            Select Evidence File
          </label>

          <input
            type="file"
            accept=".pdf,.txt,.png,.jpg,.jpeg"
            onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
            disabled={!caseId || uploading}
            className="w-full p-4 rounded-lg bg-slate-900 border border-slate-700 text-white"
          />

          {selectedFile && (
            <p className="text-sm text-slate-400 mt-2">
              Selected: {selectedFile.name}
            </p>
          )}

          <p className="text-xs text-slate-500 mt-2">
            Supported formats: PDF, TXT, PNG and JPEG.
          </p>
        </div>

        <button
          type="submit"
          disabled={!caseId || !selectedFile || uploading}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-40 px-5 py-3 rounded-lg flex items-center gap-2 font-semibold"
        >
          {uploading ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload size={18} />
              Upload Evidence
            </>
          )}
        </button>
      </form>

      <div className="space-y-4">

        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-semibold">
            Uploaded Evidence
          </h2>

          <span className="text-sm text-slate-400">
            {files.length} file(s)
          </span>
        </div>

        {loadingEvidence && (
          <div className="bg-[#111827] border border-slate-800 rounded-xl p-6 flex items-center gap-3 text-slate-400">
            <Loader2 size={20} className="animate-spin" />
            Loading evidence...
          </div>
        )}

        {!loadingEvidence && !caseId && (
          <div className="bg-[#111827] border border-slate-800 rounded-xl p-6 text-slate-400">
            Select a case to view its evidence.
          </div>
        )}

        {!loadingEvidence && caseId && files.length === 0 && (
          <div className="bg-[#111827] border border-slate-800 rounded-xl p-8 text-center">
            <FileText size={35} className="mx-auto text-slate-500" />

            <p className="font-semibold mt-3">
              No evidence uploaded yet
            </p>

            <p className="text-sm text-slate-400 mt-1">
              Upload evidence to see it listed here.
            </p>
          </div>
        )}

        {!loadingEvidence && files.map((file) => {
          const integrity = integrityResults[file.id];

          return (
            <div
              key={file.id}
              className="bg-[#111827] border border-slate-800 rounded-xl p-5 space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">

                <div className="flex items-start gap-3 min-w-0">
                  <FileText
                    size={25}
                    className="text-blue-400 shrink-0"
                  />

                  <div className="min-w-0">
                    <p className="font-semibold break-all">
                      {file.filename}
                    </p>

                    <p className="text-xs text-slate-400 mt-1">
                      Evidence ID: {file.id}
                    </p>

                    <p className="text-xs text-slate-400 mt-1">
                      {formatSize(file.file_size)}
                    </p>

                    <p className="text-xs text-slate-400 mt-1">
                      Uploaded: {file.uploaded_at
                        ? new Date(file.uploaded_at).toLocaleString()
                        : "Date unavailable"}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => verifyIntegrity(file.id)}
                  disabled={verifyingId === file.id}
                  className="bg-slate-800 hover:bg-slate-700 disabled:opacity-50 px-4 py-2 rounded-lg flex items-center justify-center gap-2 text-sm shrink-0"
                >
                  {verifyingId === file.id ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <ShieldCheck size={16} />
                  )}

                  Verify Integrity
                </button>

              </div>

              <div>
                <p className="text-xs text-slate-400 mb-1">
                  SHA-256 Hash
                </p>

                <p className="text-xs text-slate-300 break-all bg-slate-900 rounded-lg p-3">
                  {file.sha256 || "Hash unavailable"}
                </p>
              </div>

              {integrity && (
                <div className="bg-slate-900 rounded-lg p-4 space-y-2">
                  <p className="font-semibold text-sm">
                    Integrity Verification
                  </p>

                  <p className={`text-sm font-semibold ${
                    integrity.verified
                      ? "text-green-400"
                      : "text-red-400"
                  }`}>
                    {integrity.verified
                      ? "Integrity Verified"
                      : formatStatus(integrity.status)}
                  </p>

                  <p className="text-xs text-slate-400 break-all">
                    Original SHA-256: {integrity.original_sha256 || "Unavailable"}
                  </p>

                  <p className="text-xs text-slate-400 break-all">
                    Current SHA-256: {integrity.current_sha256 || "Unavailable"}
                  </p>
                </div>
              )}
            </div>
          );
        })}

      </div>

    </div>
  );
}

function formatStatus(status) {
  if (!status) return "Verification status unavailable";

  return String(status).replace(/[_-]/g, " ");
}
