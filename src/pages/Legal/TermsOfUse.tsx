import { FC, useState, useEffect } from "react";
import { LegalLayout } from "@/components/LegalLayout";
import { formatLegalContent } from "@/utils/legalFormatter";
import termsOfUseText from "@/assets/legal/terms-of-use.txt";

const TermsOfUse: FC = () => {
    const [content, setContent] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        const fetchContent = async () => {
            try {
                const response = await fetch(termsOfUseText);
                const text = await response.text();
                setContent(formatLegalContent(text));
            } catch (error) {
                console.error("Error loading Terms of Use:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchContent();
    }, []);

    if (loading) {
        return (
            <LegalLayout title="Terms of Use">
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                </div>
            </LegalLayout>
        );
    }

    return (
        <LegalLayout title="Terms of Use">
            <div dangerouslySetInnerHTML={{ __html: content }} />
        </LegalLayout>
    );
};

export default TermsOfUse;