import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../api/axios";
import BoardPage from "./boardPage";

/**
 * 掲示板コンテナコンポーネント (BoardContainer)
 * データの取得(Fetch)と状態管理を担当し、表示は BoardPage に委譲する
 */
const BoardContainer = () => {
  // URLから boardName パラメータを抽出 (/board/:boardName/list)
  const { boardName } = useParams();

  // 画面遷移用の navigate
  const navigate = useNavigate();

  // 掲示板の情報 (名前、説明など)
  const [board, setBoard] = useState<any>(null);

  // 投稿(記事)リスト
  const [posts, setPosts] = useState<any[]>([]);

  // 購読(サブスクリプション)状態
  const [subscribed, setSubscribed] = useState(false);

  // ページネーションの状態
  const [page, setPage] = useState(0); // 現在のページ (0から開始)
  const [size, setSize] = useState(15); // 1ページあたりの表示件数

  // ソート状態 (最新順 / 人気順)
  const [sort, setSort] = useState<"latest" | "popular">("latest");

  // 検索キーワード
  const [keyword, setKeyword] = useState("");

  // ローディング状態 (API呼び出し中かどうか)
  const [loading, setLoading] = useState(true);

  /**
   * 投稿リスト、掲示板情報、購読状態を一括で取得する関数
   */
  const load = async () => {
    // boardName が存在しない場合は実行しない
    if (!boardName) return;

    // ロー딩開始
    setLoading(true);

    try {
      // 3つのAPIを並列で呼び出し
      const [postRes, boardRes, subRes] = await Promise.all([
        // 投稿リストの取得 (ページ、サイズ、ソート、検索条件を含む)
        api.get(
          `/api/posts/${boardName}?page=${page}&size=${size}&sort=${sort}&keyword=${keyword}`
        ),

        // 掲示板情報の取得
        api.get(`/api/boards/${boardName}`),

        // 購読リストの取得 (ログイン中のユーザー基準)
        api.get("/api/subscription"), // ※ 404エラーが出る場合はバックエンドの確認が必要
      ]);

      // 投稿リストの状態を更新
      setPosts(postRes.data);

      // 掲示板情報の状態を更新
      setBoard(boardRes.data);

      // 購読リストが配列であることを確認して処理
      const subs = Array.isArray(subRes.data) ? subRes.data : [];

      // 現在の boardName が購読リストに含まれているか確認
      setSubscribed(subs.some((b: any) => b.name === boardName));

    } catch (err) {
      // エラー発生時のログ出力
      console.error("load error:", err);
    } finally {
      // ローディング終了
      setLoading(false);
    }
  };

  /**
   * boardName, page, size, sort が変更されるたびにデータを再取得
   */
  useEffect(() => {
    load();
  }, [boardName, page, size, sort]);

  /**
   * ✅ 購読状態の切り替え(トグル)関数
   */
  const onToggleSubscription = async () => {
    // boardId が取得できていない場合は実行しない
    if (!board?.boardId) return;

    try {
      // 購読/解除のトグルAPIを呼び出し
      const res = await api.post(`/api/subscription/${board.boardId}`);

      // サーバーのレスポンスに応じて状態を更新 (subscribed なら true)
      setSubscribed(res.data === "subscribed");

      // 他のコンポーネントに購読状態の変化を通知 (カスタムイベントの発行)
      window.dispatchEvent(new Event("subscriptionChanged"));
    } catch (e) {
      console.error(e);
    }
  };

  /**
   * ✅ 投稿作成ページへの遷移
   */
  const onWrite = () => {
    navigate(`/board/${boardName}/write`);
  };

  // 実際のUI構築は BoardPage コンポーネントに委譲 (Container-Presenterパターン)
  return (
    <BoardPage
      boardName={boardName!} // boardName を必須として渡す
      board={board} // 掲示板情報
      posts={posts} // 投稿リスト
      subscribed={subscribed} // 購読状態
      loading={loading} // ローディング状態

      // ページネーション関連の状態
      page={page}
      setPage={setPage}
      size={size}
      setSize={setSize}

      // ソート状態
      sort={sort}
      setSort={setSort}

      // 検索状態
      keyword={keyword}
      setKeyword={setKeyword}

      // イベントハンドラー
      onToggleSubscription={onToggleSubscription} // 購読トグル
      onWrite={onWrite} // 新規投稿ページ遷移
      reload={load} // データの再読み込み
    />
  );
};

export default BoardContainer;