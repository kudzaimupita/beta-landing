import { FC } from "react";
import { Link, useLocation } from "react-router-dom";
import ServlyIcon from "../../public/images/App Icon Black.png";
import ServlyWordmark from "../../public/images/Wordmark Black.png";

export const LegalNav: FC = () => {
  const location = useLocation();
  const currentPath = location.pathname;

  const legalDocuments = [
    { id: "terms", title: "Terms of Use", path: "/legal/terms" },
    { id: "privacy", title: "Privacy Policy", path: "/legal/privacy" },
    { id: "pricing", title: "Pricing Policy", path: "/legal/pricing" },
    { id: "refund", title: "Refund Policy", path: "/legal/refund" },
    {
      id: "acceptable-use",
      title: "Acceptable Use Policy",
      path: "/legal/acceptable-use",
    },
    {
      id: "beta-programme",
      title: "Beta Programme Policy",
      path: "/legal/beta-programme",
    },
  ];

  return (
    <nav className="sticky top-0 w-full rounded-lg border bg-white p-4 shadow-sm sm:w-1/2 md:fixed md:top-4 md:w-1/4">
      <h2
        className="gap-10px mb-4 flex justify-between pb-2 text-lg font-medium text-neutral-700"
        style={{ fontFamily: "Helius Medium" }}
      >
        {/* <Logo /> */}
        <a
          href="www.servly.app"
          className="flex items-center justify-center gap-2"
        >
          <img className="h-[23px] object-contain" src={ServlyIcon} alt="X" />
          <img className="h-[20px]" src={ServlyWordmark} alt="Servly" />
        </a>
        Legal
      </h2>
      <ul className="space-y-1">
        {legalDocuments.map((doc) => (
          <li key={doc.id}>
            <Link
              to={doc.path}
              className={`block rounded px-3 py-2 transition duration-150 ${
                currentPath === doc.path
                  ? "bg-neutral-900 font-medium text-neutral-100"
                  : "text-neutral-500 hover:bg-neutral-200"
              }`}
              style={{ fontFamily: "Helius Medium" }}
            >
              {doc.title}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
};
