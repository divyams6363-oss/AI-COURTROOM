
import { useEffect, useState } from "react";

import {
  ReactFlow,
  Background,
  Controls,
  MiniMap
} from "@xyflow/react";

import "@xyflow/react/dist/style.css";

import api from "../services/api";

export default function Graph() {
  const [cases, setCases] = useState([]);
  const [caseId, setCaseId] = useState("");
  const [graph, setGraph] = useState({
    nodes: [],
    edges: []
  });

  useEffect(() => {
    api.get("/cases")
      .then((res) => setCases(res.data))
      .catch((error) => {
        console.error("Failed to load cases:", error);
      });
  }, []);

  async function loadGraph(id) {
    setCaseId(id);

    if (!id) {
      setGraph({ nodes: [], edges: [] });
      return;
    }

    try {
      const response = await api.get(`/cases/${id}/graph`);

      setGraph({
        nodes: response.data.nodes || [],
        edges: response.data.edges || []
      });

    } catch (error) {
      console.error("Failed to load graph:", error);
      setGraph({ nodes: [], edges: [] });
    }
  }

  return (
    <div className="space-y-5">

      <h1 className="text-3xl font-bold">
        Evidence Graph
      </h1>

      <p className="text-slate-400">
        Visualize relationships between investigation evidence.
      </p>

      <select
        value={caseId}
        onChange={(e) => loadGraph(e.target.value)}
        className="bg-slate-900 border border-slate-700
        p-3 rounded-lg w-full"
      >
        <option value="">Select a case</option>

        {cases.map((c) => (
          <option key={c.id} value={c.id}>
            {c.title}
          </option>
        ))}

      </select>

      <div className="h-[600px] bg-[#111827]
        border border-slate-800 rounded-xl overflow-hidden">

        <ReactFlow
          nodes={graph.nodes}
          edges={graph.edges}
          fitView
        >
          <Background />
          <Controls />
          <MiniMap />
        </ReactFlow>

      </div>

    </div>
  );
}
