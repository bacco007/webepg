const entities: { [key: string]: string } = {
  "&#39;": "'",
  "&#x2F;": "/",
  "&#x3D;": "=",
  "&#x60;": "`",
  "&amp;": "&",
  "&gt;": ">",
  "&hellip;": "…",
  "&ldquo;": '"',
  "&lsquo;": "'",
  "&lt;": "<",
  "&mdash;": "—",
  "&nbsp;": "\u00A0",
  "&ndash;": "–",
  "&quot;": '"',
  "&rdquo;": '"',
  "&rsquo;": "'",
};

export function decodeHtml(html: string): string {
  if (!html) {
    return "";
  }

  // First, handle standard HTML entities
  let decoded = html.replaceAll(/&(?:#x[\da-f]+|#\d+|[\da-z]+);/gi, (match) => {
    if (match.charAt(1) === "#") {
      const code =
        match.charAt(2).toLowerCase() === "x"
          ? Number.parseInt(match.slice(3), 16)
          : Number.parseInt(match.slice(2), 10);

      return String.fromCharCode(code);
    }
    return entities[match] || match;
  });

  // Handle specific problematic sequences
  decoded = decoded
    // Fix the specific "Â€™" sequence which should be an apostrophe
    .replace(/Â€™/g, "'")
    // Fix other common encoding issues
    .replace(/Â€œ/g, '"')
    .replace(/Â€/g, "€")
    .replace(/Â/g, "")
    // Fix other potential UTF-8 encoding issues
    .replace(/â€™/g, "'")
    .replace(/â€œ/g, '"')
    .replace(/â€/g, "€")
    .replace(/â€"/g, "—")
    .replace(/â€"/g, "–")
    // Fix escaped single quotes
    .replace(/\\'/g, "'")
    // Fix escaped double quotes
    .replace(/\\"/g, '"');

  return decoded;
}
