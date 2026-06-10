"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import RichTextEditor from "@/components/ui/rich-text-editor";
import BannerUpload from "@/components/ui/banner-upload";
import ModuleQuizEditor from "@/components/module-quiz-editor";
import type { QuizQuestion } from "@/components/module-quiz-editor";
import {
  DndContext, closestCenter, PointerSensor,
  useSensor, useSensors, type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext, useSortable,
  verticalListSortingStrategy, arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// ─── Types ────────────────────────────────────────────────────

interface ContextOption {
  key: string; label: string; icon: string; color: string; description: string | null;
}

interface StageLocal {
  stageNumber:   number;
  title:         string;
  instruction:   string;
  hint:          string;
  maxScore:      number;
  type:          string;
  options:       Record<string, unknown>;
  correctAnswer: string;
  // dirty tracking
  dirty: boolean;
  saving: boolean;
  error:  string;
}

interface ModuleLocal {
  title:        string;
  subtitle:     string;
  scenario:     string;
  bannerUrl:    string;
  context:      string;
  icon:         string;
  timeEstimate: string;
  status:       string;
  dirty: boolean;
  saving: boolean;
  error:  string;
}

// ─── Helpers ─────────────────────────────────────────────────

const PHASE_OF = (n: number) => {
  if (n <= 3)  return { label: "Understanding", color: "#3B82C4" };
  if (n <= 7)  return { label: "Analysis",      color: "#8B5CF6" };
  if (n <= 10) return { label: "Solution",      color: "#F59E0B" };
  return               { label: "Reflection",   color: "#4A9B7F" };
};

const TYPE_LABELS: Record<string, string> = {
  MULTIPLE_CHOICE:  "Multiple Choice",
  RANKING:          "Arrangement",
  OPEN_ENDED:       "Open-Ended",
  TABLE_INPUT:      "Table Input",
  CHECKLIST:        "Checklist",
  COMPUTATION:      "Computation",
  MULTI_PLAN:       "Multi-Plan",
  BUDGET_CHECK:     "Trial/Budget",
  SELECT_JUSTIFY:   "Select & Justify",
  REFLECTION_SLIDER:"Reflection Slider",
};

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1">{children}</p>
  );
}

function TextField({
  value, onChange, placeholder, multiline = false, rows = 3,
}: {
  value: string; onChange: (v: string) => void;
  placeholder?: string; multiline?: boolean; rows?: number;
}) {
  const cls = "w-full rounded-lg border border-white/10 bg-slate-800/60 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none";
  return multiline
    ? <textarea className={cls} style={{ minHeight: rows * 24 }} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} />
    : <input className={cls} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} />;
}

// ─── Multiple Choice Options Editor ──────────────────────────

function MCOptionsEditor({
  options, onChange,
}: {
  options: Record<string, unknown>;
  onChange: (o: Record<string, unknown>) => void;
}) {
  const choices = (options.choices ?? []) as { icon: string; title: string; desc: string }[];
  const correctIdx = (options.correctChoiceIndex ?? 0) as number;

  const updateChoice = (i: number, field: string, val: string) => {
    const next = choices.map((c, idx) => idx === i ? { ...c, [field]: val } : c);
    onChange({ ...options, choices: next });
  };
  const addChoice = () => onChange({ ...options, choices: [...choices, { icon: "🔹", title: "New option", desc: "" }] });
  const removeChoice = (i: number) => {
    const next = choices.filter((_, idx) => idx !== i);
    onChange({ ...options, choices: next, correctChoiceIndex: Math.min(correctIdx, next.length - 1) });
  };

  return (
    <div className="space-y-2">
      {choices.map((c, i) => (
        <div key={i} className={cn("flex items-start gap-2 rounded-xl border p-2.5",
          correctIdx === i ? "border-green-500/40 bg-green-950/20" : "border-white/10 bg-slate-800/30")}>
          <button type="button" onClick={() => onChange({ ...options, correctChoiceIndex: i })}
            className={cn("mt-0.5 h-4 w-4 shrink-0 rounded-full border-2 transition-colors",
              correctIdx === i ? "border-green-400 bg-green-400" : "border-slate-500 hover:border-green-400")} />
          <div className="flex-1 space-y-1">
            <div className="flex gap-1.5">
              <input className="w-10 rounded bg-slate-700 border border-white/10 px-1 py-1 text-sm text-center"
                value={c.icon} maxLength={4} onChange={e => updateChoice(i, "icon", e.target.value)} />
              <input className="flex-1 rounded bg-slate-700 border border-white/10 px-2 py-1 text-sm text-white placeholder:text-slate-500"
                value={c.title} onChange={e => updateChoice(i, "title", e.target.value)} placeholder="Option title" />
            </div>
            <input className="w-full rounded bg-slate-700 border border-white/10 px-2 py-1 text-xs text-slate-300 placeholder:text-slate-500"
              value={c.desc} onChange={e => updateChoice(i, "desc", e.target.value)} placeholder="Description (optional)" />
          </div>
          {choices.length > 2 && (
            <button type="button" onClick={() => removeChoice(i)} className="text-slate-500 hover:text-red-400 text-lg leading-none">×</button>
          )}
        </div>
      ))}
      {choices.length < 6 && (
        <button type="button" onClick={addChoice}
          className="w-full rounded-lg border border-dashed border-slate-600 py-2 text-sm text-slate-400 hover:border-blue-500 hover:text-blue-400 transition-colors">
          + Add Option
        </button>
      )}
      <div className="rounded-lg border border-green-500/30 bg-green-950/20 p-2.5">
        <p className="text-xs text-green-400 font-semibold">🔑 Correct: {choices[correctIdx]?.title || "—"}</p>
      </div>
    </div>
  );
}

