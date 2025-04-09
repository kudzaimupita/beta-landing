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
import AcceptableUsePolicy from "@/pages/Legal/AcceptableUse";
import BetaProgrammePolicy from "@/pages/Legal/BetaProgrammePolicy";

const App: FC = () => {
  useEffect(() => {
    console.log(`We're hiring soon! Visit https://servly.app/careers
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
        {/* Redirect root to legal/terms */}
        <Route path="/" element={<Navigate to="/terms" replace />} />

        {/* Legal Routes */}
        {/* <Route path="/legal"> */}
        <Route index element={<Navigate to="/terms" replace />} />
        <Route path="terms" element={<TermsOfUse />} />
        <Route path="privacy" element={<PrivacyPolicy />} />
        <Route path="pricing" element={<PricingPolicy />} />
        <Route path="refund" element={<RefundPolicy />} />
        <Route path="acceptable-use" element={<AcceptableUsePolicy />} />
        <Route path="beta-programme" element={<BetaProgrammePolicy />} />
        {/* </Route> */}

        {/* Catch-all route - redirects all 404s to legal/terms */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
};

export default App;