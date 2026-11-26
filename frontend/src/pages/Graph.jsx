
import { useEffect, useState } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Handle,
  Position
} from "@xyflow/react";

import "@xyflow/react/dist/style.css";
import api from "../services/api";

function getArray(data, key) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.[key])) return data[key];
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.items)) return data.items;
  return [];
}

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
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [selectedEvidence, setSelectedEvidence] = useState(null);
  const [loadingCases, setLoadingCases] = useState(true);
  const [loadingGraph, setLoadingGraph] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadCases() {
      try {
        const response = await api.get("/cases");
        setCases(getArray(response.data, "cases"));
      } catch (err) {
        console.error("Failed to load cases:", err);
        setError("Unable to load cases. Check the backend connection.");
      } finally {
        setLoadingCases(false);
      }
    }

    loadCases();
  }, []);

  async function loadGraph(id) {
    setCaseId(id);
    setNodes([]);
    setEdges([]);
    setSelectedEvidence(null);
    setError("");

    if (!id) return;

    setLoadingGraph(true);

    try {
      const response = await api.get(`/cases/${id}/graph`);
      const graphData = response.data?.graph || response.data || {};

      const backendNodes = getArray(graphData, "nodes");
      const backendEdges = getArray(graphData, "edges");

      const formattedNodes = backendNodes.map((node, index) => {
        const nodeData = node.data || node;

        const evidenceId =
          nodeData.evidenceId ?? nodeData.evidence_id ?? node.id ?? index + 1;

        return {
          id: String(node.id ?? evidenceId),
          type: "evidenceNode",
          position: node.position || {
            x: (index % 3) * 280,
            y: Math.floor(index / 3) * 180
          },
          data: {
            evidenceId,
            filename:
              nodeData.filename ||
              nodeData.label ||
              nodeData.name ||
              `Evidence ${evidenceId}`,
            fileType:
              nodeData.fileType ||
              nodeData.file_type ||
              "File",
            fileSize:
              nodeData.fileSize ??
              nodeData.file_size,
            sha256: nodeData.sha256,
            uploadedAt:
              nodeData.uploadedAt ||
              nodeData.uploaded_at
          }
        };
      });

      const formattedEdges = backendEdges
        .map((edge, index) => ({
          id: String(edge.id ?? `edge-${index}`),
          source: String(edge.source ?? edge.from ?? ""),
          target: String(edge.target ?? edge.to ?? ""),
          type: "smoothstep",
          animated: false,
          style: { stroke: "#64748b" }
        }))
        .filter(edge =>
          formattedNodes.some(node => node.id === edge.source) &&
          formattedNodes.some(node => node.id === edge.target)
        );

      setNodes(formattedNodes);
      setEdges(formattedEdges);
    } catch (err) {
      console.error("Failed to load evidence graph:", err);
      setError(
        err.response?.data?.detail ||
        "Unable to load the evidence graph for this case."
      );
    } finally {
      setLoadingGraph(false);
    }
  }

  const selectedCase = cases.find(
    item => String(item.id) === String(caseId)
  );

  return (
    <div className="space-y-6 text-white">
      <div>
        <h1 className="text-3xl font-bold">Evidence Graph</h1>
        <p className="mt-2 text-sm text-slate-400">
          Explore relationships between evidence files in an investigation.
        </p>
      </div>

      <div>
        <label className="mb-2 block text-sm text-slate-400">
          Select Investigation
        </label>

        <select
          value={caseId}
          onChange={event => loadGraph(event.target.value)}
          className="w-full rounded-lg border border-slate-700 bg-slate-900 p-3 text-white"
        >
          <option value="">Select a case</option>
          {cases.map(item => (
            <option key={item.id} value={item.id}>
              {item.title || `Case ${item.id}`}
            </option>
          ))}
        </select>
      </div>

      {selectedCase && (
        <p className="text-xs text-slate-400">
          Selected: {selectedCase.title} (ID: {selectedCase.id})
        </p>
      )}

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-700 bg-slate-900 p-5">
          <p className="text-sm text-slate-400">Available Cases</p>
          <p className="mt-2 text-2xl font-bold">{cases.length}</p>
        </div>

        <div className="rounded-xl border border-slate-700 bg-slate-900 p-5">
          <p className="text-sm text-slate-400">Evidence Nodes</p>
          <p className="mt-2 text-2xl font-bold">{nodes.length}</p>
        </div>

        <div className="rounded-xl border border-slate-700 bg-slate-900 p-5">
          <p className="text-sm text-slate-400">Relationships</p>
          <p className="mt-2 text-2xl font-bold">{edges.length}</p>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-700 bg-slate-900">
        <div className="border-b border-slate-700 p-4">
          <h2 className="font-semibold">Case Evidence Network</h2>
          <p className="mt-1 text-xs text-slate-400">
            Evidence relationships returned by the backend.
          </p>
        </div>

        {loadingCases ? (
          <div className="flex min-h-[300px] items-center justify-center text-slate-400">
            Loading cases...
          </div>
        ) : cases.length === 0 ? (
          <div className="flex min-h-[300px] items-center justify-center text-slate-400">
            No cases found. Create a case first.
          </div>
        ) : !caseId ? (
          <div className="flex min-h-[300px] items-center justify-center text-slate-400">
            Select a case to view its evidence graph.
          </div>
        ) : loadingGraph ? (
          <div className="flex min-h-[300px] items-center justify-center text-blue-400">
            Loading evidence graph...
          </div>
        ) : nodes.length === 0 ? (
          <div className="flex min-h-[300px] items-center justify-center p-6 text-center text-slate-400">
            No evidence nodes were returned for this case.
          </div>
        ) : (
          <div className="h-[600px] w-full">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              nodeTypes={nodeTypes}
              onNodeClick={(_, node) => setSelectedEvidence(node.data)}
              fitView
              fitViewOptions={{ padding: 0.25 }}
              minZoom={0.2}
              maxZoom={1.5}
              defaultEdgeOptions={{ type: "smoothstep" }}
            >
              <Background color="#334155" gap={20} />
              <Controls />
              <MiniMap
                nodeColor="#2563eb"
                maskColor="rgba(15, 23, 42, 0.7)"
              />
            </ReactFlow>
          </div>
        )}
      </div>

      {selectedEvidence && (
        <div className="rounded-xl border border-blue-500/30 bg-slate-900 p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold">Evidence Details</h2>
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
        </div>
      )}

      <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
        <p className="text-sm font-medium text-amber-300">
          Graph Information
        </p>
        <p className="mt-1 text-xs leading-5 text-slate-400">
          The graph displays relationships returned by the Evidence Engine.
          A relationship does not by itself establish whether evidence
          supports or contradicts an allegation.
        </p>
      </div>
    </div>
  );
}