// ─── Shared drag handle ───────────────────────────────────────

function DragHandle({ listeners, attributes }: { listeners?: Record<string, unknown>; attributes?: Record<string, unknown> }) {
  return (
    <span
      {...listeners}
      {...attributes}
      className="cursor-grab active:cursor-grabbing text-slate-500 hover:text-slate-300 select-none px-0.5 touch-none"
      title="Drag to reorder"
    >
      ⠿
    </span>
  );
}

// ─── Sortable item row for the items list ─────────────────────

interface RankItemDef { id: string; emoji: string; text: string; sub: string; }

function SortableRankItem({
  item, onUpdate, onRemove, canRemove,
}: {
  item: RankItemDef;
  onUpdate: (field: string, val: string) => void;
  onRemove: () => void;
  canRemove: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.id });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "flex items-center gap-2 rounded-lg border bg-slate-800/40 p-2 transition-shadow",
        isDragging ? "border-purple-500/60 shadow-[0_0_16px_rgba(139,92,246,0.25)] z-50 bg-slate-800" : "border-white/10"
      )}
    >
      <DragHandle listeners={listeners as any} attributes={attributes as any} />
      <input
        className="w-9 rounded bg-slate-700 border border-white/10 px-1 py-1 text-sm text-center"
        value={item.emoji} maxLength={4}
        onChange={e => onUpdate("emoji", e.target.value)}
      />
      <input
        className="flex-1 rounded bg-slate-700 border border-white/10 px-2 py-1 text-sm text-white placeholder:text-slate-500"
        value={item.text}
        onChange={e => onUpdate("text", e.target.value)}
        placeholder="Item text"
      />
      <input
        className="w-28 rounded bg-slate-700 border border-white/10 px-2 py-1 text-xs text-slate-300 placeholder:text-slate-500"
        value={item.sub}
        onChange={e => onUpdate("sub", e.target.value)}
        placeholder="Subtitle"
      />
      {canRemove && (
        <button type="button" onClick={onRemove} className="text-slate-500 hover:text-red-400 text-lg leading-none">×</button>
      )}
    </div>
  );
}

// ─── Sortable row for the correct-order answer key ────────────

function SortableOrderRow({ id, pos, text }: { id: string; pos: number; text: string }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "flex items-center gap-2 rounded-lg border px-2.5 py-1.5 transition-shadow",
        isDragging
          ? "border-purple-400/60 bg-purple-950/60 shadow-[0_0_12px_rgba(139,92,246,0.3)] z-50"
          : "border-white/10 bg-slate-800/50"
      )}
    >
      <DragHandle listeners={listeners as any} attributes={attributes as any} />
      <span className="text-xs text-slate-500 w-5 font-mono">{pos + 1}.</span>
      <span className="flex-1 text-sm text-slate-300 truncate">{text}</span>
    </div>
  );
}

// ─── Ranking Options Editor ───────────────────────────────────

