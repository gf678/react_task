import { useParams, useNavigate } from "react-router-dom";
import React, { useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { createLowlight } from "lowlight";
import api from "../../../api/axios";

// コードブロックのシンタックスハイライトを適用するための lowlight インスタンス作成
const lowlight = createLowlight();

/**
 * 投稿作成コンポーネント
 */
const PostWrite: React.FC = () => {
  // URLから boardName パラメータを抽出 (例: /board/free/write)
  const { boardName } = useParams<{ boardName: string }>();
  const navigate = useNavigate();

  // 状態管理 (State Management)
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [formError, setFormError] = useState("");

  // boardName が undefined の場合のフォールバック
  const safeBoardName = boardName ?? "";

  // Tiptap エディタの初期化
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false,
      }),
      Image,
      CodeBlockLowlight.configure({ lowlight }),
    ],
    content: "",
    editorProps: {
      attributes: {
        class:
          "prose prose-sm sm:prose-base max-w-none min-h-[420px] px-5 py-5 focus:outline-none",
      },
    },
    onUpdate: () => {
      // 内容が変更されたらエラーメッセージをクリア
      setFormError("");
    },
  });

  /**
   * 画像ファイルをサーバーにアップロードし、エ디터に挿入する関数
   */
  const uploadImageToEditor = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    try {
      // 画像アップロード API の呼び出し
      const res = await api.post("/api/upload/image", formData);
      const url = res.data.url;

      // エディタの現在の位置に画像を挿入
      editor?.chain().focus().setImage({ src: url }).run();
    } catch (e) {
      console.error("Image upload failed:", e);
    }
  };

  /**
   * ファイル添付の処理
   * 画像はエディタ内に直接アップロードし、その他のファイルは添付リストに追加
   */
  const handleFileAttach = (files: FileList | null) => {
    if (!files) return;

    const arr = Array.from(files);

    const imageFiles: File[] = [];
    const normalFiles: File[] = [];

    // ファイルタイプによって分類
    arr.forEach((file) => {
      if (file.type.startsWith("image/")) {
        imageFiles.push(file);
      } else {
        normalFiles.push(file);
      }
    });

    // 画像ファイルはエディタにアップロード処理
    imageFiles.forEach((file) => {
      void uploadImageToEditor(file);
    });

    // 一般ファイルは添付ファイルの状態(State)に追加
    setAttachments((prev) => [...prev, ...normalFiles]);
  };

  // 添付ファイルの削除処理
  const removeAttachment = (targetIndex: number) => {
    setAttachments((prev) => prev.filter((_, index) => index !== targetIndex));
  };

  // ドロップイベント (ファイルをドラッグ&ドロップした時)
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileAttach(e.dataTransfer.files);
  };

  // ドラッグオーバー時
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!isDragging) {
      setIsDragging(true);
    }
  };

  // ドラッグがエリアから外れた時
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  /**
   * 投稿内容の送信処理
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editor) return;

    // エディタから HTML コンテンツを取得
    const content = editor.getHTML();

    // バリデーション
    if (!title.trim() || editor.isEmpty) {
      setFormError("タイトルと内容を入力してください。");
      return;
    }

    try {
      setLoading(true);
      setFormError("");

      // multipart/form-data の作成
      const formData = new FormData();
      formData.append("title", title.trim());
      formData.append("content", content);

      // 添付ファイルの追加
      attachments.forEach((file) => {
        formData.append("files", file);
      });

      // 投稿作成 API の呼び出し
      await api.post(`/api/posts/${safeBoardName}`, formData);

      // 完了後、一覧画面へ遷移
      navigate(`/board/${safeBoardName}/list`);
    } catch (err) {
      console.error("Post submission failed:", err);
    } finally {
      setLoading(false);
    }
  };

  // エディタの初期化が完了していない場合
  if (!editor) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-sky-50 px-4 py-10">
        <div className="mx-auto max-w-5xl rounded-3xl border border-white/70 bg-white/90 p-10 text-center text-gray-400 shadow-sm backdrop-blur">
          editor loading...
        </div>
      </div>
    );
  }

  // ツールバーボタンのスタイル定義
  const toolButton = (active = false) =>
    `rounded-xl border px-3 py-2 text-sm font-medium transition ${
      active
        ? "border-indigo-200 bg-indigo-50 text-indigo-700"
        : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
    }`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-sky-50 px-4 py-10">
      <div className="mx-auto max-w-5xl rounded-3xl border border-white/70 bg-white/90 shadow-sm backdrop-blur">
        {/* ヘッダーエリア */}
        <div className="border-b border-gray-100 px-6 py-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-pink-500">
            Write Post
          </p>
          <div className="mt-2 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {safeBoardName} 投稿する
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                テキスト・画像・添付ファイルを投稿できます。
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate(`/board/${safeBoardName}/list`)}
              className="rounded-xl bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-200"
            >
              一覧へ
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* エラーメッセージ表示 */}
          {formError && (
            <div className="px-6 pt-6">
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {formError}
              </div>
            </div>
          )}

          {/* タイトル入力 */}
          <div className="px-6 pb-4 pt-6">
            <label className="mb-2 block text-sm font-medium text-gray-700">
              タイトル
            </label>
            <input
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setFormError("");
              }}
              placeholder="タイトルを入力してください。"
              className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-lg font-semibold outline-none transition focus:border-pink-300 focus:ring-2 focus:ring-pink-200"
            />
          </div>

          {/* ツールバー */}
          <div className="border-y border-gray-100 bg-gray-50/70 px-6 py-4">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => editor.chain().focus().toggleBold().run()}
                className={toolButton(editor.isActive("bold"))}
              >
                Bold
              </button>
              <button
                type="button"
                onClick={() => editor.chain().focus().toggleItalic().run()}
                className={toolButton(editor.isActive("italic"))}
              >
                Italic
              </button>
              <button
                type="button"
                onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                className={toolButton(editor.isActive("heading", { level: 2 }))}
              >
                H2
              </button>
              <button
                type="button"
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                className={toolButton(editor.isActive("bulletList"))}
              >
                List
              </button>
              <button
                type="button"
                onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                className={toolButton(editor.isActive("codeBlock"))}
              >
                Code
              </button>
              <button
                type="button"
                onClick={() => editor.chain().focus().undo().run()}
                className={toolButton()}
              >
                Undo
              </button>
              <button
                type="button"
                onClick={() => editor.chain().focus().redo().run()}
                className={toolButton()}
              >
                Redo
              </button>
              <label className={toolButton()}>
                ファイルを追加
                <input
                  type="file"
                  hidden
                  multiple
                  onChange={(e) => handleFileAttach(e.target.files)}
                />
              </label>
            </div>
          </div>

          {/* エディタエリア */}
          <div className="px-6 py-5">
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              className={`rounded-3xl border-2 bg-white transition ${
                isDragging
                  ? "border-pink-300 bg-pink-50/40"
                  : "border-dashed border-gray-200"
              }`}
            >
              <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3 text-xs text-gray-400">
                <span>本文エディタ</span>
                <span>画像はドラッグ＆ドロップで挿입できます。</span>
              </div>
              <EditorContent editor={editor} />
            </div>
          </div>

          {/* 添付ファイルリスト */}
          {attachments.length > 0 && (
            <div className="px-6 pb-6">
              <div className="rounded-2xl border border-gray-100 bg-gray-50/70 p-4">
                <div className="mb-3 text-sm font-semibold text-gray-800">
                  添付ファイル
                </div>
                <div className="flex flex-wrap gap-2">
                  {attachments.map((file, idx) => (
                    <div
                      key={`${file.name}-${idx}`}
                      className="flex items-center gap-2 rounded-full bg-white px-3 py-2 text-sm text-gray-700 ring-1 ring-gray-200"
                    >
                      <span className="max-w-[220px] truncate">{file.name}</span>
                      <button
                        type="button"
                        onClick={() => removeAttachment(idx)}
                        className="text-gray-400 transition hover:text-red-500"
                      >
                        x
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* フッターアクション */}
          <div className="flex items-center justify-between border-t border-gray-100 bg-gray-50/70 px-6 py-5">
            <p className="text-sm text-gray-400">
              投稿後は掲示板の一覧へ移動します。
            </p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => navigate(`/board/${safeBoardName}/list`)}
                className="rounded-xl bg-white px-4 py-2 text-sm font-medium text-gray-700 ring-1 ring-gray-200 transition hover:bg-gray-50"
              >
                キャンセル
              </button>
              <button
                type="submit"
                disabled={loading}
                className="rounded-xl bg-pink-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-pink-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? "投稿中..." : "投稿する"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PostWrite;