function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

export function linkifyText(text: string, isOwnMessage: boolean = true): string {
  // First escape all HTML to prevent XSS
  const escapedText = escapeHtml(text);
  
  // Then linkify URLs with different colors based on sender/recipient
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const linkClass = isOwnMessage 
    ? "text-white underline hover:text-white/80 transition-colors"
    : "text-primary underline hover:text-primary/80 transition-colors";
  
  return escapedText.replace(urlRegex, (url) => {
    return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="${linkClass}">${url}</a>`;
  });
}

export function renderMessageContent(content: string, isOwnMessage: boolean = true): { __html: string } {
  const linkedText = linkifyText(content, isOwnMessage);
  return { __html: linkedText };
}
