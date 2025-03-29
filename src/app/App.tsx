import { FC, useEffect } from "react";
import { Route, Routes, Navigate } from "react-router-dom";
import { Layout } from "@/app/Layout";
import { Home } from "@/pages";
import ComingSoonPage from "@/pages/ComingSoon";
import Texture from '../assets/img/Texture.png';
import { ConsoleText } from "@/components/consoleText";

const App: FC = () => {
  useEffect(() => {
    console.log(`
      We're hiring soon! Visit https://servly.app/careers
      ${ConsoleText}
    `);
  }, []);

  return (
    <>
      <img
        className="absolute opacity-[0.5] z-[9999] h-[100vh] w-[100vw] mix-blend-multiply pointer-events-none"
        src={Texture}
        alt="Texture"
      />
      <Routes>
        {/* <Route path="/" element={<Layout />}> */}
        <Route index element={<ComingSoonPage />} />
        {/* Catch-all route - redirects all 404s to index */}
        <Route path="*" element={<Navigate to="/" replace />} />
        {/* </Route> */}
      </Routes>
    </>
  );
};

export default App;