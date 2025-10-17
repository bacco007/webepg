export const stateAbbreviations: Record<string, string> = {
  "Aus. Capital Territory": "ACT",
  "Australian Capital Territory": "ACT",
  "New South Wales": "NSW",
  "Northern Territory": "NT",
  Queensland: "QLD",
  "South Australia": "SA",
  Tasmania: "TAS",
  Victoria: "VIC",
  "Western Australia": "WA",
};

// Example usage:
// abbreviateText("New South Wales Television", stateAbbreviations)
// returns "NSW Television"

export const abbreviateText = (
  text: string,
  abbreviations: Record<string, string>
): string => {
  if (!text) {
    return text;
  }

  let result = text;

  // Sort abbreviations by length (longest first) to handle overlapping phrases
  const sortedAbbreviations = Object.entries(abbreviations).sort(
    (a, b) => b[0].length - a[0].length
  );

  // Replace each abbreviation in the text
  for (const [fullText, abbreviation] of sortedAbbreviations) {
    // Create case-insensitive regex for the full phrase
    const regex = new RegExp(fullText, "gi");
    result = result.replace(regex, abbreviation);
  }

  return result;
};
