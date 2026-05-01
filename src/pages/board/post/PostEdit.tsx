import { useParams, useNavigate } from "react-router-dom";
import React, { useEffect, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { createLowlight } from "lowlight";
import api from "../../../api/axios";

// コードブロックのシンタックスハイライトを適用するためのライブラリ
const lowlight = createLowlight();

// 既存の添付ファイル情報を表す型定義
type ExistingAttachment = {
  id?: number | string;
  name: string;
  url?: string;
};

// サーバーから返却される添付ファイルデータの生データ型定義
type RawAttachment = {
  id?: number | string;
  fileId?: number | string;
  attachmentId?: number | string;
  name?: string;
  fileName?: string;
  originalName?: string;
  url?: string;
  downloadUrl?: string;
};

// 投稿データから必要なフィールドのみを抽出した型定義
type PostResponse = {
  title?: string;
  content?: string;
  attachments?: RawAttachment[];
};

/**
 * 投稿データを正規化する関数
 * サーバーのレスポンス形式（{ data: PostResponse } または PostResponse 直下）に関わらず
 * 常に PostResponse 形式で返却するように処理
 */
const normalizePost = (
  payload: PostResponse | { data?: PostResponse },
): PostResponse => {
  if (
    payload &&
    typeof payload === "object" &&
    "data" in payload &&
    payload.data
  ) {
    return payload.data;
  }
  return payload as PostResponse;
};

/**
 * サーバーの添付ファイルデータをフロントエンド用の形式に変換する関数
 */
const normalizeAttachments = (
  attachments?: RawAttachment[],
): ExistingAttachment[] => {
  if (!Array.isArray(attachments)) {
    return [];
  }

  return attachments.map((file, index) => ({
    id: file.id ?? file.fileId ?? file.attachmentId,
    name:
      file.originalName ??
      file.fileName ??
      file.name ??
      `添付ファイル ${index + 1}`,
    url: file.url ?? file.downloadUrl,
  }));
};

/**
 * 投稿作成・編集ページコンポーネント
 */
const PostEdit: React.FC = () => {
  // URLパラメータから掲示板名と投稿IDを取得。IDが存在すれば編集モードと判断
  const params = useParams<{
    boardName: string;
    postId?: string;
    id?: string;
  }>();
  const navigate = useNavigate();

  const safeBoardName = params.boardName ?? "";
  const postId = params.postId ?? params.id ?? "";
  const isEditMode = Boolean(postId);

  // コンポーネントの状態管理
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [postLoading, setPostLoading] = useState(isEditMode);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [existingAttachments, setExistingAttachments] = useState<
    ExistingAttachment[]
  >([]);
  const [isDragging, setIsDragging] = useState(false);
  const [formError, setFormError] = useState("");

  // Tiptapエディタの初期化
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
    // エディタの内容が更新された際にエラーメッセージをクリア
    onUpdate: () => {
      setFormError("");
    },
  });

  /**
   * 既存の投稿データを取得してエディタにセットする副作用処理
   */
  useEffect(() => {
    let ignore = false; // アンマウント後のステート更新防止用フラグ

    const fetchPost = async () => {
      try {
        setPostLoading(true);

        const res = await api.get<PostResponse | { data?: PostResponse }>(
          `/api/posts/${safeBoardName}/${postId}`,
        );
        const post = normalizePost(res.data);

        if (ignore) return;

        // 取得したデータをステートに反映
        setTitle(post.title ?? "");
        editor?.commands.setContent(post.content ?? "");
        setExistingAttachments(normalizeAttachments(post.attachments));
        setFormError("");
      } catch (err) {
        console.error(err);
        if (!ignore) {
          navigate(`/board/${safeBoardName}/list`);
        }
      } finally {
        if (!ignore) {
          setPostLoading(false);
        }
      }
    };

    if (isEditMode) {
      void fetchPost();
    }

    return () => {
      ignore = true;
    };
  }, [editor, isEditMode, navigate, postId, safeBoardName]);

  /**
   * エディタ内に画像をアップロードして挿入する関数
   */
  const uploadImageToEditor = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await api.post("/api/upload/image", formData);
      const url = res.data.url;

      editor?.chain().focus().setImage({ src: url }).run();
    } catch (e) {
      console.error(e);
    }
  };

  /**
   * ファイル添付処理
   * 画像はエディタ内に挿入、それ以外は添付ファイルリストに追加
   */
  const handleFileAttach = (files: FileList | null) => {
    if (!files) return;

    const arr = Array.from(files);
    const imageFiles: File[] = [];
    const normalFiles: File[] = [];

    arr.forEach((file) => {
      if (file.type.startsWith("image/")) {
        imageFiles.push(file);
      } else {
        normalFiles.push(file);
      }
    });

    // 画像の処理
    imageFiles.forEach((file) => {
      void uploadImageToEditor(file);
    });
    // 一般ファイルの処理
    setAttachments((prev) => [...prev, ...normalFiles]);
  };

  // 新規添付ファイルの削除
  const removeAttachment = (targetIndex: number) => {
    setAttachments((prev) => prev.filter((_, index) => index !== targetIndex));
  };

  // ドラッグ&ドロップ関連のハンドラー
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileAttach(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!isDragging) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false); 
  };

  /**
   * フォーム送信処理（投稿の保存）
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editor) return;

    const content = editor.getHTML();

    // バリデーション
    if (!title.trim() || editor.isEmpty) {
      setFormError("タイトルと内容を入力してください");
      return;
    }

    try {
      setLoading(true);
      setFormError("");

      const formData = new FormData();
      formData.append("title", title.trim());
      formData.append("content", content);

      // 新規添付ファイルの追加
      attachments.forEach((file) => {
        formData.append("files", file);
      });

      // API呼び出し（PUTメソッドによる更新）
      await api.put(`/api/posts/${safeBoardName}/${postId}`, formData);

      // 完了後、一覧画面へ遷移
      navigate(`/board/${safeBoardName}/list`);
    } catch (err) {
      console.error(err);
      alert(isEditMode ? "修正中にエラーが発生しました。" : "エラーが発生しました。");
    } finally {
      setLoading(false);
    }
  };

  // ロード中の表示
  if (!editor || postLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-sky-50 px-4 py-10">
        <div className="mx-auto max-w-5xl rounded-3xl border border-white/70 bg-white/90 p-10 text-center text-gray-400 shadow-sm backdrop-blur">
          {!editor ? "editor loading..." : "記事を読み込み中…"}
        </div>
      </div>
    );
  }

  // ツールバーボタンのスタイル制御
  const toolButton = (active = false) =>
    `rounded-xl border px-3 py-2 text-sm font-medium transition ${
      active
        ? "border-indigo-200 bg-indigo-50 text-indigo-700"
        : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
    }`;

  const pageTitle = "投稿を編集する";
  const helperText = "自由に編集してみてください。";
  const submitLabel = loading ? "編集中..." : "編集する";

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-sky-50 px-4 py-10">
      <div className="mx-auto max-w-5xl rounded-3xl border border-white/70 bg-white/90 shadow-sm backdrop-blur">
        <div className="border-b border-gray-100 px-6 py-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-pink-500">
            {isEditMode ? "Edit Post" : "Write Post"}
          </p>
          <div className="mt-2 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {safeBoardName} {pageTitle}
              </h1>
              <p className="mt-1 text-sm text-gray-500">{helperText}</p>
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
          {formError && (
            <div className="px-6 pt-6">
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {formError}
              </div>
            </div>
          )}

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
              placeholder="タイトルを入力してください"
              className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-lg font-semibold outline-none transition focus:border-pink-300 focus:ring-2 focus:ring-pink-200"
            />
          </div>

          {/* ツールバーエリア */}
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

          {/* エディタ本体 */}
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
                <span>画像はドラッグ＆ドロップでそのまま挿入できます。</span>
              </div>
              <EditorContent editor={editor} />
            </div>
          </div>

          {/* 添付ファイルリスト表示 */}
          {(existingAttachments.length > 0 || attachments.length > 0) && (
            <div className="px-6 pb-6">
              <div className="rounded-2xl border border-gray-100 bg-gray-50/70 p-4">
                {existingAttachments.length > 0 && (
                  <>
                    <div className="mb-3 text-sm font-semibold text-gray-800">
                      既存の添付ファイル
                    </div>
                    <div className="mb-4 flex flex-wrap gap-2">
                      {existingAttachments.map((file, idx) =>
                        file.url ? (
                          <a
                            key={`${file.name}-${idx}`}
                            href={file.url}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded-full bg-white px-3 py-2 text-sm text-gray-700 ring-1 ring-gray-200 transition hover:bg-gray-50"
                          >
                            {file.name}
                          </a>
                        ) : (
                          <div
                            key={`${file.name}-${idx}`}
                            className="rounded-full bg-white px-3 py-2 text-sm text-gray-700 ring-1 ring-gray-200"
                          >
                            {file.name}
                          </div>
                        ),
                      )}
                    </div>
                  </>
                )}

                {attachments.length > 0 && (
                  <>
                    <div className="mb-3 text-sm font-semibold text-gray-800">
                      新しい添付ファイル
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {attachments.map((file, idx) => (
                        <div
                          key={`${file.name}-${idx}`}
                          className="flex items-center gap-2 rounded-full bg-white px-3 py-2 text-sm text-gray-700 ring-1 ring-gray-200"
                        >
                          <span className="max-w-[220px] truncate">
                            {file.name}
                          </span>
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
                  </>
                )}
              </div>
            </div>
          )}

          {/* フッターアクション */}
          <div className="flex items-center justify-between border-t border-gray-100 bg-gray-50/70 px-6 py-5">
            <p className="text-sm text-gray-400">
              編集後は掲示板の一覧へ移動します。
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
                {submitLabel}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PostEdit;