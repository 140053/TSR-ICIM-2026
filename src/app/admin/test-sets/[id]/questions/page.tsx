"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────
interface TestSetInfo {
  id:          number;
  title:       string;
  type:        "PRE_TEST" | "POST_TEST";
  description: string | null;
  timeLimit:   number | null;
  isActive:    boolean;
  module:      { id: number; title: string; icon: string } | null;
}

interface Question {
  id:           number;
  questionNum:  number;
  context:      string;
  questionText: string;
  answer:       string;
  answerType:   string;
  choices:      string | null;
  difficulty:   string;
  melc:         string | null;
  points:       number;
}

interface ContextOption {
  id:    number;
  key:   string;
  label: string;
  icon:  string;
  color: string;
}

type AnswerType = "number" | "text" | "time" | "multiple_choice";

type QForm = {
  questionNum:   string;
  context:       string;
  questionText:  string;
  answerType:    AnswerType;
  answer:        string;
  choiceA:       string;
  choiceB:       string;
  choiceC:       string;
  choiceD:       string;
  correctChoice: "A" | "B" | "C" | "D";
  difficulty:    "easy" | "average" | "difficult";
  melc:          string;
  points:        string;
};

const BLANK_FORM: QForm = {
  questionNum: "", context: "", questionText: "",
  answerType: "number", answer: "",
  choiceA: "", choiceB: "", choiceC: "", choiceD: "",
  correctChoice: "A", difficulty: "average", melc: "", points: "1",
};