function RankOptionsEditor({
  options, correctAnswer, onOptionsChange, onAnswerChange,
}: {
  options: Record<string, unknown>;
  correctAnswer: string;
  onOptionsChange: (o: Record<string, unknown>) => void;
  onAnswerChange: (v: string) => void;
}) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  // Stable IDs for items so dnd-kit can track them across re-renders
  const rawItems = (options.rankItems ?? []) as { emoji: string; text: string; sub: string }[];
  const [items, setItems] = useState<RankItemDef[]>(() =>
    rawItems.map((it, i) => ({ ...it, id: `item-${i}-${it.text}` }))
  );

  // Parse correct order (array of text strings)
  const [correctOrder, setCorrectOrder] = useState<string[]>(() => {
    try { return JSON.parse(correctAnswer); } catch { return rawItems.map(it => it.text); }
  });

  // Sync items from parent when stage changes
  useEffect(() => {
    const fresh = (options.rankItems ?? []) as { emoji: string; text: string; sub: string }[];
    setItems(fresh.map((it, i) => ({ ...it, id: `item-${i}-${it.text}` })));
    try { setCorrectOrder(JSON.parse(correctAnswer)); } catch { setCorrectOrder(fresh.map(it => it.text)); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pushChanges = (nextItems: RankItemDef[], nextOrder: string[]) => {
    onOptionsChange({ ...options, rankItems: nextItems.map(({ id: _id, ...rest }) => rest) });
    onAnswerChange(JSON.stringify(nextOrder));
  };

  // ── Items list drag end ──
  const onItemsDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIdx = items.findIndex(it => it.id === active.id);
    const newIdx = items.findIndex(it => it.id === over.id);
    const next = arrayMove(items, oldIdx, newIdx);
    setItems(next);
    // Reset correct order to match the new item order
    const newOrder = next.map(it => it.text);
    setCorrectOrder(newOrder);
    pushChanges(next, newOrder);
  };

  // ── Correct order drag end ──
  const orderIds = correctOrder.map((_, i) => `order-${i}`);
  const onOrderDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIdx = orderIds.indexOf(active.id as string);
    const newIdx = orderIds.indexOf(over.id as string);
    const next = arrayMove(correctOrder, oldIdx, newIdx);
    setCorrectOrder(next);
    onAnswerChange(JSON.stringify(next));
  };

  const updateItem = (id: string, field: string, val: string) => {
    const next = items.map(it => it.id === id ? { ...it, [field]: val } : it);
    setItems(next);
    const nextOrder = correctOrder.map(t => {
      const old = items.find(it => it.id === id);
      return field === "text" && old?.text === t ? val : t;
    });
    setCorrectOrder(nextOrder);
    pushChanges(next, nextOrder);
  };

  const addItem = () => {
    const newItem: RankItemDef = { id: `item-new-${Date.now()}`, emoji: "🔹", text: "New item", sub: "" };
    const next = [...items, newItem];
    const nextOrder = [...correctOrder, newItem.text];
    setItems(next);
    setCorrectOrder(nextOrder);
    pushChanges(next, nextOrder);
  };

  const removeItem = (id: string) => {
    const removed = items.find(it => it.id === id);
    const next = items.filter(it => it.id !== id);
    const nextOrder = correctOrder.filter(t => t !== removed?.text);
    setItems(next);
    setCorrectOrder(nextOrder);
    pushChanges(next, nextOrder);
  };

  return (
    <div className="space-y-4">
      {/* ── Items list ── */}
      <div className="space-y-1.5">
        <FieldLabel>Items — drag ⠿ to reorder</FieldLabel>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onItemsDragEnd}>
          <SortableContext items={items.map(it => it.id)} strategy={verticalListSortingStrategy}>
            {items.map(it => (
              <SortableRankItem
                key={it.id}
                item={it}
                canRemove={items.length > 2}
                onUpdate={(field, val) => updateItem(it.id, field, val)}
                onRemove={() => removeItem(it.id)}
              />
            ))}
          </SortableContext>
        </DndContext>

        {items.length < 8 && (
          <button type="button" onClick={addItem}
            className="w-full rounded-lg border border-dashed border-slate-600 py-1.5 text-sm text-slate-400 hover:border-purple-500 hover:text-purple-400 transition-colors">
            + Add Item
          </button>
        )}
      </div>

      {/* ── Correct order answer key ── */}
      {correctOrder.length > 0 && (
        <div className="rounded-xl border border-purple-500/30 bg-purple-950/20 p-3 space-y-2">
          <div className="flex items-center justify-between">
            <FieldLabel>🔑 Answer Key — drag to set correct order</FieldLabel>
          </div>
          <p className="text-[10px] text-slate-500 -mt-1">
            Drag rows into the sequence students must arrange them in.
          </p>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onOrderDragEnd}>
            <SortableContext items={orderIds} strategy={verticalListSortingStrategy}>
              {correctOrder.map((text, pos) => (
                <SortableOrderRow key={orderIds[pos]} id={orderIds[pos]} pos={pos} text={text} />
              ))}
            </SortableContext>
          </DndContext>
        </div>
      )}
    </div>
  );
}

