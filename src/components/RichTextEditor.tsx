"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import { cn } from "@/lib/utils";

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
  minHeight?: number;
}

const BTN = "px-2 py-1 rounded text-[11px] font-bold transition-colors";
const ACTIVE = "bg-[#4A9B7F] text-white";
const INACTIVE = "text-[#5A7860] dark:text-[#7BAF84] hover:bg-[#D1FAE5] dark:hover:bg-[#064e35]";

export function RichTextEditor({ value, onChange, placeholder, className, minHeight = 120 }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: false, codeBlock: false, code: false, horizontalRule: false, blockquote: false }),
      Underline,
    ],
    content: value,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class: "focus:outline-none text-sm leading-relaxed text-[#1A2E1C] dark:text-[#E8F5EB] px-3.5 py-2.5",
        style: `min-height:${minHeight}px`,
      },
    },
    immediatelyRender: false,
  });

  // Sync external value changes (e.g. reset)
  const currentHTML = editor?.getHTML();
  if (editor && value !== currentHTML && value !== undefined) {
    if (value === "" && currentHTML !== "<p></p>") {
      editor.commands.clearContent();
    } else if (value !== "" && value !== currentHTML) {
      editor.commands.setContent(value);
    }
  }

  if (!editor) return null;

  const isEmpty = editor.isEmpty;

  return (
    <div className={cn("bg-[#EBF0EC] dark:bg-[#0A180E] border border-[#DDE8DF] dark:border-[#1E3524] rounded-xl overflow-hidden focus-within:border-[#4A9B7F] transition-colors", className)}>
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-[#DDE8DF] dark:border-[#1E3524] bg-white/50 dark:bg-[#132018]/50 flex-wrap">
        <button type="button" onClick={() => editor.chain().focus().toggleBold().run()}
          className={cn(BTN, editor.isActive("bold") ? ACTIVE : INACTIVE)} title="Bold">B</button>
        <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()}
          className={cn(BTN, editor.isActive("italic") ? ACTIVE : INACTIVE, "italic")} title="Italic">I</button>
        <button type="button" onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={cn(BTN, editor.isActive("underline") ? ACTIVE : INACTIVE, "underline")} title="Underline">U</button>
        <div className="w-px h-4 bg-[#DDE8DF] dark:bg-[#1E3524] mx-1" />
        <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={cn(BTN, editor.isActive("bulletList") ? ACTIVE : INACTIVE)} title="Bullet list">• List</button>
        <button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={cn(BTN, editor.isActive("orderedList") ? ACTIVE : INACTIVE)} title="Numbered list">1. List</button>
        <div className="w-px h-4 bg-[#DDE8DF] dark:bg-[#1E3524] mx-1" />
        <button type="button" onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}
          className={cn(BTN, INACTIVE)} title="Clear formatting">✕ Format</button>
      </div>
      {/* Editor area */}
      <div className="relative">
        {isEmpty && placeholder && (
          <p className="absolute top-0 left-0 px-3.5 py-2.5 text-sm text-[#92A894] pointer-events-none select-none">{placeholder}</p>
        )}
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}

// Renders stored HTML safely (student-facing)
export function RichTextView({ html, className }: { html: string; className?: string }) {
  if (!html || html === "<p></p>") return null;
  return (
    <div
      className={cn("rich-text text-sm leading-relaxed", className)}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
