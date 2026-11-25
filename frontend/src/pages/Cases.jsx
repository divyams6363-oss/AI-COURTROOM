import { useEffect, useState } from "react";
import { Plus, FolderOpen } from "lucide-react";
import api from "../services/api";

export default function Cases() {
  const [cases, setCases] = useState([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function loadCases() {
    try {
      const response = await api.get("/cases");
      setCases(response.data);
      setError("");
    } catch {
      setError("Cannot connect to backend. Check whether it is running.");
    }
  }

  useEffect(() => {
    loadCases();
  }, []);

  async function createCase(e) {
    e.preventDefault();

    if (!title.trim()) return;

    setLoading(true);

    try {
      await api.post("/cases", {
        title,
        description
      });

      setTitle("");
      setDescription("");
      await loadCases();
    } catch {
      setError("Unable to create case.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">

      <div>
        <h1 className="text-3xl font-bold">Case Management</h1>
        <p className="text-slate-400 mt-2">
          Create and manage investigations.
        </p>
      </div>

      <form onSubmit={createCase}
        className="bg-[#111827] border border-slate-800
        rounded-xl p-6 space-y-4">

        <h2 className="text-xl font-semibold">Create New Case</h2>

        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Case title"
          className="w-full p-3 rounded-lg bg-slate-900
          border border-slate-700 outline-none"
          required
        />

        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="Case description"
          className="w-full p-3 rounded-lg bg-slate-900
          border border-slate-700 outline-none"
          rows="3"
        />

        <button disabled={loading}
          className="bg-blue-600 px-5 py-3 rounded-lg
          flex items-center gap-2 disabled:opacity-50">

          <Plus size={18} />
          {loading ? "Creating..." : "Create Case"}

        </button>

      </form>

      {error && <p className="text-red-400">{error}</p>}

      <div className="grid md:grid-cols-2 gap-5">

        {cases.map(item => (
          <div key={item.id}
            className="bg-[#111827] border border-slate-800
            rounded-xl p-6">

            <FolderOpen className="text-blue-400" />

            <h3 className="font-bold text-xl mt-4">
              {item.title}
            </h3>

            <p className="text-slate-400 mt-2">
              {item.description}
            </p>

            <p className="text-xs text-slate-500 mt-4">
              Case ID: {item.id}
            </p>

          </div>
        ))}

      </div>

      {cases.length === 0 && !error && (
        <p className="text-slate-400">
          No cases created yet.
        </p>
      )}

    </div>
  );
}