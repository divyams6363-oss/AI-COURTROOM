import { useEffect, useState } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Handle,
  Position
} from "@xyflow/react";

import "@xyflow/react/dist/style.css";
import api from "../services/api";

// Safely convert backend responses into arrays.
const getArray = (data, key) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.[key])) return data[key];
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.items)) return data.items;
  return [];
};

// Custom evidence node.
function EvidenceNode({ data, selected }) {
  return (
    <div
      className={`min-w-[210px] rounded-xl border p-4 shadow-lg ${
        selected
          ? "border-blue-400 bg-slate-800"
          : "border-slate-600 bg-slate-900"
      }`}
    >
      <Handle type="target" position={Position.Top} />

      <div className="flex items-center gap-2">
        <div className="rounded-lg bg-blue-500/20 p-2 text-blue-400">
          📄
        </div>

        <div className="min-w-0">
          <p className="max-w-[155px] truncate text-sm font-semibold text-white">
            {data.filename}
          </p>

          <p className="text-xs text-slate-400">
            Evidence #{data.evidenceId}
          </p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <span className="rounded-md bg-slate-700 px-2 py-1 text-xs text-slate-300">
          {data.fileType || "File"}
        </span>

        <span className="rounded-md bg-blue-500/10 px-2 py-1 text-xs text-blue-300">
          Evidence
        </span>
      </div>

      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}

const nodeTypes = {
  evidenceNode: EvidenceNode
};

export default function Graph() {
  const [cases, setCases] = useState([]);
  const [caseId, setCaseId] = useState("");
  const [graph, setGraph] = useState({
    nodes: [],
    edges: []
  });

  useEffect(() => {
    api.get("/cases")
      .then(res => setCases(res.data))
      .catch(console.error);
  }, []);

  async function loadGraph(id) {
    setCaseId(id);

    try {
      const response = await api.get(`/cases/${id}/graph`);

      setGraph({
        nodes: response.data.nodes || [],
        edges: response.data.edges || []
      });
    } catch (error) {
      console.error(error);
    }
  }

  return (
    <div className="space-y-6 text-white">

      <h1 className="text-3xl font-bold">Evidence Graph</h1>

      <select
        value={caseId}
        onChange={e => loadGraph(e.target.value)}
        className="bg-slate-900 border border-slate-700
        p-3 rounded-lg w-full"
      >
        <option value="">Select a case</option>
        {cases.map(c => (
          <option key={c.id} value={c.id}>{c.title}</option>
        ))}
      </select>

        {selectedCase && (
          <p className="mt-2 text-xs text-slate-400">
            Selected: {selectedCase.title} (ID: {selectedCaseId})
          </p>
        )}

        {error && (
          <p className="mt-3 text-sm text-red-400">
            {error}
          </p>
        )}
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">

        <div className="rounded-xl border border-slate-700 bg-slate-900 p-5">
          <p className="text-sm text-slate-400">Available Cases</p>
          <p className="mt-2 text-2xl font-bold">{cases.length}</p>
        </div>

        <div className="rounded-xl border border-slate-700 bg-slate-900 p-5">
          <p className="text-sm text-slate-400">Evidence Files</p>
          <p className="mt-2 text-2xl font-bold">{evidenceCount}</p>
        </div>

        <div className="rounded-xl border border-slate-700 bg-slate-900 p-5">
          <p className="text-sm text-slate-400">Manual Relationships</p>
          <p className="mt-2 text-2xl font-bold">{relationshipCount}</p>
        </div>

      </div>

      {/* Graph area */}
      <div className="overflow-hidden rounded-xl border border-slate-700 bg-slate-900">

        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-700 p-4">
          <div>
            <h2 className="font-semibold">
              Case Evidence Network
            </h2>

            <p className="mt-1 text-xs text-slate-400">
              Select a case to display its evidence.
            </p>
          </div>

          {loadingEvidence && (
            <span className="text-sm text-blue-400">
              Loading evidence...
            </span>
          )}
        </div>

        {evidenceError && (
          <div className="p-4 text-sm text-red-400">
            {evidenceError}
          </div>
        )}

        {!loadingCases && cases.length === 0 && !error && (
          <div className="flex min-h-[350px] items-center justify-center p-6 text-center text-slate-400">
            No cases found. Create a case first.
          </div>
        )}

        {selectedCaseId && (
          <div className="h-[600px] w-full">

            {loadingEvidence ? (
              <div className="flex h-full items-center justify-center text-slate-400">
                Loading case evidence...
              </div>
            ) : (
              <ReactFlow
                nodes={nodes}
                edges={edges}
                nodeTypes={nodeTypes}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onNodeClick={handleNodeClick}
                fitView
                fitViewOptions={{ padding: 0.25 }}
                minZoom={0.2}
                maxZoom={1.5}
                defaultEdgeOptions={{ type: "smoothstep" }}
              >
                <Background color="#334155" gap={20} />

                <Controls />

                <MiniMap
                  nodeColor={(node) =>
                    node.type === "evidenceNode"
                      ? "#2563eb"
                      : "#1d4ed8"
                  }
                  maskColor="rgba(15, 23, 42, 0.7)"
                />
              </ReactFlow>
            )}

          </div>
        )}

        {!loadingCases && cases.length > 0 && !selectedCaseId && (
          <div className="flex min-h-[350px] items-center justify-center text-slate-400">
            Select an investigation case to view its evidence graph.
          </div>
        )}

      </div>

      {/* Evidence details */}
      {selectedEvidence && (
        <div className="rounded-xl border border-blue-500/30 bg-slate-900 p-5">

          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold">
              Evidence Details
            </h2>

            <button
              onClick={() => setSelectedEvidence(null)}
              className="text-sm text-slate-400 hover:text-white"
            >
              Close
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

            <div>
              <p className="text-xs text-slate-400">Filename</p>
              <p className="mt-1 break-all text-sm">
                {selectedEvidence.filename}
              </p>
            </div>

            <div>
              <p className="text-xs text-slate-400">Evidence ID</p>
              <p className="mt-1 text-sm">
                {selectedEvidence.evidenceId}
              </p>
            </div>

            <div>
              <p className="text-xs text-slate-400">File Type</p>
              <p className="mt-1 text-sm">
                {selectedEvidence.fileType}
              </p>
            </div>

            <div>
              <p className="text-xs text-slate-400">File Size</p>
              <p className="mt-1 text-sm">
                {selectedEvidence.fileSize != null
                  ? `${(Number(selectedEvidence.fileSize) / 1024).toFixed(2)} KB`
                  : "Not available"}
              </p>
            </div>

            <div className="sm:col-span-2">
              <p className="text-xs text-slate-400">SHA-256</p>
              <p className="mt-1 break-all font-mono text-xs text-blue-300">
                {selectedEvidence.sha256 || "Not available"}
              </p>
            </div>

            <div>
              <p className="text-xs text-slate-400">Uploaded At</p>
              <p className="mt-1 text-sm">
                {selectedEvidence.uploadedAt
                  ? new Date(selectedEvidence.uploadedAt).toLocaleString()
                  : "Not available"}
              </p>
            </div>

          </div>

          <p className="mt-4 text-xs text-amber-400">
            Manual graph connections are temporary and are not saved to the backend.
          </p>
        </div>
      )}

      {/* Information */}
      <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
        <p className="text-sm font-medium text-amber-300">
          Graph Information
        </p>

        <p className="mt-1 text-xs leading-5 text-slate-400">
          Case-to-evidence connections show which files belong to the
          selected case. They do not establish whether evidence supports
          or contradicts an allegation. Manually created connections
          are temporary and are not stored by the backend.
        </p>
      </div>

    </div>
  );
}
