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
  return html.replaceAll(/&(?:#x[\da-f]+|#\d+|[\da-z]+);/gi, match => {
    if (match.charAt(1) === '#') {
      const code =
        match.charAt(2).toLowerCase() === 'x'
          ? Number.parseInt(match.slice(3), 16)
          : Number.parseInt(match.slice(2));

      return String.fromCharCode(code);
    }
    return entities[match] || match;
  });
}
