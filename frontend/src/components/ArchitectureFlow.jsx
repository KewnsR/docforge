import React, { useEffect, useMemo } from 'react';
import {
  Background,
  Controls,
  Handle,
  MarkerType,
  Position,
  ReactFlow,
  useNodesState,
  useEdgesState,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

function cleanLabel(value) {
  return value
    .replace(/^\[|\]$/g, '')
    .replace(/^\(|\)$/g, '')
    .replace(/^\"|\"$/g, '')
    .trim();
}

function layoutNodes(nodesById, edges) {
  const incoming = new Map(Array.from(nodesById.keys(), id => [id, 0]));
  const outgoing = new Map(Array.from(nodesById.keys(), id => [id, []]));

  edges.forEach(edge => {
    if (!outgoing.has(edge.source) || !incoming.has(edge.target)) return;
    outgoing.get(edge.source).push(edge.target);
    incoming.set(edge.target, incoming.get(edge.target) + 1);
  });

  const levels = new Map();
  const queue = Array.from(incoming.entries())
    .filter(([, count]) => count === 0)
    .map(([id]) => id);

  queue.forEach(id => levels.set(id, 0));
  while (queue.length) {
    const source = queue.shift();
    const level = levels.get(source) || 0;
    outgoing.get(source).forEach(target => {
      levels.set(target, Math.max(levels.get(target) || 0, level + 1));
      incoming.set(target, incoming.get(target) - 1);
      if (incoming.get(target) === 0) queue.push(target);
    });
  }

  Array.from(nodesById.keys()).forEach(id => {
    if (!levels.has(id)) levels.set(id, 0);
  });

  const columns = new Map();
  Array.from(nodesById.values()).forEach(node => {
    const level = levels.get(node.id);
    if (!columns.has(level)) columns.set(level, []);
    columns.get(level).push(node);
  });

  return Array.from(columns.entries()).flatMap(([level, column]) => (
    column.map((node, index) => ({
      id: node.id,
      type: 'architecture',
      data: { label: node.label },
      position: {
        x: level * 270 + 56,
        y: index * 108 + 48,
      },
    }))
  ));
}

function parseArchitecture(content) {
  const lines = String(content || '')
    .replace(/^```(?:mermaid)?\s*/i, '')
    .replace(/\s*```\s*$/i, '')
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean);
  const nodesById = new Map();
  const edges = [];
  const edgeKeys = new Set();

  const addNode = (id, label) => {
    if (!id || id.toLowerCase() === 'end' || id.toLowerCase() === 'subgraph') return;
    if (!nodesById.has(id)) nodesById.set(id, { id, label: cleanLabel(label || id) });
  };

  const nodePattern = /\b([A-Za-z][A-Za-z0-9_]*)\s*(\[\[.*?\]\]|\(\(.*?\)\)|\[.*?\]|\(.*?\)|\{.*?\})/g;
  const edgePattern = /([A-Za-z][A-Za-z0-9_]*)\s*(?:-->|---|-\.->|==>)\s*(?:\|([^|]+)\|\s*)?([A-Za-z][A-Za-z0-9_]*)/g;
  const addEdge = (source, target) => {
    if (!source || !target || source === target) return;
    const edgeKey = `${source}->${target}`;
    if (edgeKeys.has(edgeKey)) return;
    edgeKeys.add(edgeKey);
    addNode(source);
    addNode(target);
    edges.push({
      id: `edge-${edges.length}`,
      source,
      target,
      type: 'smoothstep',
      markerEnd: { type: MarkerType.ArrowClosed, color: 'var(--primary)' },
    });
  };

  lines.forEach(line => {
    if (/^(graph|flowchart|subgraph|end|style|classDef|click)\b/i.test(line)) {
      if (/^subgraph\b/i.test(line)) {
        const match = line.match(/^subgraph\s+([A-Za-z][A-Za-z0-9_]*)?(?:\[\"([^\"]+)\"\])?/i);
        if (match?.[1]) addNode(match[1], match[2] || match[1]);
      }
      return;
    }

    let match;
    while ((match = nodePattern.exec(line)) !== null) addNode(match[1], match[2]);
    while ((match = edgePattern.exec(line)) !== null) {
      addEdge(match[1], match[3]);
    }

    const chainedEdges = line.matchAll(/([A-Za-z][A-Za-z0-9_]*)\s*(?:-->|---|-\.->|==>)\s*(?:\|[^|]+\|\s*)?([A-Za-z][A-Za-z0-9_]*)/g);
    const chainNodes = Array.from(chainedEdges, match => match[2]);
    if (chainNodes.length > 1) {
      chainNodes.slice(1).forEach((target, index) => addEdge(chainNodes[index], target));
    }
  });

  if (nodesById.size === 0) {
    addNode('Architecture', 'Architecture Map');
    addNode('Source', 'Generated project structure');
    addEdge('Architecture', 'Source');
  }

  return { nodes: layoutNodes(nodesById, edges), edges };
}

function ArchitectureNode({ data }) {
  return (
    <div className="architecture-flow-node">
      <Handle type="target" position={Position.Left} />
      <span title={data.label}>{data.label}</span>
      <Handle type="source" position={Position.Right} />
    </div>
  );
}

const nodeTypes = { architecture: ArchitectureNode };

function ArchitectureFlow({ content }) {
  const graph = useMemo(() => parseArchitecture(content), [content]);
  const [nodes, setNodes, onNodesChange] = useNodesState(graph.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(graph.edges);

  useEffect(() => {
    setNodes(graph.nodes);
    setEdges(graph.edges);
  }, [graph, setEdges, setNodes]);

  return (
    <div className="architecture-flow-canvas">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        fitView
        fitViewOptions={{ padding: 0.3, minZoom: 0.45, maxZoom: 1.1 }}
        minZoom={0.25}
        maxZoom={2}
        defaultEdgeOptions={{
          type: 'smoothstep',
          markerEnd: { type: MarkerType.ArrowClosed, color: 'var(--primary)' },
          style: { stroke: 'var(--primary)', strokeWidth: 1.25 },
          labelStyle: { fill: 'var(--text-secondary)', fontSize: 9, fontWeight: 600 },
          labelBgStyle: { fill: 'var(--panel-bg)', fillOpacity: 0.96 },
          labelBgPadding: [5, 3],
          labelBgBorderRadius: 4,
        }}
      >
        <Background color="var(--border-color)" gap={28} size={1} />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  );
}

export default ArchitectureFlow;
