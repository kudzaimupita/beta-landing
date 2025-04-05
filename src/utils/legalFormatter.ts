export const formatLegalContent = (content: string): string => {
    let formattedContent = content;

    // Replace markdown headers with styled divs
    formattedContent = formattedContent.replace(/^# (.*?)$/gm, '<h1 class="text-2xl font-bold mt-6 mb-8">$1</h1>');
    formattedContent = formattedContent.replace(/^## (.*?)$/gm, '<h2 class="text-xl font-semibold mt-8 mb-3">$1</h2>');
    formattedContent = formattedContent.replace(/^### (.*?)$/gm, '<h3 class="text-lg font-medium mt-4 mb-2">$1</h3>');

    // Replace bold text
    formattedContent = formattedContent.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    // Replace italic text
    formattedContent = formattedContent.replace(/\*(.*?)\*/g, '<em>$1</em>');

    // Replace lists
    formattedContent = formattedContent.replace(/^- (.*?)$/gm, '<li class="ml-4 mb-1">$1</li>');

    // Add paragraph tags to plain text
    formattedContent = formattedContent.replace(/^(?!(#|<|$))(.+)$/gm, '<p class="mb-3">$2</p>');

    return formattedContent;
};