import { Link, useLocation } from "react-router-dom";
import { FC, useState, useEffect } from "react";
import ServlyIcon from "../../public/images/App Icon Black.png";
import ServlyWordmark from "../../public/images/Wordmark Black.png";

export const LegalNav: FC = () => {
  const location = useLocation();
  const currentPath = location.pathname;
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Check window size on mount and resize
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // Initial check
    checkIsMobile();

    // Add resize listener
    window.addEventListener('resize', checkIsMobile);

    // Cleanup
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  // Close menu when clicking outside on mobile
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (isMenuOpen && !target.closest('nav')) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen && isMobile) {
      document.addEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isMenuOpen, isMobile]);

  // Close menu when path changes
  useEffect(() => {
    setIsMenuOpen(false);
  }, [currentPath]);

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

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <nav className="fixed top-0 z-50 w-full rounded-lg border bg-white p-4 shadow-sm md:fixed md:top-4 md:w-1/4">
      <div className="flex items-center justify-between">
        <h2
          className="flex items-center gap-2 text-lg font-medium text-neutral-700"
          style={{ fontFamily: "Helius Medium" }}
        >
          <a
            href="https://www.servly.app"
            className="flex items-center justify-center gap-2"
          >
            <img className="h-[23px] object-contain" src={ServlyIcon} alt="X" />
            <img className="h-[20px]" src={ServlyWordmark} alt="Servly" />
          </a>
          {/* | */}
          <span className="">Legal</span>
        </h2>

        {/* Hamburger menu button (mobile only) */}
        <button
          className="flex h-10 w-10 items-center justify-center rounded-md md:hidden"
          onClick={toggleMenu}
          aria-label="Toggle menu"
        >
          {isMenuOpen ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          )}
        </button>
      </div>

      {/* Navigation links - always visible on desktop, toggle on mobile */}
      <ul className={`mt-4 space-y-1 ${isMobile && !isMenuOpen ? 'hidden' : 'block'} max-h-[calc(100vh-80px)] overflow-y-auto`}>
        {legalDocuments.map((doc) => (
          <li key={doc.id}>
            <Link
              to={doc.path}
              className={`block rounded px-3 py-2 transition duration-150 ${currentPath === doc.path
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