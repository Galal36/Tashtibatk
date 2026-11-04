"use client";

import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import TextStyle from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import LinkExt from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import Table from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableHeader from "@tiptap/extension-table-header";
import TableCell from "@tiptap/extension-table-cell";
import { useEffect, useRef, useState } from "react";
import { FontSize } from "./fontSize";
import { uploadImage } from "./uploadImage";
import { ApiError } from "@/lib/admin-api";

const FONT_SIZES = ["14px", "16px", "18px", "20px", "24px", "30px", "36px"];

export function RichEditor({
  value,
  onChange,
  dir = "rtl",
}: {
  value: string;
  onChange: (html: string) => void;
  dir?: "rtl" | "ltr";
}) {
  const [linkOpen, setLinkOpen] = useState(false);
  const [imageOpen, setImageOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3, 4, 5, 6] } }),
      Underline,
      TextStyle,
      Color,
      FontSize,
      Highlight.configure({ multicolor: true }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      LinkExt.configure({ openOnClick: false, autolink: true }),
      Image.configure({ inline: false, allowBase64: false }),
      Placeholder.configure({ placeholder: "اكتب المحتوى هنا…" }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: value,
    editorProps: {
      attributes: {
        class: "tiptap article-body min-h-[420px] px-5 py-4 focus:outline-none",
        dir,
      },
      handleDrop(view, event) {
        const files = Array.from(event.dataTransfer?.files ?? []).filter((f) =>
          f.type.startsWith("image/"),
        );
        if (files.length === 0) return false;
        event.preventDefault();
        files.forEach(insertUploadedImage);
        return true;
      },
      handlePaste(view, event) {
        const files = Array.from(event.clipboardData?.files ?? []).filter((f) =>
          f.type.startsWith("image/"),
        );
        if (files.length === 0) return false;
        event.preventDefault();
        files.forEach(insertUploadedImage);
        return true;
      },
    },
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });

  // keep editor in sync if the parent resets the value (e.g. after load)
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value, false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, editor]);

  async function insertUploadedImage(file: File) {
    setError(null);
    setUploading(true);
    try {
      const asset = await uploadImage(file);
      editor?.chain().focus().setImage({ src: asset.url, alt: asset.alt_text }).run();
    } catch (err) {
      setError(uploadErrorMessage(err));
    } finally {
      setUploading(false);
    }
  }

  function insertImageByUrl(url: string) {
    editor?.chain().focus().setImage({ src: url }).run();
  }

  if (!editor) return <div className="min-h-[420px] animate-pulse rounded-xl bg-slate-100" />;

  return (
    <div className="overflow-hidden rounded-xl border border-slate-300 bg-white">
      <Toolbar
        editor={editor}
        onPickImage={() => fileRef.current?.click()}
        onImageUrl={() => setImageOpen(true)}
        onLink={() => setLinkOpen(true)}
      />
      {uploading && (
        <div className="border-b border-amber-200 bg-amber-50 px-4 py-1.5 text-xs text-amber-700">
          جارٍ رفع الصورة…
        </div>
      )}
      {error && (
        <div className="flex items-center justify-between gap-2 border-b border-red-200 bg-red-50 px-4 py-1.5 text-xs text-red-700">
          <span>{error}</span>
          <button type="button" onClick={() => setError(null)} className="font-bold">
            ×
          </button>
        </div>
      )}
      <EditorContent editor={editor} />
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(e) => {
          Array.from(e.target.files ?? []).forEach(insertUploadedImage);
          e.target.value = "";
        }}
      />
      {linkOpen && <LinkModal editor={editor} onClose={() => setLinkOpen(false)} />}
      {imageOpen && (
        <ImageUrlModal
          onSubmit={(url) => {
            insertImageByUrl(url);
            setImageOpen(false);
          }}
          onClose={() => setImageOpen(false)}
        />
      )}
    </div>
  );
}

function uploadErrorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    const d = err.data as { file?: string[]; detail?: string } | string | null;
    if (typeof d === "string" && d) return d;
    if (d && typeof d === "object") {
      if (Array.isArray(d.file) && d.file[0]) return d.file[0];
      if (d.detail) return d.detail;
    }
    if (err.status === 403) return "ليس لديك صلاحية رفع الصور.";
  }
  return "تعذّر رفع الصورة. حاول مرة أخرى.";
}

