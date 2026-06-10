"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import RichTextEditor from "@/components/ui/rich-text-editor";
import BannerUpload from "@/components/ui/banner-upload";
import ModuleQuizEditor, { makeDefaultQuizQuestion } from "@/components/module-quiz-editor";
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
  key:   string;
  label: string;
  icon:  string;
  color: string;
  description: string | null;
}

type StageMode = "multiple_choice" | "ranking" | "open_ended";

interface ChoiceItem  { icon: string; title: string; desc: string; }
interface RankItem    { emoji: string; text: string; sub: string; }
interface StarterChip { label: string; text: string; }

interface SimpleStage {
  stageNumber:  number;
  title:        string;
  instruction:  string;
  hint:         string;
  mode:         StageMode;
  choices:            ChoiceItem[];
  correctChoiceIndex: number;
  rankItems:     RankItem[];
  correctOrder:  number[];
  answerKey:    string;
  starterChips: StarterChip[];
  minChars:     number;
  maxScore:     number;
}

interface ModuleInfo {
  title:        string;
  scenario:     string;
  context:      string;
  timeEstimate: string;
  bannerUrl:    string;
}

// ─── Constants ────────────────────────────────────────────────

const PHASE_OF = (n: number) => {
  if (n <= 3)  return { label: "Understanding", color: "#3B82C4" };
  if (n <= 7)  return { label: "Analysis",      color: "#8B5CF6" };
  if (n <= 10) return { label: "Solution",      color: "#F59E0B" };
  return               { label: "Reflection",   color: "#4A9B7F" };
};

const DEFAULT_TITLES = [
  "Identify & Categorize",
  "Select & Prioritize",
  "Define the Problem",
  "Analyze the Information",
  "Identify Constraints",
  "Identify Root Causes",
  "Analyze Data",
  "Develop Possible Solutions",
  "Anticipate Possible Problems",
  "Trial Implementation",
  "Choose the Best Solution",
  "Reflect & Review",
];

const MODE_LABELS: Record<StageMode, string> = {
  multiple_choice: "Multiple Choice",
  ranking:         "Arrangement",
  open_ended:      "Answer Input",
};

const MODE_ICONS: Record<StageMode, string> = {
  multiple_choice: "🔘",
  ranking:         "📊",
  open_ended:      "✍️",
};

function makeDefaultStage(n: number): SimpleStage {
  return {
    stageNumber:        n,
    title:              DEFAULT_TITLES[n - 1],
    instruction:        "",
    hint:               "",
    mode:               "multiple_choice",
    choices:            [
      { icon: "🅐", title: "Option A", desc: "" },
      { icon: "🅑", title: "Option B", desc: "" },
    ],
    correctChoiceIndex: 0,
    rankItems:          [
      { emoji: "1️⃣", text: "Item 1", sub: "" },
      { emoji: "2️⃣", text: "Item 2", sub: "" },
    ],
    correctOrder:       [0, 1],
    answerKey:          "",
    starterChips:       [],
    minChars:           50,
    maxScore:           10,
  };
}

// ─── Sub-components ───────────────────────────────────────────

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1">
      {children}
    </p>
  );
}

function TextInput({
  value, onChange, placeholder, multiline = false,
}: { value: string; onChange: (v: string) => void; placeholder?: string; multiline?: boolean }) {
  const cls =
    "w-full rounded-lg border border-white/10 bg-slate-800/60 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none";
  return multiline ? (
    <textarea
      className={cn(cls, "min-h-[80px]")}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
    />
  ) : (
    <input
      className={cls}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
    />
  );
}

// ─── Multiple Choice Editor ───────────────────────────────────

