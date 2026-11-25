import { useEffect, useState } from "react";
import { Upload, FileText } from "lucide-react";
import api from "../services/api";

export default function Evidence() {
  const [cases, setCases] = useState([]);
  const [caseId, setCaseId] = useState("");
  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    api.get("/cases")
      .then(res => setCases(res.data))
      .catch(() => setMessage("Unable to load cases."));
  }, []);

  async function uploadEvidence(e) {
    e.preventDefault();

    if (!caseId || !selectedFile) {
      setMessage("Select a case and a file first.");
      return;
    }

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      await api.post(
        `/cases/${caseId}/evidence`,
        formData
      );

      setMessage("Evidence uploaded successfully.");
      setSelectedFile(null);

      await loadEvidence(caseId);

    } catch {
      setMessage("Evidence upload failed.");
    }
  }

  async function loadEvidence(id) {
    try {
      const response = await api.get(`/cases/${id}/evidence`);
      setFiles(response.data);
    } catch {
      setMessage("Could not load evidence.");
    }
  }

  return (
    <div className="space-y-6">

      <h1 className="text-3xl font-bold">Evidence Management</h1>

      <form onSubmit={uploadEvidence}
        className="bg-[#111827] border border-slate-800
        rounded-xl p-6 space-y-5">

        <h2 className="text-xl font-semibold">Upload Evidence</h2>

        <select
          value={caseId}
          onChange={e => {
            setCaseId(e.target.value);
            loadEvidence(e.target.value);
          }}
          className="w-full p-3 rounded-lg bg-slate-900
          border border-slate-700"
        >
          <option value="">Select a case</option>

          {cases.map(item => (
            <option key={item.id} value={item.id}>
              {item.title}
            </option>
          ))}
        </select>

        <input
          type="file"
          accept=".pdf,.txt,.docx,.csv,.xlsx,.png,.jpg,.jpeg"
          onChange={e => setSelectedFile(e.target.files[0])}
          className="w-full p-4 rounded-lg bg-slate-900
          border border-slate-700"
        />

        <button
          className="bg-blue-600 px-5 py-3 rounded-lg
          flex items-center gap-2"
        >
          <Upload size={18} />
          Upload Evidence
        </button>

        {message && (
          <p className="text-sm text-slate-300">{message}</p>
        )}

      </form>

      <div className="space-y-3">

        <h2 className="text-xl font-semibold">
          Uploaded Evidence
        </h2>

        {files.map(file => (
          <div key={file.id}
            className="bg-[#111827] border border-slate-800
            rounded-lg p-4 flex items-center gap-4">

            <FileText className="text-blue-400" />

            <div>
              <p className="font-semibold">{file.filename}</p>
              <p className="text-xs text-slate-400">
                SHA-256: {file.sha256 || "Not available"}
              </p>
            </div>

          </div>
        ))}

      </div>

    </div>
  );
}