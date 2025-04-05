import { FC, ReactNode } from "react";
import { LegalNav } from "./LegalNav";

interface LegalLayoutProps {
    children: ReactNode;
    title: string;
}

export const LegalLayout: FC<LegalLayoutProps> = ({ children, title }) => {
    return (
        <div className="flex flex-col min-h-screen bg-gray-50 md:p-4">

            <div className="flex flex-col md:flex-row gap-8">
                {/* Left sidebar navigation */}
                <aside className="md:w-1/4">
                    <LegalNav />
                </aside>

                {/* Main content area */}
                <main className="md:w-3/4 bg-white p-6 rounded-lg shadow-sm border">
                    <h1 className="text-2xl font-bold mb-6" style={{ fontFamily: 'Helius Medium', color: '#66676a' }}>{title}</h1>
                    <div className="legal-document prose max-w-none" style={{ fontFamily: 'Helius Medium', color: '#19181B' }}>
                        {children}
                    </div>
                </main>
            </div>

        </div>
    );
};