function MultipleChoiceEditor({
  stage, onChange,
}: {
  stage: SimpleStage;
  onChange: (patch: Partial<SimpleStage>) => void;
}) {
  const setChoices = (choices: ChoiceItem[]) => onChange({ choices });
  const setCorrect = (i: number) => onChange({ correctChoiceIndex: i });

  const updateChoice = (i: number, patch: Partial<ChoiceItem>) => {
    const next = stage.choices.map((c, idx) => idx === i ? { ...c, ...patch } : c);
    setChoices(next);
  };
  const addChoice    = () => setChoices([...stage.choices, { icon: "🔹", title: "New Option", desc: "" }]);
  const removeChoice = (i: number) => {
    const next = stage.choices.filter((_, idx) => idx !== i);
    onChange({ choices: next, correctChoiceIndex: Math.min(stage.correctChoiceIndex, next.length - 1) });
  };

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        {stage.choices.map((choice, i) => (
          <div
            key={i}
            className={cn(
              "flex items-start gap-3 rounded-xl border p-3 transition-colors",
              stage.correctChoiceIndex === i
                ? "border-green-500/40 bg-green-950/30"
                : "border-white/10 bg-slate-800/40"
            )}
          >
            <button
              type="button"
              onClick={() => setCorrect(i)}
              title="Set as correct answer"
              className={cn(
                "mt-1 h-5 w-5 flex-shrink-0 rounded-full border-2 transition-colors",
                stage.correctChoiceIndex === i
                  ? "border-green-400 bg-green-400"
                  : "border-slate-500 hover:border-green-400"
              )}
            />
            <div className="flex-1 space-y-1">
              <div className="flex gap-2">
                <input
                  className="w-12 rounded bg-slate-700/50 border border-white/10 px-2 py-1 text-sm text-center"
                  value={choice.icon}
                  onChange={(e) => updateChoice(i, { icon: e.target.value })}
                  placeholder="🔹"
                />
                <input
                  className="flex-1 rounded bg-slate-700/50 border border-white/10 px-2 py-1 text-sm text-white placeholder:text-slate-500"
                  value={choice.title}
                  onChange={(e) => updateChoice(i, { title: e.target.value })}
                  placeholder="Option title"
                />
              </div>
              <input
                className="w-full rounded bg-slate-700/50 border border-white/10 px-2 py-1 text-xs text-slate-300 placeholder:text-slate-500"
                value={choice.desc}
                onChange={(e) => updateChoice(i, { desc: e.target.value })}
                placeholder="Short description (optional)"
              />
            </div>
            {stage.choices.length > 2 && (
              <button
                type="button"
                onClick={() => removeChoice(i)}
                className="text-slate-500 hover:text-red-400 text-lg leading-none"
              >
                ×
              </button>
            )}
          </div>
        ))}
      </div>

      {stage.choices.length < 6 && (
        <button
          type="button"
          onClick={addChoice}
          className="w-full rounded-lg border border-dashed border-slate-600 py-2 text-sm text-slate-400 hover:border-green-500 hover:text-green-400 transition-colors"
        >
          + Add Option
        </button>
      )}

      <div className="rounded-lg border border-green-500/30 bg-green-950/20 p-3">
        <p className="text-xs font-semibold text-green-400 mb-1">🔑 Answer Key</p>
        <p className="text-sm text-slate-300">
          Correct answer: <span className="font-bold text-green-300">
            {stage.choices[stage.correctChoiceIndex]?.title || "—"}
          </span>
          <span className="text-slate-500"> (click the circle beside an option to set it)</span>
        </p>
      </div>
    </div>
  );
}

// ─── Drag handle ──────────────────────────────────────────────

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

// ─── Sortable item row ─────────────────────────────────────────

function SortableNewItem({
  id, item, onUpdate, onRemove, canRemove,
}: {
  id: string;
  item: RankItem;
  onUpdate: (patch: Partial<RankItem>) => void;
  onRemove: () => void;
  canRemove: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "flex items-center gap-2 rounded-xl border p-2 transition-shadow",
        isDragging
          ? "border-purple-500/60 bg-slate-800 shadow-[0_0_16px_rgba(139,92,246,0.25)] z-50"
          : "border-white/10 bg-slate-800/40"
      )}
    >
      <DragHandle listeners={listeners as any} attributes={attributes as any} />
      <input
        className="w-10 rounded bg-slate-700/50 border border-white/10 px-1 py-1 text-sm text-center"
        value={item.emoji}
        onChange={e => onUpdate({ emoji: e.target.value })}
      />
      <input
        className="flex-1 rounded bg-slate-700/50 border border-white/10 px-2 py-1 text-sm text-white placeholder:text-slate-500"
        value={item.text}
        onChange={e => onUpdate({ text: e.target.value })}
        placeholder="Item text"
      />
      <input
        className="w-36 rounded bg-slate-700/50 border border-white/10 px-2 py-1 text-xs text-slate-300 placeholder:text-slate-500"
        value={item.sub}
        onChange={e => onUpdate({ sub: e.target.value })}
        placeholder="Subtitle (optional)"
      />
      {canRemove && (
        <button type="button" onClick={onRemove} className="text-slate-500 hover:text-red-400 text-lg">×</button>
      )}
    </div>
  );
}

// ─── Sortable answer-key row ───────────────────────────────────

function SortableOrderRow({ id, pos, item }: { id: string; pos: number; item: RankItem }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "flex items-center gap-2 rounded-lg border px-3 py-1.5 transition-shadow",
        isDragging
          ? "border-purple-400/60 bg-purple-950/60 shadow-[0_0_12px_rgba(139,92,246,0.3)] z-50"
          : "border-white/10 bg-slate-800/50"
      )}
    >
      <DragHandle listeners={listeners as any} attributes={attributes as any} />
      <span className="text-xs text-slate-500 w-5 font-mono">{pos + 1}.</span>
      <span className="text-base">{item.emoji}</span>
      <span className="flex-1 text-sm text-slate-300 truncate">{item.text}</span>
    </div>
  );
}

// ─── Ranking / Arrangement Editor ────────────────────────────

