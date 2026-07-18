import { useEffect, useState } from "react";
import { Navigate, useParams } from "react-router-dom";
import type { JSX } from "react";
import api from "../api/axios";

interface Props {
  children: JSX.Element;
}

interface BoardSummary {
  boardId?: number;
  boardTitle?: string;
  boardName?: string;
  title?: string;
  name?: string;
  isProtected?: boolean;
}

type BoardsResponse =
  | BoardSummary[]
  | {
      boards?: BoardSummary[];
      data?: BoardSummary[];
    };

const getBoards = (response: BoardsResponse) => {
  if (Array.isArray(response)) {
    return response;
  }

  if (Array.isArray(response.boards)) {
    return response.boards;
  }

  if (Array.isArray(response.data)) {
    return response.data;
  }

  return [];
};

const getBoardName = (board: BoardSummary) =>
  board.boardTitle ?? board.boardName ?? board.title ?? board.name ?? "";

const BoardPasswordRoute = ({ children }: Props) => {
  const { boardName } = useParams();
  const [isChecking, setIsChecking] = useState(true);
  const [isAllowed, setIsAllowed] = useState(false);

  useEffect(() => {
    const checkAccess = async () => {
      if (!boardName) {
        setIsAllowed(false);
        setIsChecking(false);
        return;
      }

      try {
        const { data } = await api.get<BoardsResponse>("/api/boards");
        const boards = getBoards(data);
        const currentBoard = boards.find(
          (board) => getBoardName(board) === boardName,
        );

        if (!currentBoard) {
          setIsAllowed(false);
          return;
        }

        if (!currentBoard.isProtected) {
          setIsAllowed(true);
          return;
        }

        const accessKeys = [
          currentBoard.boardId
            ? `board-access-${currentBoard.boardId}`
            : undefined,
          `board-access-${boardName}`,
        ].filter(Boolean);

        setIsAllowed(
          accessKeys.some(
            (key) => sessionStorage.getItem(key as string) === "true",
          ),
        );
      } catch (error) {
        console.error(error);
        setIsAllowed(false);
      } finally {
        setIsChecking(false);
      }
    };

    checkAccess();
  }, [boardName]);

  if (isChecking) {
    return null;
  }

  if (!isAllowed) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default BoardPasswordRoute;