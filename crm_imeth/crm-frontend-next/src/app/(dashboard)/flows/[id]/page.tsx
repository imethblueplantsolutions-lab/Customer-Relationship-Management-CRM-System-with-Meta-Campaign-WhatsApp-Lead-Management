"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  type Connection,
  type NodeTypes,
  Handle,
  Position,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { apiClient } from "@/lib/api-client";
import type { Flow, FlowNode } from "@/types";
import {
  Save,
  ArrowLeft,
  Plus,
  MessageSquare,
  GitBranch,
  HandMetal,
  CircleStop,
  Play,
  Loader2,
  Trash2,
  X,
} from "lucide-react";

// ─── Node type config ────────────────────────────────────────
const NODE_PALETTE = [
  { type: "send_message", label: "Send Message", icon: MessageSquare, color: "#3b82f6" },
  { type: "condition", label: "Condition", icon: GitBranch, color: "#8b5cf6" },
  { type: "handoff", label: "Handoff", icon: HandMetal, color: "#f97316" },
  { type: "end", label: "End", icon: CircleStop, color: "#ef4444" },
];

// ─── Custom node components ──────────────────────────────────
function StartNode({ data }: { data: Record<string, unknown> }) {
  return (
    <div className="rounded-xl border-2 border-emerald-400 bg-emerald-50 px-5 py-3 shadow-md min-w-[160px]">
      <div className="flex items-center gap-2">
        <Play className="h-4 w-4 text-emerald-600" />
        <span className="text-sm font-bold text-emerald-700">Start</span>
      </div>
      <p className="mt-1 text-[10px] text-emerald-500">Flow entry point</p>
      <Handle type="source" position={Position.Bottom} className="!bg-emerald-500" />
    </div>
  );
}

function SendMessageNode({ data }: { data: Record<string, unknown> }) {
  const text = (data.config as Record<string, string>)?.text;
  return (
    <div className="rounded-xl border-2 border-blue-300 bg-blue-50 px-5 py-3 shadow-md min-w-[180px] hover:border-blue-500 cursor-pointer transition-colors">
      <Handle type="target" position={Position.Top} className="!bg-blue-500" />
      <div className="flex items-center gap-2">
        <MessageSquare className="h-4 w-4 text-blue-600" />
        <span className="text-sm font-bold text-blue-700">Send Message</span>
      </div>
      <p className="mt-1 text-xs text-blue-600 truncate max-w-[200px]">
        {text || "Click to type message..."}
      </p>
      <Handle type="source" position={Position.Bottom} className="!bg-blue-500" />
    </div>
  );
}

function ConditionNode({ data }: { data: Record<string, unknown> }) {
  const keyword = (data.config as Record<string, string>)?.subject_key;
  return (
    <div className="rounded-xl border-2 border-purple-300 bg-purple-50 px-5 py-3 shadow-md min-w-[180px] hover:border-purple-500 cursor-pointer transition-colors">
      <Handle type="target" position={Position.Top} className="!bg-purple-500" />
      <div className="flex items-center gap-2">
        <GitBranch className="h-4 w-4 text-purple-600" />
        <span className="text-sm font-bold text-purple-700">Condition</span>
      </div>
      <p className="mt-1 text-xs font-semibold text-purple-700 truncate max-w-[200px]">
        {keyword ? `Matches: "${keyword}"` : "Click to set condition..."}
      </p>
      <Handle type="source" position={Position.Bottom} id="true" className="!bg-emerald-500" style={{ left: "30%" }} />
      <Handle type="source" position={Position.Bottom} id="false" className="!bg-red-500" style={{ left: "70%" }} />
    </div>
  );
}

function HandoffNode({ data }: { data: Record<string, unknown> }) {
  return (
    <div className="rounded-xl border-2 border-orange-300 bg-orange-50 px-5 py-3 shadow-md min-w-[160px]">
      <Handle type="target" position={Position.Top} className="!bg-orange-500" />
      <div className="flex items-center gap-2">
        <HandMetal className="h-4 w-4 text-orange-600" />
        <span className="text-sm font-bold text-orange-700">Handoff</span>
      </div>
      <p className="mt-1 text-[10px] text-orange-500">Transfer to agent</p>
      <Handle type="source" position={Position.Bottom} className="!bg-orange-500" />
    </div>
  );
}