function RankingEditor({
  stage, onChange,
}: {
  stage: SimpleStage;
  onChange: (patch: Partial<SimpleStage>) => void;
}) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  const [itemIds, setItemIds] = useState<string[]>(() =>
    stage.rankItems.map((_, i) => `ri-${i}-${Date.now()}`)
  );

  const syncIds = (items: RankItem[], oldIds: string[]) => {
    if (items.length === oldIds.length) return oldIds;
    return items.map((_, i) => oldIds[i] ?? `ri-${i}-${Date.now()}`);
  };

  const onItemsDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIdx = itemIds.indexOf(active.id as string);
    const newIdx = itemIds.indexOf(over.id as string);
    const nextItems = arrayMove(stage.rankItems, oldIdx, newIdx);
    const nextIds   = arrayMove(itemIds, oldIdx, newIdx);
    setItemIds(nextIds);
    onChange({ rankItems: nextItems, correctOrder: nextItems.map((_, i) => i) });
  };

  const orderIds = stage.correctOrder.map((_, i) => `co-${i}`);
  const onOrderDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIdx = orderIds.indexOf(active.id as string);
    const newIdx = orderIds.indexOf(over.id as string);
    onChange({ correctOrder: arrayMove(stage.correctOrder, oldIdx, newIdx) });
  };

  const updateItem = (i: number, patch: Partial<RankItem>) => {
    const next = stage.rankItems.map((it, idx) => idx === i ? { ...it, ...patch } : it);
    onChange({ rankItems: next, correctOrder: stage.correctOrder });
  };

  const addItem = () => {
    const next = [...stage.rankItems, { emoji: "🔹", text: "New Item", sub: "" }];
    const nextIds = [...itemIds, `ri-${next.length - 1}-${Date.now()}`];
    setItemIds(nextIds);
    onChange({ rankItems: next, correctOrder: next.map((_, i) => i) });
  };

  const removeItem = (i: number) => {
    const next    = stage.rankItems.filter((_, idx) => idx !== i);
    const nextIds = syncIds(next, itemIds.filter((_, idx) => idx !== i));
    setItemIds(nextIds);
    onChange({ rankItems: next, correctOrder: next.map((_, idx) => idx) });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <FieldLabel>Items to arrange — drag ⠿ to reorder</FieldLabel>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onItemsDragEnd}>
          <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
            {stage.rankItems.map((item, i) => (
              <SortableNewItem
                key={itemIds[i]}
                id={itemIds[i]}
                item={item}
                canRemove={stage.rankItems.length > 2}
                onUpdate={patch => updateItem(i, patch)}
                onRemove={() => removeItem(i)}
              />
            ))}
          </SortableContext>
        </DndContext>

        {stage.rankItems.length < 8 && (
          <button type="button" onClick={addItem}
            className="w-full rounded-lg border border-dashed border-slate-600 py-2 text-sm text-slate-400 hover:border-purple-500 hover:text-purple-400 transition-colors">
            + Add Item
          </button>
        )}
      </div>

      <div className="rounded-lg border border-purple-500/30 bg-purple-950/20 p-3 space-y-2">
        <p className="text-xs font-semibold text-purple-400">🔑 Answer Key — drag to set correct order</p>
        <p className="text-xs text-slate-500">Drag rows into the sequence students must match.</p>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onOrderDragEnd}>
          <SortableContext items={orderIds} strategy={verticalListSortingStrategy}>
            {stage.correctOrder.map((itemIdx, pos) => {
              const item = stage.rankItems[itemIdx];
              if (!item) return null;
              return (
                <SortableOrderRow key={orderIds[pos]} id={orderIds[pos]} pos={pos} item={item} />
              );
            })}
          </SortableContext>
        </DndContext>
      </div>
    </div>
  );
}

// ─── Open-Ended / Answer Input Editor ────────────────────────

function OpenEndedEditor({
  stage, onChange,
}: {
  stage: SimpleStage;
  onChange: (patch: Partial<SimpleStage>) => void;
}) {
  const chips = stage.starterChips ?? [];

  const updateChip = (i: number, patch: Partial<StarterChip>) => {
    const next = chips.map((c, idx) => idx === i ? { ...c, ...patch } : c);
    onChange({ starterChips: next });
  };
  const addChip    = () => onChange({ starterChips: [...chips, { label: "I think…", text: "I think " }] });
  const removeChip = (i: number) => onChange({ starterChips: chips.filter((_, idx) => idx !== i) });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <FieldLabel>Min characters required</FieldLabel>
        <input
          type="number"
          min={0}
          className="w-24 rounded-lg border border-white/10 bg-slate-800/60 px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          value={stage.minChars}
          onChange={(e) => onChange({ minChars: Math.max(0, parseInt(e.target.value) || 0) })}
        />
      </div>

      <div className="space-y-2">
        <FieldLabel>Sentence Starters (optional — shown as chips students can click)</FieldLabel>
        {chips.map((chip, i) => (
          <div key={i} className="flex items-center gap-2 rounded-xl border border-white/10 bg-slate-800/40 px-3 py-2">
            <input
              className="w-32 rounded bg-slate-700/50 border border-white/10 px-2 py-1 text-xs text-white placeholder:text-slate-500"
              value={chip.label}
              onChange={(e) => updateChip(i, { label: e.target.value })}
              placeholder="Button label"
            />
            <span className="text-slate-600 text-xs shrink-0">→</span>
            <input
              className="flex-1 rounded bg-slate-700/50 border border-white/10 px-2 py-1 text-xs text-white placeholder:text-slate-500"
              value={chip.text}
              onChange={(e) => updateChip(i, { text: e.target.value })}
              placeholder="Text inserted into student's textarea"
            />
            <button type="button" onClick={() => removeChip(i)} className="text-slate-500 hover:text-red-400 text-lg leading-none">×</button>
          </div>
        ))}
        {chips.length < 6 && (
          <button
            type="button"
            onClick={addChip}
            className="w-full rounded-lg border border-dashed border-slate-600 py-2 text-xs text-slate-400 hover:border-purple-500 hover:text-purple-400 transition-colors"
          >
            + Add Sentence Starter
          </button>
        )}
      </div>

      <div>
        <FieldLabel>Expected Answer / Answer Key</FieldLabel>
        <textarea
          className="w-full rounded-lg border border-white/10 bg-slate-800/60 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none min-h-[90px]"
          value={stage.answerKey}
          onChange={(e) => onChange({ answerKey: e.target.value })}
          placeholder="Type the expected answer or key points students should include…"
        />
        <p className="mt-1 text-xs text-slate-500">
          Leave blank to mark this stage as <span className="text-amber-400">teacher-graded</span>.
        </p>
      </div>

      <div className="rounded-lg border border-amber-500/30 bg-amber-950/20 p-3">
        <p className="text-xs font-semibold text-amber-400 mb-1">🔑 Answer Key</p>
        {stage.answerKey.trim() ? (
          <p className="text-sm text-slate-300 whitespace-pre-wrap">{stage.answerKey}</p>
        ) : (
          <p className="text-sm text-slate-500 italic">No answer key set — teacher will grade manually.</p>
        )}
      </div>
    </div>
  );
}

