"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import { cn } from "@/lib/utils";

// ─── Toolbar button ───────────────────────────────────────────
function TB({
  onClick, active, title, children,
}: {
  onClick: () => void;
  active?: boolean;
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => { e.preventDefault(); onClick(); }}
      title={title}
      className={cn(
        "px-2 py-1 rounded text-sm font-medium transition-colors select-none",
        active
          ? "bg-[#4A9B7F] text-white"
          : "text-[#5A7860] dark:text-[#7BAF84] hover:bg-[#EBF0EC] dark:hover:bg-[#0A180E]"
      )}
    >
      {children}
    </button>
  );
}

// ─── Props ────────────────────────────────────────────────────
interface RichTextEditorProps {
  value:       string;
  onChange:    (html: string) => void;
  placeholder?: string;
  /** Extra classes applied to the outer wrapper */
  className?:  string;
  /** Dark-theme variant (admin pages use dark background) */
  dark?:       boolean;
  minHeight?:  string;
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder = "Write here…",
  className,
  dark = false,
  minHeight = "120px",
}: RichTextEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ codeBlock: false }),
      Underline,
    ],
    content: value || "",
    onUpdate: ({ editor }) => {
      // Emit empty string when the doc is empty so validation works correctly
      const html = editor.isEmpty ? "" : editor.getHTML();
      onChange(html);
    },
    editorProps: {
      attributes: {
        class: "outline-none min-h-[inherit] prose prose-sm max-w-none",
      },
    },
  });

  if (!editor) return null;

  const toolbarCls = dark
    ? "flex items-center flex-wrap gap-0.5 p-2 border-b border-white/10 bg-slate-800/80"
    : "flex items-center flex-wrap gap-0.5 p-2 border-b border-[#DDE8DF] dark:border-[#1E3524] bg-[#F4F7F5] dark:bg-[#0D1F12]";

  const wrapperCls = dark
    ? cn(
        "rounded-xl border border-white/10 bg-slate-800/60 overflow-hidden focus-within:ring-2 focus-within:ring-purple-500",
        className
      )
    : cn(
        "rounded-xl border border-[#DDE8DF] dark:border-[#1E3524] bg-[#EBF0EC] dark:bg-[#0A180E] overflow-hidden focus-within:border-[#4A9B7F]",
        className
      );

  const editorCls = dark
    ? "px-3.5 py-2.5 text-sm text-slate-200 [&_.prose]:text-slate-200 [&_p]:text-slate-200"
    : "px-3.5 py-2.5 text-sm text-[#1E293B] dark:text-[#F1F5F9]";

  return (
    <div className={wrapperCls}>
      {/* Toolbar */}
      <div className={toolbarCls}>
        <TB onClick={() => editor.chain().focus().toggleBold().run()}      active={editor.isActive("bold")}      title="Bold">      <strong>B</strong>  </TB>
        <TB onClick={() => editor.chain().focus().toggleItalic().run()}    active={editor.isActive("italic")}    title="Italic">    <em>I</em>          </TB>
        <TB onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive("underline")} title="Underline"> <u>U</u>            </TB>
        <div className="w-px h-5 bg-[#DDE8DF] dark:bg-[#1E3524] mx-1" />
        <TB onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive("bulletList")} title="Bullet list">  ≡ List    </TB>
        <TB onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive("orderedList")} title="Numbered list"> 1. List </TB>
        <div className="w-px h-5 bg-[#DDE8DF] dark:bg-[#1E3524] mx-1" />
        <TB onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive("blockquote")} title="Blockquote"> ❝     </TB>
        <div className="w-px h-5 bg-[#DDE8DF] dark:bg-[#1E3524] mx-1 ml-auto" />
        <TB onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()} title="Clear formatting"> ✕ </TB>
      </div>

      {/* Editor area */}
      <div className={editorCls} style={{ minHeight }}>
        {editor.isEmpty && (
          <p className="absolute pointer-events-none text-sm text-[#94A3B8] select-none" aria-hidden>
            {placeholder}
          </p>
        )}
        <EditorContent editor={editor} className="relative" />
      </div>
    </div>
  );
}
