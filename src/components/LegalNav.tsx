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

    // Small delay to prevent immediate closing when opening
    const timeoutId = setTimeout(() => {
      if (isMenuOpen && isMobile) {
        document.addEventListener('click', handleClickOutside);
      }
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isMenuOpen, isMobile]);

  // Close menu when path changes
  useEffect(() => {
    setIsMenuOpen(false);
  }, [currentPath]);

  // Handle overflow at document level when menu opens
  useEffect(() => {
    if (isMenuOpen && isMobile) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
      document.body.style.width = '100%';
      document.documentElement.style.width = '100%';
    } else {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
      document.body.style.width = '';
      document.documentElement.style.width = '';
    }

    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
      document.body.style.width = '';
      document.documentElement.style.width = '';
    };
  }, [isMenuOpen, isMobile]);

  const legalDocuments = [
    { id: "terms", title: "Terms of Use", path: "/terms" },
    { id: "privacy", title: "Privacy Policy", path: "/privacy" },
    { id: "pricing", title: "Pricing Policy", path: "/pricing" },
    { id: "refund", title: "Refund Policy", path: "/refund" },
    {
      id: "acceptable-use",
      title: "Acceptable Use Policy",
      path: "/acceptable-use",
    },
    {
      id: "beta-programme",
      title: "Beta Programme Policy",
      path: "/beta-programme",
    },
  ];

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <div className="overflow-x-hidden">
      {/* Blur overlay for mobile menu */}
      <div
        className={`fixed inset-0 bg-white/50 backdrop-blur-sm z-40 md:hidden transition-all duration-300 ease-in-out ${isMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        aria-hidden="true"
        style={{ width: '100%', overflowX: 'hidden' }}
      />

      <nav className="fixed top-0 z-50 w-full overflow-x-hidden rounded-none border-b border-neutral-200 bg-white/90 backdrop-blur-sm p-4 shadow-sm md:rounded-lg md:border md:border-neutral-300 md:fixed md:top-4 md:w-1/4"
        style={{ overflowX: 'hidden' }}>
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
            <span className="">Legal</span>
          </h2>

          {/* Hamburger menu button (mobile only) */}
          <button
            className="flex h-10 w-10 items-center justify-center rounded-md transition-all duration-200 hover:bg-neutral-100 active:bg-neutral-200 md:hidden"
            onClick={toggleMenu}
            aria-label="Toggle menu"
          >
            <div className="relative w-6 h-6">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={`absolute transition-transform duration-300 ${isMenuOpen ? 'opacity-100 rotate-0' : 'opacity-0 rotate-90'}`}
              >
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={`absolute transition-transform duration-300 ${isMenuOpen ? 'opacity-0 -rotate-90' : 'opacity-100 rotate-0'}`}
              >
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            </div>
          </button>
        </div>

        {/* Navigation links - always visible on desktop, animated on mobile */}
        <div
          className={`
            overflow-hidden transition-all duration-300 ease-in-out
            ${isMobile ? (isMenuOpen ? 'max-h-[70vh]' : 'max-h-0') : 'max-h-[100vh]'}
          `}
          style={{ overflowX: 'hidden' }}
        >
          <ul className={`
            mt-4 space-y-1 max-h-[calc(100vh-80px)] overflow-y-auto overflow-x-hidden
            ${isMobile ? 'transform transition-all duration-300 ease-in-out' : ''}
            ${isMobile && isMenuOpen ? 'opacity-100 translate-y-0' : ''}
            ${isMobile && !isMenuOpen ? 'opacity-0 -translate-y-4' : ''}
          `}>
            {legalDocuments.map((doc, index) => (
              <li
                key={doc.id}
                style={{
                  // Staggered animation for each item
                  transitionDelay: isMobile ? `${index * 50}ms` : '0ms'
                }}
                className={`
                  transform transition-all duration-300
                  ${isMobile && isMenuOpen ? 'translate-x-0 opacity-100' : ''}
                  ${isMobile && !isMenuOpen ? 'translate-x-8 opacity-0' : ''}
                `}
              >
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
        </div>
      </nav>
    </div>
  );
};