// ─── Helpers ─────────────────────────────────────────────────
function parsedChoices(raw: string | null): string[] | null {
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

function formFromQuestion(q: Question): QForm {
  const choices = parsedChoices(q.choices) ?? ["", "", "", ""];
  const ismc = q.answerType === "multiple_choice";
  return {
    questionNum:   String(q.questionNum),
    context:       q.context,
    questionText:  q.questionText,
    answerType:    q.answerType as AnswerType,
    answer:        ismc ? "" : q.answer,
    choiceA:       choices[0] ?? "",
    choiceB:       choices[1] ?? "",
    choiceC:       choices[2] ?? "",
    choiceD:       choices[3] ?? "",
    correctChoice: ismc ? (q.answer as "A" | "B" | "C" | "D") : "A",
    difficulty:    q.difficulty as QForm["difficulty"],
    melc:          q.melc ?? "",
    points:        String(q.points),
  };
}

function buildPayload(form: QForm) {
  const isMC = form.answerType === "multiple_choice";
  return {
    questionNum:  parseInt(form.questionNum),
    context:      form.context.trim(),
    questionText: form.questionText.trim(),
    answerType:   form.answerType,
    answer:       isMC ? form.correctChoice : form.answer.trim(),
    choices:      isMC ? [form.choiceA, form.choiceB, form.choiceC, form.choiceD] : null,
    difficulty:   form.difficulty,
    melc:         form.melc.trim() || null,
    points:       parseInt(form.points) || 1,
  };
}

// ─── Badges ───────────────────────────────────────────────────
const DIFF_CLS: Record<string, string> = {
  easy:      "bg-[#D1FAE5] dark:bg-[#063c28] text-[#4A9B7F] border-[#4A9B7F]/30",
  average:   "bg-[#FEF3C7] dark:bg-[#3d2800] text-[#F59E0B] border-[#F59E0B]/30",
  difficult: "bg-[#FEE2E2] dark:bg-[#450a0a] text-[#E05C5C] border-[#E05C5C]/30",
};
const DIFF_LABEL: Record<string, string> = { easy: "Easy", average: "Average", difficult: "Difficult" };
const TYPE_BADGE: Record<string, string> = {
  PRE_TEST:  "bg-[#DBEAFE] dark:bg-[#1e3a5f] text-[#3B82C4] border-[#3B82C4]/40",
  POST_TEST: "bg-[#EDE9FE] dark:bg-[#2e1065] text-[#8B5CF6] border-[#8B5CF6]/40",
};
const TYPE_LABEL: Record<string, string> = { PRE_TEST: "Pre-Test", POST_TEST: "Post-Test" };
const AT_LABEL: Record<string, string> = {
  number: "Number", text: "Short Text", time: "Time", multiple_choice: "Multiple Choice",
};

// ─── Input helpers ────────────────────────────────────────────
function TextInput({ value, onChange, placeholder, className, type = "text" }: {
  value: string; onChange: (v: string) => void; placeholder?: string; className?: string; type?: string;
}) {
  return (
    <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
      className={cn("w-full px-3 py-2 text-sm bg-[#F8FAFC] dark:bg-[#0F1E2E] border border-[#E2E8F0] dark:border-[#334155] rounded-xl focus:outline-none focus:border-[#8B5CF6] transition-colors", className)} />
  );
}
function Label({ children }: { children: React.ReactNode }) {
  return <label className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] dark:text-[#94A3B8]">{children}</label>;
}

// ─── Context picker ───────────────────────────────────────────
const CUSTOM_KEY = "__custom__";

function ContextPicker({
  value, onChange, contexts, onCreateContext, creating,
}: {
  value:           string;
  onChange:        (v: string) => void;
  contexts:        ContextOption[];
  onCreateContext: (label: string) => Promise<void>;
  creating:        boolean;
}) {
  const inList   = contexts.some((c) => c.label === value);
  const isCustom = !inList; // value is typed but not in DB

  // What the <select> shows
  const selectValue = inList ? value : CUSTOM_KEY;

  function handleSelect(e: React.ChangeEvent<HTMLSelectElement>) {
    if (e.target.value === CUSTOM_KEY) {
      onChange(""); // clear so user can type
    } else {
      onChange(e.target.value);
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      {/* Select */}
      <select
        value={selectValue}
        onChange={handleSelect}
        className="w-full px-3 py-2 text-sm bg-[#F8FAFC] dark:bg-[#0F1E2E] border border-[#E2E8F0] dark:border-[#334155] rounded-xl focus:outline-none focus:border-[#8B5CF6]"
      >
        <option value={CUSTOM_KEY} disabled={value !== "" && !inList}>
          {isCustom && value ? `✏️ Custom: "${value}"` : "— Select or type custom —"}
        </option>
        {contexts.map((c) => (
          <option key={c.id} value={c.label}>{c.icon} {c.label}</option>
        ))}
        <option value={CUSTOM_KEY}>✏️ Type custom…</option>
      </select>

      {/* Custom text input — always shown when value is not in list */}
      {(isCustom || selectValue === CUSTOM_KEY) && (
        <div className="flex gap-2">
          <input
            autoFocus={selectValue === CUSTOM_KEY}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="e.g. Sari-Sari Store"
            className="flex-1 px-3 py-2 text-sm bg-[#F8FAFC] dark:bg-[#0F1E2E] border border-[#E2E8F0] dark:border-[#334155] rounded-xl focus:outline-none focus:border-[#8B5CF6]"
          />
          {/* Save to DB button — shown only when typed value is non-empty and not already in list */}
          {value.trim() && !inList && (
            <button
              type="button"
              onClick={() => onCreateContext(value.trim())}
              disabled={creating}
              title="Save this context to the database for future reuse"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-[#EDE9FE] dark:bg-[#2e1065] text-[#8B5CF6] hover:bg-[#DDD6FE] dark:hover:bg-[#3b1f7a] border border-[#8B5CF6]/30 disabled:opacity-50 transition-all whitespace-nowrap"
            >
              {creating ? "Saving…" : "💾 Save to DB"}
            </button>
          )}
        </div>
      )}

      {/* Helper text */}
      <p className="text-[10px] text-[#94A3B8]">
        {inList
          ? "Context from database. Click \"✏️ Type custom…\" to use a different value."
          : value.trim()
          ? "Custom value. Click \"💾 Save to DB\" to add it to the database for future reuse."
          : "Select an existing context or type a custom one below."}
      </p>
    </div>
  );
}

// ─── Question Form (rendered inside modal) ────────────────────
function QuestionForm({
  form, setForm, onSave, onCancel, saving, error, isNew, nextNum,
  contexts, onCreateContext, creatingContext,
}: {
  form:             QForm;
  setForm:          React.Dispatch<React.SetStateAction<QForm>>;
  onSave:           () => void;
  onCancel:         () => void;
  saving:           boolean;
  error:            string | null;
  isNew:            boolean;
  nextNum:          number;
  contexts:         ContextOption[];
  onCreateContext:  (label: string) => Promise<void>;
  creatingContext:  boolean;
}) {
  const set = (k: keyof QForm, v: string) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-6 gap-3">

        {/* Q# */}
        <div className="flex flex-col gap-1.5 sm:col-span-1">
          <Label>Q #</Label>
          <TextInput type="number" value={form.questionNum} onChange={(v) => set("questionNum", v)} placeholder={String(nextNum)} />
        </div>

        {/* Context — now a smart picker */}
        <div className="flex flex-col gap-1.5 sm:col-span-5">
          <Label>Context / Scenario *</Label>
          <ContextPicker
            value={form.context}
            onChange={(v) => set("context", v)}
            contexts={contexts}
            onCreateContext={onCreateContext}
            creating={creatingContext}
          />
        </div>

        {/* Question text */}
        <div className="flex flex-col gap-1.5 sm:col-span-6">
          <Label>Question Text *</Label>
          <textarea rows={3} value={form.questionText} onChange={(e) => set("questionText", e.target.value)}
            placeholder="Write the full question here…"
            className="w-full px-3 py-2 text-sm bg-[#F8FAFC] dark:bg-[#0F1E2E] border border-[#E2E8F0] dark:border-[#334155] rounded-xl focus:outline-none focus:border-[#8B5CF6] resize-none" />
        </div>

        {/* Answer type */}
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <Label>Answer Type</Label>
          <select value={form.answerType} onChange={(e) => set("answerType", e.target.value)}
            className="w-full px-3 py-2 text-sm bg-[#F8FAFC] dark:bg-[#0F1E2E] border border-[#E2E8F0] dark:border-[#334155] rounded-xl focus:outline-none focus:border-[#8B5CF6]">
            <option value="number">Number</option>
            <option value="text">Short Text</option>
            <option value="time">Time</option>
            <option value="multiple_choice">Multiple Choice</option>
          </select>
        </div>

        {/* Correct answer (non-MC) */}
        {form.answerType !== "multiple_choice" && (
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label>Correct Answer *</Label>
            <TextInput value={form.answer} onChange={(v) => set("answer", v)}
              placeholder={form.answerType === "number" ? "e.g. 125" : form.answerType === "time" ? "e.g. 1:30" : "e.g. Store A"} />
          </div>
        )}

        {/* Difficulty */}
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <Label>Difficulty</Label>
          <select value={form.difficulty} onChange={(e) => set("difficulty", e.target.value)}
            className="w-full px-3 py-2 text-sm bg-[#F8FAFC] dark:bg-[#0F1E2E] border border-[#E2E8F0] dark:border-[#334155] rounded-xl focus:outline-none focus:border-[#8B5CF6]">
            <option value="easy">Easy</option>
            <option value="average">Average</option>
            <option value="difficult">Difficult</option>
          </select>
        </div>

        {/* Points */}
        <div className="flex flex-col gap-1.5 sm:col-span-1">
          <Label>Points</Label>
          <TextInput type="number" value={form.points} onChange={(v) => set("points", v)} placeholder="1" />
        </div>

        {/* MC choices */}
        {form.answerType === "multiple_choice" && (
          <>
            <div className="sm:col-span-6"><Label>Answer Choices</Label></div>
            {(["A","B","C","D"] as const).map((letter) => {
              const key = `choice${letter}` as keyof QForm;
              return (
                <div key={letter} className="flex flex-col gap-1.5 sm:col-span-3">
                  <div className="flex items-center gap-2">
                    <span onClick={() => set("correctChoice", letter)}
                      className={cn(
                        "w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-extrabold cursor-pointer shrink-0 transition-all border",
                        form.correctChoice === letter
                          ? "bg-[#8B5CF6] text-white border-[#8B5CF6]"
                          : "bg-white dark:bg-[#1E293B] text-[#64748B] border-[#E2E8F0] dark:border-[#334155] hover:border-[#8B5CF6]"
                      )}
                      title={`Mark ${letter} as correct`}>
                      {letter}
                    </span>
                    <TextInput value={form[key] as string} onChange={(v) => set(key, v)} placeholder={`Choice ${letter}`} />
                  </div>
                </div>
              );
            })}
            <div className="sm:col-span-6 text-[11px] text-[#64748B] dark:text-[#94A3B8]">
              Click a letter circle to mark it as the correct answer.
            </div>
          </>
        )}

        {/* MELC */}
        <div className="flex flex-col gap-1.5 sm:col-span-4">
          <Label>MELC / Learning Competency (optional)</Label>
          <TextInput value={form.melc} onChange={(v) => set("melc", v)} placeholder="e.g. M6NS-Ia-87.1" />
        </div>

      </div>

      {error && (
        <p className="text-sm text-[#E05C5C] bg-[#FEE2E2] dark:bg-[#450a0a] px-3.5 py-2.5 rounded-xl font-semibold">
          ⚠️ {error}
        </p>
      )}

      <div className="flex gap-2 pt-1">
        <button onClick={onSave}
          disabled={saving || !form.questionText.trim() || !form.context.trim()}
          className="flex-1 py-2.5 rounded-xl text-sm font-extrabold font-nunito bg-[#8B5CF6] text-white hover:bg-[#7c3aed] disabled:opacity-50 transition-colors">
          {saving ? "Saving…" : isNew ? "Add Question" : "Save Changes"}
        </button>
        <button onClick={onCancel} disabled={saving}
          className="px-5 py-2.5 rounded-xl text-sm font-bold text-[#64748B] border border-[#E2E8F0] dark:border-[#334155] hover:border-[#8B5CF6] hover:text-[#8B5CF6] transition-all">
          Cancel
        </button>
      </div>
    </div>
  );
}

// ─── Question Card ────────────────────────────────────────────
function QuestionCard({ q, onEdit, onDelete }: {
  q: Question; onEdit: () => void; onDelete: () => void;
}) {
  const choices = parsedChoices(q.choices);
  const isMC = q.answerType === "multiple_choice";

  return (
    <div className="bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center gap-3 px-5 py-3.5 border-b border-[#E2E8F0] dark:border-[#334155] bg-[#F8FAFC] dark:bg-[#162032]">
        <div className="w-8 h-8 rounded-xl bg-[#8B5CF6] text-white flex items-center justify-center text-sm font-extrabold shrink-0">
          {q.questionNum}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-[#64748B] dark:text-[#94A3B8]">{q.context}</span>
          <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border", DIFF_CLS[q.difficulty])}>
            {DIFF_LABEL[q.difficulty]}
          </span>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#F1F5F9] dark:bg-[#334155] text-[#64748B] border border-transparent">
            {AT_LABEL[q.answerType] ?? q.answerType}
          </span>
          <span className="text-[10px] font-semibold text-[#94A3B8]">{q.points} pt{q.points !== 1 ? "s" : ""}</span>
        </div>
        <div className="ml-auto flex gap-1.5 shrink-0">
          <button onClick={onEdit}
            className="text-[11px] font-bold px-3 py-1 rounded-lg border border-[#E2E8F0] dark:border-[#334155] text-[#64748B] hover:border-[#8B5CF6] hover:text-[#8B5CF6] hover:bg-[#EDE9FE] dark:hover:bg-[#2e1065] transition-all">
            ✏️ Edit
          </button>
          <button onClick={onDelete}
            className="text-[11px] font-bold px-3 py-1 rounded-lg border border-[#E2E8F0] dark:border-[#334155] text-[#64748B] hover:border-[#E05C5C] hover:text-[#E05C5C] hover:bg-[#FEE2E2] dark:hover:bg-[#450a0a] transition-all">
            🗑️ Delete
          </button>
        </div>
      </div>
      <div className="px-5 py-4">
        <p className="text-sm font-semibold leading-relaxed mb-3">{q.questionText}</p>
        {isMC && choices && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mb-3">
            {(["A","B","C","D"] as const).map((letter, i) => (
              <div key={letter}
                className={cn("flex items-center gap-2 px-3 py-1.5 rounded-xl border text-sm",
                  q.answer === letter
                    ? "bg-[#D1FAE5] dark:bg-[#063c28] border-[#4A9B7F] text-[#4A9B7F] font-bold"
                    : "bg-[#F8FAFC] dark:bg-[#0F172A] border-[#E2E8F0] dark:border-[#334155] text-[#64748B]")}>
                <span className={cn("w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-extrabold shrink-0",
                  q.answer === letter ? "bg-[#4A9B7F] text-white" : "bg-[#E2E8F0] dark:bg-[#334155] text-[#64748B]")}>
                  {letter}
                </span>
                {choices[i] ?? "—"}
                {q.answer === letter && <span className="ml-auto text-[10px]">✓</span>}
              </div>
            ))}
          </div>
        )}
        {!isMC && (
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-[#64748B] dark:text-[#94A3B8] uppercase tracking-wider">Answer:</span>
            <span className="text-sm font-bold text-[#4A9B7F] bg-[#D1FAE5] dark:bg-[#063c28] px-2.5 py-0.5 rounded-lg">{q.answer}</span>
          </div>
        )}
        {q.melc && (
          <p className="mt-2 text-[11px] text-[#94A3B8]"><span className="font-bold">MELC:</span> {q.melc}</p>
        )}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────
export default function QuestionsEditorPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const tsId   = params.id;

  const [testSet,   setTestSet]   = useState<TestSetInfo | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [saving,    setSaving]    = useState(false);
  const [error,     setError]     = useState<string | null>(null);
  const [success,   setSuccess]   = useState<string | null>(null);

  // Contexts
  const [contexts,        setContexts]        = useState<ContextOption[]>([]);
  const [creatingContext, setCreatingContext]  = useState(false);

  // Form modal — null = closed; -1 = new; n = editing question.id
  const [editId, setEditId] = useState<number | null>(null);
  const [form,   setForm]   = useState<QForm>(BLANK_FORM);

  // Delete confirm modal
  const [deleteTarget, setDeleteTarget] = useState<Question | null>(null);
  const [deleting,     setDeleting]     = useState(false);
  const [deleteError,  setDeleteError]  = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res  = await fetch(`/api/admin/test-sets/${tsId}/questions`, { credentials: "include" });
    const data = await res.json();
    if (data.success) { setTestSet(data.testSet); setQuestions(data.questions); }
    setLoading(false);
  }, [tsId]);

  useEffect(() => { void load(); }, [load]);

  // Load contexts from DB
  useEffect(() => {
    fetch("/api/contexts")
      .then((r) => r.json())
      .then((d) => { if (d.success) setContexts(d.contexts); });
  }, []);

  const nextNum  = questions.length > 0 ? Math.max(...questions.map((q) => q.questionNum)) + 1 : 1;
  const openNew  = () => { setEditId(-1); setForm({ ...BLANK_FORM, questionNum: String(nextNum) }); setError(null); };
  const openEdit = (q: Question) => { setEditId(q.id); setForm(formFromQuestion(q)); setError(null); };
  const closeForm = () => { setEditId(null); setError(null); };

  // Create a new ScenarioContext from the typed label
  async function handleCreateContext(label: string) {
    setCreatingContext(true);
    const key = label.trim().toUpperCase().replace(/[^A-Z0-9]+/g, "_").replace(/^_|_$/g, "");
    try {
      const res  = await fetch("/api/admin/contexts", {
        method:  "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, label: label.trim(), icon: "📦", color: "#64748B" }),
      });
      const data = await res.json();
      if (data.success) {
        const created: ContextOption = {
          id:    data.context.id,
          key:   data.context.key,
          label: data.context.label,
          icon:  data.context.icon,
          color: data.context.color,
        };
        setContexts((prev) => [...prev, created]);
        // keep form.context as-is (it already matches the new label)
        setSuccess(`Context "${label}" saved to database.`);
        setTimeout(() => setSuccess(null), 3000);
      }
    } finally {
      setCreatingContext(false);
    }
  }

  const handleSave = async () => {
    if (!form.questionText.trim()) { setError("Question text is required."); return; }
    if (!form.context.trim())      { setError("Context is required."); return; }
    if (form.answerType !== "multiple_choice" && !form.answer.trim()) { setError("Answer is required."); return; }
    if (!form.questionNum || isNaN(parseInt(form.questionNum))) { setError("Valid question number is required."); return; }
    setSaving(true); setError(null);
    const payload = buildPayload(form);
    const res = editId === -1
      ? await fetch(`/api/admin/test-sets/${tsId}/questions`, {
          method: "POST", credentials: "include",
          headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
        })
      : await fetch(`/api/admin/test-sets/${tsId}/questions/${editId}`, {
          method: "PATCH", credentials: "include",
          headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
        });
    const data = await res.json();
    setSaving(false);
    if (!data.success) { setError(data.error ?? "Failed to save."); return; }
    setSuccess(editId === -1 ? "Question added!" : "Question updated!");
    closeForm(); void load();
    setTimeout(() => setSuccess(null), 3000);
  };

  async function confirmDeleteQuestion() {
    if (!deleteTarget) return;
    setDeleting(true); setDeleteError(null);
    const res  = await fetch(`/api/admin/test-sets/${tsId}/questions/${deleteTarget.id}`, {
      method: "DELETE", credentials: "include",
    });
    const data = await res.json();
    setDeleting(false);
    if (!data.success) { setDeleteError(data.error ?? "Delete failed."); return; }
    setDeleteTarget(null);
    setSuccess("Question deleted.");
    void load();
    setTimeout(() => setSuccess(null), 3000);
  }

  const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);

  return (
    <>
      <style>{`.font-nunito { font-family: var(--font-nunito,'Nunito',sans-serif); }`}</style>

      {/* ── Question form modal ── */}
      {editId !== null && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => !saving && closeForm()}>
          <div className="bg-white dark:bg-[#1E293B] rounded-2xl shadow-2xl w-full max-w-2xl border border-[#E2E8F0] dark:border-[#334155] flex flex-col max-h-[92vh]"
            onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#E2E8F0] dark:border-[#334155] shrink-0">
              <h2 className="font-nunito font-extrabold text-base text-[#8B5CF6]">
                {editId === -1 ? "➕ New Question" : `✏️ Edit Question #${form.questionNum}`}
              </h2>
              <button onClick={closeForm} disabled={saving}
                className="text-[#64748B] hover:text-[#E05C5C] text-xl leading-none transition-colors disabled:opacity-40">×</button>
            </div>
            <div className="overflow-y-auto p-6 flex-1">
              <QuestionForm
                form={form}
                setForm={setForm}
                onSave={handleSave}
                onCancel={closeForm}
                saving={saving}
                error={error}
                isNew={editId === -1}
                nextNum={nextNum}
                contexts={contexts}
                onCreateContext={handleCreateContext}
                creatingContext={creatingContext}
              />
            </div>
          </div>
        </div>
      )}

      {/* ── Delete question confirm modal ── */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => !deleting && setDeleteTarget(null)}>
          <div className="bg-white dark:bg-[#1E293B] rounded-2xl shadow-2xl p-6 w-full max-w-md border border-[#E2E8F0] dark:border-[#334155]"
            onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-[#FEE2E2] dark:bg-[#450a0a] flex items-center justify-center text-lg shrink-0">🗑️</div>
              <div>
                <h3 className="font-nunito font-extrabold text-base mb-1">Delete Question?</h3>
                <p className="text-sm text-[#64748B] dark:text-[#94A3B8]">
                  <span className="font-bold text-[#1E293B] dark:text-white">Question #{deleteTarget.questionNum}</span>
                  {" "}will be permanently removed.
                </p>
                <p className="text-xs text-[#94A3B8] mt-1 line-clamp-2">&ldquo;{deleteTarget.questionText}&rdquo;</p>
              </div>
            </div>
            {deleteError && (
              <div className="mb-4 px-3.5 py-2.5 bg-[#FEE2E2] dark:bg-[#450a0a] border border-[#E05C5C]/30 rounded-xl text-sm text-[#E05C5C] font-semibold">
                {deleteError}
              </div>
            )}
            <div className="flex gap-2">
              <button onClick={confirmDeleteQuestion} disabled={deleting}
                className="flex-1 py-2.5 rounded-xl text-sm font-extrabold font-nunito bg-[#E05C5C] hover:bg-[#c94b4b] text-white disabled:opacity-50 transition-colors">
                {deleting ? "Deleting…" : "Yes, Delete"}
              </button>
              <button onClick={() => setDeleteTarget(null)} disabled={deleting}
                className="px-5 py-2.5 rounded-xl text-sm font-bold text-[#64748B] border border-[#E2E8F0] dark:border-[#334155] hover:border-[#8B5CF6] hover:text-[#8B5CF6] hover:bg-[#EDE9FE] dark:hover:bg-[#2e1065] transition-all">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="min-h-screen bg-[#F5F7FA] dark:bg-[#0F172A] text-[#1E293B] dark:text-[#F1F5F9] font-nunito">

        <header className="sticky top-0 z-30 bg-white dark:bg-[#1E293B] border-b border-[#E2E8F0] dark:border-[#334155] px-6 h-[56px] flex items-center gap-3 shadow-sm">
          <button onClick={() => router.push("/admin/test-sets")}
            className="text-[#64748B] hover:text-[#1E293B] dark:hover:text-white transition-colors font-bold text-sm shrink-0">
            ← Test Sets
          </button>
          <div className="h-4 w-px bg-[#E2E8F0] dark:bg-[#334155]" />
          {testSet ? (
            <>
              <div className="flex items-center gap-2 min-w-0">
                <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0", TYPE_BADGE[testSet.type])}>
                  {TYPE_LABEL[testSet.type]}
                </span>
                <h1 className="font-extrabold text-base truncate">{testSet.title}</h1>
              </div>
              {testSet.module && (
                <span className="text-xs text-[#64748B] dark:text-[#94A3B8] shrink-0 hidden sm:inline">
                  {testSet.module.icon} {testSet.module.title}
                </span>
              )}
            </>
          ) : (
            <h1 className="font-extrabold text-base">Questions</h1>
          )}
          <div className="ml-auto flex items-center gap-3">
            {!loading && (
              <span className="text-xs font-semibold text-[#64748B] dark:text-[#94A3B8] hidden sm:inline">
                {questions.length} question{questions.length !== 1 ? "s" : ""} · {totalPoints} pts total
              </span>
            )}
            <button onClick={openNew}
              className="px-4 py-2 rounded-xl text-sm font-bold bg-[#8B5CF6] text-white hover:bg-[#7c3aed] transition-all">
              + Add Question
            </button>
          </div>
        </header>

        <div className="max-w-4xl mx-auto px-6 py-8 space-y-5">
          {success && (
            <div className="px-4 py-3 bg-[#D1FAE5] dark:bg-[#063c28] border border-[#4A9B7F]/40 rounded-xl text-sm font-semibold text-[#4A9B7F]">
              ✓ {success}
            </div>
          )}

          {testSet && (
            <div className="flex flex-wrap items-center gap-3 px-5 py-3 bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] rounded-2xl shadow-sm text-sm">
              {testSet.description && (
                <p className="text-[#64748B] dark:text-[#94A3B8] flex-1 min-w-[200px]">{testSet.description}</p>
              )}
              {testSet.timeLimit && (
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-[#F1F5F9] dark:bg-[#334155] text-[#64748B]">
                  ⏱ {Math.round(testSet.timeLimit / 60)} min limit
                </span>
              )}
              <span className={cn("text-[11px] font-bold px-2.5 py-1 rounded-full",
                testSet.isActive ? "bg-[#D1FAE5] dark:bg-[#063c28] text-[#4A9B7F]" : "bg-[#F1F5F9] dark:bg-[#334155] text-[#94A3B8]")}>
                {testSet.isActive ? "Active" : "Inactive"}
              </span>
            </div>
          )}

          {loading ? (
            <div className="text-center py-20 text-[#94A3B8]">Loading…</div>
          ) : questions.length === 0 ? (
            <div className="text-center py-20 border-2 border-dashed border-[#E2E8F0] dark:border-[#334155] rounded-2xl bg-white dark:bg-[#1E293B]">
              <div className="text-5xl mb-4">❓</div>
              <h3 className="font-extrabold text-lg mb-2">No questions yet</h3>
              <p className="text-sm text-[#64748B] dark:text-[#94A3B8] mb-5">
                Click &ldquo;+ Add Question&rdquo; to build this test set.
              </p>
              <button onClick={openNew}
                className="px-5 py-2.5 rounded-xl text-sm font-bold bg-[#8B5CF6] text-white hover:bg-[#7c3aed] transition-all">
                + Add First Question
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {questions.map((q) => (
                <QuestionCard key={q.id} q={q}
                  onEdit={() => openEdit(q)}
                  onDelete={() => { setDeleteTarget(q); setDeleteError(null); }} />
              ))}
              <div className="flex items-center justify-between px-5 py-3 bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] rounded-2xl shadow-sm text-xs text-[#64748B] dark:text-[#94A3B8]">
                <span><strong className="text-[#8B5CF6]">{questions.length}</strong> question{questions.length !== 1 ? "s" : ""}</span>
                <span>Total: <strong className="text-[#8B5CF6]">{totalPoints}</strong> pts</span>
                <div className="flex gap-2">
                  {(["easy","average","difficult"] as const).map((d) => {
                    const n = questions.filter((q) => q.difficulty === d).length;
                    return n > 0 ? (
                      <span key={d} className={cn("px-2 py-0.5 rounded-full border font-bold", DIFF_CLS[d])}>
                        {DIFF_LABEL[d]}: {n}
                      </span>
                    ) : null;
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
