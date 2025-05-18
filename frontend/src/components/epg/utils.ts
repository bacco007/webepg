import { Tv, Music, Film, Newspaper, Award, Users, Gamepad2, Utensils, Shirt, Landmark } from "lucide-react"
import { decodeHtml } from "@/lib/html-utils"

export function getProgramCategoryIcon(categories?: string[]) {
  if (!categories || categories.length === 0) return null

  const category = categories[0]?.toLowerCase() || ""

  if (category.includes("music")) {
    return Music
  } else if (category.includes("movie") || category.includes("film")) {
    return Film
  } else if (category.includes("series") || category.includes("show")) {
    return Tv
  } else if (category.includes("news")) {
    return Newspaper
  } else if (category.includes("award") || category.includes("ceremony")) {
    return Award
  } else if (category.includes("reality") || category.includes("game show")) {
    return Users
  } else if (category.includes("game") || category.includes("sport")) {
    return Gamepad2
  } else if (category.includes("cooking") || category.includes("food")) {
    return Utensils
  } else if (category.includes("fashion") || category.includes("lifestyle")) {
    return Shirt
  } else if (category.includes("documentary") || category.includes("history")) {
    return Landmark
  }

  return null
}

// Special styling for placeholder program titles
export const titleColorMappings: Record<string, string> = {
  "No Data Available":
    'bg-[hsl(var(--placeholder-bg))] text-muted-foreground bg-[length:4px_4px] bg-[position:1px_1px] bg-[url(\'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="4" height="4" viewBox="0 0 4 4"><path fill="none" stroke="%23888888" stroke-opacity="0.4" strokeWidth="1" d="M0 4L4 0ZM-1 1L1 -1ZM3 5L5 3"/></svg>\')]',
  "To Be Advised":
    'bg-[hsl(var(--placeholder-bg))] text-muted-foreground bg-[length:4px_4px] bg-[position:1px_1px] bg-[url(\'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="4" height="4" viewBox="0 0 4 4"><path fill="none" stroke="%23888888" stroke-opacity="0.4" strokeWidth="1" d="M0 4L4 0ZM-1 1L1 -1ZM3 5L5 3"/></svg>\')]',
  "To Be Advised (cont)":
    'bg-[hsl(var(--placeholder-bg))] text-muted-foreground bg-[length:4px_4px] bg-[position:1px_1px] bg-[url(\'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="4" height="4" viewBox="0 0 4 4"><path fill="none" stroke="%23888888" stroke-opacity="0.4" strokeWidth="1" d="M0 4L4 0ZM-1 1L1 -1ZM3 5L5 3"/></svg>\')]',
}

// Helper function to check if a program title has special styling
export function getSpecialTitleClass(title: string): string | null {
  return titleColorMappings[decodeHtml(title)] || null
}

// Helper function to check if a program is a placeholder
export function isPlaceholderProgram(title: string): boolean {
  return Object.keys(titleColorMappings).includes(decodeHtml(title))
}
