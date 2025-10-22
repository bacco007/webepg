/**
 * Vertical Timeline Events Data
 * Major milestones and events in Australian subscription TV history
 */

import type { VerticalTimelineEventCollection } from "@/types/vertical-timeline";

export const subscriptionTVEvents: VerticalTimelineEventCollection = {
  events: [
    {
      date: 1992.1,
      description:
        "Australian Government calls for tenders for subscription television licences, purchased by entrepreneur Albert Hadid who onsold it to the consortium Continental Century Pay TV, a joint venture between Century Communications and Australis Media",
      id: "australian-government-calls-for-tenders-1992",
      providers: ["government"],
      title: "Tenders for Subscription Television Licences called",
      type: "launch",
    },

    {
      date: 1995.1,
      description:
        "Galaxy launches their MMDS (Wireless Cable) service on 26th January 1995, iniitally with two channels (Premier Sports Network and news service ANBC)",
      id: "galaxy-launch-1995",
      providers: ["galaxy"],
      title: "Galaxy Launches",
      type: "launch",
    },
    {
      date: 1995.9,
      description:
        "Galaxy launches their Satellite service on 19th September 1995, Community Television Entertainment (CETV, now Austar) launches their service, servicing regional Australia, on the same day",
      id: "galaxy-satellitelaunch-1995",
      providers: ["galaxy", "austar"],
      title: "Galaxy and Austar Launches",
      type: "launch",
    },
    {
      date: "1995.10",
      description: "Foxtel launches their cable service on 22nd October 1995 with a 20 channel service",
      id: "foxtel-cablelaunch-1995",
      providers: ["foxtel"],
      title: "Foxtel Launches",
      type: "launch",
    },
    {
      date: "1995.10",
      description:
        "Australis proposed to merge Galaxy with Foxtel, with Galaxy reportedly on the brink of collapse.  Proposed merger is rejected by the Australian Competition and Consumer Commission (ACCC) as it was deemed to stifle competition",
      id: "australis-proposed-merger-galaxy-foxtel-1995",
      providers: ["galaxy", "foxtel"],
      title: "Australis Proposed Merger with Galaxy Rejected",
      type: "launch",
    },
    {date: "1997.7",
        description: "Another Galaxy/Foxtel merger proposal is made, but is again rejected by the ACCC for similar reasons to the 1995 proposal",
        id: "australis-proposed-merger-galaxy-foxtel-1997",
        providers: ["galaxy", "foxtel"],
        title: "Australis Proposed Merger with Galaxy Rejected",
        type: "launch",
    },
    {
      date: 1998.5,
      description:
        "Galaxy collapses after being declared insolvent by the Supreme Court of NSW, Foxtel acquires satellite subscribers offering an interim service.  Austar and ECTV continue to operate, with ECTV signing a content deal with Optus Vision.",
      id: "galaxy-collapse-1998",
      providers: ["austar", "ectv", "galaxy", "foxtel"],
      title: "Galaxy Collapses",
      type: "closure",
    },
    {
      date: 1998.7,
      description:
        "Austar acquires ECTV, along with the stake in XYZ Entertainment held by ECTV",
      id: "austar-acquires-ectv-1998",
      providers: ["austar", "ectv"],
      title: "Austar acquires ECTV",
      type: "closure",
    },
    {date: "1998.10", description: "Kerry Packer's Publishing and Broadcasting Limited (PBL) purchases a 25% stake in Foxtel (via News Corporation) for $150 million", id: "pbl-invests-in-foxtel-1998", providers: ["pbl", "foxtel"], title: "PBL Invests in Foxtel", type: "launch"},
    {
      date: 2009.2,
      description: "Foxtel launches High Definition service",
      id: "foxtel-hd-launch-2009",
      providers: ["foxtel"],
      title: "Foxtel HD Launches",
      type: "launch",
    },
    {date: 2011.7, description: "Foxtel and Austar enter agreement for Foxtel to acquire Austar, requiring shareholder and regulatory approval", id: "foxtel-austar-merger-2011", providers: ["foxtel", "austar"], title: "Foxtel and Austar Announce Merger", type: "merger"},
    {date: 2012.5, description: "Foxtel's acquisition of Austar is completed", id: "foxtel-austar-acquisition-2012", providers: ["foxtel", "austar"], title: "Foxtel acquires Austar", type: "acquisition"},
    {date: 2014, description: "Foxtel phase out Austar branding, transitioning to a single brand, Foxtel", id: "foxtel-phase-out-austar-branding-2014", providers: ["foxtel", "austar"], title: "Foxtel phases out Austar branding", type: "rebrand"},
    {
      date: 2012.6,
      description:
        "UBI World TV ceases operations, after calling in voluntary administration",
      id: "ubi-world-tv-collapse-2012",
      providers: ["ubi-world-tv"],
      title: "UBI World TV Collapses",
      type: "closure",
    },
    {date: 2024.12, description: "DAZN announces it will acquire Foxtel in a deal worth $3.4 billion that will see Foxtel shareholders News Corp Australia and Telstra take 6% and 3% minority stakes in DAZN", id: "dazn-announces-foxtel-acquisition-2024", providers: ["dazn", "foxtel", "news-corp-australia", "telstra"], title: "DAZN Announces Foxtel Acquisition", type: "launch"},
    {date: 2025.4, description: "DAZN completes the acquisition of Foxtel after receiving all regulatory approvals", id: "dazn-acquires-foxtel-2025", providers: ["dazn", "foxtel"], title: "DAZN acquires Foxtel", type: "acquisition"},
  ],
  metadata: {
    description:
      "Major milestones and events in Australian subscription television history",
    lastUpdated: "2025-10-19",
    title: "Australian Subscription TV History",
  },
};

// Add more event collections as needed
export const allVerticalTimelineEvents = {
  subscriptionTV: subscriptionTVEvents,
  // Add other categories here in the future
};