function EndNode() {
  return (
    <div className="rounded-xl border-2 border-red-300 bg-red-50 px-5 py-3 shadow-md min-w-[140px]">
      <Handle type="target" position={Position.Top} className="!bg-red-500" />
      <div className="flex items-center gap-2">
        <CircleStop className="h-4 w-4 text-red-600" />
        <span className="text-sm font-bold text-red-700">End</span>
      </div>
      <p className="mt-1 text-[10px] text-red-500">Flow terminates</p>
    </div>
  );
}

const nodeTypes: NodeTypes = {
  start: StartNode,
  send_message: SendMessageNode,
  condition: ConditionNode,
  handoff: HandoffNode,
  end: EndNode,
};

// ─── Flow Editor Page ────────────────────────────────────────
export default function FlowEditorPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [flow, setFlow] = useState<Flow | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [nodeCounter, setNodeCounter] = useState(0);

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const selectedNode = useMemo(
    () => nodes.find((n) => n.id === selectedNodeId) || null,
    [nodes, selectedNodeId]
  );

  const updateNodeConfig = (nodeId: string, key: string, value: string) => {
    setNodes((nds) =>
      nds.map((n) => {
        if (n.id === nodeId) {
          const currentConfig =
            ((n.data as Record<string, unknown>)?.config as Record<string, unknown>) || {};
          return {
            ...n,
            data: {
              ...n.data,
              config: {
                ...currentConfig,
                [key]: value,
              },
            },
          };
        }
        return n;
      })
    );
  };

  // ─── Load flow ─────────────────────────────────────────────
  useEffect(() => {
    if (!params.id) return;
    (async () => {
      try {
        const res = await apiClient<Flow>(`/flows/${params.id}`);
        if (res.success && res.data) {
          setFlow(res.data);
          const flowNodes = res.data.nodes || [];

          // Convert DB nodes to ReactFlow nodes
          const rfNodes: Node[] = flowNodes.map((n) => ({
            id: n.nodeKey,
            type: n.nodeType,
            position: { x: n.posX, y: n.posY },
            data: { config: n.config, nodeKey: n.nodeKey },
          }));

          // If no nodes exist, seed a start node
          if (rfNodes.length === 0) {
            rfNodes.push({
              id: "start",
              type: "start",
              position: { x: 250, y: 50 },
              data: { config: { next_node_key: "" }, nodeKey: "start" },
            });
          }

          setNodes(rfNodes);
          setNodeCounter(flowNodes.length);

          // Rebuild edges from node configs
          const rfEdges: Edge[] = [];
          for (const n of flowNodes) {
            const cfg = n.config as Record<string, unknown>;
            if (cfg.next_node_key) {
              rfEdges.push({
                id: `${n.nodeKey}->${cfg.next_node_key}`,
                source: n.nodeKey,
                target: cfg.next_node_key as string,
                animated: true,
                style: { stroke: "#94a3b8", strokeWidth: 2 },
              });
            }
            if (cfg.true_next) {
              rfEdges.push({
                id: `${n.nodeKey}->true->${cfg.true_next}`,
                source: n.nodeKey,
                sourceHandle: "true",
                target: cfg.true_next as string,
                animated: true,
                label: "Yes",
                style: { stroke: "#22c55e", strokeWidth: 2 },
              });
            }
            if (cfg.false_next) {
              rfEdges.push({
                id: `${n.nodeKey}->false->${cfg.false_next}`,
                source: n.nodeKey,
                sourceHandle: "false",
                target: cfg.false_next as string,
                animated: true,
                label: "No",
                style: { stroke: "#ef4444", strokeWidth: 2 },
              });
            }
          }
          setEdges(rfEdges);
        }
      } catch (err) {
        console.error("Failed to load flow:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [params.id, setNodes, setEdges]);

  // ─── Connect nodes ─────────────────────────────────────────
  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges((eds) =>
        addEdge(
          {
            ...connection,
            animated: true,
            style: { stroke: "#94a3b8", strokeWidth: 2 },
          },
          eds
        )
      );
    },
    [setEdges]
  );

  // ─── Add node from palette ─────────────────────────────────
  const addNode = useCallback(
    (nodeType: string) => {
      const count = nodeCounter + 1;
      setNodeCounter(count);
      const nodeKey = `${nodeType}_${count}`;

      const newNode: Node = {
        id: nodeKey,
        type: nodeType,
        position: { x: 250, y: 100 + count * 120 },
        data: { config: {}, nodeKey },
      };

      setNodes((nds) => [...nds, newNode]);
    },
    [nodeCounter, setNodes]
  );

  // ─── Delete selected node ──────────────────────────────────
  const deleteSelectedNodes = useCallback(() => {
    setNodes((nds) => nds.filter((n) => !n.selected || n.type === "start"));
    setEdges((eds) =>
      eds.filter((e) => {
        const sourceSelected = nodes.find((n) => n.id === e.source)?.selected;
        const targetSelected = nodes.find((n) => n.id === e.target)?.selected;
        return !sourceSelected && !targetSelected;
      })
    );
  }, [nodes, setNodes, setEdges]);

  // ─── Save ──────────────────────────────────────────────────
  const handleSave = async () => {
    if (!flow) return;
    setSaving(true);
    try {
      const nodesPayload = nodes.map((n) => ({
        nodeKey: n.id,
        nodeType: n.type || "start",
        config: (n.data as Record<string, unknown>)?.config || {},
        posX: n.position.x,
        posY: n.position.y,
      }));

      await apiClient(`/flows/${flow.id}/nodes`, {
        method: "PUT",
        body: JSON.stringify({ nodes: nodesPayload }),
      });
    } catch (err) {
      console.error("Failed to save:", err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-120px)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#128c7e]" />
      </div>
    );
  }

  if (!flow) {
    return (
      <div className="flex h-[calc(100vh-120px)] flex-col items-center justify-center gap-3">
        <p className="text-sm text-slate-500">Flow not found</p>
        <button
          onClick={() => router.push("/flows")}
          className="text-sm text-[#128c7e] hover:underline cursor-pointer"
        >
          ← Back to flows
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-120px)]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 rounded-t-2xl">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/flows")}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h2 className="text-sm font-bold text-slate-800">{flow.name}</h2>
            <p className="text-[10px] text-slate-400">
              {flow.status} • {flow.triggerType} trigger
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={deleteSelectedNodes}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all cursor-pointer"
          >
            <Trash2 className="h-3.5 w-3.5" /> Delete
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#128c7e] px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-[#075e54] disabled:opacity-50 transition-all cursor-pointer"
          >
            <Save className="h-3.5 w-3.5" />
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>

      {/* Canvas + Palette */}
      <div className="flex flex-1 overflow-hidden rounded-b-2xl border border-t-0 border-slate-200">
        {/* Node Palette */}
        <div className="w-52 shrink-0 border-r border-slate-200 bg-slate-50 p-3 space-y-2 overflow-y-auto">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            Add Nodes
          </p>
          {NODE_PALETTE.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.type}
                onClick={() => addNode(item.type)}
                className="flex w-full items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:border-slate-300 transition-all cursor-pointer"
              >
                <div
                  className="flex h-7 w-7 items-center justify-center rounded-lg"
                  style={{ backgroundColor: `${item.color}15`, color: item.color }}
                >
                  <Icon className="h-3.5 w-3.5" />
                </div>
                {item.label}
              </button>
            );
          })}
        </div>

        {/* ReactFlow Canvas */}
        <div className="flex-1 bg-slate-100">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={(_, node) => setSelectedNodeId(node.id)}
            onPaneClick={() => setSelectedNodeId(null)}
            nodeTypes={nodeTypes}
            fitView
            fitViewOptions={{ padding: 0.3 }}
            defaultEdgeOptions={{
              animated: true,
              style: { stroke: "#94a3b8", strokeWidth: 2 },
            }}
          >
            <Background color="#d1d5db" gap={20} size={1} />
            <Controls className="!rounded-xl !border-slate-200 !shadow-md" />
            <MiniMap
              className="!rounded-xl !border-slate-200 !shadow-md"
              nodeColor={(n) => {
                switch (n.type) {
                  case "start": return "#22c55e";
                  case "send_message": return "#3b82f6";
                  case "condition": return "#8b5cf6";
                  case "handoff": return "#f97316";
                  case "end": return "#ef4444";
                  default: return "#94a3b8";
                }
              }}
            />
          </ReactFlow>
        </div>

        {/* Node Configuration Inspector Drawer */}
        {selectedNode && (
          <div className="w-80 shrink-0 border-l border-slate-200 bg-white p-5 space-y-4 overflow-y-auto shadow-lg z-10">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Block Configuration
                </span>
                <h3 className="text-sm font-bold text-slate-800 capitalize">
                  {selectedNode.type?.replace("_", " ")}
                </h3>
              </div>
              <button
                onClick={() => setSelectedNodeId(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors cursor-pointer"
                title="Close settings"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {selectedNode.type === "condition" && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Match Keyword / Reply Condition
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. YES, 1, PRICE"
                    value={
                      ((selectedNode.data as Record<string, unknown>)?.config as Record<string, string>)?.subject_key || ""
                    }
                    onChange={(e) => updateNodeConfig(selectedNode.id, "subject_key", e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:border-[#128c7e] focus:ring-2 focus:ring-[#128c7e]/20 focus:outline-none"
                    autoFocus
                  />
                  <p className="mt-1.5 text-[11px] text-slate-500 leading-normal">
                    If the customer's reply matches this text, the flow branches out through the 🟢 <strong>Green (Yes)</strong> handle. Otherwise, it routes through the 🔴 <strong>Red (No)</strong> handle.
                  </p>
                </div>
              </div>
            )}

            {selectedNode.type === "send_message" && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    WhatsApp Message Text
                  </label>
                  <textarea
                    rows={6}
                    placeholder="Type the message to send to the customer on WhatsApp..."
                    value={
                      ((selectedNode.data as Record<string, unknown>)?.config as Record<string, string>)?.text || ""
                    }
                    onChange={(e) => updateNodeConfig(selectedNode.id, "text", e.target.value)}
                    className="w-full rounded-xl border border-slate-200 p-3 text-xs text-slate-800 placeholder-slate-400 focus:border-[#128c7e] focus:ring-2 focus:ring-[#128c7e]/20 focus:outline-none leading-relaxed"
                    autoFocus
                  />
                  <p className="mt-1.5 text-[11px] text-slate-500 leading-normal">
                    This message will be sent automatically to the customer's WhatsApp chat.
                  </p>
                </div>
              </div>
            )}

            {selectedNode.type === "handoff" && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Department or Agent Note
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Sales Team, Urgent Inquiries"
                    value={
                      ((selectedNode.data as Record<string, unknown>)?.config as Record<string, string>)?.department || ""
                    }
                    onChange={(e) => updateNodeConfig(selectedNode.id, "department", e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:border-[#128c7e] focus:ring-2 focus:ring-[#128c7e]/20 focus:outline-none"
                  />
                  <p className="mt-1.5 text-[11px] text-slate-500 leading-normal">
                    Alerts human agents on the CRM dashboard when a lead reaches this point.
                  </p>
                </div>
              </div>
            )}

            {selectedNode.type === "start" && (
              <p className="text-xs text-slate-500 leading-relaxed">
                This is the entry point. Whatever block is connected below this will run when the flow begins.
              </p>
            )}

            {selectedNode.type === "end" && (
              <p className="text-xs text-slate-500 leading-relaxed">
                This block ends the automated chat session.
              </p>
            )}

            {selectedNode.type !== "start" && (
              <button
                onClick={() => {
                  deleteSelectedNodes();
                  setSelectedNodeId(null);
                }}
                className="w-full mt-4 flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 py-2.5 text-xs font-semibold text-red-600 hover:bg-red-100 transition-colors cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5" /> Delete Block
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
