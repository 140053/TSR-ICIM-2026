"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import ModuleQuizEditor, { type QuizQuestion, makeDefaultQuizQuestion } from "@/components/module-quiz-editor";

interface QuizQuestionData {
  id:             number;
  questionNum:    number;
  questionText:   string;
  type:           string;
  options:        unknown;
  correctAnswer:  string | null;
  hint:           string | null;
  maxScore:       number;
}

interface ModuleQuizData {
  id:    number;
  title: string;
  icon:  string;
  questions: QuizQuestionData[];
}

export default function QuizEditorClient({ data }: { data: ModuleQuizData }) {
  const router = useRouter();
  const moduleId = data.id;
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [quizSaving, setQuizSaving] = useState(false);
  const [quizError, setQuizError] = useState("");
  const [saved, setSaved] = useState(false);

  // Convert API data to editor format
  useEffect(() => {
    if (data.questions.length > 0) {
      setQuizQuestions(
        data.questions.map((q) => ({
          questionNum:        q.questionNum,
          questionText:       q.questionText,
          mode:               q.type as "multiple_choice" | "ranking" | "open_ended",
          choices:            (q.options as any)?.choices ?? [{ icon: "🅐", title: "Option A", desc: "" }, { icon: "🅑", title: "Option B", desc: "" }],
          correctChoiceIndex: (q.options as any)?.correctChoiceIndex ?? 0,
          rankItems:          (q.options as any)?.rankItems ?? [{ emoji: "1️⃣", text: "Item 1", sub: "" }, { emoji: "2️⃣", text: "Item 2", sub: "" }],
          correctOrder:       q.correctAnswer ? (() => {
            try {
              const arr: string[] = JSON.parse(q.correctAnswer);
              const items = (q.options as any)?.rankItems ?? [];
              return arr.map((t: string) => items.findIndex((it: any) => it.text === t)).filter((i: number) => i >= 0);
            } catch { return [0, 1]; }
          })() : [0, 1],
          answerKey:          q.type === "open_ended" ? (q.correctAnswer ?? "") : "",
          hint:               q.hint ?? "",
          maxScore:           q.maxScore,
        }))
      );
    } else {
      setQuizQuestions([makeDefaultQuizQuestion(1)]);
    }
  }, [data]);

  // Save quiz questions
  const saveQuiz = async () => {
    setQuizSaving(true);
    setQuizError("");
    setSaved(false);
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
      const res = await fetch(`/api/teacher/modules/${moduleId}/quiz`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ questions }),
      });
      const json = await res.json();
      if (!json.success) {
        setQuizError(json.error ?? "Failed to save quiz.");
      } else {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch {
      setQuizError("Network error.");
    } finally {
      setQuizSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0D1117] text-white flex flex-col">
      {/* Top bar */}
      <header className="sticky top-0 z-40 flex items-center gap-3 border-b border-white/10 bg-[#0D1117]/95 backdrop-blur px-5 h-14">
        <button onClick={() => router.push("/admin")}
          className="text-slate-400 hover:text-white text-sm flex items-center gap-1 transition-colors">
          ← Dashboard
        </button>
        <span className="text-slate-600">/</span>
        <span className="text-sm font-semibold text-white truncate max-w-xs">{data.title}</span>
        <span className="ml-2 text-xs px-2 py-0.5 rounded-full font-semibold border bg-purple-950/40 border-purple-500/40 text-purple-400">
          Scenario Question
        </span>
      </header>

      {/* Content */}
      <div className="flex-1 p-6 max-w-4xl mx-auto w-full">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <span>{data.icon}</span> Scenario Questions
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Add scenario questions for this module. Students will answer these after completing Stage 12.
          </p>
        </div>

        <div className="flex items-center gap-4 mb-6">
          <button
            type="button"
            onClick={saveQuiz}
            disabled={quizSaving}
            className="px-4 py-2 rounded-xl text-sm font-bold bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white transition-colors"
          >
            {quizSaving ? "Saving…" : "Save Questions"}
          </button>
          {saved && (
            <span className="text-green-400 text-sm flex items-center gap-1">
              ✓ Saved
            </span>
          )}
        </div>
        {quizError && (
          <p className="text-xs text-red-400 mb-4">{quizError}</p>
        )}
        <ModuleQuizEditor questions={quizQuestions} onChange={setQuizQuestions} dark />
      </div>
    </div>
  );
}