import { useEffect, useState } from "react";
import { Navigate, useParams } from "react-router-dom";
import type { FormEvent, JSX } from "react";
import api from "../api/axios";

interface Props {
  children: JSX.Element;
}

interface Board {
  boardId?: number;
  id?: number;
  boardTitle?: string;
  boardName?: string;
  title?: string;
  name?: string;
  isProtected?: boolean;
  protected?: boolean;
}

const ACCESS_DURATION = 60 * 60 * 1000;

const getBoardId = (board: Board) => board.boardId ?? board.id;

const getBoardName = (board: Board) =>
  board.boardTitle ?? board.boardName ?? board.title ?? board.name ?? "";

const hasValidAccess = (key: string) => {
  const value = sessionStorage.getItem(key);

  if (!value) return false;

  if (value === "true") {
    return true;
  }

  try {
    const parsed = JSON.parse(value);

    if (Date.now() > parsed.expiresAt) {
      sessionStorage.removeItem(key);
      return false;
    }

    return true;
  } catch {
    sessionStorage.removeItem(key);
    return false;
  }
};

const saveBoardAccess = (boardId: number, boardName: string) => {
  const expiresAt = Date.now() + ACCESS_DURATION;
  const value = JSON.stringify({ expiresAt });

  sessionStorage.setItem(`board-access-${boardId}`, value);
  sessionStorage.setItem(`board-access-${boardName}`, value);
};

const BoardPasswordRoute = ({ children }: Props) => {
  const { boardName } = useParams();

  const [isChecking, setIsChecking] = useState(true);
  const [isAllowed, setIsAllowed] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [currentBoard, setCurrentBoard] = useState<Board | null>(null);
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const checkAccess = async () => {
      if (!boardName) {
        setIsBlocked(true);
        setIsChecking(false);
        return;
      }

      const decodedBoardName = decodeURIComponent(boardName);

      if (
        hasValidAccess(`board-access-${decodedBoardName}`) ||
        hasValidAccess(`board-access-${boardName}`)
      ) {
        setIsAllowed(true);
        setIsChecking(false);
        return;
      }

      try {
        const { data } = await api.get<Board[]>("/api/boards", {
          params: { t: Date.now() },
        });

        const board = data.find(
          (item) => getBoardName(item) === decodedBoardName,
        );

        if (!board) {
        setIsAllowed(true);
        return;
        }

        setCurrentBoard(board);

        const boardId = getBoardId(board);
        const isProtected = board.isProtected ?? board.protected ?? false;

        if (!isProtected) {
          setIsAllowed(true);
          return;
        }

        if (boardId && hasValidAccess(`board-access-${boardId}`)) {
          setIsAllowed(true);
          return;
        }

        setIsAllowed(false);
      } catch (error) {
        console.error(error);
        setIsAllowed(true);
        } finally {
        setIsChecking(false);
      }
    };

    checkAccess();
  }, [boardName]);

  const checkPassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const boardId = currentBoard ? getBoardId(currentBoard) : undefined;
    const name = currentBoard ? getBoardName(currentBoard) : boardName;

    if (!boardId || !name) return;

    try {
      setIsSubmitting(true);

      await api.post(`/api/boards/${boardId}/access`, {
        password,
      });

      saveBoardAccess(boardId, name);
      setPassword("");
      setIsAllowed(true);
    } catch (error) {
      console.error(error);
      alert("비밀번호가 틀렸습니다");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isChecking) {
    return null;
  }

  if (isBlocked) {
    return <Navigate to="/" replace />;
  }

  if (isAllowed) {
    return children;
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <form
        onSubmit={checkPassword}
        className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl"
      >
        <h3 className="mb-4 font-semibold">🔒 Password</h3>

        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="mb-4 w-full rounded-xl border px-3 py-2 outline-none focus:border-pink-300 focus:ring-2 focus:ring-pink-200"
          placeholder="Password"
          autoFocus
        />

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-xl bg-pink-500 px-4 py-2 text-white disabled:opacity-60"
          >
            확인
          </button>

          <button
            type="button"
            onClick={() => setPassword("")}
            className="rounded-xl bg-gray-100 px-4 py-2"
          >
            취소
          </button>
        </div>
      </form>
    </div>
  );
};

export default BoardPasswordRoute;
