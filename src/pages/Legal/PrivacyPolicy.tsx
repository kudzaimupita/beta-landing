import { FC, useState, useEffect } from "react";
import { LegalLayout } from "@/components/LegalLayout";
import { formatLegalContent } from "@/utils/legalFormatter";
import privacyPolicyText from "@/assets/legal/privacy-policy.txt";
import TextSkeletons from "@/widgets/Skeletons";

const PrivacyPolicy: FC = () => {
    const [content, setContent] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        const fetchContent = async () => {
            try {
                const response = await fetch(privacyPolicyText);
                const text = await response.text();
                setContent(formatLegalContent(text));
            } catch (error) {
                console.error("Error loading Privacy Policy:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchContent();
    }, []);

    if (loading) {
        return (
            <LegalLayout title="Privacy Policy">
                <div className="flex justify-center items-center">
                    <TextSkeletons />
                </div>
            </LegalLayout>
        );
    }

    return (
        <LegalLayout title="Privacy Policy">
            <div dangerouslySetInnerHTML={{ __html: content }} />
        </LegalLayout>
    );
};

export default PrivacyPolicy;