import { FC, useEffect } from "react";
import { Route, Routes, Navigate } from "react-router-dom";
import { Layout } from "@/app/Layout";
import { Home } from "@/pages";
import ComingSoonPage from "@/pages/ComingSoon";
import Texture from '../assets/img/Texture.png';
import { ConsoleText } from "@/components/consoleText";
import TermsOfUse from "@/pages/Legal/TermsOfUse";
import PrivacyPolicy from "@/pages/Legal/PrivacyPolicy";
import PricingPolicy from "@/pages/Legal/PricingPolicy";
import RefundPolicy from "@/pages/Legal/RefundPolicy";

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
        className="fixed opacity-[0.1] z-[9999] h-[100vh] w-[100vw] mix-blend-multiply pointer-events-none"
        src={Texture}
        alt="Texture"
      />
      <Routes>
        <Route index element={<ComingSoonPage />} />

        {/* Legal Routes */}
        <Route path="/legal">
          <Route index element={<Navigate to="/legal/terms" replace />} />
        </Route>
        <Route path="/legal/terms" element={<TermsOfUse />} />
        <Route path="/legal/privacy" element={<PrivacyPolicy />} />
        <Route path="/legal/pricing" element={<PricingPolicy />} />
        <Route path="/legal/refund" element={<RefundPolicy />} />

        {/* Catch-all route - redirects all 404s to index */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
};

export default App;