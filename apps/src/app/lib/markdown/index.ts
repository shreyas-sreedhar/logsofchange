/**
 * Simple markdown to HTML converter
 * For a production environment, consider using a more robust library like marked or remark
 */
export function markdownToHtml(markdown: string): string {
  let html = markdown
    .replace(/^# (.*)/gm, '<h1>$1</h1>')
    .replace(/^## (.*)/gm, '<h2>$1</h2>')
    .replace(/^### (.*)/gm, '<h3>$1</h3>')
    .replace(/\*\*(.*)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*)\*/g, '<em>$1</em>')
    .replace(/- (.*)/gm, '<li>$1</li>')
    .replace(/\n\n/g, '</p><p>');
  
  // Wrap lists
  html = html.replace(/<li>(.*?)<\/li>/g, function(match) {
    if (match.indexOf('<ul>') === -1) {
      return '<ul>' + match + '</ul>';
    }
    return match;
  });
  
  // Fix doubled ul tags
  html = html.replace(/<\/ul><ul>/g, '');
  
  return `<p>${html}</p>`;
} 