import { FC, useState, useEffect } from "react";
import { LegalLayout } from "@/components/LegalLayout";
import { formatLegalContent } from "@/utils/legalFormatter";
import pricingPolicyText from "@/assets/legal/pricing-policy.txt";
import TextSkeletons from "@/widgets/Skeletons";

const PricingPolicy: FC = () => {
    const [content, setContent] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        const fetchContent = async () => {
            try {
                const response = await fetch(pricingPolicyText);
                const text = await response.text();
                setContent(formatLegalContent(text));
            } catch (error) {
                console.error("Error loading Pricing Policy:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchContent();
    }, []);

    if (loading) {
        return (
            <LegalLayout title="Pricing Policy">
                <div className="flex justify-center items-center">
                    <TextSkeletons />
                </div>
            </LegalLayout>
        );
    }

    return (
        <LegalLayout title="Pricing Policy">
            <div dangerouslySetInnerHTML={{ __html: content }} />
        </LegalLayout>
    );
};

export default PricingPolicy;