// ─── Generic JSON options editor (fallback) ───────────────────

function JsonOptionsEditor({
  options, onChange,
}: {
  options: Record<string, unknown>;
  onChange: (o: Record<string, unknown>) => void;
}) {
  const [raw, setRaw] = useState(() => JSON.stringify(options, null, 2));
  const [jsonError, setJsonError] = useState("");

  const handleChange = (v: string) => {
    setRaw(v);
    try {
      const parsed = JSON.parse(v);
      setJsonError("");
      onChange(parsed);
    } catch {
      setJsonError("Invalid JSON");
    }
  };

  return (
    <div>
      <FieldLabel>Options (JSON)</FieldLabel>
      <textarea
        className={cn("w-full rounded-lg border bg-slate-800/60 px-3 py-2 text-xs font-mono text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none min-h-[120px]",
          jsonError ? "border-red-500" : "border-white/10")}
        value={raw}
        onChange={e => handleChange(e.target.value)}
      />
      {jsonError && <p className="text-xs text-red-400 mt-1">{jsonError}</p>}
    </div>
  );
}

// ─── Stage Editor Pane ────────────────────────────────────────

function StageEditorPane({
  stage, onSave,
}: {
  stage: StageLocal;
  onSave: (patch: Partial<StageLocal>) => void;
}) {
  const phase = PHASE_OF(stage.stageNumber);
  const [local, setLocal] = useState<StageLocal>(stage);
  const isDirty = useRef(false);

  // Sync when parent stage changes (e.g. after save)
  useEffect(() => { setLocal(stage); isDirty.current = false; }, [stage.stageNumber]);

  const update = useCallback((patch: Partial<StageLocal>) => {
    setLocal(prev => ({ ...prev, ...patch, dirty: true }));
    isDirty.current = true;
  }, []);

  const handleSave = () => {
    if (!local.title.trim() || !local.instruction.trim()) return;
    onSave({ ...local });
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <span
          className="h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
          style={{ background: phase.color }}
        >
          {stage.stageNumber}
        </span>
        <div>
          <p className="text-xs font-semibold" style={{ color: phase.color }}>{phase.label}</p>
          <p className="text-xs text-slate-500">{TYPE_LABELS[stage.type] ?? stage.type}</p>
        </div>
        {local.dirty && (
          <span className="ml-auto text-xs text-amber-400 font-semibold">● Unsaved</span>
        )}
      </div>

      {/* Title */}
      <div>
        <FieldLabel>Stage Title *</FieldLabel>
        <TextField value={local.title} onChange={v => update({ title: v })} placeholder="Stage title" />
      </div>

      {/* Instruction */}
      <div>
        <FieldLabel>Instruction / Question *</FieldLabel>
        <TextField value={local.instruction} onChange={v => update({ instruction: v })} placeholder="What should the student do?" multiline rows={3} />
      </div>

      {/* Type-specific options */}
      {local.type === "MULTIPLE_CHOICE" && (
        <div>
          <FieldLabel>Choices & Answer Key</FieldLabel>
          <MCOptionsEditor
            options={local.options}
            onChange={o => update({ options: o })}
          />
        </div>
      )}

      {local.type === "RANKING" && (
        <div>
          <FieldLabel>Rank Items & Correct Order</FieldLabel>
          <RankOptionsEditor
            options={local.options}
            correctAnswer={local.correctAnswer}
            onOptionsChange={o => update({ options: o })}
            onAnswerChange={v => update({ correctAnswer: v })}
          />
        </div>
      )}

      {local.type === "OPEN_ENDED" && (
        <div>
          <FieldLabel>Answer Key (optional — leave blank for teacher grading)</FieldLabel>
          <TextField
            value={local.correctAnswer}
            onChange={v => update({ correctAnswer: v })}
            placeholder="Expected answer or key points…"
            multiline rows={3}
          />
        </div>
      )}

      {!["MULTIPLE_CHOICE", "RANKING", "OPEN_ENDED"].includes(local.type) && (
        <JsonOptionsEditor
          options={local.options}
          onChange={o => update({ options: o })}
        />
      )}

      {/* Correct Answer (non-MC/Ranking types) */}
      {!["MULTIPLE_CHOICE", "RANKING", "OPEN_ENDED"].includes(local.type) && (
        <div>
          <FieldLabel>Correct Answer (JSON string, optional)</FieldLabel>
          <TextField value={local.correctAnswer} onChange={v => update({ correctAnswer: v })} placeholder="null or JSON string" />
        </div>
      )}

      {/* Hint */}
      <div>
        <FieldLabel>Hint (optional)</FieldLabel>
        <TextField value={local.hint} onChange={v => update({ hint: v })} placeholder="Hint for struggling students…" />
      </div>

      {/* Max Score */}
      <div className="w-32">
        <FieldLabel>Max Score</FieldLabel>
        <input type="number" min={1} max={100}
          className="w-full rounded-lg border border-white/10 bg-slate-800/60 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={local.maxScore}
          onChange={e => update({ maxScore: Number(e.target.value) })}
        />
      </div>

      {/* Error */}
      {local.error && (
        <p className="text-xs text-red-400 bg-red-950/30 border border-red-500/30 rounded-lg px-3 py-2">{local.error}</p>
      )}

      {/* Save button */}
      <button
        type="button"
        onClick={handleSave}
        disabled={local.saving || !local.title.trim() || !local.instruction.trim()}
        className={cn(
          "w-full rounded-xl py-2.5 text-sm font-semibold transition-colors",
          local.dirty
            ? "bg-blue-600 hover:bg-blue-500 text-white"
            : "bg-slate-700 text-slate-400 cursor-default",
          "disabled:opacity-40 disabled:cursor-not-allowed"
        )}
      >
        {local.saving ? "Saving…" : local.dirty ? "Save Stage" : "No Changes"}
      </button>
    </div>
  );
}

