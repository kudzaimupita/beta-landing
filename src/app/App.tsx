import { FC } from "react";
import { Route, Routes } from "react-router-dom";
import { Layout } from "@/app/Layout";
import { Home, NoMatch } from "@/pages";
import ComingSoonPage from "@/pages/ComingSoon";
import Texture from '../assets/img/Texture.png';

const App: FC = () => {
  return (
    <>
      <img className="absolute opacity-[0.5] z-[9999] h-[100vh] w-[100vw] mix-blend-multiply pointer-events-none"
        src={Texture} alt="Texture" />
      <Routes>
        {/* <Route path="/" element={<Layout />}> */}
        <Route index element={<ComingSoonPage />} />
        <Route path="*" element={<NoMatch />} />
        {/* </Route> */}
      </Routes>
    </>
  );
};

export default App;
