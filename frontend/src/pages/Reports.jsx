import { useEffect, useState } from "react";
import { Download, FileText } from "lucide-react";
import api from "../services/api";

export default function Reports() {
  const [cases, setCases] = useState([]);
  const [caseId, setCaseId] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    api.get("/cases")
      .then(res => setCases(res.data))
      .catch(console.error);
  }, []);

  async function downloadReport() {
    if (!caseId) {
      setMessage("Select a case first.");
      return;
    }

    try {
      const response = await api.post(
        `/cases/${caseId}/report`,
        {},
        { responseType: "blob" }
      );

      const url = URL.createObjectURL(response.data);
      const link = document.createElement("a");

      link.href = url;
      link.download = `veritas-report-${caseId}.pdf`;

      document.body.appendChild(link);
      link.click();
      link.remove();

      URL.revokeObjectURL(url);

      setMessage("Report downloaded.");
    } catch {
      setMessage("Report generation failed.");
    }
  }

  return (
    <div className="space-y-6">

      <h1 className="text-3xl font-bold">Reports</h1>

      <div className="bg-[#111827] border border-slate-800
        rounded-xl p-6 space-y-5">

        <FileText size={35} className="text-blue-400" />

        <h2 className="text-xl font-semibold">
          Generate Investigation Report
        </h2>

        <select
          value={caseId}
          onChange={e => setCaseId(e.target.value)}
          className="w-full bg-slate-900 border border-slate-700
          rounded-lg p-3"
        >
          <option value="">Select a case</option>

          {cases.map(c => (
            <option key={c.id} value={c.id}>{c.title}</option>
          ))}
        </select>

        <button
          onClick={downloadReport}
          className="bg-blue-600 px-5 py-3 rounded-lg
          flex items-center gap-2"
        >
          <Download size={18} />
          Generate PDF Report
        </button>

        {message && (
          <p className="text-sm text-slate-300">{message}</p>
        )}

      </div>

    </div>
  );
}