// ─── Main Edit Page ───────────────────────────────────────────

export default function ModuleEditPage() {
  const router   = useRouter();
  const params   = useParams<{ id: string }>();
  const moduleId = parseInt(params.id);

  const [loading, setLoading]   = useState(true);
  const [loadErr, setLoadErr]   = useState("");
  const [module, setModule]     = useState<ModuleLocal | null>(null);
  const [stages, setStages]     = useState<StageLocal[]>([]);
  const [activeStage, setActiveStage] = useState(1);
  const [contexts, setContexts] = useState<ContextOption[]>([]);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [quizSaving,    setQuizSaving]    = useState(false);
  const [quizError,     setQuizError]     = useState("");

  // Load module + stages + contexts
  useEffect(() => {
    if (isNaN(moduleId)) { setLoadErr("Invalid module ID."); setLoading(false); return; }

    Promise.all([
      fetch(`/api/teacher/modules/${moduleId}/edit-data`).then(r => r.json()),
      fetch("/api/contexts").then(r => r.json()),
      fetch(`/api/teacher/modules/${moduleId}/quiz`, { credentials: "include" }).then(r => r.json()),
    ]).then(([modData, ctxData, quizData]) => {
      if (!modData.success) { setLoadErr(modData.error ?? "Failed to load module."); return; }
      const m = modData.module;
      setModule({
        title: m.title, subtitle: m.subtitle ?? "", scenario: m.scenario,
        bannerUrl: m.bannerUrl ?? "",
        context: m.context, icon: m.icon, timeEstimate: String(m.timeEstimate ?? ""),
        status: m.status, dirty: false, saving: false, error: "",
      });
      setStages(
        (modData.stages as any[]).map(s => ({
          stageNumber:   s.stageNumber,
          title:         s.title,
          instruction:   s.instruction,
          hint:          s.hint ?? "",
          maxScore:      s.maxScore,
          type:          s.type,
          options:       s.options ?? {},
          correctAnswer: s.correctAnswer ?? "",
          dirty: false, saving: false, error: "",
        }))
      );
      if (ctxData.success) setContexts(ctxData.contexts);
      if (quizData.success && Array.isArray(quizData.questions)) {
        setQuizQuestions(quizData.questions.map((q: any) => ({
          questionNum:        q.questionNum,
          questionText:       q.questionText,
          mode:               q.type as "multiple_choice" | "ranking" | "open_ended",
          choices:            (q.options as any)?.choices            ?? [{ icon: "🅐", title: "Option A", desc: "" }, { icon: "🅑", title: "Option B", desc: "" }],
          correctChoiceIndex: (q.options as any)?.correctChoiceIndex ?? 0,
          rankItems:          (q.options as any)?.rankItems           ?? [{ emoji: "1️⃣", text: "Item 1", sub: "" }, { emoji: "2️⃣", text: "Item 2", sub: "" }],
          correctOrder:       q.correctAnswer ? (() => { try { const arr: string[] = JSON.parse(q.correctAnswer); const items = (q.options as any)?.rankItems ?? []; return arr.map((t: string) => items.findIndex((it: any) => it.text === t)).filter((i: number) => i >= 0); } catch { return [0, 1]; } })() : [0, 1],
          answerKey:          q.type === "open_ended" ? (q.correctAnswer ?? "") : "",
          hint:               q.hint ?? "",
          maxScore:           q.maxScore,
        })));
      }
    }).catch(() => setLoadErr("Network error loading module."))
      .finally(() => setLoading(false));
  }, [moduleId]);

  // Save module metadata
  const saveModule = async () => {
    if (!module) return;
    setModule(m => m ? { ...m, saving: true, error: "" } : m);
    try {
      const res  = await fetch(`/api/teacher/modules/${moduleId}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title:        module.title,
          subtitle:     module.subtitle || null,
          scenario:     module.scenario,
          bannerUrl:    module.bannerUrl || null,
          context:      module.context,
          icon:         module.icon,
          timeEstimate: module.timeEstimate ? parseInt(module.timeEstimate) : null,
          status:       module.status,
        }),
      });
      const json = await res.json();
      if (!json.success) { setModule(m => m ? { ...m, error: json.error ?? "Failed to save.", saving: false } : m); return; }
      setModule(m => m ? { ...m, dirty: false, saving: false } : m);
    } catch {
      setModule(m => m ? { ...m, error: "Network error.", saving: false } : m);
    }
  };

  // Save quiz questions
  const saveQuiz = async () => {
    setQuizSaving(true);
    setQuizError("");
    try {
      const questions = quizQuestions.filter(q => q.questionText.trim()).map((q) => {
        let type: string;
        let options: object | null = null;
        let correctAnswer: string | null = null;
        if (q.mode === "multiple_choice") {
          type = "multiple_choice";
          options = { choices: q.choices, correctChoiceIndex: q.correctChoiceIndex };
        } else if (q.mode === "ranking") {
          type = "ranking";
          options = { rankItems: q.rankItems };
          correctAnswer = JSON.stringify(q.correctOrder.map((i) => q.rankItems[i]?.text ?? ""));
        } else {
          type = "open_ended";
          correctAnswer = q.answerKey.trim() || null;
        }
        return { questionNum: q.questionNum, questionText: q.questionText, type, options, correctAnswer, hint: q.hint || null, maxScore: q.maxScore };
      });
      const res  = await fetch(`/api/teacher/modules/${moduleId}/quiz`, {
        method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
        body: JSON.stringify({ questions }),
      });
      const json = await res.json();
      if (!json.success) { setQuizError(json.error ?? "Failed to save quiz."); }
    } catch {
      setQuizError("Network error.");
    } finally {
      setQuizSaving(false);
    }
  };

  // Save a single stage
  const saveStage = async (patch: Partial<StageLocal>) => {
    const sNum = patch.stageNumber!;
    setStages(prev => prev.map(s => s.stageNumber === sNum ? { ...s, saving: true, error: "" } : s));
    try {
      const res  = await fetch(`/api/teacher/modules/${moduleId}/stages/${sNum}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title:         patch.title,
          instruction:   patch.instruction,
          hint:          patch.hint || null,
          maxScore:      patch.maxScore,
          options:       patch.options,
          correctAnswer: patch.correctAnswer || null,
        }),
      });
      const json = await res.json();
      if (!json.success) {
        setStages(prev => prev.map(s => s.stageNumber === sNum ? { ...s, error: json.error ?? "Failed to save.", saving: false } : s));
        return;
      }
      setStages(prev => prev.map(s => s.stageNumber === sNum ? { ...s, ...patch, dirty: false, saving: false, error: "" } : s));
    } catch {
      setStages(prev => prev.map(s => s.stageNumber === sNum ? { ...s, error: "Network error.", saving: false } : s));
    }
  };

  const currentStage = stages.find(s => s.stageNumber === activeStage);

  // ── Loading / error states ────────────────────────────────
  if (loading) return (
    <div className="min-h-screen bg-[#0D1117] flex items-center justify-center">
      <div className="text-slate-400 text-sm animate-pulse">Loading module…</div>
    </div>
  );
  if (loadErr || !module) return (
    <div className="min-h-screen bg-[#0D1117] flex items-center justify-center flex-col gap-3">
      <p className="text-red-400">{loadErr || "Module not found."}</p>
      <button onClick={() => router.back()} className="text-sm text-slate-400 hover:text-white">← Go back</button>
    </div>
  );

  const dirtyStages = stages.filter(s => s.dirty).length;

  return (
    <div className="min-h-screen bg-[#0D1117] text-white flex flex-col">
      {/* Top bar */}
      <header className="sticky top-0 z-40 flex items-center gap-3 border-b border-white/10 bg-[#0D1117]/95 backdrop-blur px-5 h-14">
        <button onClick={() => router.push("/dashboard/teacher/modules")}
          className="text-slate-400 hover:text-white text-sm flex items-center gap-1 transition-colors">
          ← Modules
        </button>
        <span className="text-slate-600">/</span>
        <span className="text-sm font-semibold text-white truncate max-w-xs">{module.title}</span>
        <span className={cn("ml-2 text-xs px-2 py-0.5 rounded-full font-semibold border",
          module.status === "ACTIVE"   ? "bg-green-950/40 border-green-500/40 text-green-400" :
          module.status === "DRAFT"    ? "bg-amber-950/40 border-amber-500/40 text-amber-400" :
                                         "bg-slate-800 border-slate-600 text-slate-400")}>
          {module.status}
        </span>
        {dirtyStages > 0 && (
          <span className="text-xs text-amber-400 font-semibold">● {dirtyStages} stage{dirtyStages > 1 ? "s" : ""} unsaved</span>
        )}
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* ── LEFT: Module Info + Stage list ─────────────────── */}
        <aside className="w-72 shrink-0 border-r border-white/10 flex flex-col overflow-y-auto">
          {/* Module metadata form */}
          <div className="p-4 border-b border-white/10 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Module Info</p>

            <div>
              <FieldLabel>Icon</FieldLabel>
              <input
                className="w-16 rounded-lg border border-white/10 bg-slate-800/60 px-2 py-2 text-xl text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={module.icon} maxLength={4}
                onChange={e => setModule(m => m ? { ...m, icon: e.target.value, dirty: true } : m)}
              />
            </div>

            <div>
              <FieldLabel>Title *</FieldLabel>
              <TextField value={module.title} onChange={v => setModule(m => m ? { ...m, title: v, dirty: true } : m)} placeholder="Module title" />
            </div>

            <div>
              <FieldLabel>Banner (optional)</FieldLabel>
              <BannerUpload
                value={module.bannerUrl}
                onChange={url => setModule(m => m ? { ...m, bannerUrl: url, dirty: true } : m)}
                dark
              />
            </div>

            <div>
              <FieldLabel>Scenario *</FieldLabel>
              <RichTextEditor
                value={module.scenario}
                onChange={v => setModule(m => m ? { ...m, scenario: v, dirty: true } : m)}
                placeholder="Scenario description…"
                dark
                minHeight="100px"
              />
            </div>

            <div>
              <FieldLabel>Context</FieldLabel>
              <div className="grid grid-cols-2 gap-1.5">
                {contexts.map(ctx => (
                  <button key={ctx.key} type="button"
                    onClick={() => setModule(m => m ? { ...m, context: ctx.key, dirty: true } : m)}
                    className={cn("flex items-center gap-1.5 rounded-lg border px-2 py-1.5 text-xs text-left transition-all",
                      module.context === ctx.key ? "border-2 font-semibold" : "border-white/10 bg-slate-800/40 text-slate-400 hover:border-slate-500")}
                    style={module.context === ctx.key
                      ? { borderColor: ctx.color, background: ctx.color + "22", color: ctx.color }
                      : {}}>
                    <span>{ctx.icon}</span><span className="truncate">{ctx.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <div className="flex-1">
                <FieldLabel>Est. Time (min)</FieldLabel>
                <input type="number" min={0}
                  className="w-full rounded-lg border border-white/10 bg-slate-800/60 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={module.timeEstimate}
                  onChange={e => setModule(m => m ? { ...m, timeEstimate: e.target.value, dirty: true } : m)}
                />
              </div>
              <div className="flex-1">
                <FieldLabel>Status</FieldLabel>
                <select
                  className="w-full rounded-lg border border-white/10 bg-slate-800/60 px-2 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={module.status}
                  onChange={e => setModule(m => m ? { ...m, status: e.target.value, dirty: true } : m)}
                >
                  <option value="DRAFT">Draft</option>
                  <option value="ACTIVE">Active</option>
                  <option value="ARCHIVED">Archived</option>
                </select>
              </div>
            </div>

            {module.error && <p className="text-xs text-red-400">{module.error}</p>}

            <button
              type="button" onClick={saveModule}
              disabled={module.saving || !module.dirty}
              className={cn("w-full rounded-xl py-2 text-sm font-semibold transition-colors",
                module.dirty ? "bg-blue-600 hover:bg-blue-500 text-white" : "bg-slate-700 text-slate-500 cursor-default",
                "disabled:opacity-40 disabled:cursor-not-allowed")}
            >
              {module.saving ? "Saving…" : module.dirty ? "Save Module Info" : "No Changes"}
            </button>
          </div>

          {/* Stage list */}
          <div className="flex-1 py-2">
            <p className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Stages</p>
            {stages.map(s => {
              const ph = PHASE_OF(s.stageNumber);
              const isActive = s.stageNumber === activeStage;
              return (
                <button key={s.stageNumber} type="button"
                  onClick={() => setActiveStage(s.stageNumber)}
                  className={cn("w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors",
                    isActive ? "bg-slate-800" : "hover:bg-slate-800/50")}>
                  <span className="h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 text-white"
                    style={{ background: isActive ? ph.color : ph.color + "44" }}>
                    {s.stageNumber}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className={cn("text-xs font-medium truncate", isActive ? "text-white" : "text-slate-400")}>{s.title}</p>
                    <p className="text-[10px] text-slate-600">{TYPE_LABELS[s.type] ?? s.type}</p>
                  </div>
                  {s.dirty  && <span className="text-amber-400 text-[10px] font-bold">●</span>}
                  {s.saving && <span className="text-blue-400 text-[10px] animate-pulse">↻</span>}
                </button>
              );
            })}
          </div>
        </aside>

        {/* ── RIGHT: Stage editor ─────────────────────────────── */}
        <main className="flex-1 overflow-y-auto p-6">
          {currentStage ? (
            <div className="max-w-2xl mx-auto">
              <StageEditorPane
                key={currentStage.stageNumber}
                stage={currentStage}
                onSave={saveStage}
              />
              {/* Stage navigation */}
              <div className="flex justify-between mt-8">
                <button type="button" onClick={() => setActiveStage(n => Math.max(1, n - 1))}
                  disabled={activeStage === 1}
                  className="rounded-lg border border-white/10 px-4 py-2 text-sm text-slate-400 hover:text-white disabled:opacity-30 transition-colors">
                  ← Previous
                </button>
                <button type="button" onClick={() => setActiveStage(n => Math.min(12, n + 1))}
                  disabled={activeStage === 12}
                  className="rounded-lg bg-slate-700 hover:bg-slate-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-30 transition-colors">
                  Next →
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-slate-500 text-sm">
              Select a stage from the left
            </div>
          )}
        </main>
      </div>

      {/* ── Module Quiz section ─────────────────────────────── */}
      <div className="border-t border-white/10 p-6">
        <div className="max-w-4xl mx-auto space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white">Scenario Questions</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                These questions appear after students complete all 12 stages.
              </p>
            </div>
            <button
              type="button"
              onClick={saveQuiz}
              disabled={quizSaving}
              className="px-4 py-2 rounded-xl text-sm font-bold bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white transition-colors"
            >
              {quizSaving ? "Saving…" : "Save Questions"}
            </button>
          </div>
          {quizError && (
            <p className="text-xs text-red-400">{quizError}</p>
          )}
          <ModuleQuizEditor questions={quizQuestions} onChange={setQuizQuestions} dark />
        </div>
      </div>
    </div>
  );
}
