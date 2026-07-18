import { useEffect, useState } from "react";
import { Navigate, useParams } from "react-router-dom";
import type { JSX } from "react";
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

      const decodedBoardName = decodeURIComponent(boardName);

      if (
        sessionStorage.getItem(`board-access-${decodedBoardName}`) === "true" ||
        sessionStorage.getItem(`board-access-${boardName}`) === "true"
      ) {
        setIsAllowed(true);
        setIsChecking(false);
        return;
      }

      try {
        const { data } = await api.get<Board[]>("/api/boards", {
          params: { t: Date.now() },
        });

        const currentBoard = data.find((board) => {
          const name =
            board.boardTitle ?? board.boardName ?? board.title ?? board.name;

          return name === decodedBoardName;
        });

        if (!currentBoard) {
          setIsAllowed(false);
          return;
        }

        const boardId = currentBoard.boardId ?? currentBoard.id;
        const isProtected =
          currentBoard.isProtected ?? currentBoard.protected ?? false;

        if (!isProtected) {
          setIsAllowed(true);
          return;
        }

        setIsAllowed(
          boardId
            ? sessionStorage.getItem(`board-access-${boardId}`) === "true"
            : false,
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

  if (isChecking) return null;

  if (!isAllowed) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default BoardPasswordRoute;