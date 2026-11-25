
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
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/cases")
      .then(res => setCases(res.data))
      .catch(() => setError("Unable to load cases."));
  }, []);

  async function loadGraph(id) {
    setCaseId(id);
    setError("");

    if (!id) {
      setGraph({ nodes: [], edges: [] });
      return;
    }

    try {
      const response = await api.get(
        `/cases/${id}/graph`
      );

      const result = response.data.graph || {};

      setGraph({
        nodes: result.nodes || [],
        edges: result.edges || []
      });

    } catch (error) {
      console.error(error);
      setError("Unable to load evidence graph.");
    }
  }

  return (
    <div className="space-y-5">

      <h1 className="text-3xl font-bold">
        Evidence Relationship Graph
      </h1>

      <select
        value={caseId}
        onChange={e => loadGraph(e.target.value)}
        className="bg-slate-900 border border-slate-700
        p-3 rounded-lg w-full"
      >
        <option value="">Select a case</option>

        {cases.map(c => (
          <option key={c.id} value={c.id}>
            {c.title}
          </option>
        ))}
      </select>

      {error && (
        <p className="text-red-400">{error}</p>
      )}

      {graph.nodes.length === 0 && (
        <p className="text-slate-400">
          No evidence relationships available.
          Upload at least two evidence files containing
          shared keywords to generate connections.
        </p>
      )}

      <div className="h-[600px] bg-[#111827]
        border border-slate-800 rounded-xl">

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
