import { FC, useState, useEffect } from "react";
import { LegalLayout } from "@/components/LegalLayout";
import { formatLegalContent } from "@/utils/legalFormatter";
import refundPolicyText from "@/assets/legal/refund-policy.txt";
import TextSkeletons from "@/widgets/Skeletons";

const RefundPolicy: FC = () => {
    const [content, setContent] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        const fetchContent = async () => {
            try {
                const response = await fetch(refundPolicyText);
                const text = await response.text();
                setContent(formatLegalContent(text));
            } catch (error) {
                console.error("Error loading Refund Policy:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchContent();
    }, []);

    if (loading) {
        return (
            <LegalLayout title="Refund Policy">
                <div className="flex justify-center items-center">
                    <TextSkeletons />
                </div>
            </LegalLayout>
        );
    }

    return (
        <LegalLayout title="Refund Policy">
            <div dangerouslySetInnerHTML={{ __html: content }} />
        </LegalLayout>
    );
};

export default RefundPolicy;