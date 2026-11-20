/**
 * Utility to parse markdown and plain text into safe, beautifully styled HTML
 * for dashboard banners and transactional/broadcast emails.
 */

export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function renderFormattedHtml(rawText: string, options: { forEmail?: boolean } = {}): string {
  if (!rawText || typeof rawText !== 'string') return '';
  const forEmail = options.forEmail || false;

  // Step 1: Escape HTML to ensure safety, while allowing pre-existing standard formatting tags
  // We first escape everything
  let text = escapeHtml(rawText);

  // Restore safe inline tags if the user entered them manually
  text = text
    .replace(/&lt;b&gt;(.*?)&lt;\/b&gt;/gi, '<strong>$1</strong>')
    .replace(/&lt;strong&gt;(.*?)&lt;\/strong&gt;/gi, '<strong>$1</strong>')
    .replace(/&lt;i&gt;(.*?)&lt;\/i&gt;/gi, '<em>$1</em>')
    .replace(/&lt;em&gt;(.*?)&lt;\/em&gt;/gi, '<em>$1</em>')
    .replace(/&lt;u&gt;(.*?)&lt;\/u&gt;/gi, '<u>$1</u>')
    .replace(/&lt;br\s*\/?&gt;/gi, '<br />');

  // Step 2: Markdown Bold (**text** or __text__)
  text = text.replace(/(?:\*\*|__)(.+?)(?:\*\*|__)/g, '<strong>$1</strong>');

  // Step 3: Markdown Italic (*text* or _text_)
  // Be careful not to match within words or bold tags
  text = text.replace(/(?:^|[^*_])(?:\*|_)([^*_\n]+?)(?:\*|_)(?=[^*_]|$)/g, (match, p1) => {
    const prefix = match.startsWith('*') || match.startsWith('_') ? '' : match[0];
    return `${prefix}<em>${p1}</em>`;
  });

  // Step 4: Markdown Links [text](url)
  const linkStyle = forEmail
    ? 'color: #0E4F45; text-decoration: underline; font-weight: 600;'
    : 'color: inherit; text-decoration: underline; font-weight: 600;';

  text = text.replace(/\[([^\]]+)\]\((https?:\/\/[^\s\)]+)\)/g, (match, label, url) => {
    return `<a href="${url}" target="_blank" rel="noopener noreferrer" style="${linkStyle}">${label}</a>`;
  });

  // Step 5: Convert bare URLs (not already in a link) to clickable links
  text = text.replace(/(^|[\s(])(https?:\/\/[^\s<)]+)(?=[)\s]|$)/g, (match, prefix, url) => {
    return `${prefix}<a href="${url}" target="_blank" rel="noopener noreferrer" style="${linkStyle}">${url}</a>`;
  });

  // Step 6: Process line-by-line for bullet lists (- or * or •) and numbered lists (1. 2.)
  const lines = text.split(/\r?\n/);
  const output: string[] = [];
  let inList: 'ul' | 'ol' | null = null;

  const ulStyle = forEmail
    ? 'margin: 12px 0 16px 0; padding-left: 24px; color: inherit; list-style-type: disc;'
    : 'margin: 8px 0 10px 0; padding-left: 20px; color: inherit; list-style-type: disc;';
  const olStyle = forEmail
    ? 'margin: 12px 0 16px 0; padding-left: 24px; color: inherit; list-style-type: decimal;'
    : 'margin: 8px 0 10px 0; padding-left: 20px; color: inherit; list-style-type: decimal;';
  const liStyle = forEmail
    ? 'margin-bottom: 6px; line-height: 1.55;'
    : 'margin-bottom: 4px; line-height: 1.5;';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Bullet list item
    const bulletMatch = trimmed.match(/^[-*•]\s+(.+)$/);
    // Numbered list item
    const numMatch = trimmed.match(/^\d+[\.)]\s+(.+)$/);

    if (bulletMatch) {
      if (inList === 'ol') {
        output.push('</ol>');
        inList = null;
      }
      if (!inList) {
        output.push(`<ul style="${ulStyle}">`);
        inList = 'ul';
      }
      output.push(`<li style="${liStyle}">${bulletMatch[1]}</li>`);
    } else if (numMatch) {
      if (inList === 'ul') {
        output.push('</ul>');
        inList = null;
      }
      if (!inList) {
        output.push(`<ol style="${olStyle}">`);
        inList = 'ol';
      }
      output.push(`<li style="${liStyle}">${numMatch[1]}</li>`);
    } else {
      if (inList) {
        output.push(inList === 'ul' ? '</ul>' : '</ol>');
        inList = null;
      }
      if (trimmed === '') {
        output.push('<br />');
      } else {
        output.push(forEmail ? `<p style="margin: 0 0 12px 0; line-height: 1.6;">${line}</p>` : `<div>${line}</div>`);
      }
    }
  }

  if (inList) {
    output.push(inList === 'ul' ? '</ul>' : '</ol>');
  }

  let finalHtml = output.join('\n');
  // Collapse excessive breaks
  finalHtml = finalHtml.replace(/(<br \/>\s*){2,}/g, '<br /><br />');
  return finalHtml;
}
