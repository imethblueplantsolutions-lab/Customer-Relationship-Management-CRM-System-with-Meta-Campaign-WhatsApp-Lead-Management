"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
  closestCorners,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { apiClient } from "@/lib/api-client";
import { formatCurrency, initials } from "@/lib/utils";
import type { Pipeline, PipelineStage, Deal } from "@/types";
import { PipelineSkeleton } from "@/components/ui/Skeleton";
import {
  GitBranch,
  Plus,
  ChevronDown,
  Calendar,
  Check,
  X,
  Loader2,
} from "lucide-react";

// ─── Default stages for new pipelines ──────────────────────
const DEFAULT_PIPELINE_NAME = "Sales Pipeline";

export default function PipelinesPage() {
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [stages, setStages] = useState<PipelineStage[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialog state
  const [showNewPipeline, setShowNewPipeline] = useState(false);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);

  // Deal form state
  const [showDealForm, setShowDealForm] = useState(false);
  const [dealStageId, setDealStageId] = useState("");
  const [dealTitle, setDealTitle] = useState("");
  const [dealValue, setDealValue] = useState("");

  // Drag state
  const [activeDealId, setActiveDealId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 10 } }),
    useSensor(KeyboardSensor)
  );

  // ─── Data loading ──────────────────────────────────────────
  const loadPipelines = useCallback(async () => {
    try {
      const res = await apiClient<Pipeline[]>("/pipelines");
      if (res.success && res.data) {
        setPipelines(res.data);
        return res.data;
      }
    } catch (err) {
      console.error("Failed to load pipelines:", err);
    }
    return [];
  }, []);

  const loadDeals = useCallback(async (pipelineId: string) => {
    try {
      const res = await apiClient<Deal[]>(`/pipelines/${pipelineId}/deals`);
      if (res.success && res.data) setDeals(res.data);
    } catch (err) {
      console.error("Failed to load deals:", err);
    }
  }, []);

  useEffect(() => {
    (async () => {
      const list = await loadPipelines();
      if (list.length > 0) {
        setSelectedId(list[0].id);
      }
      setLoading(false);
    })();
  }, [loadPipelines]);

  useEffect(() => {
    if (!selectedId) return;
    const pipeline = pipelines.find((p) => p.id === selectedId);
    if (pipeline?.stages) {
      setStages([...pipeline.stages].sort((a, b) => a.position - b.position));
    }
    loadDeals(selectedId);
  }, [selectedId, pipelines, loadDeals]);

  // ─── Create pipeline ──────────────────────────────────────
  const handleCreatePipeline = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const res = await apiClient<Pipeline>("/pipelines", {
        method: "POST",
        body: JSON.stringify({ name: newName.trim() }),
      });
      if (res.success && res.data) {
        const list = await loadPipelines();
        setSelectedId(res.data.id);
        setNewName("");
        setShowNewPipeline(false);
      }
    } catch (err) {
      console.error("Failed to create pipeline:", err);
    } finally {
      setCreating(false);
    }
  };

  // ─── Create deal ───────────────────────────────────────────
  const handleCreateDeal = async () => {
    if (!dealTitle.trim() || !dealStageId) return;
    try {
      await apiClient(`/pipelines/${selectedId}/deals`, {
        method: "POST",
        body: JSON.stringify({
          stageId: dealStageId,
          title: dealTitle.trim(),
          value: parseFloat(dealValue) || 0,
        }),
      });
      await loadDeals(selectedId);
      setDealTitle("");
      setDealValue("");
      setShowDealForm(false);
    } catch (err) {
      console.error("Failed to create deal:", err);
    }
  };

  // ─── Drag & Drop ──────────────────────────────────────────
  const dealsByStage = useMemo(() => {
    const map = new Map<string, Deal[]>();
    for (const stage of stages) map.set(stage.id, []);
    for (const deal of deals) {
      const bucket = map.get(deal.stageId);
      if (bucket) bucket.push(deal);
    }
    return map;
  }, [stages, deals]);

  const activeDeal = activeDealId ? deals.find((d) => d.id === activeDealId) ?? null : null;

  function handleDragStart(event: DragStartEvent) {
    setActiveDealId(String(event.active.id));
  }

  async function handleDragEnd(event: DragEndEvent) {
    setActiveDealId(null);
    const { active, over } = event;
    if (!over) return;
    const dealId = String(active.id);
    const targetStageId = String(over.id);
    const deal = deals.find((d) => d.id === dealId);
    if (!deal || deal.stageId === targetStageId) return;

    // Optimistic update
    setDeals((prev) =>
      prev.map((d) => (d.id === dealId ? { ...d, stageId: targetStageId } : d))
    );

    try {
      await apiClient(`/deals/${dealId}`, {
        method: "PUT",
        body: JSON.stringify({ stageId: targetStageId }),
      });
    } catch {
      // Revert on failure
      await loadDeals(selectedId);
    }
  }

  const selectedPipeline = pipelines.find((p) => p.id === selectedId);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-10 w-48 bg-slate-200/70 rounded-xl animate-pulse" />
          <div className="h-10 w-32 bg-slate-200/70 rounded-xl animate-pulse" />
        </div>
        <PipelineSkeleton columns={4} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="relative">
            <select
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              className="appearance-none rounded-xl border border-slate-200 bg-white pl-10 pr-10 py-2.5 text-sm font-semibold text-slate-800 cursor-pointer focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
            >
              {pipelines.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <GitBranch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-600" />
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowNewPipeline(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" /> New Pipeline
          </button>
          <button
            onClick={() => {
              setDealStageId(stages[0]?.id || "");
              setShowDealForm(true);
            }}
            disabled={!selectedId || stages.length === 0}
            className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-md hover:bg-blue-700 transition-all disabled:opacity-50 cursor-pointer"
          >
            <Plus className="h-4 w-4" /> Add Deal
          </button>
        </div>
      </div>

      {/* Kanban Board */}
      {pipelines.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 py-20">
          <GitBranch className="h-12 w-12 text-slate-300" />
          <h3 className="mt-4 text-lg font-semibold text-slate-600">No pipelines yet</h3>
          <p className="mt-2 text-sm text-slate-400">Create one to start tracking deals</p>
          <button
            onClick={() => setShowNewPipeline(true)}
            className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white cursor-pointer"
          >
            <Plus className="h-4 w-4" /> Create Pipeline
          </button>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={() => setActiveDealId(null)}
        >
          <div className="pipeline-scroll flex snap-x snap-mandatory gap-5 overflow-x-auto pb-4 lg:snap-none">
            {stages.map((stage) => {
              const stageDeals = dealsByStage.get(stage.id) ?? [];
              const totalValue = stageDeals.reduce((s, d) => s + (d.value || 0), 0);
              return (
                <StageColumn
                  key={stage.id}
                  stage={stage}
                  deals={stageDeals}
                  totalValue={totalValue}
                  onAddDeal={() => {
                    setDealStageId(stage.id);
                    setShowDealForm(true);
                  }}
                />
              );
            })}
          </div>

          <DragOverlay dropAnimation={{ duration: 200, easing: "cubic-bezier(0.2,0,0,1)" }}>
            {activeDeal ? (
              <div className="opacity-90">
                <DealCard deal={activeDeal} stage={stages.find((s) => s.id === activeDeal.stageId) ?? null} isOverlay />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      {/* New Pipeline Modal */}
      {showNewPipeline && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-800">New Pipeline</h3>
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Sales Pipeline"
              className="mt-4 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
              onKeyDown={(e) => e.key === "Enter" && handleCreatePipeline()}
              autoFocus
            />
            <p className="mt-2 text-xs text-slate-400">Default stages will be created automatically.</p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setShowNewPipeline(false)}
                className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleCreatePipeline}
                disabled={creating || !newName.trim()}
                className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50 cursor-pointer"
              >
                {creating ? "Creating..." : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Deal Modal */}
      {showDealForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-800">New Deal</h3>
            <div className="mt-4 space-y-3">
              <input
                value={dealTitle}
                onChange={(e) => setDealTitle(e.target.value)}
                placeholder="Deal title"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                autoFocus
              />
              <input
                type="number"
                value={dealValue}
                onChange={(e) => setDealValue(e.target.value)}
                placeholder="Value (USD)"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
              />
              <select
                value={dealStageId}
                onChange={(e) => setDealStageId(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none cursor-pointer"
              >
                {stages.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setShowDealForm(false)}
                className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateDeal}
                disabled={!dealTitle.trim()}
                className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50 cursor-pointer"
              >
                Create Deal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Stage Column ────────────────────────────────────────────
function StageColumn({
  stage,
  deals,
  totalValue,
  onAddDeal,
}: {
  stage: PipelineStage;
  deals: Deal[];
  totalValue: number;
  onAddDeal: () => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.id });

  return (
    <div className="flex w-[85vw] min-w-[260px] max-w-[320px] shrink-0 snap-start flex-col rounded-2xl border border-slate-200/60 bg-white/80 p-5 lg:w-auto lg:max-w-none lg:flex-1 lg:basis-[260px] lg:shrink lg:snap-none shadow-sm">
      <div className="-mx-4 -mt-4 h-[3px] rounded-t-2xl" style={{ backgroundColor: stage.color }} />
      <div className="flex items-center justify-between pt-3">
        <h3 className="truncate text-sm font-semibold text-slate-800">{stage.name}</h3>
        <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">
          {deals.length}
        </span>
      </div>
      <p className="text-xs text-slate-400">{formatCurrency(totalValue)}</p>

      <div
        ref={setNodeRef}
        className={`mt-3 flex flex-1 flex-col gap-2 rounded-xl transition-all min-h-[80px] ${
          isOver ? "bg-blue-600/5 outline outline-2 outline-dashed outline-blue-600 outline-offset-2" : ""
        }`}
      >
        {deals.length === 0 ? (
          <div className="flex flex-1 items-center justify-center rounded-xl border-2 border-dashed border-slate-200 py-8 text-xs text-slate-400">
            Drop deal here
          </div>
        ) : (
          deals.map((deal) => (
            <DraggableDealCard key={deal.id} deal={deal} stage={stage} />
          ))
        )}
      </div>

      <button
        onClick={onAddDeal}
        className="mt-3 flex w-full items-center justify-start gap-1 rounded-xl border border-dashed border-slate-200 bg-transparent px-3 py-2 text-xs font-medium text-slate-400 hover:border-slate-300 hover:text-slate-600 transition-all cursor-pointer"
      >
        <Plus className="h-3 w-3" /> Add deal
      </button>
    </div>
  );
}

// ─── Draggable Deal Card ─────────────────────────────────────
function DraggableDealCard({ deal, stage }: { deal: Deal; stage: PipelineStage }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: deal.id });
  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={{ opacity: isDragging ? 0.3 : 1, touchAction: "none" }}
    >
      <DealCard deal={deal} stage={stage} />
    </div>
  );
}

// ─── Deal Card ───────────────────────────────────────────────
function DealCard({
  deal,
  stage,
  isOverlay,
}: {
  deal: Deal;
  stage: PipelineStage | null;
  isOverlay?: boolean;
}) {
  const contactLabel = deal.lead?.name || deal.lead?.phoneNumber || "No contact";

  return (
    <div
      className={`group relative w-full rounded-xl border border-slate-200/50 bg-slate-50/70 pl-4 pr-3 py-4 text-left shadow-sm transition-all ${
        isOverlay
          ? "shadow-xl"
          : "hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white hover:shadow-md"
      }`}
    >
      <span
        className="absolute left-0 top-0 h-full w-1 rounded-l-xl"
        style={{ backgroundColor: stage?.color ?? "#94a3b8" }}
      />

      <div className="flex items-start justify-between gap-2">
        <h4 className="flex-1 text-sm font-semibold leading-snug text-slate-800 break-words">
          {deal.title}
        </h4>
        {deal.status === "won" && (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-600">
            <Check className="h-3 w-3" /> Won
          </span>
        )}
        {deal.status === "lost" && (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-500">
            <X className="h-3 w-3" /> Lost
          </span>
        )}
      </div>

      <div className="mt-2 flex items-center gap-2">
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-200 text-[10px] font-semibold text-slate-600">
          {initials(deal.lead?.name, deal.lead?.phoneNumber)}
        </span>
        <span className="truncate text-xs text-slate-500">{contactLabel}</span>
      </div>

      <div className="mt-2 flex items-center justify-between">
        <span className="text-sm font-bold text-blue-600">
          {formatCurrency(deal.value, deal.currency)}
        </span>
        {deal.expectedCloseDate && (
          <span className="flex items-center gap-1 text-[11px] text-slate-400">
            <Calendar className="h-3 w-3" />
            {new Date(deal.expectedCloseDate).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}
          </span>
        )}
      </div>
    </div>
  );
}
