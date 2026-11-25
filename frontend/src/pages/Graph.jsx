
import { useState, useCallback } from "react";

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
  ShieldCheck
} from "lucide-react";

// Custom evidence node

function EvidenceNode({ data }) {
  const Icon = data.type === "image"
    ? Image
    : data.type === "transaction"
    ? CreditCard
    : FileText;

  return (
    <div className="bg-[#172033] border border-slate-600
      rounded-xl p-4 min-w-[175px] shadow-xl">

      <Handle type="target" position={Position.Top} />

      <div className="flex items-center gap-2 mb-3">
        <Icon size={20} className="text-blue-400" />
        <span className="text-xs text-slate-400">
          {data.type.toUpperCase()}
        </span>
      </div>

      <h3 className="font-semibold text-sm">
        {data.label}
      </h3>

      <p className="text-xs text-slate-400 mt-2">
        {data.description}
      </p>

      <Handle type="source" position={Position.Bottom} />

    </div>
  );
}

const nodeTypes = {
  evidence: EvidenceNode
};

// Sample evidence

const initialNodes = [
  {
    id: "1",
    type: "evidence",
    position: { x: 100, y: 50 },
    data: {
      label: "Bank Statement",
      type: "document",
      description: "Transaction record"
    }
  },
  {
    id: "2",
    type: "evidence",
    position: { x: 450, y: 50 },
    data: {
      label: "Payment Screenshot",
      type: "image",
      description: "Payment confirmation image"
    }
  },
  {
    id: "3",
    type: "evidence",
    position: { x: 270, y: 260 },
    data: {
      label: "Transaction Record",
      type: "transaction",
      description: "Recorded transfer details"
    }
  },
  {
    id: "4",
    type: "evidence",
    position: { x: 650, y: 280 },
    data: {
      label: "Email Document",
      type: "document",
      description: "Communication evidence"
    }
  }
];

const initialEdges = [
  {
    id: "e1-3",
    source: "1",
    target: "3",
    label: "SUPPORTS",
    animated: true,
    style: { stroke: "#22c55e", strokeWidth: 2 },
    labelStyle: { fill: "#22c55e", fontWeight: 600 },
    markerEnd: { type: MarkerType.ArrowClosed }
  },
  {
    id: "e2-3",
    source: "2",
    target: "3",
    label: "CONTRADICTS",
    style: { stroke: "#ef4444", strokeWidth: 2 },
    labelStyle: { fill: "#ef4444", fontWeight: 600 },
    markerEnd: { type: MarkerType.ArrowClosed }
  },
  {
    id: "e3-4",
    source: "3",
    target: "4",
    label: "RELATED",
    style: { stroke: "#60a5fa", strokeWidth: 2 },
    labelStyle: { fill: "#60a5fa", fontWeight: 600 },
    markerEnd: { type: MarkerType.ArrowClosed }
  }
];

export default function Graph() {

  const [nodes, setNodes] = useState(initialNodes);
  const [edges, setEdges] = useState(initialEdges);
  const [selectedNode, setSelectedNode] = useState(null);


  
const onNodesChange = useCallback((changes) => {
  if (!Array.isArray(changes)) return;

  setNodes((previousNodes) => {
    let updatedNodes = [...previousNodes];

    changes.forEach((change) => {
      if (change.type === "position") {
        updatedNodes = updatedNodes.map((node) =>
          node.id === change.id
            ? {
                ...node,
                position: change.position ?? node.position,
                dragging: change.dragging
              }
            : node
        );
      }

      if (change.type === "remove") {
        updatedNodes = updatedNodes.filter(
          (node) => node.id !== change.id
        );
      }
    });

    return updatedNodes;
  });
}, []);

const onEdgesChange = useCallback((changes) => {
  if (!Array.isArray(changes)) return;

  setEdges((previousEdges) =>
    previousEdges.filter(
      (edge) =>
        !changes.some(
          (change) =>
            change.type === "remove" &&
            change.id === edge.id
        )
    )
  );
}, []);


  const onConnect = useCallback((connection) => {
    const newEdge = {
      ...connection,
      id: `edge-${Date.now()}`,
      label: "RELATED",
      markerEnd: { type: MarkerType.ArrowClosed },
      style: { stroke: "#60a5fa", strokeWidth: 2 }
    };

    setEdges(previous => [...previous, newEdge]);
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        <div className="bg-[#111827] border border-slate-800
          rounded-xl p-4">
          <p className="text-slate-400 text-sm">Evidence Nodes</p>
          <h2 className="text-2xl font-bold mt-2">
            {nodes.length}
          </h2>
        </div>

        <div className="bg-[#111827] border border-slate-800
          rounded-xl p-4">
          <p className="text-slate-400 text-sm">Relationships</p>
          <h2 className="text-2xl font-bold mt-2">
            {edges.length}
          </h2>
        </div>

        <div className="bg-[#111827] border border-slate-800
          rounded-xl p-4">
          <p className="text-slate-400 text-sm">
            Contradictions
          </p>
          <h2 className="text-2xl font-bold mt-2 text-red-400">
            {edges.filter(e => e.label === "CONTRADICTS").length}
          </h2>
        </div>

      </div>

      <div className="bg-[#111827] border border-slate-800
        rounded-xl overflow-hidden">

        <div className="p-4 border-b border-slate-800">
          <h2 className="font-semibold">
            Investigation Relationship Map
          </h2>

          <p className="text-xs text-slate-400 mt-1">
            Drag nodes, connect evidence and select nodes for details.
          </p>
        </div>

        <div className="h-[550px]">

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

        </div>

      </div>

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

      {selectedNode && (
        <div className="bg-[#111827] border border-slate-700
          rounded-xl p-5">

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

          <div className="flex items-center gap-2 mt-4
            text-xs text-orange-400">
            <ShieldCheck size={16} />
            Sample relationship data — not backend verified
          </div>

        </div>
      )}

    </div>
  );
}
