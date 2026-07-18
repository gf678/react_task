import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import type { Post } from "../../types/post";
import { useTranslation } from "react-i18next";
import api from "../../api/axios";

interface Props {

  boardId:number;

  boardTitle:string;

  posts:Post[];

  isProtected:boolean;

}


const BoardCard: React.FC<Props> = ({
  boardId,
  boardTitle,
  posts,
  isProtected,
}) => {

  const { t } = useTranslation();

  const navigate = useNavigate();


  const [showPassword,setShowPassword] = useState(false);

  const [password,setPassword] = useState("");


  const formatDate = (date?: string) => {

    if (!date) return "";

    const d = new Date(date);

    return `${(d.getMonth()+1)
      .toString()
      .padStart(2,"0")}.${d
      .getDate()
      .toString()
      .padStart(2,"0")}`;

  };


  // 게시판 입장
  const openBoard = () => {


    if(!isProtected){

      navigate(`/board/${boardTitle}/list`);

      return;

    }


    setShowPassword(true);

  };


  // 비밀번호 확인
  const checkPassword = async()=>{


    try{


      await api.post(
        `/api/boards/${boardId}/access`,
        {
          password
        }
      );


      setShowPassword(false);

      setPassword("");


      navigate(
        `/board/${boardTitle}/list`
      );


    }catch(err){

      console.error(err);

      alert("비밀번호가 틀렸습니다");

    }


  };



  return (

    <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">


      <div className="border-b border-gray-100 px-5 py-4">

        <div className="flex items-center justify-between gap-3">


          <button
            onClick={openBoard}
            className="truncate text-lg font-semibold text-gray-900 transition hover:text-pink-600"
          >

            {boardTitle}


            {isProtected && (
              <span className="ml-2">
                🔒
              </span>
            )}


          </button>



          <span className="shrink-0 rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-600">

            {posts.length} {t("boardCard.posts")}

          </span>


        </div>


      </div>





      <ul className="divide-y divide-gray-100">


        {posts.length > 0 ? (

          posts.slice(0,5).map((post)=>(


            <li key={post.postId}>


              <Link
                to={
                  isProtected
                  ? "#"
                  : `/board/${boardTitle}/post/${post.postId}`
                }

                onClick={(e)=>{

                  if(isProtected){

                    e.preventDefault();

                    setShowPassword(true);

                  }

                }}

                className="block px-5 py-4 transition hover:bg-pink-50/40"
              >


                <div className="flex items-start justify-between gap-3">


                  <div className="min-w-0 flex-1">


                    <div className="truncate text-sm font-medium text-gray-800">


                      {post.title}


                      {post.comments?.length ? (

                        <span className="ml-2 text-red-500">

                          [{post.comments.length}]

                        </span>

                      ):null}


                    </div>



                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">


                      <span>

                        {post.user?.alias ?? t("boardCard.anonymous")}

                      </span>


                      <span>

                        {formatDate(post.createdAt)}

                      </span>


                    </div>



                  </div>




                  <div className="flex shrink-0 items-center gap-2 text-xs text-gray-500">


                    <span className="rounded-full bg-gray-100 px-2 py-1">

                      👍 {post.likes-post.dislikes}

                    </span>


                    <span className="rounded-full bg-gray-100 px-2 py-1">

                      👁 {post.views}

                    </span>


                  </div>



                </div>



              </Link>


            </li>


          ))


        ):(


          <li className="px-5 py-10 text-center text-sm text-gray-400">


            <button
              onClick={openBoard}
              className="transition hover:text-pink-500"
            >

              {t("boardCard.firstPost")}

            </button>


          </li>


        )}



      </ul>





      <div className="border-t border-gray-100 bg-gray-50/70 px-5 py-3">


        <button
          onClick={openBoard}
          className="text-sm font-medium text-gray-600 transition hover:text-pink-600"
        >

          {t("boardCard.more")}

        </button>


      </div>






      {/* 비밀번호 모달 */}

      {showPassword && (


        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">


          <div className="rounded-2xl bg-white p-6 shadow-xl">


            <h3 className="mb-4 font-semibold">

              🔒 Password

            </h3>



            <input

              type="password"

              value={password}

              onChange={
                e=>setPassword(e.target.value)
              }

              className="mb-4 rounded-xl border px-3 py-2"

              placeholder="Password"

            />



            <div className="flex gap-2">


              <button

                onClick={checkPassword}

                className="rounded-xl bg-pink-500 px-4 py-2 text-white"

              >

                확인

              </button>




              <button

                onClick={()=>{

                  setShowPassword(false);

                  setPassword("");

                }}

                className="rounded-xl bg-gray-100 px-4 py-2"

              >

                취소

              </button>



            </div>



          </div>


        </div>


      )}



    </div>

  );

};


export default BoardCard;