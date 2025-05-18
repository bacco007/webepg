/**
 * Sorts channels by their channel number, handling alphanumeric values
 * First sorts by the numeric part, then by the alphabetic part
 *
 * @param channels Array of channels to sort
 * @param getChannelName Optional function to get channel name for fallback sorting
 * @returns Sorted array of channels
 */
export function sortChannelsByNumber<T>(
  channels: T[],
  getChannelNumber: (channel: T) => string | undefined,
  getChannelName?: (channel: T) => string,
): T[] {
  return [...channels].sort((a, b) => {
    // Get channel numbers using the provided function
    const aLcn = getChannelNumber(a)
    const bLcn = getChannelNumber(b)

    // Extract numeric and alphabetic parts from channel numbers
    const aMatch = aLcn?.match(/^(\d+)([a-zA-Z]*)$/)
    const bMatch = bLcn?.match(/^(\d+)([a-zA-Z]*)$/)

    // Default values if no match or no channel number
    const aNum = aMatch ? Number.parseInt(aMatch[1]) : Number.POSITIVE_INFINITY
    const aLetter = aMatch ? aMatch[2] : ""
    const bNum = bMatch ? Number.parseInt(bMatch[1]) : Number.POSITIVE_INFINITY
    const bLetter = bMatch ? bMatch[2] : ""

    // First sort by numeric part
    if (aNum !== bNum) {
      return aNum - bNum
    }

    // Then sort by alphabetic part
    if (aLetter !== bLetter) {
      return aLetter.localeCompare(bLetter)
    }

    // If both parts are the same and we have a name getter function, sort by name
    if (getChannelName) {
      return getChannelName(a).localeCompare(getChannelName(b))
    }

    // Default return if no name getter provided
    return 0
  })
}
