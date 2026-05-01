import { Routes, Route } from "react-router-dom";

import Layout from "./components/Layout";
import Home from "./pages/Home";
import Auth from "./pages/Auth";
import UserEdit from "./pages/UserEdit";
import AdminPage from "./pages/Admin";
import ResetPassword from "./pages/ResetPassword";

import BoardContainer from "./pages/board/boardContainer";
import PostWrite from "./pages/board/post/PostWrite";
import PostDetail from "./pages/board/post/PostDetail";
import ProtectedRoute from "./routes/ProtectedRoute";
import AdminRoute from "./routes/AdminRoute";
import ErrorPage from "./pages/ErrorPage";
import PostEdit from "./pages/board/post/PostEdit";

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Auth />} />

      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/board/:boardName/list" element={<BoardContainer />} />
        <Route path="/board/:boardName/post/:postId" element={<PostDetail />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route
          path="/board/:boardName/write"
          element={
            <ProtectedRoute>
              <PostWrite />
            </ProtectedRoute>
          }
        />
        <Route
          path="/board/:boardName/update/:postId"
          element={
            <ProtectedRoute>
              <PostEdit />
            </ProtectedRoute>
          }
        />
        <Route
          path="/user/edit"
          element={
            <ProtectedRoute>
              <UserEdit />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminPage />
            </AdminRoute>
          }
        />
        <Route path="/error" element={<ErrorPage />} />
        <Route path="*" element={<ErrorPage />} />
      </Route>
    </Routes>
  );
}

export default App;