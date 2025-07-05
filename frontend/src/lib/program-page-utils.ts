import type { ChannelPrograms } from "@/types/program-pages";
import { compareLCN } from "@/utils/sort";

export const sortChannels = (channels: ChannelPrograms[]) => {
  return channels.sort((a, b) => {
    const lcnA = a.channel.lcn;
    const lcnB = b.channel.lcn;
    const lcnCompare = compareLCN(lcnA, lcnB);
    if (lcnCompare !== 0) {
      return lcnCompare;
    }
    return a.channel.name.localeCompare(b.channel.name);
  });
};

export const decodeHtml = (html: string): string => {
  const txt = document.createElement("textarea");
  txt.innerHTML = html;
  return txt.value;
};

export const collectCategories = (channels: ChannelPrograms[]) => {
  const categories = new Set<string>();
  for (const ch of channels) {
    for (const programs of Object.values(ch.programs)) {
      for (const program of programs) {
        for (const category of program.categories) {
          categories.add(category);
        }
      }
    }
  }
  return [...categories].sort();
};

export const getUniqueGroups = (channels: ChannelPrograms[]) => {
  return [...new Set(channels.map((ch) => ch.channel.group))].sort();
};