// ─── Stage Editor Panel ───────────────────────────────────────

function StageEditor({
  stage, onChange,
}: {
  stage: SimpleStage;
  onChange: (patch: Partial<SimpleStage>) => void;
}) {
  const phase = PHASE_OF(stage.stageNumber);

  return (
    <div className="space-y-5">
      <div
        className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold text-white"
        style={{ backgroundColor: phase.color + "33", border: `1px solid ${phase.color}88`, color: phase.color }}
      >
        <span>Stage {stage.stageNumber}</span>
        <span>·</span>
        <span>{phase.label}</span>
      </div>

      <div>
        <FieldLabel>Stage Title</FieldLabel>
        <TextInput
          value={stage.title}
          onChange={(v) => onChange({ title: v })}
          placeholder="e.g. Identify & Categorize"
        />
      </div>

      <div>
        <FieldLabel>Question / Instruction for students</FieldLabel>
        <TextInput
          value={stage.instruction}
          onChange={(v) => onChange({ instruction: v })}
          placeholder="What should the student do or answer in this stage?"
          multiline
        />
      </div>

      <div>
        <FieldLabel>Mode</FieldLabel>
        <div className="grid grid-cols-3 gap-2">
          {(["multiple_choice", "ranking", "open_ended"] as StageMode[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => onChange({ mode: m })}
              className={cn(
                "rounded-xl border px-3 py-3 text-center text-sm font-medium transition-all",
                stage.mode === m
                  ? "border-purple-500 bg-purple-950/40 text-purple-300"
                  : "border-white/10 bg-slate-800/40 text-slate-400 hover:border-slate-500 hover:text-slate-300"
              )}
            >
              <div className="text-xl mb-1">{MODE_ICONS[m]}</div>
              <div>{MODE_LABELS[m]}</div>
            </button>
          ))}
        </div>
      </div>

      {stage.mode === "multiple_choice" && (
        <MultipleChoiceEditor stage={stage} onChange={onChange} />
      )}
      {stage.mode === "ranking" && (
        <RankingEditor stage={stage} onChange={onChange} />
      )}
      {stage.mode === "open_ended" && (
        <OpenEndedEditor stage={stage} onChange={onChange} />
      )}

      <div>
        <FieldLabel>Hint (optional)</FieldLabel>
        <TextInput
          value={stage.hint}
          onChange={(v) => onChange({ hint: v })}
          placeholder="A hint shown to struggling students…"
        />
      </div>

      <div className="flex items-center gap-3">
        <div className="w-32">
          <FieldLabel>Max Score</FieldLabel>
          <input
            type="number"
            min={1}
            max={100}
            className="w-full rounded-lg border border-white/10 bg-slate-800/60 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            value={stage.maxScore}
            onChange={(e) => onChange({ maxScore: Number(e.target.value) })}
          />
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────

export default function AdminModuleNewPage() {
  const router = useRouter();

  const [info, setInfo] = useState<ModuleInfo>({
    title: "", scenario: "", context: "", timeEstimate: "90", bannerUrl: "",
  });

  const [stages, setStages] = useState<SimpleStage[]>(() =>
    Array.from({ length: 12 }, (_, i) => makeDefaultStage(i + 1))
  );

  const [activeStage, setActiveStage] = useState(1);
  const [step, setStep]     = useState<"info" | "quiz" | "stages" | "review">("info");
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState("");
  const [contexts, setContexts]               = useState<ContextOption[]>([]);
  const [contextsLoading, setContextsLoading] = useState(true);
  const [showNewCtx, setShowNewCtx]           = useState(false);
  const [newCtx, setNewCtx] = useState({ label: "", description: "", icon: "📦", color: "#64748B" });
  const [savingCtx, setSavingCtx] = useState(false);
  const [ctxError, setCtxError]   = useState("");

  useEffect(() => {
    fetch("/api/contexts")
      .then((r) => r.json())
      .then((d) => { if (d.success) setContexts(d.contexts); })
      .finally(() => setContextsLoading(false));
  }, []);

  async function handleCreateContext() {
    if (!newCtx.label.trim()) return;
    setCtxError("");
    setSavingCtx(true);
    try {
      const res  = await fetch("/api/teacher/contexts", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          key:         newCtx.label.trim().toUpperCase().replace(/\s+/g, "_"),
          label:       newCtx.label.trim(),
          description: newCtx.description.trim() || undefined,
          icon:        newCtx.icon.trim() || "📦",
          color:       newCtx.color,
        }),
      });
      const json = await res.json();
      if (!json.success) { setCtxError(json.error ?? "Failed to create context."); return; }
      const created: ContextOption = {
        key:         json.context.key,
        label:       json.context.label,
        description: json.context.description,
        icon:        json.context.icon,
        color:       json.context.color,
      };
      setContexts((prev) => [...prev, created]);
      setInfo((p) => ({ ...p, context: created.key }));
      setNewCtx({ label: "", description: "", icon: "📦", color: "#64748B" });
      setShowNewCtx(false);
    } catch {
      setCtxError("Network error. Please try again.");
    } finally {
      setSavingCtx(false);
    }
  }

  const updateStage = useCallback((n: number, patch: Partial<SimpleStage>) => {
    setStages((prev) => prev.map((s) => s.stageNumber === n ? { ...s, ...patch } : s));
  }, []);

  function buildPayload(saveAsDraft: boolean) {
    const stagePayload = stages.map((s) => {
      let type: string;
      let options: object;
      let correctAnswer: string | null = null;

      if (s.mode === "multiple_choice") {
        type    = "MULTIPLE_CHOICE";
        options = { choices: s.choices, correctChoiceIndex: s.correctChoiceIndex };
      } else if (s.mode === "ranking") {
        type          = "RANKING";
        options       = { rankItems: s.rankItems };
        correctAnswer = JSON.stringify(s.correctOrder.map((i) => s.rankItems[i]?.text ?? ""));
      } else {
        type          = "OPEN_ENDED";
        options       = { starterChips: s.starterChips, minChars: s.minChars };
        correctAnswer = s.answerKey.trim() || null;
      }

      return {
        stageNumber:   s.stageNumber,
        type,
        title:         s.title,
        instruction:   s.instruction,
        hint:          s.hint || null,
        options,
        correctAnswer,
        maxScore:      s.maxScore,
      };
    });

    // Build quiz payload
    const quizPayload = quizQuestions.filter(q => q.questionText.trim()).map((q) => {
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

    return {
      title:         info.title,
      scenario:      info.scenario,
      context:       info.context,
      icon:          "📦",
      bannerUrl:     info.bannerUrl || null,
      timeEstimate:  parseInt(info.timeEstimate) || 90,
      stages:        stagePayload,
      quizQuestions: quizPayload,
      saveAsDraft,
    };
  }

  async function handleSubmit(saveAsDraft: boolean) {
    setError("");
    setSaving(true);
    try {
      const res = await fetch("/api/teacher/modules/create", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(buildPayload(saveAsDraft)),
      });
      const json = await res.json();
      if (!json.success) {
        setError(json.error ?? "Failed to create module.");
        return;
      }
      router.push("/admin");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const currentStage   = stages.find((s) => s.stageNumber === activeStage)!;
  const stagesComplete = stages.every((s) => s.instruction.trim().length > 0);

  // ── Step: Module Info ─────────────────────────────────────
  if (step === "info") {
    return (
      <div className="min-h-screen bg-[#0D1117] text-white p-6">
        <div className="max-w-2xl mx-auto space-y-6">
          <div>
            <button
              onClick={() => router.push("/admin")}
              className="text-sm text-slate-400 hover:text-white mb-4 flex items-center gap-1"
            >
              ← Back to Admin
            </button>
            <h1 className="text-2xl font-bold text-white">Create New Module</h1>
            <p className="text-slate-400 text-sm mt-1">Step 1 of 4 — Module Info</p>
          </div>

          <div className="flex gap-2">
            {["Module Info", "Module Quiz", "12 Stages", "Review"].map((lbl, i) => (
              <div key={i} className="flex-1 h-1.5 rounded-full" style={{ background: i === 0 ? "#8B5CF6" : "#1e293b" }} />
            ))}
          </div>

          <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-6 space-y-5">
            <div>
              <FieldLabel>Module Title *</FieldLabel>
              <TextInput
                value={info.title}
                onChange={(v) => setInfo((p) => ({ ...p, title: v }))}
                placeholder="e.g. Feeding Program Budget Planning"
              />
            </div>
            <div>
              <FieldLabel>Module Banner (optional)</FieldLabel>
              <BannerUpload
                value={info.bannerUrl}
                onChange={(url) => setInfo((p) => ({ ...p, bannerUrl: url }))}
                dark
              />
            </div>
            <div>
              <FieldLabel>Scenario / Problem Description *</FieldLabel>
              <RichTextEditor
                value={info.scenario}
                onChange={(v) => setInfo((p) => ({ ...p, scenario: v }))}
                placeholder="Describe the real-world problem students will solve in this module…"
                dark
                minHeight="140px"
              />
            </div>
            <div className="space-y-3">
              <FieldLabel>Context / Subject Area *</FieldLabel>
              {contextsLoading ? (
                <div className="h-10 rounded-lg border border-white/10 bg-slate-800/60 animate-pulse" />
              ) : (
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {contexts.map((ctx) => (
                    <button
                      key={ctx.key}
                      type="button"
                      onClick={() => { setInfo((p) => ({ ...p, context: ctx.key })); setShowNewCtx(false); }}
                      className={cn(
                        "flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-sm transition-all",
                        info.context === ctx.key
                          ? "border-2 font-semibold"
                          : "border-white/10 bg-slate-800/40 text-slate-400 hover:border-slate-500 hover:text-slate-300"
                      )}
                      style={
                        info.context === ctx.key
                          ? { borderColor: ctx.color, backgroundColor: ctx.color + "22", color: ctx.color }
                          : {}
                      }
                    >
                      <span className="text-base flex-shrink-0">{ctx.icon}</span>
                      <div className="min-w-0">
                        <p className="truncate font-medium leading-tight">{ctx.label}</p>
                        {ctx.description && (
                          <p className="truncate text-[10px] opacity-60">{ctx.description}</p>
                        )}
                      </div>
                    </button>
                  ))}

                  <button
                    type="button"
                    onClick={() => { setShowNewCtx((v) => !v); setCtxError(""); }}
                    className={cn(
                      "flex items-center justify-center gap-2 rounded-xl border border-dashed px-3 py-2.5 text-sm transition-all",
                      showNewCtx
                        ? "border-purple-500 bg-purple-950/30 text-purple-400"
                        : "border-slate-600 text-slate-500 hover:border-purple-500 hover:text-purple-400"
                    )}
                  >
                    <span className="text-lg leading-none">{showNewCtx ? "✕" : "+"}</span>
                    <span>{showNewCtx ? "Cancel" : "New context"}</span>
                  </button>
                </div>
              )}

              {showNewCtx && (
                <div className="rounded-xl border border-purple-500/30 bg-purple-950/20 p-4 space-y-3">
                  <p className="text-xs font-semibold text-purple-400 uppercase tracking-wide">Create New Context</p>

                  <div className="flex gap-2">
                    <div className="flex-shrink-0">
                      <p className="text-[10px] text-slate-500 mb-1">Icon</p>
                      <input
                        className="w-14 rounded-lg border border-white/10 bg-slate-800/60 px-2 py-2 text-xl text-center focus:outline-none focus:ring-2 focus:ring-purple-500"
                        value={newCtx.icon}
                        maxLength={4}
                        onChange={(e) => setNewCtx((p) => ({ ...p, icon: e.target.value }))}
                        placeholder="📦"
                      />
                    </div>
                    <div className="flex-1">
                      <p className="text-[10px] text-slate-500 mb-1">Label *</p>
                      <input
                        className="w-full rounded-lg border border-white/10 bg-slate-800/60 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        value={newCtx.label}
                        onChange={(e) => setNewCtx((p) => ({ ...p, label: e.target.value }))}
                        placeholder="e.g. Community Health"
                      />
                    </div>
                    <div className="flex-shrink-0">
                      <p className="text-[10px] text-slate-500 mb-1">Color</p>
                      <input
                        type="color"
                        className="w-14 h-[38px] rounded-lg border border-white/10 bg-slate-800/60 cursor-pointer p-1"
                        value={newCtx.color}
                        onChange={(e) => setNewCtx((p) => ({ ...p, color: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div>
                    <p className="text-[10px] text-slate-500 mb-1">Description (optional)</p>
                    <input
                      className="w-full rounded-lg border border-white/10 bg-slate-800/60 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      value={newCtx.description}
                      onChange={(e) => setNewCtx((p) => ({ ...p, description: e.target.value }))}
                      placeholder="Short description shown under the label…"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <p className="text-[10px] text-slate-500">Preview:</p>
                    <div
                      className="inline-flex items-center gap-1.5 rounded-xl border-2 px-3 py-1.5 text-sm font-semibold"
                      style={{ borderColor: newCtx.color, backgroundColor: newCtx.color + "22", color: newCtx.color }}
                    >
                      <span>{newCtx.icon || "📦"}</span>
                      <span>{newCtx.label || "Context Name"}</span>
                    </div>
                  </div>

                  {ctxError && (
                    <p className="text-xs text-red-400">{ctxError}</p>
                  )}

                  <button
                    type="button"
                    onClick={handleCreateContext}
                    disabled={savingCtx || !newCtx.label.trim()}
                    className="w-full rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-40 disabled:cursor-not-allowed py-2 text-sm font-semibold text-white transition-colors"
                  >
                    {savingCtx ? "Creating…" : "✓ Create & Select"}
                  </button>
                </div>
              )}
            </div>
            <div>
              <FieldLabel>Estimated Time (minutes)</FieldLabel>
              <input
                type="number"
                min={10}
                className="w-32 rounded-lg border border-white/10 bg-slate-800/60 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                value={info.timeEstimate}
                onChange={(e) => setInfo((p) => ({ ...p, timeEstimate: e.target.value }))}
              />
            </div>
          </div>

          <button
            onClick={() => { if (info.title.trim() && info.scenario.trim() && info.context) setStep("quiz"); }}
            disabled={!info.title.trim() || !info.scenario.trim() || !info.context}
            className="w-full rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-40 disabled:cursor-not-allowed py-3 font-semibold transition-colors"
          >
            Next: Module Quiz →
          </button>
        </div>
      </div>
    );
  }

  // ── Step: Module Quiz ─────────────────────────────────────
  if (step === "quiz") {
    return (
      <div className="min-h-screen bg-[#0D1117] text-white p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <div>
            <button onClick={() => setStep("info")} className="text-sm text-slate-400 hover:text-white mb-4 flex items-center gap-1">
              ← Back to Module Info
            </button>
            <h1 className="text-2xl font-bold text-white">Module Quiz</h1>
            <p className="text-slate-400 text-sm mt-1">Step 2 of 4 — Post-Stage Quiz (optional)</p>
          </div>

          <div className="flex gap-2">
            {["Module Info", "Module Quiz", "12 Stages", "Review"].map((lbl, i) => (
              <div key={i} className="flex-1 h-1.5 rounded-full" style={{ background: i <= 1 ? "#8B5CF6" : "#1e293b" }} />
            ))}
          </div>

          <div className="rounded-2xl border border-purple-500/20 bg-purple-950/10 p-4 text-sm text-purple-300 space-y-1">
            <p className="font-semibold">📝 About the Module Quiz</p>
            <p className="text-slate-400">These questions will appear as a separate quiz that students must answer <strong className="text-white">after completing all 12 stages</strong>. Use any of the 3 question types (Multiple Choice, Arrangement, Answer Input). You can skip this step to create the module without a quiz.</p>
          </div>

          <ModuleQuizEditor questions={quizQuestions} onChange={setQuizQuestions} dark />

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => { setQuizQuestions([]); setStep("stages"); }}
              className="flex-1 rounded-xl border border-slate-600 hover:border-slate-400 py-3 text-sm font-semibold text-slate-300 hover:text-white transition-colors"
            >
              Skip Quiz — Go to Stages →
            </button>
            <button
              type="button"
              onClick={() => setStep("stages")}
              disabled={quizQuestions.some(q => !q.questionText.trim()) && quizQuestions.length > 0}
              className="flex-1 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-40 disabled:cursor-not-allowed py-3 text-sm font-semibold transition-colors"
            >
              {quizQuestions.length === 0 ? "No Quiz — Next: Configure Stages →" : `Save ${quizQuestions.length} Question${quizQuestions.length !== 1 ? "s" : ""} — Next: Configure Stages →`}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Step: Stages ──────────────────────────────────────────
  if (step === "stages") {
    return (
      <div className="min-h-screen bg-[#0D1117] text-white flex">
        <aside className="w-56 flex-shrink-0 border-r border-white/10 flex flex-col">
          <div className="p-4 border-b border-white/10">
            <button
              onClick={() => setStep("quiz")}
              className="text-xs text-slate-400 hover:text-white"
            >
              ← Module Quiz
            </button>
            <p className="text-sm font-semibold text-white mt-1 truncate">{info.title}</p>
            <p className="text-xs text-slate-400">Step 3 of 4 — Stages</p>
          </div>

          <div className="flex-1 overflow-y-auto py-2">
            {stages.map((s) => {
              const phase    = PHASE_OF(s.stageNumber);
              const hasQ     = s.instruction.trim().length > 0;
              const isActive = s.stageNumber === activeStage;
              return (
                <button
                  key={s.stageNumber}
                  type="button"
                  onClick={() => setActiveStage(s.stageNumber)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors",
                    isActive ? "bg-slate-800" : "hover:bg-slate-800/50"
                  )}
                >
                  <span
                    className="h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                    style={{
                      background: isActive ? phase.color : phase.color + "33",
                      color:      isActive ? "#fff" : phase.color,
                    }}
                  >
                    {s.stageNumber}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className={cn("text-xs font-medium truncate", isActive ? "text-white" : "text-slate-400")}>
                      {s.title}
                    </p>
                    <p className="text-[10px] text-slate-600">{MODE_LABELS[s.mode]}</p>
                  </div>
                  {hasQ ? (
                    <span className="text-green-400 text-xs">✓</span>
                  ) : (
                    <span className="text-slate-600 text-xs">○</span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="p-3 border-t border-white/10 space-y-2">
            <div className="text-xs text-slate-500 text-center">
              {stages.filter((s) => s.instruction.trim()).length}/12 stages configured
            </div>
            <button
              onClick={() => setStep("review")}
              disabled={!stagesComplete}
              className="w-full rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-40 disabled:cursor-not-allowed py-2 text-sm font-semibold transition-colors"
            >
              Review →
            </button>
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-2xl mx-auto">
            <StageEditor
              stage={currentStage}
              onChange={(patch) => updateStage(currentStage.stageNumber, patch)}
            />

            <div className="flex justify-between mt-8">
              <button
                type="button"
                onClick={() => setActiveStage((n) => Math.max(1, n - 1))}
                disabled={activeStage === 1}
                className="rounded-lg border border-white/10 px-4 py-2 text-sm text-slate-400 hover:text-white disabled:opacity-30 transition-colors"
              >
                ← Previous Stage
              </button>
              <button
                type="button"
                onClick={() => {
                  if (activeStage === 12) setStep("review");
                  else setActiveStage((n) => n + 1);
                }}
                className="rounded-lg bg-slate-700 hover:bg-slate-600 px-4 py-2 text-sm font-medium text-white transition-colors"
              >
                {activeStage === 12 ? "Review →" : "Next Stage →"}
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // ── Step: Review & Publish ────────────────────────────────
  return (
    <div className="min-h-screen bg-[#0D1117] text-white p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <button
            onClick={() => setStep("stages")}
            className="text-sm text-slate-400 hover:text-white mb-4 flex items-center gap-1"
          >
            ← Back to Stages
          </button>
          <h1 className="text-2xl font-bold text-white">Review Module</h1>
          <p className="text-slate-400 text-sm mt-1">Step 4 of 4 — Confirm and publish</p>
        </div>

        <div className="flex gap-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex-1 h-1.5 rounded-full bg-purple-600" />
          ))}
        </div>

        <div className="rounded-2xl border border-white/10 bg-slate-900/60 overflow-hidden">
          {info.bannerUrl && (
            <img src={info.bannerUrl} alt="Banner" className="w-full h-32 object-cover" />
          )}
          <div className="p-5 space-y-2">
            <p className="font-semibold text-white text-lg">{info.title}</p>
            <div
              className="text-sm text-slate-400 prose prose-sm prose-invert max-w-none line-clamp-3"
              dangerouslySetInnerHTML={{ __html: info.scenario }}
            />
            {info.context && <p className="text-xs text-slate-500">Context: {info.context}</p>}
            <p className="text-xs text-slate-500">Est. {info.timeEstimate} min · 12 stages</p>
          </div>
        </div>

        {/* Quiz summary */}
        <div className="rounded-2xl border border-white/10 bg-slate-900/60 overflow-hidden">
          <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
            <p className="text-sm font-semibold text-white">Module Quiz</p>
            <button type="button" onClick={() => setStep("quiz")} className="text-xs text-purple-400 hover:text-purple-300">Edit</button>
          </div>
          {quizQuestions.length === 0 ? (
            <p className="px-4 py-3 text-xs text-slate-500">No quiz questions — students will skip directly to the completion screen after Stage 12.</p>
          ) : (
            <div className="divide-y divide-white/5">
              {quizQuestions.map((q) => (
                <div key={q.questionNum} className="px-4 py-2.5 flex items-center gap-3 text-sm">
                  <span className="w-5 h-5 rounded-full bg-purple-600/30 text-purple-300 text-[10px] font-black flex items-center justify-center shrink-0">{q.questionNum}</span>
                  <span className="flex-1 truncate text-slate-300">{q.questionText || "(no text)"}</span>
                  <span className="text-[10px] text-slate-500">{q.mode === "multiple_choice" ? "MC" : q.mode === "ranking" ? "Rank" : "Input"}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-white/10 bg-slate-900/60 overflow-hidden">
          <div className="px-4 py-3 border-b border-white/10">
            <p className="text-sm font-semibold text-white">All 12 Stages</p>
          </div>
          <div className="divide-y divide-white/5">
            {stages.map((s) => {
              const phase = PHASE_OF(s.stageNumber);
              const hasQ  = s.instruction.trim().length > 0;
              return (
                <div key={s.stageNumber} className="flex items-center gap-3 px-4 py-2.5">
                  <span
                    className="h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                    style={{ background: phase.color + "33", color: phase.color }}
                  >
                    {s.stageNumber}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-300 truncate">{s.title}</p>
                    <p className="text-xs text-slate-500 truncate">{s.instruction || <em className="text-red-400">No question set</em>}</p>
                  </div>
                  <span className="text-xs text-slate-500">{MODE_ICONS[s.mode]} {MODE_LABELS[s.mode]}</span>
                  {hasQ ? (
                    <span className="text-green-400 text-xs">✓</span>
                  ) : (
                    <span className="text-red-400 text-xs">!</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {error && (
          <div className="rounded-xl bg-red-950/40 border border-red-500/30 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        {!stagesComplete && (
          <div className="rounded-xl bg-amber-950/30 border border-amber-500/30 px-4 py-3 text-sm text-amber-300">
            ⚠️ Some stages are missing a question/instruction. Go back and fill them in.
          </div>
        )}

        {/* Draft/Publish explanation */}
        <div className="rounded-xl border border-white/10 bg-slate-800/40 px-4 py-3 text-xs text-slate-400 space-y-1">
          <p><span className="font-semibold text-slate-300">Save as Draft</span> — module is saved but hidden from all sections. You can continue editing and publish later.</p>
          <p><span className="font-semibold text-slate-300">Publish Module</span> — module becomes active and can be assigned to sections. All 12 stages must be complete.</p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => handleSubmit(true)}
            disabled={saving}
            className="flex-1 rounded-xl border border-slate-600 hover:border-slate-400 py-3 text-sm font-semibold text-slate-300 hover:text-white transition-colors disabled:opacity-40"
          >
            {saving ? "Saving…" : "◐ Save as Draft"}
          </button>
          <button
            onClick={() => handleSubmit(false)}
            disabled={saving || !stagesComplete}
            className="flex-1 rounded-xl bg-purple-600 hover:bg-purple-500 py-3 text-sm font-semibold text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {saving ? "Publishing…" : "✓ Publish Module"}
          </button>
        </div>
      </div>
    </div>
  );
}
