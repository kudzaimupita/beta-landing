import { FC, useState, useEffect } from "react";
import { LegalLayout } from "@/components/LegalLayout";
import { formatLegalContent } from "@/utils/legalFormatter";
import acceptableUsePolicyText from "@/assets/legal/acceptable-use-policy.txt";
import TextSkeletons from "@/widgets/Skeletons";

const AcceptableUsePolicy: FC = () => {
    const [content, setContent] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        const fetchContent = async () => {
            try {
                const response = await fetch(acceptableUsePolicyText);
                const text = await response.text();
                setContent(formatLegalContent(text));
            } catch (error) {
                alert("Error loading Acceptable Use Policy. Contact support or visit servly.app/help")
                console.error("Error loading Acceptable Use Policy. Contact support or visit https://servly.app/help:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchContent();
    }, []);

    if (loading) {
        return (
            <LegalLayout title="Acceptable Use Policy">
                <div className="flex justify-center items-center">
                    <TextSkeletons />
                </div>
            </LegalLayout>
        );
    }

    return (
        <LegalLayout title="Acceptable Use Policy">
            <div dangerouslySetInnerHTML={{ __html: content }} />
        </LegalLayout>
    );
};

export default AcceptableUsePolicy;
