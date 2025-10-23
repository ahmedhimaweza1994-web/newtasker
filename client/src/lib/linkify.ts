function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

export function linkifyText(text: string): string {
  // First escape all HTML to prevent XSS
  const escapedText = escapeHtml(text);
  
  // Then linkify URLs
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return escapedText.replace(urlRegex, (url) => {
    return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-primary underline hover:text-primary/80 transition-colors">${url}</a>`;
  });
}

export function renderMessageContent(content: string): { __html: string } {
  const linkedText = linkifyText(content);
  return { __html: linkedText };
}
