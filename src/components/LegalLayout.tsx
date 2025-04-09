import { FC, ReactNode, useState, useEffect } from "react";
import { LegalNav } from "./LegalNav";

interface LegalLayoutProps {
    children: ReactNode;
    title: string;
}

export const LegalLayout: FC<LegalLayoutProps> = ({ children, title }) => {
    const [showScrollButton, setShowScrollButton] = useState(false);

    // Handle scroll event to show/hide the button
    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 50) {
                setShowScrollButton(true);
            } else {
                setShowScrollButton(false);
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Scroll to top function
    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    };

    // Calculate top padding based on mobile/desktop
    const [topPadding, setTopPadding] = useState("pt-20");

    useEffect(() => {
        const updatePadding = () => {
            if (window.innerWidth < 768) {
                setTopPadding("pt-20"); // More padding on mobile for the fixed header
            } else {
                setTopPadding("pt-4"); // Less padding needed on desktop
            }
        };

        updatePadding();
        window.addEventListener('resize', updatePadding);
        return () => window.removeEventListener('resize', updatePadding);
    }, []);

    return (
        <div className={`flex flex-col min-h-screen bg-gray-50 md:p-4 ${topPadding} pb-20`}>
            <div className="flex flex-col md:flex-row gap-8">
                {/* Left sidebar navigation */}
                <aside className="md:w-1/4">
                    <LegalNav />
                </aside>

                {/* Main content area */}
                <main className="md:w-3/4 bg-white p-6 rounded-lg shadow-sm border mb-16">
                    <h1 className="text-2xl font-bold mb-2" style={{ fontFamily: 'Helius Medium', color: '#010101' }}>{title}</h1>
                    <div className="legal-document prose max-w-none" style={{ fontFamily: 'Helius Medium', color: '#19181B' }}>
                        {children}
                    </div>
                </main>
            </div>

            {/* Scroll to top button */}
            <button
                onClick={scrollToTop}
                className={`fixed bottom-6 right-6 bg-neutral-800 text-white rounded-full p-3 shadow-lg transition-all duration-300 z-40 hover:bg-neutral-700 active:bg-neutral-900 ${showScrollButton ? 'opacity-90 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'}`}
                aria-label="Scroll to top"
            >
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
                >
                    <polyline points="18 15 12 9 6 15"></polyline>
                </svg>
            </button>
        </div>
    );
};