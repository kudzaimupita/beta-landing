import React from 'react';

const TextSkeletons = () => {
    return (
        <div className="w-full max-w-4xl mx-auto p-4">
            {/* Heading Skeleton */}
            <div className="animate-pulse mb-6">
                <div className="h-8 bg-gray-200 rounded-md w-3/4"></div>
            </div>

            {/* Paragraph Skeletons */}
            <div className="animate-pulse space-y-4 mb-8">
                <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded-md w-full"></div>
                    <div className="h-4 bg-gray-200 rounded-md w-5/6"></div>
                    <div className="h-4 bg-gray-200 rounded-md w-full"></div>
                    <div className="h-4 bg-gray-200 rounded-md w-4/5"></div>
                </div>

                <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded-md w-full"></div>
                    <div className="h-4 bg-gray-200 rounded-md w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded-md w-5/6"></div>
                    <div className="h-4 bg-gray-200 rounded-md w-full"></div>
                </div>
            </div>

            {/* Section Title Skeleton */}
            <div className="animate-pulse mb-4">
                <div className="h-6 bg-gray-200 rounded-md w-1/3"></div>
            </div>

            {/* List Items Skeleton */}
            <div className="animate-pulse space-y-3 mb-8 pl-4">
                <div className="flex items-start">
                    <div className="h-3 w-3 rounded-full bg-gray-200 mt-1 mr-3"></div>
                    <div className="h-4 bg-gray-200 rounded-md w-5/6"></div>
                </div>
                <div className="flex items-start">
                    <div className="h-3 w-3 rounded-full bg-gray-200 mt-1 mr-3"></div>
                    <div className="h-4 bg-gray-200 rounded-md w-3/4"></div>
                </div>
                <div className="flex items-start">
                    <div className="h-3 w-3 rounded-full bg-gray-200 mt-1 mr-3"></div>
                    <div className="h-4 bg-gray-200 rounded-md w-4/5"></div>
                </div>
            </div>

            {/* Final Paragraph Skeleton */}
            <div className="animate-pulse space-y-2">
                <div className="h-4 bg-gray-200 rounded-md w-full"></div>
                <div className="h-4 bg-gray-200 rounded-md w-5/6"></div>
                <div className="h-4 bg-gray-200 rounded-md w-4/5"></div>
                <div className="h-4 bg-gray-200 rounded-md w-full"></div>
            </div>
        </div>
    );
};

export default TextSkeletons;