import { FC, useState, useEffect } from "react";
import { LegalLayout } from "@/components/LegalLayout";
import { formatLegalContent } from "@/utils/legalFormatter";
import betaProgrammePolicyText from "@/assets/legal/beta-programmes-agreement.txt";
import TextSkeletons from "@/widgets/Skeletons";

const BetaProgrammePolicy: FC = () => {
    const [content, setContent] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        const fetchContent = async () => {
            try {
                const response = await fetch(betaProgrammePolicyText);
                const text = await response.text();
                setContent(formatLegalContent(text));
            } catch (error) {
                alert("Error loading Beta Programme Policy. Contact support or visit servly.app/help")
                console.error("Error loading Beta Programme Policy. Contact support or visit https://servly.app/help:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchContent();
    }, []);

    if (loading) {
        return (
            <LegalLayout title="Beta Programme Policy">
                <div className="flex justify-center items-center">
                    <TextSkeletons />
                </div>
            </LegalLayout>
        );
    }

    return (
        <LegalLayout title="Beta Programme Policy">
            <div dangerouslySetInnerHTML={{ __html: content }} />
        </LegalLayout>
    );
};

export default BetaProgrammePolicy;
