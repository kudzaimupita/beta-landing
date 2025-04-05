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
        { id: "refund", title: "Refund Policy", path: "/legal/refund" }
    ];

    return (
        <nav className="w-full sticky top-0 bg-white rounded-lg border shadow-sm p-4 sm:w-1/2 md:w-1/4 md:fixed md:top-4">
            <h2
                className="text-lg font-medium mb-4 pb-2 flex justify-between gap-10px text-neutral-700"
                style={{ fontFamily: 'Helius Medium' }}
            >
                {/* <Logo /> */}
                <Link to="/" className="flex gap-2 justify-center items-center">
                    <img className="h-[23px] object-contain" src={ServlyIcon} alt="X" />
                    <img className="h-[20px]" src={ServlyWordmark} alt="Servly" />
                </Link>
                Legal
            </h2>
            <ul className="space-y-1">
                {legalDocuments.map((doc) => (
                    <li key={doc.id}>
                        <Link
                            to={doc.path}
                            className={`block py-2 px-3 rounded transition duration-150 ${currentPath === doc.path
                                ? "bg-neutral-900 text-neutral-100 font-medium"
                                : "hover:bg-neutral-200 text-neutral-500"
                                }`}
                            style={{ fontFamily: 'Helius Medium' }}
                        >
                            {doc.title}
                        </Link>
                    </li>
                ))}
            </ul>
        </nav>
    );
};