// ─── Toolbar ────────────────────────────────────────────────────────────────
function Toolbar({
  editor,
  onPickImage,
  onImageUrl,
  onLink,
}: {
  editor: Editor;
  onPickImage: () => void;
  onImageUrl: () => void;
  onLink: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1 border-b border-slate-200 bg-slate-50 p-2">
      <Btn on={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")} label="B" bold />
      <Btn on={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")} label="I" italic />
      <Btn on={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive("underline")} label="U" underline />
      <Btn on={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive("strike")} label="S" strike />
      <Sep />
      <select
        className="h-8 rounded-md border border-slate-300 bg-white px-1 text-xs"
        value={currentHeading(editor)}
        onChange={(e) => {
          const v = e.target.value;
          if (v === "p") editor.chain().focus().setParagraph().run();
          else editor.chain().focus().toggleHeading({ level: Number(v) as 1 | 2 | 3 | 4 | 5 | 6 }).run();
        }}
      >
        <option value="p">نص</option>
        {[1, 2, 3, 4, 5, 6].map((l) => (
          <option key={l} value={l}>{`H${l}`}</option>
        ))}
      </select>
      <select
        className="h-8 rounded-md border border-slate-300 bg-white px-1 text-xs"
        value=""
        onChange={(e) => e.target.value && editor.chain().focus().setFontSize(e.target.value).run()}
      >
        <option value="">حجم الخط</option>
        {FONT_SIZES.map((s) => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>
      <ColorInput title="لون النص" onPick={(c) => editor.chain().focus().setColor(c).run()} />
      <ColorInput
        title="تظليل"
        highlight
        onPick={(c) => editor.chain().focus().toggleHighlight({ color: c }).run()}
      />
      <Sep />
      <Btn on={() => editor.chain().focus().setTextAlign("right").run()} active={editor.isActive({ textAlign: "right" })} label="⟶" />
      <Btn on={() => editor.chain().focus().setTextAlign("center").run()} active={editor.isActive({ textAlign: "center" })} label="≡" />
      <Btn on={() => editor.chain().focus().setTextAlign("left").run()} active={editor.isActive({ textAlign: "left" })} label="⟵" />
      <Btn on={() => editor.chain().focus().setTextAlign("justify").run()} active={editor.isActive({ textAlign: "justify" })} label="☰" />
      <Sep />
      <Btn on={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive("bulletList")} label="•" />
      <Btn on={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive("orderedList")} label="1." />
      <Btn on={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive("blockquote")} label="❝" />
      <Btn on={() => editor.chain().focus().toggleCodeBlock().run()} active={editor.isActive("codeBlock")} label="</>" />
      <Btn on={() => editor.chain().focus().setHorizontalRule().run()} active={false} label="―" />
      <Sep />
      <Btn on={onLink} active={editor.isActive("link")} label="🔗" title="إضافة رابط" />
      <Btn on={() => editor.chain().focus().unsetLink().run()} active={false} label="⛓" title="إزالة الرابط" />
      <Btn on={onPickImage} active={false} label="🖼 صورة" title="رفع صورة من جهازك" />
      <Btn on={onImageUrl} active={false} label="🔗🖼" title="إدراج صورة برابط" />
      <Btn
        on={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
        active={false}
        label="▦"
        title="إدراج جدول"
      />
      <Sep />
      <Btn on={() => editor.chain().focus().undo().run()} active={false} label="↶" title="تراجع" />
      <Btn on={() => editor.chain().focus().redo().run()} active={false} label="↷" title="إعادة" />
    </div>
  );
}

function currentHeading(editor: Editor): string {
  for (const l of [1, 2, 3, 4, 5, 6]) if (editor.isActive("heading", { level: l })) return String(l);
  return "p";
}

function Btn({
  on,
  active,
  label,
  title,
  bold,
  italic,
  underline,
  strike,
}: {
  on: () => void;
  active: boolean;
  label: string;
  title?: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strike?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={on}
      title={title}
      className={`grid h-8 min-w-8 place-items-center whitespace-nowrap rounded-md px-1.5 text-sm transition ${
        active ? "bg-brand-600 text-white" : "text-slate-700 hover:bg-slate-200"
      } ${bold ? "font-bold" : ""} ${italic ? "italic" : ""} ${underline ? "underline" : ""} ${
        strike ? "line-through" : ""
      }`}
    >
      {label}
    </button>
  );
}

function Sep() {
  return <span className="mx-0.5 h-6 w-px bg-slate-300" />;
}

function ColorInput({
  title,
  onPick,
  highlight,
}: {
  title: string;
  onPick: (c: string) => void;
  highlight?: boolean;
}) {
  return (
    <label
      title={title}
      className="relative grid h-8 w-8 cursor-pointer place-items-center rounded-md hover:bg-slate-200"
    >
      <span className={highlight ? "text-amber-500" : "text-slate-700"}>
        {highlight ? "▮" : "A"}
      </span>
      <input
        type="color"
        className="absolute inset-0 cursor-pointer opacity-0"
        onChange={(e) => onPick(e.target.value)}
      />
    </label>
  );
}

// ─── Link modal ─────────────────────────────────────────────────────────────
function LinkModal({ editor, onClose }: { editor: Editor; onClose: () => void }) {
  const [url, setUrl] = useState<string>(editor.getAttributes("link").href ?? "https://");
  function apply() {
    if (url && url !== "https://") {
      editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
    }
    onClose();
  }
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 p-4" dir="rtl">
      <div className="card w-full max-w-sm space-y-4 p-5">
        <h3 className="font-bold text-slate-800">إضافة رابط</h3>
        <input
          autoFocus
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && apply()}
          className="input"
          placeholder="https://example.com"
        />
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="btn-ghost px-4 py-2 text-sm">إلغاء</button>
          <button onClick={apply} className="btn-primary px-4 py-2 text-sm">إضافة</button>
        </div>
      </div>
    </div>
  );
}

// ─── Image-by-URL modal ─────────────────────────────────────────────────────
function ImageUrlModal({
  onSubmit,
  onClose,
}: {
  onSubmit: (url: string) => void;
  onClose: () => void;
}) {
  const [url, setUrl] = useState("https://");
  function apply() {
    const trimmed = url.trim();
    if (trimmed && trimmed !== "https://") onSubmit(trimmed);
    else onClose();
  }
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 p-4" dir="rtl">
      <div className="card w-full max-w-sm space-y-4 p-5">
        <h3 className="font-bold text-slate-800">إدراج صورة برابط</h3>
        <input
          autoFocus
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && apply()}
          className="input"
          placeholder="https://example.com/image.jpg"
        />
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="btn-ghost px-4 py-2 text-sm">إلغاء</button>
          <button onClick={apply} className="btn-primary px-4 py-2 text-sm">إدراج</button>
        </div>
      </div>
    </div>
  );
}
