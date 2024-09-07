const entities: { [key: string]: string } = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
  '&#x2F;': '/',
  '&#x60;': '`',
  '&#x3D;': '=',
  '&nbsp;': '\u00A0',
};

export function decodeHtml(html: string): string {
  return html.replace(/&(?:#x[a-f0-9]+|#[0-9]+|[a-z0-9]+);/gi, (match) => {
    if (match.charAt(1) === '#') {
      const code =
        match.charAt(2).toLowerCase() === 'x'
          ? parseInt(match.substr(3), 16)
          : parseInt(match.substr(2));

      return String.fromCharCode(code);
    }
    return entities[match] || match;
  });
}
