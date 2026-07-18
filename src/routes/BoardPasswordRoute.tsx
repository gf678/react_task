import {  useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import type { FormEvent, JSX } from "react";
import api from "../api/axios";

interface Props {
  children: JSX.Element;
}

interface Board {
  id?: number;
  boardId?: number;
  name?: string;
  boardName?: string;
  boardTitle?: string;
  title?: string;
  isProtected?: boolean;
  protected?: boolean;
}

const ACCESS_DURATION = 60 * 60 * 1000;

const getBoards = (data: any): Board[] => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.boards)) return data.boards;
  return [];
};

const getBoardId = (board: Board) => board.boardId ?? board.id;

const getBoardName = (board: Board) =>
  board.boardTitle ?? board.boardName ?? board.name ?? board.title ?? "";

const hasValidAccess = (key: string) => {
  const value = sessionStorage.getItem(key);
  if (!value) return false;

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
  const [needsPassword, setNeedsPassword] = useState(false);
  const [currentBoard, setCurrentBoard] = useState<Board | null>(null);
  const [password, setPassword] = useState("");

  useEffect(() => {
    const checkBoard = async () => {
      if (!boardName) {
        setIsChecking(false);
        return;
      }

      const decodedBoardName = decodeURIComponent(boardName);

      try {
        const { data } = await api.get("/api/boards");
        const boards = getBoards(data);

        const board = boards.find(
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

        if (
          hasValidAccess(`board-access-${decodedBoardName}`) ||
          (boardId && hasValidAccess(`board-access-${boardId}`))
        ) {
          setIsAllowed(true);
          return;
        }

        setNeedsPassword(true);
      } catch (error) {
        console.error(error);
        setIsAllowed(true);
      } finally {
        setIsChecking(false);
      }
    };

    checkBoard();
  }, [boardName]);

  const checkPassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!currentBoard || !boardName) return;

    const boardId = getBoardId(currentBoard);
    const decodedBoardName = decodeURIComponent(boardName);

    if (!boardId) return;

    try {
      await api.post(`/api/boards/${boardId}/access`, { password });

      saveBoardAccess(boardId, decodedBoardName);

      setNeedsPassword(false);
      setIsAllowed(true);
      setPassword("");
    } catch (error) {
      console.error(error);
      alert("비밀번호가 틀렸습니다");
    }
  };

  if (isChecking) return null;

  if (isAllowed) return children;

  if (needsPassword) {
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
            onChange={(e) => setPassword(e.target.value)}
            className="mb-4 w-full rounded-xl border px-3 py-2"
            placeholder="Password"
            autoFocus
          />

          <button
            type="submit"
            className="rounded-xl bg-pink-500 px-4 py-2 text-white"
          >
            확인
          </button>
        </form>
      </div>
    );
  }

  return children;
};

export default BoardPasswordRoute;