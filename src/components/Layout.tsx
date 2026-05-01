import { Outlet } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";

// レイアウトコンポーネント：ヘッダー、メインコンテンツ領域、フッターで構成される基本ページレイアウト
const Layout: React.FC = () => {
  return (
    <>
      <Header />
      <main>
        <Outlet />
      </main>
      <Footer />
    </>
  );
};

export default Layout;