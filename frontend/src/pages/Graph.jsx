
import { useEffect, useState, useCallback } from "react";

import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Handle,
  Position,
  MarkerType,
} from "@xyflow/react";

import "@xyflow/react/dist/style.css";

import {
  FileText,
  Image,
  CreditCard,
  X,
  ShieldCheck,
} from "lucide-react";

// Custom evidence node
function EvidenceNode({ data }) {
  const Icon =
    data.type === "image"
      ? Image
      : data.type === "transaction"
      ? CreditCard
      : FileText;

  return (
    <div className="bg-[#172033] border border-slate-600 rounded-xl p-4 min-w-[175px] shadow-xl">
      <Handle type="target" position={Position.Top} />

      <div className="flex items-center gap-2 mb-3">
        <Icon size={20} className="text-blue-400" />
        <span className="text-xs text-slate-400">
          {(data.type || "document").toUpperCase()}
        </span>
      </div>

      <h3 className="font-semibold text-sm">
        {data.label}
      </h3>

      <p className="text-xs text-slate-400 mt-2">
        {data.description || ""}
      </p>

      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}

const nodeTypes = {
  evidence: EvidenceNode,
};

export default function Graph() {
  const [cases, setCases] = useState([]);
  const [caseId, setCaseId] = useState("");
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [error, setError] = useState("");

  // Load cases
  useEffect(() => {
    fetch("http://127.0.0.1:8000/cases")
      .then((res) => {
        if (!res.ok) throw new Error("Failed");
        return res.json();
      })
      .then((data) => setCases(data))
      .catch(() => setError("Unable to load cases."));
  }, []);

  // Load graph for selected case
  async function loadGraph(id) {
    setCaseId(id);
    setError("");
    setSelectedNode(null);

    if (!id) {
      setNodes([]);
      setEdges([]);
      return;
    }

    try {
      const response = await fetch(
        `http://127.0.0.1:8000/cases/${id}/graph`
      );

      if (!response.ok) {
        throw new Error("Graph request failed");
      }

      const data = await response.json();
      const result = data.graph || data;

      setNodes(result.nodes || []);
      setEdges(result.edges || []);
    } catch (err) {
      console.error(err);
      setNodes([]);
      setEdges([]);
      setError("Unable to load evidence graph.");
    }
  }

  // Node changes
  const onNodesChange = useCallback((changes) => {
    setNodes((prev) => {
      let updated = [...prev];

      changes.forEach((change) => {
        if (change.type === "position") {
          updated = updated.map((node) =>
            node.id === change.id
              ? {
                  ...node,
                  position: change.position ?? node.position,
                  dragging: change.dragging,
                }
              : node
          );
        }

        if (change.type === "remove") {
          updated = updated.filter(
            (node) => node.id !== change.id
          );
        }
      });

      return updated;
    });
  }, []);

  // Edge changes
  const onEdgesChange = useCallback((changes) => {
    setEdges((prev) =>
      prev.filter(
        (edge) =>
          !changes.some(
            (change) =>
              change.type === "remove" &&
              change.id === edge.id
          )
      )
    );
  }, []);

  // Connect nodes
  const onConnect = useCallback((connection) => {
    const newEdge = {
      ...connection,
      id: `edge-${Date.now()}`,
      label: "RELATED",
      markerEnd: { type: MarkerType.ArrowClosed },
      style: { stroke: "#60a5fa", strokeWidth: 2 },
    };

    setEdges((prev) => [...prev, newEdge]);
  }, []);

  return (
    <div className="space-y-6">

      <div>
        <h1 className="text-3xl font-bold">
          Evidence Graph
        </h1>

        <p className="text-slate-400 mt-2">
          Visualize relationships between investigation evidence.
        </p>
      </div>

      {/* Case selection */}
      <div className="bg-[#111827] border border-slate-800 rounded-xl p-4">

        <label className="text-sm text-slate-400">
          Select Case
        </label>

        <select
          value={caseId}
          onChange={(e) => loadGraph(e.target.value)}
          className="bg-slate-900 border border-slate-700 p-3 rounded-lg w-full mt-2"
        >
          <option value="">Select a case</option>

          {cases.map((c) => (
            <option key={c.id} value={c.id}>
              {c.title}
            </option>
          ))}
        </select>

        {error && (
          <p className="text-red-400 mt-3">
            {error}
          </p>
        )}
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        <div className="bg-[#111827] border border-slate-800 rounded-xl p-4">
          <p className="text-slate-400 text-sm">
            Evidence Nodes
          </p>

          <h2 className="text-2xl font-bold mt-2">
            {nodes.length}
          </h2>
        </div>

        <div className="bg-[#111827] border border-slate-800 rounded-xl p-4">
          <p className="text-slate-400 text-sm">
            Relationships
          </p>

          <h2 className="text-2xl font-bold mt-2">
            {edges.length}
          </h2>
        </div>

        <div className="bg-[#111827] border border-slate-800 rounded-xl p-4">
          <p className="text-slate-400 text-sm">
            Contradictions
          </p>

          <h2 className="text-2xl font-bold mt-2 text-red-400">
            {edges.filter((e) => e.label === "CONTRADICTS").length}
          </h2>
        </div>

      </div>

      {/* Graph */}
      <div className="bg-[#111827] border border-slate-800 rounded-xl overflow-hidden">

        <div className="p-4 border-b border-slate-800">
          <h2 className="font-semibold">
            Investigation Relationship Map
          </h2>

          <p className="text-xs text-slate-400 mt-1">
            Drag nodes, connect evidence and select nodes for details.
          </p>
        </div>

        <div className="h-[550px]">

          {nodes.length > 0 ? (
            <ReactFlow
              nodes={nodes}
              edges={edges}
              nodeTypes={nodeTypes}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onNodeClick={(_, node) => setSelectedNode(node)}
              fitView
              nodesConnectable={true}
            >
              <Background color="#334155" gap={20} />
              <Controls />
              <MiniMap />
            </ReactFlow>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-400">
              {caseId
                ? "No evidence relationships available."
                : "Select a case to view its evidence graph."}
            </div>
          )}

        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-5 text-sm text-slate-400">

        <span className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-green-500" />
          Supports
        </span>

        <span className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-red-500" />
          Contradicts
        </span>

        <span className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-blue-500" />
          Related
        </span>

      </div>

      {/* Selected node details */}
      {selectedNode && (
        <div className="bg-[#111827] border border-slate-700 rounded-xl p-5">

          <div className="flex justify-between items-center">

            <h2 className="font-bold text-lg">
              Evidence Details
            </h2>

            <button onClick={() => setSelectedNode(null)}>
              <X />
            </button>

          </div>

          <h3 className="text-blue-400 font-semibold mt-4">
            {selectedNode.data.label}
          </h3>

          <p className="text-slate-400 mt-2">
            {selectedNode.data.description}
          </p>

          <p className="text-xs text-slate-500 mt-3">
            Evidence ID: {selectedNode.id}
          </p>

          <div className="flex items-center gap-2 mt-4 text-xs text-orange-400">
            <ShieldCheck size={16} />
            Evidence relationship visualization
          </div>

        </div>
      )}

    </div>
  );
}
