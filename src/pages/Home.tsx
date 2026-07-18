import React, { useEffect, useState } from "react";
import PostCard from "./cards/PostCard";
import BoardCard from "./cards/BoardCard";
import api from "../api/axios";
import type { Post } from "../types/post";
import { useTranslation } from "react-i18next";

interface Board {
  boardId: number;
  name: string;
  isProtected: boolean;
  description: string | null;
  posts: Post[];
}

const Home: React.FC = () => {
  const [boards, setBoards] = useState<Board[]>([]);
  const [boardMap, setBoardMap] = useState<Record<string, Post[]>>({});
  const [popularPosts, setPopularPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  const { t } = useTranslation();

  // コンポーネントのマウント時に掲示板リストと投稿データを取得
  useEffect(() => {
    void loadHome();
  }, []);

  const loadHome = async () => {
    try {

      setLoading(true);

      const res = await api.get("/api/boards");


      const boardsData: Board[] = Array.isArray(res.data)
        ? res.data
        : res.data?.boards ?? [];


      setBoards(boardsData);


      const map: Record<string, Post[]> = {};


      boardsData.forEach((board)=>{

        if(board.isProtected){
          map[board.name]=[];
        }else{
          map[board.name]=board.posts ?? [];
        }

      });


      setBoardMap(map);


      const allPosts = Object.values(map).flat();


      const sorted = [...allPosts].sort(
        (a,b)=>
          (b.likes-b.dislikes)
          -
          (a.likes-a.dislikes)
      );


      setPopularPosts(sorted.slice(0,10));


    } catch(err){

      console.error("Home load error:",err);

    } finally {

      setLoading(false);

    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-sky-50 px-4 py-10">
      <div className="mx-auto max-w-7xl space-y-8">

        <section className="rounded-3xl border border-white/70 bg-white/90 px-6 py-7 shadow-sm backdrop-blur">
          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-pink-500">
                Community Hub
              </p>

              <h1 className="mt-2 text-3xl font-bold text-gray-900">
                {t("home.title")}
              </h1>

              <p className="mt-2 text-sm leading-6 text-gray-500">
                {t("home.description")}
              </p>
            </div>

            <div className="flex gap-3">
              <div className="rounded-2xl bg-gray-50 px-4 py-3 ring-1 ring-gray-100">
                <p className="text-xs text-gray-500">
                  {t("home.boards")}
                </p>

                <p className="mt-1 text-xl font-semibold text-gray-900">
                  {boards.length}
                </p>
              </div>

              <div className="rounded-2xl bg-gray-50 px-4 py-3 ring-1 ring-gray-100">
                <p className="text-xs text-gray-500">
                  {t("home.popular")}
                </p>

                <p className="mt-1 text-xl font-semibold text-gray-900">
                  {popularPosts.length}
                </p>
              </div>
            </div>
          </div>
        </section>


        <section className="rounded-3xl border border-white/70 bg-white/90 p-6 shadow-sm backdrop-blur">

          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {t("home.popularPosts")}
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                {t("home.popularDescription")}
              </p>
            </div>

            <span className="rounded-full bg-pink-50 px-3 py-1 text-xs font-semibold text-pink-600">
              Top 10
            </span>
          </div>


          {loading ? (
            <div className="py-12 text-center text-gray-400">
              {t("common.loading")}
            </div>

          ) : popularPosts.length > 0 ? (

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">

              {popularPosts.map((post) => (
                <PostCard
                  key={post.postId}
                  postId={post.postId}
                  title={post.title}
                  writer={post.user?.alias ?? t("common.anonymous")}
                  boardname={post.board?.name ?? "unknown"}
                  thumbs={post.likes - post.dislikes}
                  comment={post.comments?.length ?? 0}
                  views={post.views}
                />
              ))}

            </div>

          ) : (

            <div className="py-12 text-center text-sm text-gray-400">
              {t("home.noPopular")}
            </div>

          )}

        </section>



        <section className="rounded-3xl border border-white/70 bg-white/90 p-6 shadow-sm backdrop-blur">

          <div className="mb-5">
            <h2 className="text-xl font-semibold text-gray-900">
              {t("home.boardsTitle")}
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              {t("home.boardDescription")}
            </p>
          </div>


          {loading ? (

            <div className="py-12 text-center text-gray-400">
              {t("common.loading")}
            </div>

          ) : (

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">

              {boards.map((b) => (
                <BoardCard
                  key={b.name}
                  boardTitle={b.name}
                  posts={boardMap[b.name] ?? []}
                  isProtected={b.isProtected}
                />
              ))}

            </div>

          )}

        </section>

      </div>
    </div>
  );
};

export default Home;