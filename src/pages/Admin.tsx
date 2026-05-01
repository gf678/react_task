// React 훅: 상태 관리, 사이드이펙트 사용
import { useEffect, useState } from "react";
// 라우팅 이동용 훅
import { useNavigate } from "react-router-dom";
// axios 기반 API 모듈
import api from "../api/axios";

// 게시판 타입 정의
interface Board {
  boardId: number;
  name: string;
  description: string;
}

// 유저 타입 정의
interface User {
  id: number;
  loginId: string;
  alias: string;
  role: "USER" | "MODERATOR" | "ADMIN";
}

// 역할에 따른 UI 스타일 클래스 반환 함수
const roleBadgeClass = (role: User["role"]) => {
  if (role === "ADMIN") return "bg-red-50 text-red-600 ring-red-200";
  if (role === "MODERATOR") return "bg-blue-50 text-blue-600 ring-blue-200";
  return "bg-gray-50 text-gray-600 ring-gray-200";
};

// 관리자 페이지 메인 컴포넌트
const AdminPage = () => {
  const navigate = useNavigate();

  // 게시판 목록 상태
  const [boards, setBoards] = useState<Board[]>([]);
  // 유저 목록 상태
  const [users, setUsers] = useState<User[]>([]);
  // 유저 검색 input 상태
  const [searchId, setSearchId] = useState("");
  // 로딩 상태
  const [loading, setLoading] = useState(true);
  // 게시판 생성 중 상태
  const [creating, setCreating] = useState(false);
  // 유저 검색 중 상태
  const [searching, setSearching] = useState(false);
  // 게시판 저장 중 ID (로딩 표시용)
  const [savingBoardId, setSavingBoardId] = useState<number | null>(null);
  // 유저 권한 변경 중 ID
  const [updatingUserId, setUpdatingUserId] = useState<number | null>(null);

  // 새 게시판 입력 상태
  const [newBoard, setNewBoard] = useState({
    name: "",
    description: "",
  });

  // 현재 수정 중인 게시판 ID
  const [editingBoardId, setEditingBoardId] = useState<number | null>(null);
  // 게시판 수정 임시 데이터
  const [boardDraft, setBoardDraft] = useState({
    name: "",
    description: "",
  });

  // 최초 렌더링 시 데이터 로드
  useEffect(() => {
    void fetchData(true);
  }, []);

  // 게시판 + 유저 데이터 가져오기
  const fetchData = async (showLoading = false) => {
    try {
      if (showLoading) setLoading(true);

      const res = await api.get("/api/admin/boards");
      setBoards(res.data.boards || []);
      setUsers(res.data.users || []);
    } catch (err) {
      console.error(err);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  // 게시판 생성
  const createBoard = async () => {
    const name = newBoard.name.trim();
    const description = newBoard.description.trim();

    // 이름 필수 체크
    if (!name) {
      return;
    }

    try {
      setCreating(true);

      await api.post("/api/admin/boards", {
        name,
        description,
      });

      // 입력 초기화 후 재조회
      setNewBoard({ name: "", description: "" });
      await fetchData();
    } catch (err) {
      console.error(err);
      alert("掲示板の作成に失敗");
    } finally {
      setCreating(false);
    }
  };

  // 게시판 수정 시작
  const startEditBoard = (board: Board) => {
    setEditingBoardId(board.boardId);
    setBoardDraft({
      name: board.name,
      description: board.description ?? "",
    });
  };

  // 게시판 수정 취소
  const cancelEditBoard = () => {
    setEditingBoardId(null);
    setBoardDraft({
      name: "",
      description: "",
    });
  };

  // 게시판 저장
  const saveBoard = async (boardId: number) => {
    const name = boardDraft.name.trim();
    const description = boardDraft.description.trim();

    if (!name) {
      return;
    }

    try {
      setSavingBoardId(boardId);

      await api.put(`/api/admin/boards/${boardId}`, {
        name,
        description,
      });

      await fetchData();
      cancelEditBoard();
    } catch (err) {
      console.error(err);
      alert("掲示板の更新に失敗");
    } finally {
      setSavingBoardId(null);
    }
  };

  // 유저 검색
  const searchUser = async () => {
    const keyword = searchId.trim();

    // 검색어 없으면 전체 조회
    if (!keyword) {
      await fetchData();
      return;
    }

    try {
      setSearching(true);

      const res = await api.get(
        `/api/admin/users/search?loginId=${encodeURIComponent(keyword)}`
      );

      setUsers(Array.isArray(res.data) ? res.data : res.data?.users || []);
    } catch (err) {
      console.error(err);
      alert("ユーザーの検索に失敗");
    } finally {
      setSearching(false);
    }
  };

  // 유저 권한 변경
  const updateRole = async (userId: number, role: string) => {
    try {
      setUpdatingUserId(userId);

      await api.post("/api/admin/users/role", {
        userId,
        newRole: role,
      });

      // 검색 상태 여부에 따라 다시 로드
      if (searchId.trim()) {
        await searchUser();
      } else {
        await fetchData();
      }
    } catch (err) {
      console.error(err);
      alert("権限の変更に失敗");
    } finally {
      setUpdatingUserId(null);
    }
  };

  // 로딩 화면
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-sky-50 px-4 py-10">
        <div className="mx-auto max-w-7xl rounded-3xl border border-white/70 bg-white/85 p-10 text-center text-gray-400 shadow-sm backdrop-blur">
          loading...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-sky-50 px-4 py-10">
      <div className="mx-auto max-w-7xl space-y-6">

        {/* 상단 관리자 정보 영역 */}
        <section className="rounded-3xl border border-white/70 bg-white/90 p-6 shadow-sm backdrop-blur">
          <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-pink-500">
                Admin Console
              </p>
              <h1 className="mt-2 text-3xl font-bold text-gray-900">
                掲示板管理
              </h1>
              <p className="mt-2 text-sm text-gray-500">
                掲示板の作成、掲示板情報の編集、ユーザー権限の変更を一括で管理します。
              </p>
            </div>

            {/* 통계 + 홈 버튼 */}
            <div className="flex flex-wrap gap-3">
              <div className="rounded-2xl bg-gray-50 px-4 py-3 ring-1 ring-gray-100">
                <p className="text-xs text-gray-500">Boards</p>
                <p className="mt-1 text-xl font-semibold text-gray-900">
                  {boards.length}
                </p>
              </div>

              <div className="rounded-2xl bg-gray-50 px-4 py-3 ring-1 ring-gray-100">
                <p className="text-xs text-gray-500">Users</p>
                <p className="mt-1 text-xl font-semibold text-gray-900">
                  {users.length}
                </p>
              </div>

              <button
                onClick={() => navigate("/")}
                className="rounded-2xl bg-gray-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-black"
              >
                ホームへ
              </button>
            </div>
          </div>
        </section>

        {/* 게시판 생성 영역 */}
        <section className="rounded-3xl border border-white/70 bg-white/90 p-6 shadow-sm backdrop-blur">
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-gray-900">掲示板作成</h2>
            <p className="mt-1 text-sm text-gray-500">
              新しい掲示板の名前と説明を入力して、そのまま作成できます。
            </p>
          </div>

          {/* 입력 폼 */}
          <div className="grid gap-3 md:grid-cols-[1fr_1.4fr_auto]">
            <input
              placeholder="掲示板名"
              value={newBoard.name}
              onChange={(e) =>
                setNewBoard({ ...newBoard, name: e.target.value })
              }
              className="rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-pink-300 focus:ring-2 focus:ring-pink-200"
            />

            <input
              placeholder="説明"
              value={newBoard.description}
              onChange={(e) =>
                setNewBoard({
                  ...newBoard,
                  description: e.target.value,
                })
              }
              className="rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-pink-300 focus:ring-2 focus:ring-pink-200"
            />

            <button
              onClick={createBoard}
              disabled={creating}
              className="rounded-xl bg-pink-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-pink-600 disabled:opacity-50"
            >
              {creating ? "作成中..." : "作成"}
            </button>
          </div>
        </section>

        {/* 게시판 목록 */}
        <section className="rounded-3xl border border-white/70 bg-white/90 p-6 shadow-sm backdrop-blur">
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-gray-900">掲示板一覧</h2>
            <p className="mt-1 text-sm text-gray-500">
              既存の掲示板の名前と説明をそのまま編集できます。
            </p>
          </div>

          {/* 테이블 */}
          <div className="overflow-x-auto rounded-2xl border border-gray-100">
            <table className="min-w-full divide-y divide-gray-100 text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">ID</th>
                  <th className="px-4 py-3 text-left font-medium">名前</th>
                  <th className="px-4 py-3 text-left font-medium">説明</th>
                  <th className="px-4 py-3 text-right font-medium">操作</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100 bg-white">
                {boards.map((board) => {
                  const isEditing = editingBoardId === board.boardId;

                  return (
                    <tr key={board.boardId} className="align-top">
                      <td className="px-4 py-4 text-gray-500">{board.boardId}</td>

                      <td className="px-4 py-4">
                        {isEditing ? (
                          <input
                            value={boardDraft.name}
                            onChange={(e) =>
                              setBoardDraft((prev) => ({
                                ...prev,
                                name: e.target.value,
                              }))
                            }
                            className="w-full rounded-xl border border-gray-200 px-3 py-2 outline-none transition focus:border-pink-300 focus:ring-2 focus:ring-pink-200"
                          />
                        ) : (
                          <span className="font-medium text-gray-900">
                            {board.name}
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-4">
                        {isEditing ? (
                          <textarea
                            value={boardDraft.description}
                            onChange={(e) =>
                              setBoardDraft((prev) => ({
                                ...prev,
                                description: e.target.value,
                              }))
                            }
                            rows={3}
                            className="w-full rounded-xl border border-gray-200 px-3 py-2 outline-none transition focus:border-pink-300 focus:ring-2 focus:ring-pink-200"
                          />
                        ) : (
                          <span className="text-gray-600">
                            {board.description || "-"}
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-4">
                        <div className="flex justify-end gap-2">
                          {isEditing ? (
                            <>
                              <button
                                onClick={() => saveBoard(board.boardId)}
                                disabled={savingBoardId === board.boardId}
                                className="rounded-xl bg-gray-900 px-3 py-2 text-xs font-medium text-white transition hover:bg-black disabled:opacity-50"
                              >
                                {savingBoardId === board.boardId ? "保存中..." : "保存"}
                              </button>

                              <button
                                onClick={cancelEditBoard}
                                className="rounded-xl bg-gray-100 px-3 py-2 text-xs font-medium text-gray-700 transition hover:bg-gray-200"
                              >
                                キャンセル
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => startEditBoard(board)}
                              className="rounded-xl bg-indigo-50 px-3 py-2 text-xs font-medium text-indigo-600 transition hover:bg-indigo-100"
                            >
                              編集
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {/* 게시판 없을 때 */}
                {boards.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-10 text-center text-gray-400">
                      掲示板がありません
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* 유저 권한 관리 */}
        <section className="rounded-3xl border border-white/70 bg-white/90 p-6 shadow-sm backdrop-blur">
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-gray-900">유저 권한 관리</h2>
            <p className="mt-1 text-sm text-gray-500">
              loginIdでユーザーを検索し、権限を変更できます。
            </p>
          </div>

          {/* 검색 영역 */}
          <div className="mb-5 flex flex-col gap-3 md:flex-row">
            <input
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              placeholder="ユーザーID検索"
              className="flex-1 rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-pink-300 focus:ring-2 focus:ring-pink-200"
            />

            <button
              onClick={searchUser}
              disabled={searching}
              className="rounded-xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-600 disabled:opacity-50"
            >
              {searching ? "検索中..." : "検索"}
            </button>

            <button
              onClick={() => {
                setSearchId("");
                void fetchData();
              }}
              className="rounded-xl bg-gray-100 px-5 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-200"
            >
              リセット
            </button>
          </div>

          {/* ユーザーテーブル */}
          <div className="overflow-x-auto rounded-2xl border border-gray-100">
            <table className="min-w-full divide-y divide-gray-100 text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">ID</th>
                  <th className="px-4 py-3 text-left font-medium">ニックネーム</th>
                  <th className="px-4 py-3 text-left font-medium">権限</th>
                  <th className="px-4 py-3 text-right font-medium">変更</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100 bg-white">
                {users.map((user) => (
                  <tr key={user.id}>
                    <td className="px-4 py-4 text-gray-700">{user.loginId}</td>

                    <td className="px-4 py-4 font-medium text-gray-900">
                      {user.alias}
                    </td>

                    <td className="px-4 py-4">
                      {/* 権限バッジ */}
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${roleBadgeClass(
                          user.role
                        )}`}
                      >
                        {user.role}
                      </span>
                    </td>

                    <td className="px-4 py-4">
                      <div className="flex justify-end gap-2">
                        {/* USER → MODERATOR */}
                        {user.role === "USER" && (
                          <button
                            onClick={() => updateRole(user.id, "MODERATOR")}
                            disabled={updatingUserId === user.id}
                            className="rounded-xl bg-indigo-500 px-3 py-2 text-xs font-medium text-white transition hover:bg-indigo-600 disabled:opacity-50"
                          >
                            昇格
                          </button>
                        )}

                        {/* MODERATOR → USER */}
                        {user.role === "MODERATOR" && (
                          <button
                            onClick={() => updateRole(user.id, "USER")}
                            disabled={updatingUserId === user.id}
                            className="rounded-xl bg-red-500 px-3 py-2 text-xs font-medium text-white transition hover:bg-red-600 disabled:opacity-50"
                          >
                            降格
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}

                {/* ユーザーなし */}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-10 text-center text-gray-400">
                      ユーザーがいません
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

      </div>
    </div>
  );
};

export default AdminPage;